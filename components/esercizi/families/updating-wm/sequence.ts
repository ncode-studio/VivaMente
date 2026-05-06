/**
 * components/esercizi/families/updating-wm/sequence.ts
 *
 * Tipi stimolo e generatori per Updating WM.
 *   StimoloUWM_PI  — Parole / Immagini (pre-cue MC)
 *   StimoloUWM_N   — Numeri (trasformazione MC)
 */

import { UWM_ITEMS, type UWMItem } from "./items";
import type { UWMProprieta, UWMTransform, UWMTabALevel, UWMTabBLevel } from "./levels";

// ── Tipi stimolo ───────────────────────────────────────────────────────────────

export type UWMDirezione = "massimo" | "minimo";

export interface StimoloUWM_PI {
  variante:   "parole" | "immagini";
  items:      UWMItem[];                             // sequenza (N item)
  proprieta:  UWMProprieta;
  direzione:  UWMDirezione;
  domanda:    string;                                // "Quale era il più grande?"
  opzioniMC:  UWMItem[];                             // 4 item (shuffled, include il corretto)
  idxCorr:    0 | 1 | 2 | 3;
  speedMs:    number;
}

export interface StimoloUWM_N {
  variante:   "numeri";
  cifre:      number[];                              // sequenza originale
  trasf:      UWMTransform;
  risultato:  number[];                              // sequenza trasformata
  opzioniMC:  number[][];                            // 4 sequenze (shuffled)
  idxCorr:    0 | 1 | 2 | 3;
  speedMs:    number;
  regola:     string;                                // "Aggiungi 1 a ogni numero"
}

export type StimoloUWM = StimoloUWM_PI | StimoloUWM_N;
export type RispostaUWM = number | null;             // 0-3 | null (timeout/skip)

// ── Pool senza ripetizione (PI) ────────────────────────────────────────────────

export interface UWMPoolRef {
  pool: UWMItem[];
  idx:  number;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function creaUWMPoolRef(rng: () => number): UWMPoolRef {
  return { pool: shuffle([...UWM_ITEMS], rng), idx: 0 };
}

// ── Generatore Parole / Immagini ───────────────────────────────────────────────

const DOMANDE: Record<UWMProprieta, Record<UWMDirezione, string>> = {
  dimensione: {
    massimo: "Quale era il più GRANDE?",
    minimo:  "Quale era il più PICCOLO?",
  },
  peso: {
    massimo: "Quale era il più PESANTE?",
    minimo:  "Quale era il più LEGGERO?",
  },
};

function valoreItem(item: UWMItem, prop: UWMProprieta): number {
  return prop === "dimensione" ? item.dimensione : item.peso;
}

export function generaStimoloPIInner(
  level: UWMTabALevel,
  nStimuli: number,
  variante: "parole" | "immagini",
  poolRef: UWMPoolRef,
  rng: () => number,
): StimoloUWM_PI {
  const pool = poolRef.pool;
  const len  = pool.length;

  // Scegli proprietà e direzione casualmente
  const prop: UWMProprieta =
    level.proprieta[Math.floor(rng() * level.proprieta.length)];
  const dir: UWMDirezione = rng() < 0.5 ? "massimo" : "minimo";

  // Tenta di trovare N item con vincitore univoco
  let items: UWMItem[] = [];
  let corrIdx = 0;
  let found = false;

  for (let attempt = 0; attempt < 15 && !found; attempt++) {
    const start = (poolRef.idx + attempt * 3) % len;
    const candidates: UWMItem[] = [];
    for (let i = 0; i < nStimuli; i++) {
      candidates.push(pool[(start + i) % len]);
    }

    // Verifica vincitore univoco
    const vals = candidates.map((it) => valoreItem(it, prop));
    const target = dir === "massimo" ? Math.max(...vals) : Math.min(...vals);
    const winners = candidates.filter((it) => valoreItem(it, prop) === target);
    if (winners.length === 1) {
      items = candidates;
      corrIdx = candidates.indexOf(winners[0]);
      found = true;
    }
  }

  // Fallback: prendi comunque i primi N (può avere pareggio ma raro)
  if (!found) {
    items = [];
    for (let i = 0; i < nStimuli; i++) {
      items.push(pool[(poolRef.idx + i) % len]);
    }
    const vals = items.map((it) => valoreItem(it, prop));
    const target = dir === "massimo" ? Math.max(...vals) : Math.min(...vals);
    corrIdx = items.findIndex((it) => valoreItem(it, prop) === target);
  }

  // Avanza pool
  poolRef.idx = (poolRef.idx + nStimuli) % len;

  // 3 foil: item successivi nel pool (esclusi quelli in items)
  const usedIds = new Set(items.map((it) => it.id));
  const foils: UWMItem[] = [];
  let fi = poolRef.idx;
  while (foils.length < 3) {
    const candidate = pool[fi % len];
    if (!usedIds.has(candidate.id)) foils.push(candidate);
    fi++;
    if (fi - poolRef.idx > len) break; // safety
  }
  while (foils.length < 3) foils.push(items[(foils.length) % items.length]); // fallback

  // Costruisci 4 opzioni MC: il corretto + 3 foil, mescolate
  const corretto = items[corrIdx];
  const opzioniCandidati: UWMItem[] = shuffle([corretto, ...foils], rng);
  const idxCorr = opzioniCandidati.indexOf(corretto) as 0 | 1 | 2 | 3;

  return {
    variante,
    items,
    proprieta: prop,
    direzione: dir,
    domanda:   DOMANDE[prop][dir],
    opzioniMC: opzioniCandidati,
    idxCorr,
    speedMs:   level.speedMs,
  };
}

// ── Generatore Numeri ──────────────────────────────────────────────────────────

function applica(cifra: number, trasf: UWMTransform): number {
  switch (trasf) {
    case "+1": return cifra + 1;
    case "-1": return cifra - 1;
    case "+2": return cifra + 2;
    case "-2": return cifra - 2;
  }
}

function rangePerTrasf(trasf: UWMTransform): [number, number] {
  switch (trasf) {
    case "+1": return [1, 8]; // risultati 2-9
    case "-1": return [2, 9]; // risultati 1-8
    case "+2": return [1, 7]; // risultati 3-9
    case "-2": return [3, 9]; // risultati 1-7
  }
}

function generaDistrattorice(
  corretto: number[],
  altri: number[][],
  rng: () => number,
): number[] {
  const len = corretto.length;
  for (let attempt = 0; attempt < 20; attempt++) {
    const cand = [...corretto];
    const n = 1 + (rng() < 0.3 ? 1 : 0); // modifica 1-2 cifre
    const positions = shuffle(Array.from(Array(len).keys()), rng).slice(0, n);
    for (const p of positions) {
      const delta = rng() < 0.5 ? 1 : -1;
      cand[p] = Math.max(0, cand[p] + delta);
    }
    const key = cand.join(",");
    if (
      key !== corretto.join(",") &&
      altri.every((s) => s.join(",") !== key)
    ) {
      return cand;
    }
  }
  // Fallback: aggiungi 10 alla prima cifra
  return corretto.map((v, i) => (i === 0 ? v + 10 : v));
}

export function generaStimoloN(
  level: UWMTabBLevel,
  nDigits: number,
  trasf: UWMTransform,
  rng: () => number,
): StimoloUWM_N {
  const [min, max] = rangePerTrasf(trasf);
  const cifre: number[] = [];
  for (let i = 0; i < nDigits; i++) {
    cifre.push(min + Math.floor(rng() * (max - min + 1)));
  }
  const risultato = cifre.map((c) => applica(c, trasf));

  // 3 distrattori
  const d1 = generaDistrattorice(risultato, [], rng);
  const d2 = generaDistrattorice(risultato, [d1], rng);
  const d3 = generaDistrattorice(risultato, [d1, d2], rng);

  const opzioniCandidati: number[][] = shuffle([risultato, d1, d2, d3], rng);
  const idxCorr = opzioniCandidati.findIndex(
    (s) => s.join(",") === risultato.join(","),
  ) as 0 | 1 | 2 | 3;

  const labels: Record<UWMTransform, string> = {
    "+1": "Aggiungi 1 a ogni numero",
    "-1": "Sottrai 1 a ogni numero",
    "+2": "Aggiungi 2 a ogni numero",
    "-2": "Sottrai 2 a ogni numero",
  };

  return {
    variante:  "numeri",
    cifre,
    trasf,
    risultato,
    opzioniMC: opzioniCandidati,
    idxCorr,
    speedMs:   level.speedMs,
    regola:    labels[trasf],
  };
}
