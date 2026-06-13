"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ClientTheme {
  client_name: string;
  primary_color: string;
  secondary_color?: string;
  logo_url?: string;
}

interface ThemeContextType {
  theme: ClientTheme | null;
  setEngagementId: (id: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  setEngagementId: () => {},
});

export function useClientTheme() {
  return useContext(ThemeContext);
}

export default function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ClientTheme | null>(null);
  const [engagementId, setEngagementId] = useState<string | null>(null);

  useEffect(() => {
    if (!engagementId) {
      setTheme(null);
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/portal/theme?engagement_id=${engagementId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) {
          setTheme(data.theme);
        } else if (data.default) {
          setTheme(data.default);
        }
      })
      .catch(() => setTheme(null));
  }, [engagementId]);

  useEffect(() => {
    if (theme?.primary_color) {
      document.documentElement.style.setProperty("--client-primary", theme.primary_color);
    } else {
      document.documentElement.style.removeProperty("--client-primary");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setEngagementId }}>
      {children}
    </ThemeContext.Provider>
  );
}
