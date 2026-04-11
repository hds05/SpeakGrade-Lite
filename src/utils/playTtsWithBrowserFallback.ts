import type { MutableRefObject } from "react";
import { playAudioFromObjectUrl } from "@/utils/playAudioFromUrl";

/** Detiene la voz del navegador (fallback). Úsalo en cleanup al salir del escenario. */
export function cancelBrowserSpeech(): void {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Cuando OpenAI/ElevenLabs fallan (clave, región, cuota), reproduce el texto con la voz del sistema.
 */
export function speakWithBrowser(text: string, lang = "en-US"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("speechSynthesis not available"));
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("speechSynthesis error"));
    window.speechSynthesis.speak(utter);
  });
}

/**
 * Obtiene audio del endpoint TTS del servidor; si falla o el blob es inválido, usa `speechSynthesis`.
 */
export async function playTtsAudioOrBrowser(
  text: string,
  audioRef: MutableRefObject<HTMLAudioElement | null>,
  fetchTts: () => Promise<Response>,
  options?: { lang?: string }
): Promise<void> {
  const res = await fetchTts();
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.warn(
      `[TTS] API ${res.status} → usando voz del navegador`,
      errText.slice(0, 160)
    );
    await speakWithBrowser(text, options?.lang ?? "en-US");
    return;
  }
  const blob = await res.blob();
  if (blob.size < 64) {
    console.warn("[TTS] Audio vacío o inválido → usando voz del navegador");
    await speakWithBrowser(text, options?.lang ?? "en-US");
    return;
  }
  const url = URL.createObjectURL(blob);
  await playAudioFromObjectUrl(url, audioRef);
}
