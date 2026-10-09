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
import { GeminiVoice, type VoiceSession } from "@/components/gemini-live";

type Status = "idle" | "connecting" | "live" | "scoring" | "ended" | "error";

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
  const [voiceLimit, setVoiceLimit] = useState(0);
  const [voiceTurns, setVoiceTurns] = useState(0);
  const startRef = useRef(0);
  const durationRef = useRef(0);
  const voiceRef = useRef<GeminiVoice | null>(null);
  const linesRef = useRef<Line[]>([]);
  const savingRef = useRef(false);
  const linesBoxRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true); // istifadəçi yuxarı qalxıbsa avtomatik scroll ona mane olmasın
  const endCallRef = useRef<() => Promise<void>>(async () => {});
  const now = () => startRef.current ? (Date.now() - startRef.current) / 1000 : 0;

  useEffect(() => {
    if (status !== "live") return;
    const interval = setInterval(() => setElapsed(now()), 500);
    return () => clearInterval(interval);
  }, [status]);
  useEffect(() => () => stopVoice(), []);
  // Yeni replika və ya mətn artdıqca transkript rəvan aşağı sürüşür (CSS scroll-behavior: smooth).
  useEffect(() => {
    const box = linesBoxRef.current;
    if (box && followRef.current) box.scrollTo({ top: box.scrollHeight });
  }, [lines, waiting]);

  function stopVoice() {
    voiceRef.current?.close();
    voiceRef.current = null;
  }
  async function startVoice() {
    if (!available || status === "connecting") return;
    stopVoice();
    setStatus("connecting"); setError(""); setMuted(false); setVoiceTurns(0);
    linesRef.current = []; setLines([]);
    const voice = new GeminiVoice({
      time: now,
      transcript: (transcript) => { linesRef.current = transcript; setLines(transcript); },
      customerSpeaking: setCustomerSpeaking,
      operatorSpeaking: setOperatorSpeaking,
      operatorTurns: setVoiceTurns,
      disconnected: (message) => {
        durationRef.current = now(); setElapsed(durationRef.current);
        setStatus(linesRef.current.length ? "ended" : "error"); setError(message);
        // Söhbət itməsin: limit dolanda və ya bağlantı kəsiləndə transkript avtomatik saxlanılır və qiymətləndirilir.
        if (linesRef.current.length >= 2) void endCallRef.current();
      },
    });
    voiceRef.current = voice;
    try {
      const limit = await voice.start(() => postJSON<VoiceSession>("/api/realtime-session", { scenarioId }));
      if (voiceRef.current !== voice) return;
      setVoiceLimit(limit);
      startRef.current = Date.now(); setStatus("live");
      notify({ tone: "success", title: "Səs bağlantısı hazırdır", description: "Salamlaşma ilə məşqə başlayın." });
    } catch (e) {
      if (voiceRef.current !== voice) return;
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
      linesRef.current = [...next, { role: "customer", text: reply.text, t: now() }];
      setLines(linesRef.current); setDraft("");
    } catch (e) { setError(e instanceof Error ? e.message : "Cavab alınmadı. Yenidən göndərin."); }
    finally { setWaiting(false); }
  }
  async function endCall() {
    if (waiting || savingRef.current) return;
    savingRef.current = true;
    if (status === "live") durationRef.current = now();
    setElapsed(durationRef.current); setCustomerSpeaking(false); setOperatorSpeaking(false); setStatus("scoring"); setError("");
    try {
      const transcript = voiceRef.current ? await voiceRef.current.finish() : linesRef.current;
      linesRef.current = transcript; setLines(transcript); stopVoice();
      const result = await postJSON<{ id?: string; scored?: boolean; error?: string }>("/api/calls", { scenarioId, operatorName, mode, transcript, durationSec: durationRef.current });
      if (!result.id) throw new Error(result.error || "Zəng saxlanılmadı.");
      // Zəng bazadadır: qiymətləndirmə alınmasa da hesabata keçirik, orada yenidən qiymətləndirmək olar.
      if (result.scored) notify({ tone: "success", title: "Zəng qiymətləndirildi", description: "Nəticə və transkript üzrə sübutlar hesabatda hazırdır." });
      else notify({ tone: "error", title: "Zəng saxlanıldı, qiymətləndirilmədi", description: result.error || "Hesabatda yenidən qiymətləndirə bilərsiniz." });
      router.push(`/report/${encodeURIComponent(result.id)}`);
      router.refresh();
    } catch (e) { savingRef.current = false; setError(e instanceof Error ? e.message : "Zəng saxlanılmadı."); setStatus("ended"); }
  }
  endCallRef.current = endCall;
  function toggleMute() { voiceRef.current?.setMuted(!muted); setMuted(!muted); }

  const live = status === "live";
  const statusText: Record<Status, string> = { idle: "Zəngə hazır", connecting: "Bağlantı qurulur…", live: "Zəng davam edir", scoring: "Qiymətləndirilir…", ended: "Zəng bitib", error: "Zəng başlamadı" };
  const hasEnoughTranscript = lines.filter((line) => line.role === "operator").length >= 2;
  const textLimitReached = mode === 'text' && lines.filter(line => line.role === 'operator').length >= 5;

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
        {live && mode === 'text' && <p className="muted small">Demo məşqi maksimum 5 operator replikasıdır.{textLimitReached && ' Məşqi bitirib nəticəni görün.'}</p>}
        {status === "ended" && <><button className="btn primary" onClick={() => void endCall()} disabled={!hasEnoughTranscript}>Saxla və qiymətləndir</button><Link className="btn" href="/">Yeni məşq seç</Link></>}
        {status === "error" && <><button className="btn primary" onClick={startVoice} disabled={!available}>Səs bağlantısını yenidən qur</button><Link className="btn" href={practiceHref(scenarioId, operatorName, "text")}>Mətn rejiminə keç</Link></>}
        {mode === "voice" && <p className="muted small">Demo zəngi maksimum {fmtTime(voiceLimit || 60)} · Operator replikaları: {voiceTurns}/10</p>}
      </section>
      <section className="card transcript-panel"><div className="section-heading"><h2>Canlı transkript</h2><span className="muted small">Qiymətləndirmə zəngdən sonra göstərilir</span></div>{error && <div className="error">{error}</div>}
        <div ref={linesBoxRef} className="transcript-lines" aria-live="polite" aria-relevant="additions text" tabIndex={0} aria-label="Transkript" onScroll={(event) => { const box = event.currentTarget; followRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80; }}>{!lines.length && <EmptyState title="Danışıq burada görünəcək" description={live ? "İlk cavabınızla söhbətə başlayın." : "Zəngi başlatdıqdan sonra operator və AI müştərinin replikaları vaxtla göstərilir."} />}{lines.map((line, i) => <div key={i} className={`bubble ${line.role === "operator" ? "op" : "cu"}`}><div className="who">{line.role === "operator" ? "Siz · operator" : "AI müştəri"} · {fmtTime(line.t)}</div>{line.text}</div>)}{waiting && <div className="bubble cu muted">AI müştəri cavab hazırlayır…</div>}</div>
        {mode === "text" && live && <form className="text-composer" onSubmit={(event) => { event.preventDefault(); void sendText(); }}><input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Operator kimi yazın…" aria-label="Operatorun cavabı" maxLength={1000} disabled={waiting || textLimitReached} autoFocus /><button className="btn primary" type="submit" disabled={waiting || textLimitReached || !draft.trim()}>{waiting ? "Gözləyin…" : "Göndər"}</button></form>}
      </section>
    </div>
  </main>;
}
