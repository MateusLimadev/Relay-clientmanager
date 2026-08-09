"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/icons";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Lê a classe aplicada pelo script inline no <head> para evitar mismatch de hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  if (theme === null) {
    return <div className={`h-9 w-9 ${className}`} aria-hidden />;
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-border-soft ${className}`}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
