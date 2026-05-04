/**
 * components/esercizi/families/associative-memory/sequence.ts
 *
 * Generatore stimoli Associative Memory (3 varianti).
 *
 * Flusso trial: encoding N coppie → delay → retrieval MC (1 per coppia).
 *
 * Varianti:
 *   parola_immagine  — encoding: parola + emoji; retrieval: cue=parola, opzioni=emoji
 *   immagine_immagine— encoding: emoji + emoji;  retrieval: cue=emoji,  opzioni=emoji
 *   parola_parola    — encoding: parola + parola;retrieval: cue=parola, opzioni=parole
 *
 * Coppie semanticamente NON correlate: elementoA e elementoB sempre da categorie diverse.
 */

import { AM_ITEMS, type AMItem } from "./items";

// ── Tipi ───────────────────────────────────────────────────────────────────────

export type AMVariante = "parola_immagine" | "immagine_immagine" | "parola_parola";

export interface AMCoppiaTrial {
  // Lato sinistro durante encoding e cue durante retrieval
  cue:     string; // parola o emoji
  cueTipo: "parola" | "emoji";
  // Lato destro durante encoding (= risposta corretta)
  target:     string;
  targetTipo: "parola" | "emoji";
  // Opzioni MC (target + 3 foil, mescolate)
  opzioniMC: string[];
  idxCorr:   0 | 1 | 2 | 3;
}

export interface StimoloAM {
  variante: AMVariante;
  coppie:   AMCoppiaTrial[]; // N coppie
  speedMs:  number;
  delayMs:  number;
}

export type RispostaAM = {
  risposte: number[]; // idxCorr scelto per ogni coppia (0-3)
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

// ── Pool ref (senza ripetizione) ───────────────────────────────────────────────

export interface AMPoolRef {
  shuffled: AMItem[];
  idx:      number;
}

export function creaAMPoolRef(rng: () => number): AMPoolRef {
  return { shuffled: shuffle([...AM_ITEMS], rng), idx: 0 };
}

function nextItems(count: number, poolRef: AMPoolRef, rng: () => number): AMItem[] {
  const pool = poolRef.shuffled;
  const len  = pool.length;
  const result: AMItem[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(poolRef.idx + i) % len]);
  }
  poolRef.idx = (poolRef.idx + count) % len;
  if (poolRef.idx < count) {
    poolRef.shuffled = shuffle([...AM_ITEMS], rng);
  }
  return result;
}

// ── Generatore principale ──────────────────────────────────────────────────────

export function generaStimoloAM(
  nCoppie:  number,
  variante: AMVariante,
  speedMs:  number,
  delayMs:  number,
  poolRef:  AMPoolRef,
  rng:      () => number,
): StimoloAM {
  const totalNeeded = nCoppie * 2 + 3; // N coppie (A+B) + foil buffer
  const itemsRaw    = nextItems(Math.min(totalNeeded, AM_ITEMS.length), poolRef, rng);

  // Costruisci N coppie con categorie diverse tra A e B
  const usedIds = new Set<string>();
  const coppieItems: Array<{ a: AMItem; b: AMItem }> = [];

  const pool = [...itemsRaw];
  let pi = 0;

  for (let i = 0; i < nCoppie && pi < pool.length; i++) {
    const a = pool[pi++];
    if (usedIds.has(a.id)) { i--; continue; }

    // Cerca un B di categoria diversa
    let b: AMItem | null = null;
    for (let j = pi; j < pool.length; j++) {
      if (!usedIds.has(pool[j].id) && pool[j].categoria !== a.categoria) {
        b = pool[j];
        pool.splice(j, 1); // rimuovi B dalla lista temporanea
        break;
      }
    }
    if (!b) {
      // Fallback: prendi qualsiasi item non usato
      for (let j = pi; j < pool.length; j++) {
        if (!usedIds.has(pool[j].id)) {
          b = pool[j];
          pool.splice(j, 1);
          break;
        }
      }
    }
    if (!b) break;

    usedIds.add(a.id);
    usedIds.add(b.id);
    coppieItems.push({ a, b });
  }

  // Pool foil: tutti gli item NON usati come B in questo trial
  const usedBIds = new Set(coppieItems.map((c) => c.b.id));
  const foilPool = AM_ITEMS.filter((it) => !usedBIds.has(it.id));

  // Attributi da estrarre per variante
  const getCue    = (it: AMItem) => variante === "immagine_immagine" ? it.emoji : it.parola;
  const getTarget = (it: AMItem) => variante === "parola_parola"      ? it.parola : it.emoji;

  const cueTipo:    "parola" | "emoji" = variante === "immagine_immagine" ? "emoji" : "parola";
  const targetTipo: "parola" | "emoji" = variante === "parola_parola"      ? "parola" : "emoji";

  // Costruisci retrieval MC per ogni coppia
  const coppie: AMCoppiaTrial[] = coppieItems.map(({ a, b }) => {
    const correctValue = getTarget(b);

    // 3 foil: item dal foilPool escludendo quelli già usati come B in questo trial
    const foilShuffled = shuffle(foilPool.filter((it) => it.id !== b.id), rng);
    const foilValues   = foilShuffled.slice(0, 3).map((it) => getTarget(it));

    const opzioniRaw   = shuffle([correctValue, ...foilValues], rng);
    const idxCorr      = opzioniRaw.indexOf(correctValue) as 0 | 1 | 2 | 3;

    return {
      cue:     getCue(a),
      cueTipo,
      target:  correctValue,
      targetTipo,
      opzioniMC: opzioniRaw,
      idxCorr,
    };
  });

  return { variante, coppie, speedMs, delayMs };
}
