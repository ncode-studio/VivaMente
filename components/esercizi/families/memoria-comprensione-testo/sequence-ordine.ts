/**
 * components/esercizi/families/memoria-comprensione-testo/sequence-ordine.ts
 *
 * Generatore stimoli per Ordine Narrativo MBT.
 * Flusso: lettura testo → riordino card eventi.
 */

import {
  MCTON_TESTI_3,
  MCTON_TESTI_4,
  MCTON_TESTI_5,
  MCTON_TESTI_6,
  type MCTOrdineTestoEntry,
  type EventoNarrativo,
} from "./testi-ordine";
import { selezionaERegistra } from "./seenTexts";

export type { EventoNarrativo };

// ── Tipi stimolo/risposta ─────────────────────────────────────────────────────

export interface StimoloOrdineNarrativo {
  testo:          string;
  cardsPool:      EventoNarrativo[];  // shuffled: eventi corretti + distrattori scelti
  ordineCorretto: string[];           // ids degli eventi corretti nell'ordine giusto
  nSlot:          number;             // quanti slot riempire (= ordineCorretto.length)
}

export type RispostaOrdineNarrativo = {
  slotIds: string[];  // ids degli eventi nell'ordine scelto dall'utente
} | null;

// ── Pool per band ─────────────────────────────────────────────────────────────

type Band = 3 | 4 | 5 | 6;

const BAND_POOL: Record<Band, readonly MCTOrdineTestoEntry[]> = {
  3: MCTON_TESTI_3,
  4: MCTON_TESTI_4,
  5: MCTON_TESTI_5,
  6: MCTON_TESTI_6,
};

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number, rng: () => number): T[] {
  return shuffle(arr, rng).slice(0, n);
}

// ── Funzione di mapping nEventi → band ───────────────────────────────────────

function bandFromEventi(nEventi: number): number {
  if (nEventi <= 3) return 3;
  if (nEventi <= 4) return 4;
  if (nEventi <= 5) return 5;
  return 6;
}

// ── Generatore principale ─────────────────────────────────────────────────────

export interface PescaStimoloOrdineOpts {
  nEventi:      number;
  nDistractors: number;
  /** Chiave di partizione anti-ripetizione (per ordine narrativo: "ordine"). */
  tipo:         string;
  userId:       string | null;
  now:          number;
  rng:          () => number;
}

export function generaStimoloOrdineNarrativo(
  opts: PescaStimoloOrdineOpts,
): StimoloOrdineNarrativo {
  const { nEventi, nDistractors, tipo, userId, now, rng } = opts;

  const band      = bandFromEventi(nEventi) as Band;
  const candidati = BAND_POOL[band];
  // Selezione persistente anti-ripetizione (cross-sessione e intra-sessione).
  const testo =
    selezionaERegistra(candidati, tipo, userId, now, rng) ?? candidati[0];

  const useN         = Math.min(nEventi, testo.eventi.length);
  const correctEvts  = testo.eventi.slice(0, useN);
  const ordineCorr   = correctEvts.map((e) => e.id);

  const useDist      = Math.min(nDistractors, testo.distrattori.length);
  const distrattori  = pickRandom([...testo.distrattori], useDist, rng);

  const cardsPool    = shuffle([...correctEvts, ...distrattori], rng);

  return {
    testo:          testo.testo,
    cardsPool,
    ordineCorretto: ordineCorr,
    nSlot:          useN,
  };
}
