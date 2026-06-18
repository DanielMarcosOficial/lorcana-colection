"use client";

import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else setTheme("system");
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    const html = document.documentElement;
    if (t === "dark") {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (t === "light") {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      localStorage.removeItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
  };

  if (!mounted) {
    return <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-navy-700 animate-pulse" />;
  }

  const options: { value: Theme; label: string; Icon: () => React.ReactElement }[] = [
    { value: "light", label: "Claro", Icon: SunIcon },
    { value: "system", label: "Sistema", Icon: MonitorIcon },
    { value: "dark", label: "Escuro", Icon: MoonIcon },
  ];

  return (
    <div
      className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-600 dark:bg-navy-800"
      role="group"
      aria-label="Tema"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => apply(value)}
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            theme === value
              ? "bg-white text-indigo-600 shadow-sm dark:bg-navy-600 dark:text-indigo-300"
              : "text-slate-500 hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100"
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
