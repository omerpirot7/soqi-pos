"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  applyAccentColor,
  clearAccentColor,
  normalizeHex,
  readStoredAccent,
  writeStoredAccent,
} from "@/lib/accent-color";
import { cn } from "@/lib/utils";

export function AccentColorPicker() {
  const t = useTranslations("common");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [color, setColor] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredAccent();
    if (stored) setColor(normalizeHex(stored));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dark = resolvedTheme === "dark";
    if (color === DEFAULT_ACCENT && !readStoredAccent()) {
      clearAccentColor();
      return;
    }
    applyAccentColor(color, dark);
  }, [color, mounted, resolvedTheme]);

  function pick(hex: string) {
    const next = normalizeHex(hex);
    setColor(next);
    writeStoredAccent(next);
    applyAccentColor(next, resolvedTheme === "dark");
  }

  function reset() {
    setColor(DEFAULT_ACCENT);
    writeStoredAccent(null);
    clearAccentColor();
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-10 w-10" aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label={t("accentColor")}
          title={t("accentColor")}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <Palette className="h-5 w-5" />
            <span
              className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
              style={{ backgroundColor: color }}
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-3">
        <DropdownMenuLabel className="px-0 pb-2 pt-0 text-sm font-semibold">
          {t("accentColor")}
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-2">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.id}
              aria-label={p.id}
              onClick={() => pick(p.hex)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                normalizeHex(color) === p.hex
                  ? "border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground/30"
                  : "border-transparent"
              )}
              style={{ backgroundColor: p.hex }}
            />
          ))}
        </div>
        <DropdownMenuSeparator className="my-3" />
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t("customColor")}</span>
          <input
            type="color"
            value={normalizeHex(color)}
            onChange={(e) => pick(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
          />
        </label>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-2"
          onClick={reset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("resetColor")}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
