"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Line } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import Icon from "@/components/Icon";
import { DataNotice, EmptyState } from "@/components/ui";
import { postJSON } from "@/components/api-client";
import { practiceHref } from "@/components/view-helpers";
import { useErrorNotification, useNotify } from "@/components/Notifications";

type Status = "idle" | "connecting" | "live" | "scoring" | "ended" | "error";
type RealtimeEvent = { type: string; item?: { id: string; type: string; role: string }; item_id?: string; transcript?: string; error?: { message?: string } };

export default function CallClient({ scenarioId, title, department, operatorName, mode, available, initialError }: { scenarioId: string; title: string; department: string; operatorName: string; mode: "voice" | "text"; available: boolean; initialError: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const notify = useNotify();
  useErrorNotification(error, "Məşq zamanı xəta baş verdi");
  const [lines, setLines] = useState<Line[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [customerSpeaking, setCustomerSpeaking] = useState(false);
  const [operatorSpeaking, setOperatorSpeaking] = useState(false);
  const startRef = useRef(0);
  const durationRef = useRef(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const order = useRef<{ id: string; role: Line["role"]; t: number }[]>([]);
  const texts = useRef<Record<string, string>>({});
  const now = () => startRef.current ? (Date.now() - startRef.current) / 1000 : 0;

  useEffect(() => {
    if (status !== "live") return;
    const interval = setInterval(() => setElapsed(now()), 500);
    return () => clearInterval(interval);
  }, [status]);
  useEffect(() => () => stopVoice(), []);

  function stopVoice() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current = null;
  }
  function rebuild() {
    setLines(order.current.filter((item) => texts.current[item.id]?.trim()).map((item) => ({ role: item.role, text: texts.current[item.id].trim(), t: item.t })));
  }
  function onEvent(event: RealtimeEvent) {
    if ((event.type === "conversation.item.added" || event.type === "conversation.item.created") && event.item?.type === "message") {
      const item = event.item;
      if (!order.current.some((entry) => entry.id === item.id) && (item.role === "user" || item.role === "assistant")) order.current.push({ id: item.id, role: item.role === "user" ? "operator" : "customer", t: now() });
    }
    if (["conversation.item.input_audio_transcription.completed", "response.output_audio_transcript.done", "response.audio_transcript.done"].includes(event.type) && event.item_id && event.transcript) {
      texts.current[event.item_id] = event.transcript;
      rebuild();
    }
    if (event.type === "output_audio_buffer.started") setCustomerSpeaking(true);
    if (event.type === "output_audio_buffer.stopped" || event.type === "output_audio_buffer.cleared") setCustomerSpeaking(false);
    if (event.type === "input_audio_buffer.speech_started") setOperatorSpeaking(true);
    if (event.type === "input_audio_buffer.speech_stopped") setOperatorSpeaking(false);
    if (event.type === "error") setError("Səsli söhbətdə xəta baş verdi. Zəngi bitirib mətn rejimində yenidən başlaya bilərsiniz.");
  }
  async function startVoice() {
    if (!available || status === "connecting") return;
    setStatus("connecting"); setError("");
    try {
      const session = await postJSON<{ key?: string; error?: string }>("/api/realtime-session", { scenarioId });
      if (!session.key) throw new Error(session.error || "Səs sessiyası yaradılmadı.");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (event) => { if (audioRef.current) audioRef.current.srcObject = event.streams[0]; };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          durationRef.current = now(); setElapsed(durationRef.current); stopVoice(); setStatus("ended"); setError("Səs bağlantısı kəsildi. Mövcud transkripti qiymətləndirə və ya yeni məşqə başlaya bilərsiniz.");
        }
      };
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofon üçün localhost və ya HTTPS ünvanı tələb olunur.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0], stream);
      const channel = pc.createDataChannel("oai-events");
      channel.onmessage = (message) => { try { onEvent(JSON.parse(message.data)); } catch { setError("Səs transkripti oxunmadı. Mətn rejimində yenidən məşq edə bilərsiniz."); } };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", body: offer.sdp, headers: { Authorization: `Bearer ${session.key}`, "Content-Type": "application/sdp" } });
      if (!answer.ok) throw new Error("Səs bağlantısı qurulmadı.");
      await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() });
      startRef.current = Date.now(); setStatus("live");
      notify({ tone: "success", title: "Səs bağlantısı hazırdır", description: "Salamlaşma ilə məşqə başlayın." });
    } catch (e) {
      stopVoice(); setError(`${e instanceof Error ? e.message : "Zəng başlamadı."} Mətn rejimi ilə davam edə bilərsiniz.`); setStatus("error");
    }
  }
  function startText() { if (!available) return; startRef.current = Date.now(); setStatus("live"); setError(""); }
  async function sendText() {
    const text = draft.trim();
    if (!text || waiting || status !== "live") return;
    const next: Line[] = [...lines, { role: "operator", text, t: now() }];
    setWaiting(true); setError("");
    try {
      const reply = await postJSON<{ text?: string; error?: string }>("/api/customer-reply", { scenarioId, transcript: next });
      if (!reply.text) throw new Error(reply.error || "Müştərinin cavabı alınmadı.");
      setLines([...next, { role: "customer", text: reply.text, t: now() }]); setDraft("");
    } catch (e) { setError(e instanceof Error ? e.message : "Cavab alınmadı. Yenidən göndərin."); }
    finally { setWaiting(false); }
  }
  async function endCall() {
    if (waiting || status === "scoring") return;
    if (status === "live") durationRef.current = now();
    setElapsed(durationRef.current); stopVoice(); setCustomerSpeaking(false); setOperatorSpeaking(false); setStatus("scoring"); setError("");
    try {
      const result = await postJSON<{ id?: string; error?: string }>("/api/calls", { scenarioId, operatorName, mode, transcript: lines, durationSec: durationRef.current });
      if (!result.id) throw new Error(result.error || "Qiymətləndirmə alınmadı.");
      notify({ tone: "success", title: "Zəng qiymətləndirildi", description: "Nəticə və transkript üzrə sübutlar hesabatda hazırdır." });
      router.push(`/report/${encodeURIComponent(result.id)}`);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Qiymətləndirmə alınmadı."); setStatus("ended"); }
  }
  function toggleMute() { streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = muted; }); setMuted(!muted); }

  const live = status === "live";
  const statusText: Record<Status, string> = { idle: "Zəngə hazır", connecting: "Bağlantı qurulur…", live: "Zəng davam edir", scoring: "Qiymətləndirilir…", ended: "Zəng bitib", error: "Zəng başlamadı" };
  const hasEnoughTranscript = lines.filter((line) => line.role === "operator").length >= 2;

  return <main id="main-content" className="page">
    <div className="page-heading"><div><h1>{title}</h1><p className="muted">{department && `${department} · `}{mode === "voice" ? "Səsli məşq" : "Mətn məşqi"} · Operator: {operatorName}</p></div><Link href="/" className="back-link"><Icon name="arrow" width="16" height="16" />Ssenarilər</Link></div>
    <DataNotice error={initialError} />
    <div className="call-layout">
      <section className="callpanel" aria-label="Zəngin idarə edilməsi">
        <span className="pill" role="status">{live && <span className="status-dot" />}{statusText[status]}</span>
        <div className="avatar" aria-hidden="true">AI</div>
        <div><h2>AI müştəri</h2><p className="muted">{department || title}</p></div>
        <div className="mono call-timer" aria-label={`Zəng müddəti ${fmtTime(elapsed)}`}>{fmtTime(elapsed)}</div>
        {mode === "voice" && <div className={`waveform${live && (customerSpeaking || operatorSpeaking) ? " active" : ""}`} aria-hidden="true">{[14, 30, 44, 22, 36, 18, 40, 26, 12].map((height, i) => <span key={i} style={{ "--i": i, "--height": `${height}px` } as CSSProperties} />)}</div>}
        <p className="muted small" role="status">{live ? mode === "text" ? "Operator kimi yazaraq söhbətə başlayın." : customerSpeaking ? "Müştəri danışır…" : muted ? "Mikrofon bağlıdır" : operatorSpeaking ? "Siz danışırsınız…" : "Siz operatorsunuz. Salamlaşma ilə başlayın." : status === "scoring" ? "Transkript meyarlar üzrə qiymətləndirilir." : "AI ilə təhlükəsiz məşq mühiti"}</p>
        {status === "idle" && <button className="btn primary" onClick={mode === "voice" ? startVoice : startText} disabled={!available}><Icon name="phone" />{mode === "voice" ? "Zəngi qəbul et" : "Söhbətə başla"}</button>}
        {live && <div className="call-controls">{mode === "voice" && <button type="button" className="icon-button" onClick={toggleMute} aria-label={muted ? "Mikrofonu aç" : "Mikrofonu bağla"} aria-pressed={muted}><Icon name={muted ? "mic-off" : "mic"} width="24" height="24" /></button>}<button type="button" className="icon-button end" aria-label="Zəngi bitir və qiymətləndir" title="Zəngi bitir və qiymətləndir" onClick={() => void endCall()} disabled={!hasEnoughTranscript || waiting}><Icon name="hangup" width="24" height="24" /></button></div>}
        {live && !hasEnoughTranscript && <p className="muted small">Qiymətləndirmə üçün ən azı 2 operator replikası lazımdır.</p>}
        {status === "ended" && <><button className="btn primary" onClick={() => void endCall()} disabled={!hasEnoughTranscript}>Qiymətləndirməni yenidən göndər</button><Link className="btn" href="/">Yeni məşq seç</Link></>}
        {status === "error" && <Link className="btn" href={practiceHref(scenarioId, operatorName, "text")}>Mətn rejiminə keç</Link>}
        <audio ref={audioRef} autoPlay />
      </section>
      <section className="card transcript-panel"><div className="section-heading"><h2>Canlı transkript</h2><span className="muted small">Qiymətləndirmə zəngdən sonra göstərilir</span></div>{error && <div className="error">{error}</div>}
        <div className="transcript-lines" aria-live="polite" aria-relevant="additions text">{!lines.length && <EmptyState title="Danışıq burada görünəcək" description={live ? "İlk cavabınızla söhbətə başlayın." : "Zəngi başlatdıqdan sonra operator və AI müştərinin replikaları vaxtla göstərilir."} />}{lines.map((line, i) => <div key={i} className={`bubble ${line.role === "operator" ? "op" : "cu"}`}><div className="who">{line.role === "operator" ? "Siz · operator" : "AI müştəri"} · {fmtTime(line.t)}</div>{line.text}</div>)}{waiting && <div className="bubble cu muted">AI müştəri cavab hazırlayır…</div>}</div>
        {mode === "text" && live && <form className="text-composer" onSubmit={(event) => { event.preventDefault(); void sendText(); }}><input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Operator kimi yazın…" aria-label="Operatorun cavabı" maxLength={4000} disabled={waiting} autoFocus /><button className="btn primary" type="submit" disabled={waiting || !draft.trim()}>{waiting ? "Gözləyin…" : "Göndər"}</button></form>}
      </section>
    </div>
  </main>;
}
