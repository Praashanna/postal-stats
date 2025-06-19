import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TimePeriod } from "@/types";

interface PeriodContextType {
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
  clearPeriod: () => void;
}

const PeriodContext = createContext<PeriodContextType | null>(null);

export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (context === null) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
};

interface PeriodProviderProps {
  children: ReactNode;
}

export function PeriodProvider({ children }: PeriodProviderProps) {
  const [period, setPeriodState] = useState<TimePeriod>(() => {
    const savedPeriod = localStorage.getItem("postalStatsPeriod");
    const validPeriods: TimePeriod[] = ["today", "yesterday", "7d", "14d", "30d"];
    return validPeriods.includes(savedPeriod as TimePeriod) ? (savedPeriod as TimePeriod) : "7d";
  });

  useEffect(() => {
    localStorage.setItem("postalStatsPeriod", period);
  }, [period]);

  const setPeriod = (newPeriod: TimePeriod) => {
    setPeriodState(newPeriod);
  };

  const clearPeriod = () => {
    localStorage.removeItem("postalStatsPeriod");
    setPeriodState("7d");
  };

  return (
    <PeriodContext.Provider value={{ period, setPeriod, clearPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}
