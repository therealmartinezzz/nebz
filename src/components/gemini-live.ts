import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import type { Line } from "@/lib/types";
import { LiveTranscript } from "./live-transcript";

export type VoiceSession = { key: string; model: string; maxDurationSec: number; maxOperatorTurns: number };
type Callbacks = {
  time: () => number;
  transcript: (lines: Line[]) => void;
  customerSpeaking: (speaking: boolean) => void;
  operatorSpeaking: (speaking: boolean) => void;
  operatorTurns: (turns: number) => void;
  disconnected: (message: string) => void;
};

export class GeminiVoice {
  private session: Session | null = null;
  private microphone: MediaStream | null = null;
  private input: AudioContext | null = null;
  private output: AudioContext | null = null;
  private capture: AudioWorkletNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextAudioTime = 0;
  private transcript = new LiveTranscript();
  private closed = false;
  private finishing = false;
  private muted = false;
  private lastSpeech = 0;
  private operatorStart: number | undefined;
  private customerStart: number | undefined;
  private operatorTurns = 0;
  private maxOperatorTurns = 10;
  private turnHasOperator = false;
  private turnLimitReached = false;
  private finishPromise: Promise<Line[]> | undefined;
  private connectionTimer: ReturnType<typeof setTimeout> | undefined;
  private durationTimer: ReturnType<typeof setTimeout> | undefined;
  private finishTimer: ReturnType<typeof setTimeout> | undefined;
  private finishResolve: (() => void) | undefined;

  constructor(private callbacks: Callbacks) {}

  async start(getSession: () => Promise<VoiceSession>) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofon üçün localhost və ya HTTPS ünvanı tələb olunur.");
    try {
      // AudioContext istifadəçinin düymə klikindən yaradılır: mobil autoplay icazəsi qorunur.
      this.input = new AudioContext({ sampleRate: 16000 });
      this.output = new AudioContext({ sampleRate: 24000 });
      await Promise.all([this.input.resume(), this.output.resume()]);
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (this.closed) { microphone.getTracks().forEach((track) => track.stop()); this.assertOpen(); }
      this.microphone = microphone;
      this.assertOpen();
      await this.input.audioWorklet.addModule("/audio/pcm-capture.js");
      this.assertOpen();
      const credentials = await getSession();
      this.assertOpen();
      if (!credentials.key || !credentials.model) throw new Error("Səs sessiyası yaradılmadı.");
      this.maxOperatorTurns = Math.min(10, credentials.maxOperatorTurns || 10);
      const ai = new GoogleGenAI({ apiKey: credentials.key, httpOptions: { apiVersion: "v1beta" } });
      const connecting = ai.live.connect({
        model: credentials.model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onmessage: (message) => {
            try { this.onMessage(message); }
            catch { this.disconnect("Səs axını oxunmadı. Mövcud transkripti qiymətləndirə bilərsiniz."); }
          },
          onerror: () => this.disconnect("Səs bağlantısında xəta baş verdi. Transkripti saxlayıb mətn rejimində yeni məşqə başlaya bilərsiniz."),
          onclose: () => this.disconnect("Səs bağlantısı bağlandı. Mövcud transkripti qiymətləndirə bilərsiniz."),
        },
      }).catch(() => { throw new Error("Gemini səs bağlantısı qurulmadı. Mətn rejimi ilə davam edə bilərsiniz."); }).then((session) => {
        if (this.closed) session.close();
        else this.session = session;
        return session;
      });
      await Promise.race([
        connecting,
        new Promise<never>((_, reject) => {
          this.connectionTimer = setTimeout(() => reject(new Error("Səs bağlantısı üçün gözləmə müddəti bitdi.")), 20_000);
        }),
      ]);
      clearTimeout(this.connectionTimer);
      this.assertOpen();
      const source = this.input.createMediaStreamSource(this.microphone);
      this.capture = new AudioWorkletNode(this.input, "pcm-capture");
      // Səs emalı davam edir, amma mikrofon səsi dinamiklərə qaytarılmır.
      const silence = this.input.createGain();
      silence.gain.value = 0;
      source.connect(this.capture).connect(silence).connect(this.input.destination);
      this.capture.port.onmessage = (event: MessageEvent<{ buffer: ArrayBuffer; level: number }>) => {
        if (this.closed || this.finishing || this.muted || !this.session) return;
        if (event.data.level > 0.015) {
          this.lastSpeech = Date.now();
          this.operatorStart ??= this.callbacks.time();
        }
        this.callbacks.operatorSpeaking(Date.now() - this.lastSpeech < 350);
        const bytes = new Uint8Array(event.data.buffer);
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        try {
          this.session.sendRealtimeInput({ audio: { data: btoa(binary), mimeType: "audio/pcm;rate=16000" } });
        } catch {
          this.disconnect("Mikrofon səsi göndərilmədi. Mövcud transkripti qiymətləndirə bilərsiniz.");
        }
      };
      this.durationTimer = setTimeout(() => {
        this.endAtLimit('60 saniyəlik demo limiti bitdi. Mövcud transkripti qiymətləndirə bilərsiniz.');
      }, Math.min(60, credentials.maxDurationSec) * 1000);
      return credentials.maxDurationSec;
    } catch (error) {
      this.close();
      if (error instanceof DOMException && error.name === "NotAllowedError") throw new Error("Mikrofon icazəsi verilmədi. Brauzerdə mikrofonu açın və ya mətn rejimini seçin.");
      // SDK xətasının URL-i/tokeni UI-a çıxmır.
      if (error instanceof Error && !error.message.includes("token") && !error.message.includes("http") && !error.message.includes("auth_tokens")) throw error;
      throw new Error("Gemini səs bağlantısı qurulmadı. Mətn rejimi ilə davam edə bilərsiniz.");
    }
  }

  private assertOpen() { if (this.closed) throw new Error("Səs bağlantısı bağlandı."); }

  private onMessage(message: LiveServerMessage) {
    if (this.closed) return;
    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      this.stopPlayback();
      this.transcript.interrupt();
      this.customerStart = undefined;
    }
    if (content.inputTranscription) {
      const { text, finished } = content.inputTranscription;
      if (text?.trim()) this.turnHasOperator = true;
      this.transcript.append("operator", text, finished, this.operatorStart ?? this.callbacks.time());
      if (finished) this.operatorStart = undefined;
    }
    if (content.outputTranscription) {
      const { text, finished } = content.outputTranscription;
      this.customerStart ??= this.callbacks.time();
      this.transcript.append("customer", text, finished, this.customerStart);
      if (finished) this.customerStart = undefined;
    }
    this.callbacks.transcript(this.transcript.snapshot());
    if (!this.finishing) {
      for (const part of content.modelTurn?.parts ?? []) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) {
          const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] || 24000);
          this.playAudio(part.inlineData.data, rate);
        }
      }
    }
    if (content.turnComplete) {
      if (this.turnHasOperator) {
        this.operatorTurns++;
        this.turnHasOperator = false;
        this.callbacks.operatorTurns(this.operatorTurns);
      }
      if (this.operatorTurns >= this.maxOperatorTurns) {
        this.turnLimitReached = true;
        this.stopMicrophone();
        if (!this.sources.size) this.endAtLimit('10 operator replikası tamamlandı. Mövcud transkripti qiymətləndirə bilərsiniz.');
      }
      this.transcript.completeTurn();
      this.operatorStart = undefined;
      this.customerStart = undefined;
      this.finishResolve?.();
    }
  }

  private playAudio(base64: string, rate: number) {
    const context = this.output;
    if (!context || context.state === "closed") return;
    const binary = atob(base64);
    if (binary.length < 2) return;
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const buffer = context.createBuffer(1, Math.floor(bytes.length / 2), rate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    this.nextAudioTime = Math.max(context.currentTime + 0.02, this.nextAudioTime);
    source.start(this.nextAudioTime);
    this.nextAudioTime += buffer.duration;
    this.sources.add(source);
    this.callbacks.customerSpeaking(true);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      if (!this.sources.size) this.callbacks.customerSpeaking(false);
      if (!this.sources.size && this.turnLimitReached) this.endAtLimit('10 operator replikası tamamlandı. Mövcud transkripti qiymətləndirə bilərsiniz.');
    };
  }

  private endAtLimit(message: string) {
    if (this.closed || this.finishing) return;
    // Limit çatanda audio dərhal bağlanır; artıq alınmış mətn qorunur.
    const transcript = this.transcript.snapshot();
    this.close();
    this.callbacks.transcript(transcript);
    this.callbacks.disconnected(message);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.microphone?.getAudioTracks().forEach((track) => { track.enabled = !muted; });
    if (muted) {
      this.callbacks.operatorSpeaking(false);
      try { this.session?.sendRealtimeInput({ audioStreamEnd: true }); } catch { /* Bağlı sessiya */ }
    }
  }

  finish(): Promise<Line[]> {
    return this.finishPromise ??= this.finishSession();
  }

  private async finishSession(): Promise<Line[]> {
    if (!this.closed && this.session) {
      this.finishing = true;
      this.stopMicrophone();
      this.stopPlayback();
      await new Promise<void>((resolve) => {
        this.finishResolve = resolve;
        this.finishTimer = setTimeout(resolve, 2000);
        try { this.session?.sendRealtimeInput({ audioStreamEnd: true }); } catch { resolve(); }
      });
    }
    this.close();
    return this.transcript.snapshot();
  }

  private stopMicrophone() {
    if (this.capture) { this.capture.port.onmessage = null; this.capture.disconnect(); }
    this.capture = null;
    this.microphone?.getTracks().forEach((track) => track.stop());
    this.microphone = null;
  }
  private stopPlayback() {
    for (const source of this.sources) { source.onended = null; source.stop(); source.disconnect(); }
    this.sources.clear();
    this.nextAudioTime = 0;
    this.callbacks.customerSpeaking(false);
  }
  private disconnect(message: string) {
    if (this.closed || this.finishing) return;
    this.close();
    this.callbacks.disconnected(message);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.connectionTimer);
    clearTimeout(this.durationTimer);
    clearTimeout(this.finishTimer);
    this.finishResolve?.();
    this.stopMicrophone();
    this.stopPlayback();
    this.session?.close();
    this.session = null;
    void this.input?.close().catch(() => {});
    void this.output?.close().catch(() => {});
    this.input = null;
    this.output = null;
    this.callbacks.operatorSpeaking(false);
  }
}
