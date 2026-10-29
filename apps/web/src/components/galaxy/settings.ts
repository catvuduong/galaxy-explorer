import { useSyncExternalStore } from "react";

export type GalaxySettings = {
  arms: number;
  spin: boolean;
  speed: number;
  core: string;
  mid: string;
  edge: string;
};

export const DEFAULT_SETTINGS: GalaxySettings = {
  arms: 4,
  spin: true,
  speed: 1,
  core: "#ffa64d",
  mid: "#b36bff",
  edge: "#4f8cff",
};

const STORAGE_KEY = "galaxy-explorer:settings";

// A tiny external store: the server renders DEFAULT_SETTINGS, and the browser swaps in the
// saved values after hydration without a mismatch. Storage failures fall back to defaults.
let current: GalaxySettings | null = null;
const listeners = new Set<() => void>();

function readStored(): GalaxySettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getSnapshot(): GalaxySettings {
  current ??= readStored();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(next: GalaxySettings) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the settings still apply.
  }
  listeners.forEach((listener) => listener());
}

export function useGalaxySettings() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS);
}

export function updateGalaxySettings(patch: Partial<GalaxySettings>) {
  write({ ...getSnapshot(), ...patch });
}

export function resetGalaxySettings() {
  write(DEFAULT_SETTINGS);
}
