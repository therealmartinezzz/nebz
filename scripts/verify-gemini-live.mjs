// Lokal serverdən qısaömürlü token alıb bir sintetik cavabı yoxlayır.
// Bazaya yazmır, mikrofonu açmır, token/açar/transkript çap etmir.
import { GoogleGenAI, Modality } from "@google/genai";

const scenarioId = process.argv[2];
if (!scenarioId) { console.error("İstifadə: node scripts/verify-gemini-live.mjs <scenario-id>"); process.exit(1); }
let session;
const timeout = setTimeout(() => { session?.close(); console.error("Gemini Live yoxlamasının vaxtı bitdi"); process.exit(1); }, 45_000);
try {
  const response = await fetch("http://localhost:3000/api/realtime-session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId }), signal: AbortSignal.timeout(20_000),
  });
  const credentials = await response.json();
  if (!response.ok) throw new Error(`Səs sessiyası endpoint-i: ${response.status}`);
  const ai = new GoogleGenAI({ apiKey: credentials.key, httpOptions: { apiVersion: "v1beta" } });
  let audioChunks = 0;
  let transcriptReceived = false;
  let resolveTurn;
  let rejectTurn;
  const turn = new Promise((resolve, reject) => { resolveTurn = resolve; rejectTurn = reject; });
  // Bağlantı xətası setup tamamlanmadan gəlsə də promise unhandled olmur.
  void turn.catch(() => {});
  session = await ai.live.connect({
    model: credentials.model,
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
      onmessage: (message) => {
        const content = message.serverContent;
        for (const part of content?.modelTurn?.parts ?? []) if (part.inlineData?.mimeType?.startsWith("audio/pcm")) audioChunks++;
        if (content?.outputTranscription?.text) transcriptReceived = true;
        if (content?.turnComplete) resolveTurn();
      },
      onerror: () => rejectTurn(new Error("Gemini Live bağlantı xətası")),
      onclose: () => rejectTurn(new Error("Gemini Live bağlantısı bağlandı")),
    },
  });
  session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Salam, NovaBank çağrı mərkəzi, mən Ayseləm. Sizə necə kömək edə bilərəm?" }] }], turnComplete: true });
  await turn;
  session.close();
  console.log(JSON.stringify({ model: credentials.model, audioChunks, transcriptReceived, maxDurationSec: credentials.maxDurationSec, success: audioChunks > 0 && transcriptReceived }));
  clearTimeout(timeout);
  process.exit(audioChunks > 0 && transcriptReceived ? 0 : 1);
} catch (error) {
  session?.close();
  clearTimeout(timeout);
  console.error(error.message.includes("endpoint") ? error.message : "Gemini Live real bağlantı yoxlaması alınmadı");
  process.exit(1);
}
