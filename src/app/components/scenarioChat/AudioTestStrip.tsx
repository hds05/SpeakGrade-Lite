"use client";

import { playTestBeep, unlockWebAudioOnUserGesture } from "@/utils/webAudioUnlock";

/**
 * Clic de prueba: desbloquea audio del navegador y reproduce un pitido corto.
 * Útil si no se escucha la voz del bot (Windows / política de autoplay).
 */
export default function AudioTestStrip(): React.JSX.Element {
  const handleTest = () => {
    unlockWebAudioOnUserGesture();
    playTestBeep();
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-center text-[11px] leading-snug text-white/80 sm:text-xs">
      <p className="mb-2 text-white/90">
        ¿No escuchas al personaje? Prueba el sonido y revisa el volumen del sistema.
      </p>
      <button
        type="button"
        onClick={handleTest}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
      >
        Probar sonido (pitido)
      </button>
      <p className="mt-2 text-white/60">
        Windows: clic derecho en el icono de volumen → configuración de sonido → dispositivo de salida
        correcto. Comprueba que la pestaña del navegador no esté silenciada.
      </p>
    </div>
  );
}
