import type { MutableRefObject } from "react";

/**
 * Reproduce audio desde una object URL; si el navegador bloquea autoplay,
 * reintenta tras la siguiente interacción (clic o tecla).
 * Opcional: asigna el elemento a audioRef para poder pausar desde fuera.
 */
export async function playAudioFromObjectUrl(
  url: string,
  audioRef?: MutableRefObject<HTMLAudioElement | null>
): Promise<void> {
  const audio = new Audio(url);
  audio.volume = 1;
  audio.muted = false;
  audio.defaultMuted = false;
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  if (audioRef) audioRef.current = audio;

  const tryPlay = async (): Promise<void> => {
    try {
      await audio.play();
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name;
      if (name !== "NotAllowedError" && name !== "AbortError") throw e;
      await new Promise<void>((resolve, reject) => {
        const handler = () => {
          window.removeEventListener("pointerdown", handler);
          window.removeEventListener("keydown", handler);
          void audio.play().then(() => resolve()).catch(reject);
        };
        window.addEventListener("pointerdown", handler, { once: true });
        window.addEventListener("keydown", handler, { once: true });
      });
    }
  };

  await tryPlay();

  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () =>
        reject(new Error("Error al reproducir el audio generado (TTS)."));
    });
  } finally {
    if (audioRef?.current === audio) audioRef.current = null;
    URL.revokeObjectURL(url);
  }
}
