/** Accent / primary brand color helpers (HSL CSS vars used by Tailwind theme) */

export const ACCENT_STORAGE_KEY = "soqi-accent-color";
export const ACCENT_CHANGE_EVENT = "soqi-accent-change";
export const DEFAULT_ACCENT = "#15803d";

export const ACCENT_PRESETS = [
  { id: "green", hex: "#15803d" },
  { id: "teal", hex: "#0f766e" },
  { id: "blue", hex: "#1d4ed8" },
  { id: "indigo", hex: "#4f46e5" },
  { id: "violet", hex: "#7c3aed" },
  { id: "rose", hex: "#e11d48" },
  { id: "orange", hex: "#ea580c" },
  { id: "amber", hex: "#d97706" },
  { id: "slate", hex: "#334155" },
] as const;

/** CSS vars overridden when a custom accent is applied */
const ACCENT_CSS_VARS = [
  "--primary",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--input",
] as const;

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) {
    return { h: 158, s: 64, l: 28 };
  }
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function normalizeHex(hex: string): string {
  const raw = hex.trim();
  if (!raw) return DEFAULT_ACCENT;
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const a = withHash[1];
    const b = withHash[2];
    const c = withHash[3];
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return DEFAULT_ACCENT;
}

function notifyAccentChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACCENT_CHANGE_EVENT));
}

/** Apply primary + surface CSS variables on <html> (overrides light/dark theme tokens) */
export function applyAccentColor(hex: string, dark = false) {
  if (typeof document === "undefined") return;
  const { h, s, l } = hexToHsl(normalizeHex(hex));
  const primaryL = dark ? Math.min(Math.max(l, 42), 55) : Math.min(Math.max(l, 22), 40);
  const root = document.documentElement;

  root.style.setProperty("--primary", `${h} ${s}% ${primaryL}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${primaryL}%`);

  if (dark) {
    root.style.setProperty("--background", `${h} 20% 8%`);
    root.style.setProperty("--foreground", `${h} 15% 95%`);
    root.style.setProperty("--card", `${h} 18% 11%`);
    root.style.setProperty("--card-foreground", `${h} 15% 95%`);
    root.style.setProperty("--popover", `${h} 18% 11%`);
    root.style.setProperty("--popover-foreground", `${h} 15% 95%`);
    root.style.setProperty("--secondary", `${h} 14% 18%`);
    root.style.setProperty("--secondary-foreground", `${h} 15% 95%`);
    root.style.setProperty("--muted", `${h} 12% 16%`);
    root.style.setProperty("--muted-foreground", `${h} 10% 65%`);
    root.style.setProperty("--accent", `${h} 25% 18%`);
    root.style.setProperty("--accent-foreground", `${h} 50% 70%`);
    root.style.setProperty("--border", `${h} 12% 20%`);
    root.style.setProperty("--input", `${h} 12% 20%`);
  } else {
    root.style.setProperty("--background", `${h} 20% 98%`);
    root.style.setProperty("--foreground", `${h} 30% 10%`);
    root.style.setProperty("--card", `${h} 35% 99%`);
    root.style.setProperty("--card-foreground", `${h} 30% 10%`);
    root.style.setProperty("--popover", `${h} 35% 99%`);
    root.style.setProperty("--popover-foreground", `${h} 30% 10%`);
    root.style.setProperty("--secondary", `${h} 14% 92%`);
    root.style.setProperty("--secondary-foreground", `${h} 30% 15%`);
    root.style.setProperty("--muted", `${h} 10% 94%`);
    root.style.setProperty("--muted-foreground", `${h} 8% 40%`);
    root.style.setProperty("--accent", `${h} 30% 92%`);
    root.style.setProperty(
      "--accent-foreground",
      `${h} ${s}% ${Math.max(primaryL - 6, 18)}%`
    );
    root.style.setProperty("--border", `${h} 12% 88%`);
    root.style.setProperty("--input", `${h} 12% 88%`);
  }

  notifyAccentChange();
}

export function clearAccentColor() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of ACCENT_CSS_VARS) {
    root.style.removeProperty(key);
  }
  notifyAccentChange();
}

export function readStoredAccent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredAccent(hex: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!hex) localStorage.removeItem(ACCENT_STORAGE_KEY);
    else localStorage.setItem(ACCENT_STORAGE_KEY, normalizeHex(hex));
  } catch {
    /* ignore */
  }
}

/** Read resolved primary color for charts / non-CSS consumers */
export function readPrimaryCssColor(): string {
  if (typeof document === "undefined") return "hsl(158 64% 28%)";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  return raw ? `hsl(${raw})` : "hsl(158 64% 28%)";
}
