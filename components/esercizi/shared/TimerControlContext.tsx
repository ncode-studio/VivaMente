"use client";

import { createContext, useContext } from "react";

export interface TimerControl {
  pausa: () => void;
  riprendi: () => void;
}

export const TimerControlContext = createContext<TimerControl | null>(null);

export function useTimerControl(): TimerControl | null {
  return useContext(TimerControlContext);
}
