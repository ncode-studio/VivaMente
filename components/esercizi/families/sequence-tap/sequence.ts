/**
 * components/esercizi/families/sequence-tap/sequence.ts
 *
 * Generazione stimoli per i 4 esercizi Sequence Tap.
 *
 * Numeri Forward/Backward : cifre 0–9, nessuna ripetizione consecutiva,
 *   nessuna monotona ≥ 3.
 * Parole Forward          : parole da pool shuffled, senza rimpiazzo entro sessione.
 * Parole Backward         : parola singola + tastiera (assistita / mista / alfabeto).
 */

import type { STStreamLevelConfig, STBackwardLevelConfig, TasteraMode } from "./levels";
import { POOL_PAROLE_FORWARD, POOL_PAROLE_BACKWARD } from "./word-pools";

// ── Tipi esportati ────────────────────────────────────────────────────────────

export type StimoloSTStream = {
  mode: "numeri_forward" | "numeri_backward" | "parole_forward";
  sequence:        string[];
  responseOptions: string[];
  targetSequence:  string[];
  speedMs:         number;
  tLimMs:          number | null;
};

export type StimoloSTBackward = {
  mode:           "parole_backward";
  parola:         string;
  tastiera:       string[];
  tasteraMode:    TasteraMode;
  targetSequence: string[];
  espoMs:         number;
  tLimMs:         number;
};

export type StimoloST = StimoloSTStream | StimoloSTBackward;

/** Risposta: sequenza di stringhe toccate dall'utente nell'ordine di tap. */
export type RispostaST = string[];

// ── Pool ref parole forward ───────────────────────────────────────────────────

export type ParolePoolRef = { pool: string[]; idx: number };

export function creaParolePoolRef(): ParolePoolRef {
  return { pool: [], idx: 999 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Matrice vicinanza fonetica/visiva per distrattori Parole Backward.
const VICINI: Record<string, readonly string[]> = {
  A: ["E", "O"], B: ["P", "D"], C: ["G", "K"], D: ["T", "B"],
  E: ["F", "A"], F: ["V", "S"], G: ["C", "J"], H: ["N", "K"],
  I: ["L", "J"], J: ["I", "G"], K: ["C", "X"], L: ["R", "I"],
  M: ["N", "W"], N: ["M", "H"], O: ["A", "U"], P: ["B", "T"],
  Q: ["C", "K"], R: ["L", "N"], S: ["Z", "F"], T: ["D", "P"],
  U: ["V", "O"], V: ["F", "B"], W: ["M", "V"], X: ["K", "S"],
  Y: ["I", "J"], Z: ["S", "C"],
};

const ALPHABET_FULL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── Generazione cifre ─────────────────────────────────────────────────────────

function generaSequenzaNumeri(seqLen: number, rng: () => number): string[] {
  for (let attempt = 0; attempt < 100; attempt++) {
    const seq = shuffled("0123456789".split(""), rng).slice(0, seqLen);
    let valid = true;
    for (let i = 0; i <= seq.length - 3; i++) {
      const a = Number(seq[i]), b = Number(seq[i + 1]), c = Number(seq[i + 2]);
      if ((b === a + 1 && c === a + 2) || (b === a - 1 && c === a - 2)) {
        valid = false;
        break;
      }
    }
    if (valid) return seq;
  }
  return shuffled("0123456789".split(""), rng).slice(0, seqLen);
}

// ── Generatori pubblici ───────────────────────────────────────────────────────

export function generaNumeriForward(
  level: STStreamLevelConfig,
  seqLenOverride: number,
  rng: () => number,
): StimoloSTStream {
  const sequence = generaSequenzaNumeri(seqLenOverride, rng);
  return {
    mode: "numeri_forward",
    sequence,
    responseOptions: "0123456789".split(""),
    targetSequence: sequence,
    speedMs: level.speedMs,
    tLimMs: level.tLimMs,
  };
}

export function generaNumeriBackward(
  level: STStreamLevelConfig,
  seqLenOverride: number,
  rng: () => number,
): StimoloSTStream {
  const sequence = generaSequenzaNumeri(seqLenOverride, rng);
  return {
    mode: "numeri_backward",
    sequence,
    responseOptions: "0123456789".split(""),
    targetSequence: [...sequence].reverse(),
    speedMs: level.speedMs,
    tLimMs: level.tLimMs,
  };
}

export function generaParoleForward(
  level: STStreamLevelConfig,
  seqLenOverride: number,
  poolRef: ParolePoolRef,
  rng: () => number,
): StimoloSTStream {
  const sequence: string[] = [];
  for (let i = 0; i < seqLenOverride; i++) {
    if (poolRef.idx >= poolRef.pool.length) {
      poolRef.pool = shuffled(POOL_PAROLE_FORWARD, rng);
      poolRef.idx = 0;
    }
    sequence.push(poolRef.pool[poolRef.idx++]);
  }
  return {
    mode: "parole_forward",
    sequence,
    responseOptions: shuffled(sequence, rng),
    targetSequence: sequence,
    speedMs: level.speedMs,
    tLimMs: level.tLimMs,
  };
}

export function generaParoleBackward(
  level: STBackwardLevelConfig,
  wordLenOverride: number,
  usedWords: Set<string>,
  rng: () => number,
): StimoloSTBackward {
  const pool = POOL_PAROLE_BACKWARD[wordLenOverride] ?? POOL_PAROLE_BACKWARD[4];
  const available = (pool as string[]).filter((w) => !usedWords.has(w));
  const source = available.length > 0 ? available : [...pool];
  const parola = source[Math.floor(rng() * source.length)];

  usedWords.add(parola);
  if (usedWords.size > 10) {
    usedWords.delete(usedWords.values().next().value as string);
  }

  const lettere  = parola.split("");
  const targetSequence = [...lettere].reverse();

  let tastiera: string[];
  const { tastiera: tasteraMode } = level;

  if (tasteraMode === "assistita") {
    tastiera = shuffled(lettere, rng);
  } else if (tasteraMode === "mista_4" || tasteraMode === "mista_6") {
    const nDist = tasteraMode === "mista_4" ? 4 : 6;
    const uniche = [...new Set(lettere)];
    const candidates: string[] = [];
    for (const l of uniche) {
      for (const v of VICINI[l] ?? []) {
        if (!uniche.includes(v) && !candidates.includes(v)) candidates.push(v);
      }
    }
    for (const l of shuffled(ALPHABET_FULL, rng)) {
      if (!uniche.includes(l) && !candidates.includes(l) && candidates.length < nDist * 2) {
        candidates.push(l);
      }
    }
    tastiera = shuffled([...uniche, ...shuffled(candidates, rng).slice(0, nDist)], rng);
  } else {
    tastiera = shuffled(ALPHABET_FULL, rng);
  }

  return {
    mode: "parole_backward",
    parola,
    tastiera,
    tasteraMode,
    targetSequence,
    espoMs: level.espoMs,
    tLimMs: level.tLimMs,
  };
}
