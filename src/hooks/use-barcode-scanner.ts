"use client";

import { useEffect, useCallback } from "react";
import { createBarcodeScannerListener } from "@/lib/barcode-scanner";

export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
  const stableOnScan = useCallback(onScan, [onScan]);

  useEffect(() => {
    if (!enabled) return;
    const listener = createBarcodeScannerListener({ onScan: stableOnScan });
    listener.start();
    return () => listener.stop();
  }, [stableOnScan, enabled]);
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const fn = shortcuts[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
