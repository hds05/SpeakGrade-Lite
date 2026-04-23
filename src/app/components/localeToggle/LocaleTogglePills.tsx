"use client";

import type { UiLocale } from "@/utils/uiLocale";

export default function LocaleTogglePills({
  locale,
  onChange,
}: {
  locale: UiLocale;
  onChange: (locale: UiLocale) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
          locale === "en"
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onChange("es")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
          locale === "es"
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        Español
      </button>
    </div>
  );
}

