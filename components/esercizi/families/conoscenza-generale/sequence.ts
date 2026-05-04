/**
 * components/esercizi/families/conoscenza-generale/sequence.ts
 *
 * Tipo stimolo e generatore per Conoscenza Generale.
 */

import { DOMANDE_PER_RARITÀ, type CGDomanda } from "./questions";
import { RARITÀ_BY_INDEX, type CGRarità } from "./levels";

// ── Tipo stimolo ───────────────────────────────────────────────────────────────

export interface StimoloCG {
  id:        string;
  domanda:   string;
  opzioni:   [string, string, string, string];
  indiceCor: 0 | 1 | 2 | 3;
  rarità:    CGRarità;
  tLimMs:    number;
}

export type RispostaCG = number | null; // 0-3 = opzione tappata; null = timeout

// ── Pool senza ripetizione ─────────────────────────────────────────────────────

export interface CGPoolRef {
  pools: Record<CGRarità, CGDomanda[]>;
  idx:   Record<CGRarità, number>;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function creaPoolRef(rng: () => number): CGPoolRef {
  const rarità: CGRarità[] = ["molto_nota", "nota", "media", "meno_nota", "rara"];
  const pools = {} as Record<CGRarità, CGDomanda[]>;
  const idx   = {} as Record<CGRarità, number>;
  for (const r of rarità) {
    pools[r] = shuffle([...(DOMANDE_PER_RARITÀ[r] ?? [])], rng);
    idx[r]   = 0;
  }
  return { pools, idx };
}

// ── Generatore ─────────────────────────────────────────────────────────────────

export function generaDomanda(
  raritàIndex: number,
  tLimMs: number,
  poolRef: CGPoolRef,
): StimoloCG {
  const rarità = RARITÀ_BY_INDEX[Math.min(4, Math.max(0, raritàIndex))];
  const arr = poolRef.pools[rarità];
  const item = arr[poolRef.idx[rarità] % arr.length];
  poolRef.idx[rarità]++;

  return {
    id:        item.id,
    domanda:   item.domanda,
    opzioni:   item.opzioni,
    indiceCor: item.indiceCor,
    rarità:    item.rarità,
    tLimMs,
  };
}
