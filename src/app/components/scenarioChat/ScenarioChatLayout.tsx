"use client";

import type { ReactNode, RefObject } from "react";

export interface ScenarioChatLayoutProps {
  chatScrollRef: RefObject<HTMLDivElement | null>;
  finalTranscript: string;
  interimTranscript: string;
  listening: boolean;
  micActive: boolean;
  headerSlot: ReactNode;
  children: ReactNode;
  controlsSlot: ReactNode;
  /** Texto de ayuda bajo los botones (mic) */
  hintText?: string;
  /** Franja opcional: prueba de sonido + avisos */
  audioHelpSlot?: ReactNode;
}

/**
 * Layout unificado: transcripción en vivo arriba, mensajes centrados en panel rosa, sin scroll de página.
 */
export default function ScenarioChatLayout({
  chatScrollRef,
  finalTranscript,
  interimTranscript,
  listening,
  micActive,
  headerSlot,
  children,
  controlsSlot,
  hintText,
  audioHelpSlot,
}: ScenarioChatLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] max-h-[100dvh] flex-col overflow-hidden px-3 pt-3 pb-4 sm:px-4">
      {headerSlot}

      <div className="mx-auto mt-3 flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-2xl border-2 border-rose-500/45 bg-white/10 shadow-lg backdrop-blur-md">
        <div className="shrink-0 border-b border-rose-500/35 bg-rose-950/30 px-4 py-3">
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-rose-200/90">
            Live transcription
          </p>
          <div className="min-h-[2.75rem] text-center text-sm leading-relaxed text-white sm:text-base">
            {listening && (finalTranscript || interimTranscript) ? (
              <p className="px-1">
                <span className="text-white">{finalTranscript}</span>
                {interimTranscript ? (
                  <span className="text-rose-100/95 italic"> {interimTranscript}</span>
                ) : null}
              </p>
            ) : micActive ? (
              <p className="text-white/55">
                Speak naturally — your words appear here in real time.
              </p>
            ) : (
              <p className="text-white/55">Microphone is muted. Unmute to speak.</p>
            )}
          </div>
          <p className="mt-1 text-center text-xs text-rose-200/80">
            {micActive
              ? listening
                ? "Listening…"
                : "Processing or waiting for speech…"
              : "Mic off"}
          </p>
        </div>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
        >
          <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-white/70">
            Conversation
          </h3>
          <div className="flex flex-col gap-3">{children}</div>
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-2xl shrink-0 flex-col items-center gap-2">
        {controlsSlot}
        {hintText ? (
          <p className="text-center text-xs text-blue-100/90">{hintText}</p>
        ) : null}
        {audioHelpSlot}
      </div>
    </div>
  );
}
