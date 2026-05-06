/**
 * components/esercizi/families/pasat-light/sequence.ts
 *
 * Generazione sequenze per Pasat Light (variante MC, lv 1-10).
 *
 * Ogni StimoloPL è una sequenza di cifre con operazioni assegnate.
 * La prima cifra non ha risposta (memorizzazione). I passi successivi
 * ciascuno richiedono una risposta MC (prev OP curr = ?).
 *
 * Vincoli generazione:
 *   - Sottrazione solo quando prev >= curr (risultato >= 0)
 *   - 4 opzioni MC: risultato + 3 distrattori plausibili (±1, ±2, distante)
 *   - Tutte le opzioni >= 0, uniche
 */

import type { PLOp, PLLevelConfig } from "./levels";

// ── Tipi ───────────────────────────────────────────────────────────────────────

export interface PLPasso {
  cifraCorr: number;
  op:        PLOp;
  risultato: number;
  opzioni:   [number, number, number, number];
  idxCorr:   0 | 1 | 2 | 3;
}

export interface StimoloPL {
  cifre:  number[];   // tutte le cifre (length = seqLen), cifre[0] è la prima da memorizzare
  passi:  PLPasso[];  // length = seqLen - 1, un passo per ogni coppia successiva
  isiMs:  number;
}

export type RispostaPL = { corretti: number; totali: number } | null;

// ── Generazione opzioni MC ─────────────────────────────────────────────────────

function generaOpzioniMC(
  risultato: number,
  rng: () => number,
): { opzioni: [number, number, number, number]; idxCorr: 0 | 1 | 2 | 3 } {
  const set = new Set<number>([risultato]);

  // Distrattori vicini
  for (const delta of [1, -1, 2, -2, 3, -3, 4, -4]) {
    if (set.size >= 4) break;
    const v = risultato + delta;
    if (v >= 0) set.add(v);
  }

  // Distrattore distante se ancora mancano
  let tentativi = 0;
  while (set.size < 4 && tentativi < 20) {
    const dist = 5 + Math.floor(rng() * 6); // 5-10
    const sign = rng() < 0.5 ? 1 : -1;
    const v = risultato + sign * dist;
    if (v >= 0) set.add(v);
    tentativi++;
  }

  // Fallback: numeri positivi piccoli
  let pad = 0;
  while (set.size < 4) { if (!set.has(pad)) set.add(pad); pad++; }

  const arr = Array.from(set);
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const opzioni = arr as [number, number, number, number];
  const idxCorr = arr.indexOf(risultato) as 0 | 1 | 2 | 3;
  return { opzioni, idxCorr };
}

// ── Generatore sequenza ────────────────────────────────────────────────────────

export function generaSequenzaPL(
  level: PLLevelConfig,
  seqLen: number,
  rng: () => number,
): StimoloPL {
  // Genera cifre
  const cifre: number[] = [];
  for (let i = 0; i < seqLen; i++) {
    cifre.push(1 + Math.floor(rng() * 9)); // 1-9
  }

  const passi: PLPasso[] = [];
  for (let i = 1; i < seqLen; i++) {
    const prev = cifre[i - 1];
    const curr = cifre[i];

    // Operazioni valide per questo step
    const validOps = level.ops.filter((op) => op !== "−" || prev >= curr);
    const op: PLOp = validOps.length > 0
      ? validOps[Math.floor(rng() * validOps.length)]
      : "+";

    const risultato = op === "+" ? prev + curr : prev - curr;
    const { opzioni, idxCorr } = generaOpzioniMC(risultato, rng);

    passi.push({ cifraCorr: curr, op, risultato, opzioni, idxCorr });
  }

  return { cifre, passi, isiMs: level.isiMs };
}
