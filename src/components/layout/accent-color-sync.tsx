"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  applyAccentColor,
  clearAccentColor,
  readStoredAccent,
} from "@/lib/accent-color";

/** Re-applies stored accent when theme (light/dark) changes */
export function AccentColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const stored = readStoredAccent();
    if (!stored) {
      clearAccentColor();
      return;
    }
    applyAccentColor(stored, resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}
