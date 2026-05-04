/**
 * components/esercizi/families/memoria-lista/sequence.ts
 *
 * Generatore stimoli Memoria Lista — varianti Riconoscimento.
 *
 * Flusso trial: encoding N item → delay → riconoscimento (griglia N+M item).
 * L'utente tocca tutti gli item che ricorda dalla lista.
 */

import { ML_ITEMS, type MLWordItem } from "./items";

export type { MLWordItem };

// ── Tipi ───────────────────────────────────────────────────────────────────────

export type MLVariante = "parole" | "immagini";

export interface StimoloML {
  variante: MLVariante;
  items:   MLWordItem[];  // N target (in ordine di presentazione)
  griglia: MLWordItem[];  // N target + M foil, mescolati per il riconoscimento
  speedMs: number;
  delayMs: number;
}

export type RispostaML = {
  selezionati: string[]; // id degli item toccati nel riconoscimento
} | null;

// ── Utility ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Pool senza ripetizione ─────────────────────────────────────────────────────

export interface MLPoolRef {
  shuffled: MLWordItem[];
  idx:      number;
}

export function creaMLPoolRef(rng: () => number): MLPoolRef {
  return { shuffled: shuffle([...ML_ITEMS], rng), idx: 0 };
}

function nextItems(count: number, poolRef: MLPoolRef, rng: () => number): MLWordItem[] {
  const pool = poolRef.shuffled;
  const len  = pool.length;
  const result: MLWordItem[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(poolRef.idx + i) % len]);
  }
  poolRef.idx = (poolRef.idx + count) % len;
  if (poolRef.idx < count) {
    poolRef.shuffled = shuffle([...ML_ITEMS], rng);
  }
  return result;
}

// ── Generatore principale ──────────────────────────────────────────────────────

export function generaStimoloML(
  nItems:   number,
  nFoil:    number,
  variante: MLVariante,
  speedMs:  number,
  delayMs:  number,
  poolRef:  MLPoolRef,
  rng:      () => number,
): StimoloML {
  const total   = Math.min(nItems + nFoil, ML_ITEMS.length);
  const all     = nextItems(total, poolRef, rng);
  const items   = all.slice(0, nItems);
  const foils   = all.slice(nItems);
  const griglia = shuffle([...items, ...foils], rng);

  return { variante, items, griglia, speedMs, delayMs };
}
