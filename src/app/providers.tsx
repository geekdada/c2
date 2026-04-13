import { useEffect, type PropsWithChildren } from "react";

import { useUiStore } from "./store/ui";

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    if (theme !== "system") {
      applyDarkClass(theme === "dark");
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyDarkClass(mq.matches);

    const onChange = (e: MediaQueryListEvent) => applyDarkClass(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return children;
}
