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

interface ThemeResponse {
  theme?: ClientTheme;
  default?: ClientTheme;
}

export default function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [fetchedTheme, setFetchedTheme] = useState<ClientTheme | null>(null);
  const [engagementId, setEngagementId] = useState<string | null>(null);

  // Derive the active theme during render: when there is no engagement, the
  // theme is null without needing a synchronous setState inside the effect.
  const theme = engagementId ? fetchedTheme : null;

  useEffect(() => {
    if (!engagementId) {
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`/api/v1/portal/theme?engagement_id=${engagementId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((raw) => {
        const data = raw as ThemeResponse;
        if (data.theme) {
          setFetchedTheme(data.theme);
        } else if (data.default) {
          setFetchedTheme(data.default);
        }
      })
      .catch(() => setFetchedTheme(null));
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
