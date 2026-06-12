/**
 * components/esercizi/families/memoria-comprensione-testo/sequence.ts
 *
 * Generatore stimoli per Memoria e Comprensione del Testo — varianti MBT.
 * Flusso: lettura testo → domande MCQ (N domande, nOpzioni opzioni ciascuna).
 */

import { MC_TESTI, type MCTesto } from "./testi";
import { selezionaERegistra } from "./seenTexts";

export type { MCTesto };

// ── Tipi ───────────────────────────────────────────────────────────────────────

export type MCTVariante = "fattuale" | "inferenziale";

export interface StimoloMCT {
  variante: MCTVariante;
  testo:    string;
  domande:  Array<{
    testo:   string;
    opzioni: string[];  // nOpzioni opzioni (già tagliate)
    idxCorr: number;
  }>;
}

export type RispostaMCT = {
  risposte: number[]; // indice opzione scelta per ogni domanda
} | null;

// ── Pool candidati per band (nFrasi) ──────────────────────────────────────────

/**
 * Testi candidati per una band (nFrasi) e una variante di pool.
 *
 * Split del pool tra varianti: fattuale prende i testi a indice pari,
 * inferenziale i dispari. Questo evita che lo stesso testo appaia in entrambi
 * gli esercizi (fattuale e inferenziale erano percepiti come duplicati). Quando
 * `poolVariante` è undefined (es. MLT) il pool è intero.
 *
 * Se lo split per parità lascia il pool vuoto (band con un solo testo), si
 * ricade sul pool intero della band per non restare senza candidati.
 */
export function candidatiMCT(
  nFrasi: number,
  poolVariante?: MCTVariante,
): MCTesto[] {
  const all = MC_TESTI.filter((t) => t.nFrasi === nFrasi);
  const filtered =
    poolVariante === "fattuale"
      ? all.filter((_, i) => i % 2 === 0)
      : poolVariante === "inferenziale"
      ? all.filter((_, i) => i % 2 === 1)
      : [...all];
  return filtered.length > 0 ? filtered : [...all];
}

// ── Costruzione stimolo da un testo già selezionato ──────────────────────────

function buildStimoloMCT(
  testo:    MCTesto,
  nDomande: number,
  nOpzioni: number,
  variante: MCTVariante,
): StimoloMCT {
  const allDomande = variante === "fattuale" ? testo.fattuale : testo.inferenziale;
  const n = Math.min(nDomande, allDomande.length);

  const domande = allDomande.slice(0, n).map((d) => ({
    testo:   d.testo,
    opzioni: d.opzioni.slice(0, nOpzioni),
    idxCorr: d.idxCorr < nOpzioni ? d.idxCorr : 0,
  }));

  return { variante, testo: testo.testo, domande };
}

// ── Generatore principale (selezione persistente anti-ripetizione) ───────────

export interface PescaStimoloMCTOpts {
  nFrasi:        number;
  nDomande:      number;
  nOpzioni:      number;
  /** Variante usata per generare le domande (fattuale | inferenziale). */
  variante:      MCTVariante;
  /** Variante usata per partizionare il pool testi; undefined = pool intero (MLT). */
  poolVariante?: MCTVariante;
  /** Chiave di partizione anti-ripetizione: "fattuale" | "inferenziale" | "mlt". */
  tipo:          string;
  userId:        string | null;
  now:           number;
  rng:           () => number;
}

export function generaStimoloMCT(opts: PescaStimoloMCTOpts): StimoloMCT {
  const candidati = candidatiMCT(opts.nFrasi, opts.poolVariante);
  const testo =
    selezionaERegistra(candidati, opts.tipo, opts.userId, opts.now, opts.rng) ??
    candidati[0];
  return buildStimoloMCT(testo, opts.nDomande, opts.nOpzioni, opts.variante);
}
