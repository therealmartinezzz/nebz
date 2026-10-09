import type { SVGProps } from "react";

type Name = "pulse" | "phone" | "hangup" | "mic" | "mic-off" | "play" | "arrow" | "plus" | "check" | "document" | "close" | "alert" | "info";
const paths: Record<Name, React.ReactNode> = {
  close: <path d="m6 6 12 12M6 18 18 6" />,
  alert: <><path d="m12 3 10 18H2Z" /><path d="M12 9v5M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  pulse: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />,
  hangup: <path d="M3 15.5c5-4.7 13-4.7 18 0l-2.2 2.3-3.3-1.6v-2.4a11 11 0 0 0-7 0v2.4l-3.3 1.6Z" />,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" /></>,
  "mic-off": <><path d="m3 3 18 18M9 9v2a3 3 0 0 0 5.1 2.1M15 9V5a3 3 0 0 0-5.8-1M5 10v1a7 7 0 0 0 12 4.9M19 10v1M12 18v4M8 22h8" /></>,
  play: <path d="m8 4 12 8-12 8Z" />,
  arrow: <path d="m10 5-7 7 7 7M3 12h18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
};

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
