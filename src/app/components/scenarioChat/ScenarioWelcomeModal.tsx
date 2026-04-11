"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export interface ScenarioWelcomeModalProps {
  open: boolean;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: ReactNode;
  /** Bullet lines; se antepone "• " si la línea no empieza ya con "•". */
  bulletPoints: readonly string[];
  ctaLabel: string;
  onStart: () => void | Promise<void>;
  /** Encabezado del recuadro azul (por defecto igual que Easy Weekly Manager). */
  expectHeading?: string;
  /** Contenido opcional entre la descripción y el recuadro azul (p. ej. rol + hechos). */
  contextSlot?: ReactNode;
  /** z-index del overlay (p. ej. z-[999] si hace falta tapar capas legacy). */
  overlayClassName?: string;
}

/**
 * Modal de bienvenida unificado (misma estructura que `/cards/easyWeeklyManager`).
 */
export default function ScenarioWelcomeModal({
  open,
  imageSrc,
  imageAlt,
  title,
  description,
  bulletPoints,
  ctaLabel,
  onStart,
  expectHeading = "What to expect:",
  contextSlot,
  overlayClassName = "z-50",
}: ScenarioWelcomeModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/80 p-4 ${overlayClassName}`}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-6">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={200}
            height={150}
            className="mx-auto rounded-xl"
          />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-gray-800">{title}</h2>
        <div className="mb-6 text-lg leading-relaxed text-gray-600">
          {description}
        </div>
        {contextSlot ? <div className="mb-6 text-left">{contextSlot}</div> : null}
        <div className="mb-6 rounded-xl bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-800">{expectHeading}</h3>
          <ul className="space-y-1 text-left text-blue-700">
            {bulletPoints.map((line, i) => (
              <li key={i}>
                {line.trimStart().startsWith("•") ? line : `• ${line}`}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => void onStart()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-blue-800"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
