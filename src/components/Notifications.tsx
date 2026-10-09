"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";

type Message = { title: string; description?: string; tone?: "success" | "error" | "info"; key?: string };
type Toast = Message & { id: number };
const Context = createContext<(message: Message) => void>(() => {});

export function useNotify() { return useContext(Context); }

export function useErrorNotification(error: string, title = "Əməliyyat tamamlanmadı") {
  const notify = useNotify();
  useEffect(() => { if (error) notify({ title, description: error, tone: "error", key: title }); }, [error, title, notify]);
}

function Notification({ item, dismiss }: { item: Toast; dismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const [hidden, setHidden] = useState(false);
  const remaining = useRef(6000);
  const sticky = item.tone === "error";
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (sticky || paused || hidden) return;
    const started = Date.now();
    const timer = setTimeout(() => dismiss(item.id), remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [sticky, paused, hidden, item.id, dismiss]);
  return <li className={`toast ${item.tone ?? "info"}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="toast-symbol"><Icon name={item.tone === "success" ? "check" : item.tone === "error" ? "alert" : "info"} /></div>
    <div className="toast-copy" role={sticky ? "alert" : "status"} aria-atomic="true"><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div>
    <button type="button" className="toast-close" aria-label={`${item.title} bildirişini bağla`} onClick={() => dismiss(item.id)}><Icon name="close" width="18" height="18" /></button>
    {!sticky && <span className="toast-lifetime" aria-hidden="true" style={{ animationPlayState: paused || hidden ? "paused" : "running" }} />}
  </li>;
}

export default function Notifications({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const sequence = useRef(0);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const notify = useCallback((message: Message) => {
    const item = { ...message, id: ++sequence.current };
    setItems((current) => [...current.filter((entry) => message.key ? entry.key !== message.key : entry.title !== message.title || entry.description !== message.description), item].slice(-3));
  }, []);
  useEffect(() => {
    let offline = !navigator.onLine;
    const lost = () => { offline = true; notify({ key: "connection", tone: "error", title: "İnternet bağlantısı yoxdur", description: "Daxil etdiyiniz mətn açıq formadadır. Bağlantı bərpa olunanda yenidən cəhd edin." }); };
    const restored = () => { if (offline) notify({ key: "connection", tone: "success", title: "Bağlantı bərpa olundu", description: "Yarımçıq əməliyyatı yenidən göndərə bilərsiniz." }); offline = false; };
    if (offline) lost();
    window.addEventListener("offline", lost); window.addEventListener("online", restored);
    return () => { window.removeEventListener("offline", lost); window.removeEventListener("online", restored); };
  }, [notify]);
  return <Context.Provider value={notify}>{children}<section className="toast-region" aria-label="Bildirişlər"><ol className="toast-list">{items.map((item) => <Notification key={item.id} item={item} dismiss={dismiss} />)}</ol></section></Context.Provider>;
}
