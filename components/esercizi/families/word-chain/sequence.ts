/**
 * components/esercizi/families/word-chain/sequence.ts
 *
 * Generatore stimoli Word Chain Alfabetico.
 *
 * Ogni trial:
 *   - N parole con lettere iniziali consecutive nell'alfabeto italiano
 *   - Distanza semantica "alta": tutte categorie diverse (best effort)
 *   - Distanza semantica "media": max 2 per categoria
 *   - Parole mescolate per il display (l'utente deve trovare l'ordine)
 */

import { ITALIAN_ALPHABET, PAROLE_PER_LETTERA, type WCWord, type LetteraIT } from "./words";
import type { WCSemanticDistance } from "./levels";

// ── Tipi ───────────────────────────────────────────────────────────────────────

export interface WCParola {
  parola:  string;
  lettera: LetteraIT;
}

export interface StimoloWC {
  parole:       WCParola[]; // N parole, mescolate (ordine display casuale)
  sequenza:     LetteraIT[]; // N lettere in ordine alfabetico (sequenza corretta)
  tLimMs:      number;
  targetTimeMs: number;
}

export type RispostaWC = { tempoMs: number } | null; // null = timeout

// ── Utility ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Pool senza ripetizione per lettera ─────────────────────────────────────────

export interface WCPoolRef {
  indices: Record<LetteraIT, number>; // indice next per ogni lettera
  shuffled: Record<LetteraIT, WCWord[]>; // pool shuffled per lettera
}

export function creaWCPoolRef(rng: () => number): WCPoolRef {
  const shuffled = {} as Record<LetteraIT, WCWord[]>;
  const indices  = {} as Record<LetteraIT, number>;
  for (const l of ITALIAN_ALPHABET) {
    shuffled[l] = shuffle([...PAROLE_PER_LETTERA[l]], rng);
    indices[l]  = 0;
  }
  return { shuffled, indices };
}

function nextWord(
  lettera: LetteraIT,
  poolRef: WCPoolRef,
  escludiCategorie: Set<string>,
  maxPerCat: number,
  catCount: Record<string, number>,
): WCWord {
  const pool = poolRef.shuffled[lettera];
  const len  = pool.length;
  const idx  = poolRef.indices[lettera];

  // Cerca una parola con categoria rispettosa del vincolo distanza
  for (let i = 0; i < len; i++) {
    const candidate = pool[(idx + i) % len];
    const count = catCount[candidate.categoria] ?? 0;
    if (count < maxPerCat && !escludiCategorie.has(candidate.categoria)) {
      poolRef.indices[lettera] = (idx + i + 1) % len;
      return candidate;
    }
  }

  // Fallback: qualsiasi parola non già nella sequenza attuale (per categoria)
  for (let i = 0; i < len; i++) {
    const candidate = pool[(idx + i) % len];
    const count = catCount[candidate.categoria] ?? 0;
    if (count < maxPerCat) {
      poolRef.indices[lettera] = (idx + i + 1) % len;
      return candidate;
    }
  }

  // Fallback estremo: prima disponibile
  const word = pool[idx % len];
  poolRef.indices[lettera] = (idx + 1) % len;
  return word;
}

// ── Generatore principale ──────────────────────────────────────────────────────

export function generaStimoloWC(
  nWords:       number,
  distanza:     WCSemanticDistance,
  tLimMs:       number,
  targetTimeMs: number,
  poolRef:      WCPoolRef,
  rng:          () => number,
): StimoloWC {
  const maxPerCat = distanza === "alta" ? 1 : 2;
  const totalLetters = ITALIAN_ALPHABET.length; // 21

  // Trova posizioni di partenza valide (tutte le N lettere hanno ≥1 parola)
  const validStarts: number[] = [];
  for (let s = 0; s <= totalLetters - nWords; s++) {
    const ok = ITALIAN_ALPHABET.slice(s, s + nWords).every(
      (l) => PAROLE_PER_LETTERA[l].length >= 1,
    );
    if (ok) validStarts.push(s);
  }

  const startIdx = validStarts[Math.floor(rng() * validStarts.length)] ?? 0;
  const sequenza = ITALIAN_ALPHABET.slice(startIdx, startIdx + nWords) as LetteraIT[];

  // Seleziona una parola per lettera rispettando il vincolo distanza
  const catCount: Record<string, number> = {};
  const parole: WCParola[] = [];

  for (const lettera of sequenza) {
    const usedCats = new Set(
      distanza === "alta"
        ? Object.keys(catCount).filter((c) => catCount[c] >= 1)
        : [],
    );
    const word = nextWord(lettera, poolRef, usedCats, maxPerCat, catCount);
    catCount[word.categoria] = (catCount[word.categoria] ?? 0) + 1;
    parole.push({ parola: word.parola, lettera });
  }

  // Mescola per il display
  const paroleDisp = shuffle(parole, rng);

  return { parole: paroleDisp, sequenza, tLimMs, targetTimeMs };
}
