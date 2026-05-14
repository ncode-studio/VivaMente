/**
 * components/esercizi/families/simon/sequence.ts
 *
 * Generatore on-demand stimoli per Simon Spaziale.
 *
 * Ogni stimolo ha:
 *   - direzione  : la direzione indicata dalla freccia (target risposta)
 *   - posizione  : la zona dello schermo in cui appare (interferenza spaziale)
 *   - congruente : true se direzione === posizione, false altrimenti
 *
 * Cap anti-pattern (mantenuti tramite GoStreamState locale al sequencer):
 *   - max 3 stessi tipo (congr/incongr) consecutivi
 *   - max 3 stessa direzione consecutiva
 *   - max 2 stessa posizione consecutiva
 *
 * Ratio congr/incongr: campionamento Bernoulli con probabilità `incongrueRate`;
 * cap forza riselezione quando si supera la soglia di consecutivi.
 */

import type { SimonDirezione } from "./levels";

// ── Tipi ───────────────────────────────────────────────────────────────────────

export interface SimonStimolo {
  direzione:   SimonDirezione;
  posizione:   SimonDirezione;
  congruente:  boolean;
}

export interface SimonStreamState {
  lastTipo:            "congr" | "incongr" | null;
  consecutiviTipo:     number;
  lastDirezione:       SimonDirezione | null;
  consecutiviDirezione: number;
  lastPosizione:       SimonDirezione | null;
  consecutiviPosizione: number;
}

export function creaSimonStreamState(): SimonStreamState {
  return {
    lastTipo:             null,
    consecutiviTipo:      0,
    lastDirezione:        null,
    consecutiviDirezione: 0,
    lastPosizione:        null,
    consecutiviPosizione: 0,
  };
}

// ── Caps ──────────────────────────────────────────────────────────────────────

const MAX_TIPO_CONSEC       = 3;
const MAX_DIREZIONE_CONSEC  = 3;
const MAX_POSIZIONE_CONSEC  = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIREZIONI_2: readonly SimonDirezione[] = ["sx", "dx"];
const DIREZIONI_4: readonly SimonDirezione[] = ["sx", "dx", "su", "giu"];

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickExcept<T>(arr: readonly T[], except: T, rng: () => number): T {
  const candidates = arr.filter((x) => x !== except);
  return candidates[Math.floor(rng() * candidates.length)];
}

// ── Generatore ────────────────────────────────────────────────────────────────

export function generaProssimoStimoloSimon(
  state:          SimonStreamState,
  incongrueRate:  number,
  nDirezioni:     2 | 4,
  rng:            () => number = Math.random,
): SimonStimolo {
  const direzioniAttive = nDirezioni === 2 ? DIREZIONI_2 : DIREZIONI_4;

  // 1) Decidi se congruente o incongruente
  let congruente: boolean = rng() >= incongrueRate;
  // Forza switch se troppi consecutivi dello stesso tipo
  if (state.lastTipo !== null && state.consecutiviTipo >= MAX_TIPO_CONSEC) {
    congruente = state.lastTipo === "incongr";
  }
  const tipoStr: "congr" | "incongr" = congruente ? "congr" : "incongr";

  // 2) Pesca direzione (evita stessa direzione se cap raggiunto)
  let direzione: SimonDirezione;
  if (
    state.lastDirezione !== null &&
    state.consecutiviDirezione >= MAX_DIREZIONE_CONSEC
  ) {
    direzione = pickExcept(direzioniAttive, state.lastDirezione, rng);
  } else {
    direzione = pick(direzioniAttive, rng);
  }

  // 3) Deriva posizione dalla direzione e dal tipo (congr/incongr)
  let posizione: SimonDirezione;
  if (congruente) {
    posizione = direzione;
  } else {
    // Incongruente: posizione ≠ direzione. Random tra le altre N-1 direzioni.
    posizione = pickExcept(direzioniAttive, direzione, rng);
  }

  // 4) Verifica cap su posizione: se troppi consecutivi, riprova con altra direzione/coppia
  if (
    state.lastPosizione !== null &&
    state.consecutiviPosizione >= MAX_POSIZIONE_CONSEC &&
    posizione === state.lastPosizione
  ) {
    if (congruente) {
      // Cambia direzione per cambiare posizione (mantenendo congruenza)
      direzione = pickExcept(direzioniAttive, state.lastPosizione, rng);
      posizione = direzione;
    } else {
      // Cambia posizione (mantenendo incongruenza con la direzione)
      const candidate = direzioniAttive.filter(
        (p) => p !== direzione && p !== state.lastPosizione,
      );
      if (candidate.length > 0) {
        posizione = candidate[Math.floor(rng() * candidate.length)];
      }
    }
  }

  // 5) Aggiorna state
  if (state.lastTipo === tipoStr) state.consecutiviTipo += 1;
  else                            state.consecutiviTipo = 1;
  state.lastTipo = tipoStr;

  if (state.lastDirezione === direzione) state.consecutiviDirezione += 1;
  else                                   state.consecutiviDirezione = 1;
  state.lastDirezione = direzione;

  if (state.lastPosizione === posizione) state.consecutiviPosizione += 1;
  else                                   state.consecutiviPosizione = 1;
  state.lastPosizione = posizione;

  return { direzione, posizione, congruente };
}
