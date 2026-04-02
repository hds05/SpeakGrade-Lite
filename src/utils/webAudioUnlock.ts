/**
 * Debe llamarse en el mismo tick síncrono que un clic del usuario (antes de cualquier await).
 * Desbloquea AudioContext y refuerza la política de autoplay del navegador.
 */
let unlocked = false;

export function unlockWebAudioOnUserGesture(): void {
  if (typeof window === "undefined" || unlocked) return;

  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (AC) {
    try {
      const ctx = new AC();
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.001);
    } catch {
      /* ignore */
    }
  }

  try {
    const dummy = new Audio();
    dummy.src =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==";
    void dummy.play().catch(() => {});
  } catch {
    /* ignore */
  }

  unlocked = true;
}

/** Pitido audible al hacer clic; no depende del flag `unlocked`. Útil para diagnosticar salida de audio. */
export function playTestBeep(): void {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    osc.frequency.value = 880;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}
