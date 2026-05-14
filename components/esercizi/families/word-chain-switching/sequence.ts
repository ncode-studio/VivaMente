/**
 * components/esercizi/families/word-chain-switching/sequence.ts
 *
 * Generatore stimoli Word Chain Switching.
 *
 * Modalità:
 *   - selezione  : N parole pre-generate, l'utente le seleziona alternando categoria.
 *   - produzione : nessuna parola pre-generata; l'utente produce N parole tramite
 *                  tastiera QWERTY, alternando categoria.
 *
 * Pool lessicale: word-chain/words.ts, riorganizzato per categoria.
 * Coppie possibili escludono verdure/veicoli (pool troppo piccolo per generazione
 * in modalità "selezione", e troppo specifiche per la validazione in produzione).
 */

import { PAROLE_PER_LETTERA, ITALIAN_ALPHABET } from "../word-chain/words";
import type { WCSSemanticDistance } from "./levels";

// ── Pool per categoria ─────────────────────────────────────────────────────────

const _poolPerCat: Record<string, string[]> = {};
for (const l of ITALIAN_ALPHABET) {
  for (const w of PAROLE_PER_LETTERA[l]) {
    if (w.categoria === "verdure" || w.categoria === "veicoli") continue; // pool troppo piccolo
    if (!_poolPerCat[w.categoria]) _poolPerCat[w.categoria] = [];
    _poolPerCat[w.categoria].push(w.parola);
  }
}
export const POOL_PER_CATEGORIA: Readonly<Record<string, readonly string[]>> = _poolPerCat;

// ── Coppie di categorie ────────────────────────────────────────────────────────

interface CategoryPair {
  catA:  string;
  catB:  string;
  nomeA: string;
  nomeB: string;
}

const PAIRS_ALTA: readonly CategoryPair[] = [
  { catA: "animali",  catB: "oggetti",  nomeA: "Animale",  nomeB: "Oggetto"  },
  { catA: "animali",  catB: "mestieri", nomeA: "Animale",  nomeB: "Mestiere" },
  { catA: "frutta",   catB: "mestieri", nomeA: "Frutta",   nomeB: "Mestiere" },
  { catA: "natura",   catB: "cibi",     nomeA: "Natura",   nomeB: "Cibo"     },
  { catA: "animali",  catB: "luoghi",   nomeA: "Animale",  nomeB: "Luogo"    },
  { catA: "frutta",   catB: "oggetti",  nomeA: "Frutta",   nomeB: "Oggetto"  },
  { catA: "mestieri", catB: "luoghi",   nomeA: "Mestiere", nomeB: "Luogo"    },
];

const PAIRS_MEDIA: readonly CategoryPair[] = [
  { catA: "animali",  catB: "natura",   nomeA: "Animale",  nomeB: "Natura"   },
  { catA: "frutta",   catB: "cibi",     nomeA: "Frutta",   nomeB: "Cibo"     },
  { catA: "cibi",     catB: "natura",   nomeA: "Cibo",     nomeB: "Natura"   },
  { catA: "oggetti",  catB: "mestieri", nomeA: "Oggetto",  nomeB: "Mestiere" },
  { catA: "luoghi",   catB: "natura",   nomeA: "Luogo",    nomeB: "Natura"   },
];

// ── Tipi stimolo ───────────────────────────────────────────────────────────────

/** Etichetta logica della categoria (non guida visiva — è SOLO per la valutazione interna). */
export type WCSCat = "A" | "B";

export interface WCSParola {
  idx:       number;       // posizione unica nel array parole
  parola:    string;
  categoria: string;
  cat:       WCSCat;       // appartenenza alla categoria A o B (non mostrata all'utente)
}

export interface StimoloWCS_Selezione {
  variante:      "selezione";
  parole:        WCSParola[];          // N parole mescolate (display)
  sequenzaCat:   WCSCat[];             // [A, B, A, B, ...] — N elementi
  nomiCategorie: { A: string; B: string };
  tLimMs:        number;
  targetTimeMs:  number;
}

export interface StimoloWCS_Produzione {
  variante:      "produzione";
  catA:          string;               // id pool (es. "animali") per validazione
  catB:          string;
  nomiCategorie: { A: string; B: string };
  sequenzaCat:   WCSCat[];             // [A, B, A, B, ...] — N elementi attesi
  tLimMs:        number;
  targetTimeMs:  number;
}

export type StimoloWCS = StimoloWCS_Selezione | StimoloWCS_Produzione;

export type RispostaWCS = {
  tempoMs:          number;   // tempo trascorso dall'inizio del trial
  errori:           number;   // errori semantici (tap/parole su categoria sbagliata)
  paroleCompletate: number;   // n. di parole accettate prima della fine del trial
  totale:           number;   // n. di parole target (= stimolo.sequenzaCat.length)
} | null;

// ── Pool ref senza ripetizione ─────────────────────────────────────────────────

export interface WCSPoolRef {
  shuffled: Record<string, string[]>;
  indices:  Record<string, number>;
}

export function creaWCSPoolRef(rng: () => number): WCSPoolRef {
  const shuffled: Record<string, string[]> = {};
  const indices:  Record<string, number>   = {};
  for (const [cat, words] of Object.entries(POOL_PER_CATEGORIA)) {
    shuffled[cat] = shuffle([...words], rng);
    indices[cat]  = 0;
  }
  return { shuffled, indices };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextWords(
  cat: string,
  count: number,
  poolRef: WCSPoolRef,
  rng: () => number,
): string[] {
  const pool = poolRef.shuffled[cat] ?? [];
  const len  = pool.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (poolRef.indices[cat] + i) % len;
    result.push(pool[idx]);
  }
  poolRef.indices[cat] = (poolRef.indices[cat] + count) % len;
  // Rimescola quando si torna all'inizio
  if (poolRef.indices[cat] < count) {
    poolRef.shuffled[cat] = shuffle([...pool], rng);
  }
  return result;
}

// ── Generatore principale ──────────────────────────────────────────────────────

// ── Pool lookup per validazione produzione ────────────────────────────────────

/** Normalizza una stringa per confronto: lowercase, no accenti, trim. */
export function normalizzaWCS(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * Verifica se `parola` appartiene a `categoria` cercando nel pool lessicale.
 * Confronto case- e accent-insensitive.
 */
export function isParolaInCategoria(parola: string, categoria: string): boolean {
  const norm = normalizzaWCS(parola);
  if (norm.length === 0) return false;
  const pool = POOL_PER_CATEGORIA[categoria];
  if (!pool) return false;
  return pool.some((w) => normalizzaWCS(w) === norm);
}

/** Restituisce la categoria del pool a cui appartiene la parola, oppure null. */
export function categoriaPerParola(parola: string): string | null {
  const norm = normalizzaWCS(parola);
  if (norm.length === 0) return null;
  for (const [cat, words] of Object.entries(POOL_PER_CATEGORIA)) {
    if (words.some((w) => normalizzaWCS(w) === norm)) return cat;
  }
  return null;
}

// ── Generatore: modalità SELEZIONE ────────────────────────────────────────────

export function generaStimoloWCSSelezione(
  nWords:       number,
  distanza:     WCSSemanticDistance,
  tLimMs:       number,
  targetTimeMs: number,
  poolRef:      WCSPoolRef,
  rng:          () => number,
): StimoloWCS_Selezione {
  const pairs = distanza === "alta" ? PAIRS_ALTA : PAIRS_MEDIA;
  const pair  = pairs[Math.floor(rng() * pairs.length)];

  const perCat = nWords / 2; // sempre intero (nWords multiplo di 2)

  const wordsA = nextWords(pair.catA, perCat, poolRef, rng).map(
    (p, i): WCSParola => ({ idx: i,          parola: p, categoria: pair.catA, cat: "A" }),
  );
  const wordsB = nextWords(pair.catB, perCat, poolRef, rng).map(
    (p, i): WCSParola => ({ idx: perCat + i, parola: p, categoria: pair.catB, cat: "B" }),
  );

  const parole = shuffle([...wordsA, ...wordsB], rng);

  // Sequenza alternata A, B, A, B, ...
  const sequenzaCat: WCSCat[] = Array.from({ length: nWords }, (_, i) =>
    i % 2 === 0 ? "A" : "B",
  );

  return {
    variante:      "selezione",
    parole,
    sequenzaCat,
    nomiCategorie: { A: pair.nomeA, B: pair.nomeB },
    tLimMs,
    targetTimeMs,
  };
}

// ── Generatore: modalità PRODUZIONE ───────────────────────────────────────────

export function generaStimoloWCSProduzione(
  nWords:       number,
  distanza:     WCSSemanticDistance,
  tLimMs:       number,
  targetTimeMs: number,
  rng:          () => number,
): StimoloWCS_Produzione {
  const pairs = distanza === "alta" ? PAIRS_ALTA : PAIRS_MEDIA;
  const pair  = pairs[Math.floor(rng() * pairs.length)];

  const sequenzaCat: WCSCat[] = Array.from({ length: nWords }, (_, i) =>
    i % 2 === 0 ? "A" : "B",
  );

  return {
    variante:      "produzione",
    catA:          pair.catA,
    catB:          pair.catB,
    nomiCategorie: { A: pair.nomeA, B: pair.nomeB },
    sequenzaCat,
    tLimMs,
    targetTimeMs,
  };
}
