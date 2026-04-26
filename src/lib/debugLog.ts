export const DEBUG_AI =
  process.env.DEBUG_AI === "1" ||
  process.env.DEBUG_AI === "true" ||
  process.env.NEXT_PUBLIC_DEBUG_AI === "1" ||
  process.env.NEXT_PUBLIC_DEBUG_AI === "true";

export function debugLog(...args: unknown[]): void {
  if (DEBUG_AI) console.log(...args);
}

export function debugWarn(...args: unknown[]): void {
  if (DEBUG_AI) console.warn(...args);
}

