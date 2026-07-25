/**
 * Detect USB/HID barcode scanner input:
 * fast sequential keystrokes ending with Enter.
 */

export type ScannerOptions = {
  maxIntervalMs?: number;
  minLength?: number;
  onScan: (code: string) => void;
};

export function createBarcodeScannerListener(options: ScannerOptions) {
  const maxIntervalMs = options.maxIntervalMs ?? 50;
  const minLength = options.minLength ?? 3;

  let buffer = "";
  let lastKeyTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    buffer = "";
    lastKeyTime = 0;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isInput =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable;

    // Allow scanner in dedicated barcode fields
    const isBarcodeField = target?.getAttribute?.("data-barcode-input") === "true";

    if (isInput && !isBarcodeField) {
      // Still capture if typing is very fast (scanner into focused search)
      const now = Date.now();
      if (lastKeyTime && now - lastKeyTime > maxIntervalMs && buffer.length < minLength) {
        reset();
        return;
      }
    }

    const now = Date.now();
    if (lastKeyTime && now - lastKeyTime > maxIntervalMs) {
      buffer = "";
    }
    lastKeyTime = now;

    if (e.key === "Enter") {
      if (buffer.length >= minLength) {
        e.preventDefault();
        options.onScan(buffer);
      }
      reset();
      return;
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (timer) clearTimeout(timer);
      timer = setTimeout(reset, maxIntervalMs * 4);
    }
  };

  return {
    start: () => window.addEventListener("keydown", handler),
    stop: () => {
      window.removeEventListener("keydown", handler);
      reset();
    },
  };
}
