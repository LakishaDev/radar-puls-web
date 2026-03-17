"use client";

import {useCallback, useEffect} from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void, enabled = true) {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (combo.key !== "Escape" && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")) {
        if (!combo.ctrl) {
          return;
        }
      }

      const ctrlMatch = combo.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = combo.alt ? event.altKey : !event.altKey;

      if (event.key.toLowerCase() !== combo.key.toLowerCase()) {
        return;
      }
      if (!ctrlMatch || !shiftMatch || !altMatch) {
        return;
      }

      event.preventDefault();
      callback();
    },
    [callback, combo, enabled],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, handler]);
}
