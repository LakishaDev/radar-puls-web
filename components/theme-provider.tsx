"use client";

import {useEffect} from "react";

export function ThemeProvider({children}: {children: React.ReactNode}) {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("rp-theme");
    const shouldUseDark =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  return <>{children}</>;
}
