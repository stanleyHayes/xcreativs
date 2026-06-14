"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CurrencyCode = "USD" | "GHS" | "EUR";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (amount: number) => string;
  convert: (amountUSD: number) => number;
}

const rates: Record<CurrencyCode, number> = {
  USD: 1,
  GHS: 15.5,
  EUR: 0.92,
};

const symbols: Record<CurrencyCode, string> = {
  USD: "$",
  GHS: "₵",
  EUR: "€",
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  format: (a) => `$${a.toLocaleString()}`,
  convert: (a) => a,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();
      const stored = localStorage.getItem("xc-currency") as CurrencyCode | null;
      if (active && stored && rates[stored]) {
        setCurrencyState(stored);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("xc-currency", c);
    }
  };

  const convert = (amountUSD: number) => {
    return amountUSD * rates[currency];
  };

  const format = (amount: number) => {
    const converted = currency === "USD" ? amount : amount * rates[currency];
    return `${symbols[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}
