"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Line } from "@/lib/types";
import { fmtTime } from "@/lib/format";

type Status = "idle" | "connecting" | "live" | "scoring" | "error";

export default function CallClient() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const operatorName = params.get("name") || "Operator";
  const mode = params.get("mode") === "text" ? "text" : "voice";

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);

  const startRef = useRef(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Səsli rejimdə növbəni item_id ilə saxlayırıq ki, transkriptlər gec gəlsə də sıra pozulmasın.
  const order = useRef<{ id: string; role: Line["role"]; t: number }[]>([]);
  const texts = useRef<Record<string, string>>({});

  const now = () => (Date.now() - startRef.current) / 1000;

  useEffect(() => {
    if (status !== "live") return;
    const i = setInterval(() => setElapsed(now()), 500);
    return () => clearInterval(i);
  }, [status]);

  useEffect(() => () => stopVoice(), []);

  function rebuild() {
    setLines(
      order.current
        .filter((o) => texts.current[o.id]?.trim())
        .map((o) => ({ role: o.role, text: texts.current[o.id].trim(), t: o.t }))
    );
  }

  function onEvent(ev: any) {
    if ((ev.type === "conversation.item.added" || ev.type === "conversation.item.created") && ev.item?.type === "message") {
      if (!order.current.some((o) => o.id === ev.item.id) && (ev.item.role === "user" || ev.item.role === "assistant")) {
        order.current.push({ id: ev.item.id, role: ev.item.role === "user" ? "operator" : "customer", t: now() });
      }
    }
    if (ev.type === "conversation.item.input_audio_transcription.completed") {
      texts.current[ev.item_id] = ev.transcript;
      rebuild();
    }
    if (ev.type === "response.output_audio_transcript.done" || ev.type === "response.audio_transcript.done") {
      texts.current[ev.item_id] = ev.transcript;
      rebuild();
    }
    if (ev.type === "error") setError(ev.error?.message || "Realtime xətası");
  }

  async function startVoice() {
    setStatus("connecting");
    setError("");
    try {
      const s = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      }).then((r) => r.json());
      if (!s.key) throw new Error(s.error || "Səs sessiyası yaradılmadı");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        if (audioRef.current) audioRef.current.srcObject = e.streams[0];
      };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0], stream);

      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (m) => onEvent(JSON.parse(m.data));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${s.key}`, "Content-Type": "application/sdp" },
      });
      if (!answer.ok) throw new Error("Səs bağlantısı qurulmadı");
      await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() });

      startRef.current = Date.now();
      setStatus("live");
    } catch (e: any) {
      stopVoice();
      setError(e.message + " — mətn rejimi ilə davam edə bilərsiniz.");
      setStatus("error");
    }
  }

  function stopVoice() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }

  function startText() {
    startRef.current = Date.now();
    setStatus("live");
  }

  async function sendText() {
    const text = draft.trim();
    if (!text || waiting) return;
    const next: Line[] = [...lines, { role: "operator", text, t: now() }];
    setLines(next);
    setDraft("");
    setWaiting(true);
    try {
      const r = await fetch("/api/customer-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, transcript: next }),
      }).then((r) => r.json());
      if (r.text) setLines((l) => [...l, { role: "customer", text: r.text, t: now() }]);
      else setError(r.error || "Cavab alınmadı");
    } finally {
      setWaiting(false);
    }
  }

  async function endCall() {
    const durationSec = now();
    stopVoice();
    setStatus("scoring");
    const r = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, operatorName, mode, transcript: lines, durationSec }),
    }).then((r) => r.json());
    if (r.id) router.push(`/report/${r.id}`);
    else {
      setError(r.error || "Qiymətləndirmə alınmadı");
      setStatus("live");
    }
  }

  const live = status === "live";

  return (
    <main className="page">
      <div className="row">
        <section className="callpanel side">
          <span className="pill ok">{mode === "voice" ? "Səsli zəng" : "Mətn rejimi"}</span>
          <div className="avatar">LM</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Leyla M.</div>
            <div style={{ color: "#c5cbd3" }}>AI müştəri · operator: {operatorName}</div>
          </div>
          <div className="mono" style={{ fontSize: 40 }}>{fmtTime(elapsed)}</div>

          {status === "idle" && (
            <button className="btn primary" onClick={mode === "voice" ? startVoice : startText}>
              {mode === "voice" ? "Zəngi qəbul et" : "Söhbətə başla"}
            </button>
          )}
          {status === "connecting" && <div style={{ color: "#c5cbd3" }}>Qoşulur…</div>}
          {live && (
            <button className="btn danger" onClick={endCall} disabled={lines.length < 2}>
              Zəngi bitir və qiymətləndir
            </button>
          )}
          {status === "scoring" && <div style={{ color: "#c5cbd3" }}>AI zəngi qiymətləndirir…</div>}
          {status === "error" && (
            <a className="btn" href={`/call/${scenarioId}?name=${encodeURIComponent(operatorName)}&mode=text`}>
              Mətn rejiminə keç
            </a>
          )}
          {mode === "voice" && live && (
            <div style={{ color: "#c5cbd3", fontSize: 14 }}>Siz operatorsunuz. Salamlaşma ilə başlayın.</div>
          )}
          <audio ref={audioRef} autoPlay />
        </section>

        <section className="card grow" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Transkript</h2>
          {error && <div className="error">{error}</div>}
          {lines.length === 0 && <p className="muted">Zəng başlayanda danışıq burada görünəcək.</p>}
          {lines.map((l, i) => (
            <div key={i} className={`bubble ${l.role === "operator" ? "op" : "cu"}`}>
              <div className="who">
                {l.role === "operator" ? `Siz · ${fmtTime(l.t)}` : `Leyla M. · ${fmtTime(l.t)}`}
              </div>
              {l.text}
            </div>
          ))}
          {waiting && <div className="bubble cu muted">Leyla M. yazır…</div>}

          {mode === "text" && live && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendText();
              }}
              style={{ display: "flex", gap: 10, marginTop: 8 }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Operator kimi yazın…"
                aria-label="Operatorun cavabı"
                style={{ flex: 1 }}
                autoFocus
              />
              <button className="btn primary" type="submit" disabled={waiting}>Göndər</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
