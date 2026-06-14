"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children, defaultTheme = "light" }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();
      const stored = localStorage.getItem("xc-theme") as Theme | null;
      if (!active) return;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      }
      setStorageReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (storageReady) {
      localStorage.setItem("xc-theme", theme);
    }
  }, [theme, storageReady]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
