import {
  POOL_SA_BASSA, POOL_SA_MEDIA,
  type SAItem, type SARelazione,
} from "./word-pools";
import type { LDDifficoltà } from "./levels";

// ── Tipi stimolo ───────────────────────────────────────────────────────────────

export interface StimoloSA {
  modo: "synonym_antonym";
  target: string;
  probe: string;
  relazioneCorrelta: SARelazione;
  tLimMs: number;
}

export type StimoloLD = StimoloSA;

export type RispostaLD = SARelazione | null;

// ── Stato pool: rotazione ciclica senza ripetizioni ─────────────────────────────
//
// Ogni segmento (relazione × difficoltà) è una coda da cui si estrae con pop().
// Garanzie (entro la sessione):
//   1. ogni coppia vista esattamente una volta prima che qualsiasi coppia si
//      ripeta (rotazione su coda shufflata);
//   2. all'esaurimento della coda si rifà lo shuffle dell'intero pool → il ciclo
//      successivo ha un ordine diverso;
//   3. la prima coppia del nuovo ciclo è sempre diversa dall'ultima del vecchio
//      (nessuna coppia due volte di fila al reset).
// Lo stato vive in memoria per la durata della sessione: nessuna persistenza.

interface SegmentoCoda {
  /** Pool completo del segmento (immutabile). */
  pool: readonly SAItem[];
  /** Coda corrente; l'estrazione avviene con pop() (ultimo elemento). */
  coda: SAItem[];
  /** Ultima coppia estratta, per la guardia "mai due volte di fila" al reset. */
  ultimo: SAItem | null;
}

export interface LDPoolRef {
  sin_b: SegmentoCoda;
  con_b: SegmentoCoda;
  nc_b:  SegmentoCoda;
  sin_m: SegmentoCoda;
  con_m: SegmentoCoda;
  nc_m:  SegmentoCoda;
  rng: () => number;
  saQueue: SARelazione[];
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function creaSegmento(
  pool: readonly SAItem[],
  rel: SARelazione,
  rng: () => number,
): SegmentoCoda {
  const filtrato = pool.filter((x) => x.relazione === rel);
  return { pool: filtrato, coda: shuffle(filtrato, rng), ultimo: null };
}

/**
 * Estrae la prossima coppia dal segmento. Quando la coda si svuota, rifà lo
 * shuffle dell'intero pool del segmento e assicura che la prossima estrazione
 * (l'ultimo elemento dell'array, ovvero il primo pop) sia diversa dall'ultima
 * coppia già vista.
 */
function estrai(seg: SegmentoCoda, rng: () => number): SAItem {
  if (seg.coda.length === 0) {
    const nuova = shuffle(seg.pool, rng);
    // Evita che la stessa coppia appaia due volte di fila al reset.
    if (seg.pool.length > 1 && seg.ultimo &&
        nuova[nuova.length - 1].id === seg.ultimo.id) {
      [nuova[nuova.length - 1], nuova[0]] = [nuova[0], nuova[nuova.length - 1]];
    }
    seg.coda = nuova;
  }
  const item = seg.coda.pop()!;
  seg.ultimo = item;
  return item;
}

export function creaPoolRef(rng: () => number): LDPoolRef {
  return {
    sin_b: creaSegmento(POOL_SA_BASSA, "sinonimo",      rng),
    con_b: creaSegmento(POOL_SA_BASSA, "contrario",     rng),
    nc_b:  creaSegmento(POOL_SA_BASSA, "non_correlato", rng),
    sin_m: creaSegmento(POOL_SA_MEDIA, "sinonimo",      rng),
    con_m: creaSegmento(POOL_SA_MEDIA, "contrario",     rng),
    nc_m:  creaSegmento(POOL_SA_MEDIA, "non_correlato", rng),
    rng,
    saQueue: [],
  };
}

const RELAZIONI_BASE: SARelazione[] = ["sinonimo", "contrario", "non_correlato"];

function segmentoPer(
  poolRef: LDPoolRef,
  difficoltà: LDDifficoltà,
  relazione: SARelazione,
): SegmentoCoda {
  if (difficoltà === "bassa") {
    if (relazione === "sinonimo")  return poolRef.sin_b;
    if (relazione === "contrario") return poolRef.con_b;
    return poolRef.nc_b;
  }
  if (relazione === "sinonimo")  return poolRef.sin_m;
  if (relazione === "contrario") return poolRef.con_m;
  return poolRef.nc_m;
}

export function generaSynonymAntonym(
  difficoltà: LDDifficoltà,
  tLimMs: number,
  poolRef: LDPoolRef,
): StimoloSA {
  if (poolRef.saQueue.length === 0) {
    poolRef.saQueue = shuffle(RELAZIONI_BASE, poolRef.rng);
  }
  const relazione = poolRef.saQueue.shift()!;

  const item = estrai(segmentoPer(poolRef, difficoltà, relazione), poolRef.rng);

  return {
    modo: "synonym_antonym",
    target: item.target,
    probe: item.probe,
    relazioneCorrelta: item.relazione,
    tLimMs,
  };
}
