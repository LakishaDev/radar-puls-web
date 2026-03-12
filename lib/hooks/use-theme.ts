"use client";

import {useSyncExternalStore} from "react";

type Theme = "light" | "dark";
const storageKey = "rp-theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => onStoreChange();
  const onStorageChange = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };
  const onThemeChange = () => onStoreChange();

  mediaQuery.addEventListener("change", onMediaChange);
  window.addEventListener("storage", onStorageChange);
  window.addEventListener("rp-theme-change", onThemeChange as EventListener);

  return () => {
    mediaQuery.removeEventListener("change", onMediaChange);
    window.removeEventListener("storage", onStorageChange);
    window.removeEventListener("rp-theme-change", onThemeChange as EventListener);
  };
}

function getThemeSnapshot(): Theme {
  return getPreferredTheme();
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  const setTheme = (nextTheme: Theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextTheme);
      window.dispatchEvent(new Event("rp-theme-change"));
    }
    applyThemeClass(nextTheme);
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return {theme, setTheme, toggleTheme};
}
