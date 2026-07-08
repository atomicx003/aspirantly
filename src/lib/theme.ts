export interface ThemeDef {
  key: string;
  label: string;
  /** oklch primary accent color */
  primary: string;
  /** foreground on top of primary */
  primaryForeground: string;
  /** swatch shown in the picker (any valid CSS color) */
  swatch: string;
}

export const THEMES: ThemeDef[] = [
  {
    key: "cyan",
    label: "Neon Cyan",
    primary: "oklch(0.78 0.16 195)",
    primaryForeground: "oklch(0.16 0.02 265)",
    swatch: "oklch(0.78 0.16 195)",
  },
  {
    key: "blue",
    label: "Electric Blue",
    primary: "oklch(0.68 0.18 255)",
    primaryForeground: "oklch(0.98 0.01 250)",
    swatch: "oklch(0.68 0.18 255)",
  },
  {
    key: "purple",
    label: "Electric Purple",
    primary: "oklch(0.62 0.24 300)",
    primaryForeground: "oklch(0.98 0.01 250)",
    swatch: "oklch(0.62 0.24 300)",
  },
  {
    key: "emerald",
    label: "Emerald",
    primary: "oklch(0.75 0.19 150)",
    primaryForeground: "oklch(0.16 0.02 265)",
    swatch: "oklch(0.75 0.19 150)",
  },
  {
    key: "orange",
    label: "Sunset Orange",
    primary: "oklch(0.74 0.17 55)",
    primaryForeground: "oklch(0.16 0.02 265)",
    swatch: "oklch(0.74 0.17 55)",
  },
  {
    key: "red",
    label: "Crimson Red",
    primary: "oklch(0.63 0.24 20)",
    primaryForeground: "oklch(0.98 0.01 250)",
    swatch: "oklch(0.63 0.24 20)",
  },
  {
    key: "pink",
    label: "Hot Pink",
    primary: "oklch(0.7 0.22 350)",
    primaryForeground: "oklch(0.98 0.01 250)",
    swatch: "oklch(0.7 0.22 350)",
  },
];

export const DEFAULT_THEME = "cyan";
export const THEME_STORAGE_KEY = "aspirantly-theme";

export function getTheme(key: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}

/** Applies the theme by overriding the primary accent CSS variables on :root. */
export function applyTheme(key: string | null | undefined) {
  if (typeof document === "undefined") return;
  const t = getTheme(key);
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--primary-foreground", t.primaryForeground);
  root.style.setProperty("--ring", t.primary);
  root.style.setProperty("--sidebar-primary", t.primary);
  root.style.setProperty("--sidebar-ring", t.primary);
  root.style.setProperty("--glow-cyan", `0 0 30px ${t.primary}`);
}

export function loadStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
}

export function storeTheme(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, key);
  applyTheme(key);
}
