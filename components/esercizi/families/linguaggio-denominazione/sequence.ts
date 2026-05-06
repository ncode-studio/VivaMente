/**
 * components/esercizi/families/linguaggio-denominazione/sequence.ts
 *
 * Tipi e generatori per Picture Naming e Synonym/Antonym Decision.
 */

import {
  POOL_FO, POOL_FO_AU,
  POOL_SA_BASSA, POOL_SA_MEDIA,
  type PNItem, type SAItem, type SARelazione,
} from "./word-pools";
import type { LDFrequencyBand, LDDifficoltà } from "./levels";

// ── Tipi stimolo ───────────────────────────────────────────────────────────────

export interface StimoloPN {
  modo: "picture_naming";
  emoji: string;
  risposteAccettate: string[];
  tLimMs: number;
}

export interface StimoloSA {
  modo: "synonym_antonym";
  target: string;
  probe: string;
  relazioneCorrelta: SARelazione;
  tLimMs: number;
}

export type StimoloLD = StimoloPN | StimoloSA;

export type RispostaLD = string | SARelazione | null;

// ── Normalizzazione risposta PN ────────────────────────────────────────────────

export function normalizzaRisposta(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function isRispostaPNCorretta(risposta: string, accettate: string[]): boolean {
  const n = normalizzaRisposta(risposta);
  return n.length > 0 && accettate.some((a) => normalizzaRisposta(a) === n);
}

// ── Stato pool senza ripetizione ───────────────────────────────────────────────

export interface LDPoolRef {
  poolPN_FO:    PNItem[];
  idxPN_FO:     number;
  poolPN_FO_AU: PNItem[];
  idxPN_FO_AU:  number;
  // SA sub-pools per relazione × difficoltà
  sin_b: SAItem[]; idxSinB: number;
  con_b: SAItem[]; idxConB: number;
  nc_b:  SAItem[]; idxNcB:  number;
  sin_m: SAItem[]; idxSinM: number;
  con_m: SAItem[]; idxConM: number;
  nc_m:  SAItem[]; idxNcM:  number;
  saCycleIdx: number;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function creaPoolRef(rng: () => number): LDPoolRef {
  const byRel = (pool: SAItem[], rel: SARelazione) =>
    shuffle(pool.filter((x) => x.relazione === rel), rng);

  return {
    poolPN_FO:    shuffle([...POOL_FO],    rng),
    idxPN_FO:     0,
    poolPN_FO_AU: shuffle([...POOL_FO_AU], rng),
    idxPN_FO_AU:  0,
    sin_b: byRel(POOL_SA_BASSA as SAItem[], "sinonimo"),     idxSinB: 0,
    con_b: byRel(POOL_SA_BASSA as SAItem[], "contrario"),    idxConB: 0,
    nc_b:  byRel(POOL_SA_BASSA as SAItem[], "non_correlato"), idxNcB: 0,
    sin_m: byRel(POOL_SA_MEDIA as SAItem[], "sinonimo"),     idxSinM: 0,
    con_m: byRel(POOL_SA_MEDIA as SAItem[], "contrario"),    idxConM: 0,
    nc_m:  byRel(POOL_SA_MEDIA as SAItem[], "non_correlato"), idxNcM: 0,
    saCycleIdx: 0,
  };
}

// ── Generatori ─────────────────────────────────────────────────────────────────

export function generaPictureNaming(
  banda: LDFrequencyBand,
  tLimMs: number,
  poolRef: LDPoolRef,
): StimoloPN {
  let item: PNItem;
  if (banda === "FO") {
    item = poolRef.poolPN_FO[poolRef.idxPN_FO % poolRef.poolPN_FO.length];
    poolRef.idxPN_FO++;
  } else {
    item = poolRef.poolPN_FO_AU[poolRef.idxPN_FO_AU % poolRef.poolPN_FO_AU.length];
    poolRef.idxPN_FO_AU++;
  }
  return {
    modo: "picture_naming",
    emoji: item.emoji,
    risposteAccettate: item.risposteAccettate,
    tLimMs,
  };
}

const RELAZIONI_CYCLE: SARelazione[] = ["sinonimo", "contrario", "non_correlato"];

export function generaSynonymAntonym(
  difficoltà: LDDifficoltà,
  tLimMs: number,
  poolRef: LDPoolRef,
): StimoloSA {
  const relazione = RELAZIONI_CYCLE[poolRef.saCycleIdx % 3];
  poolRef.saCycleIdx++;

  let item: SAItem;
  if (difficoltà === "bassa") {
    if (relazione === "sinonimo") {
      item = poolRef.sin_b[poolRef.idxSinB++ % poolRef.sin_b.length];
    } else if (relazione === "contrario") {
      item = poolRef.con_b[poolRef.idxConB++ % poolRef.con_b.length];
    } else {
      item = poolRef.nc_b[poolRef.idxNcB++ % poolRef.nc_b.length];
    }
  } else {
    if (relazione === "sinonimo") {
      item = poolRef.sin_m[poolRef.idxSinM++ % poolRef.sin_m.length];
    } else if (relazione === "contrario") {
      item = poolRef.con_m[poolRef.idxConM++ % poolRef.con_m.length];
    } else {
      item = poolRef.nc_m[poolRef.idxNcM++ % poolRef.nc_m.length];
    }
  }

  return {
    modo: "synonym_antonym",
    target: item.target,
    probe: item.probe,
    relazioneCorrelta: item.relazione,
    tLimMs,
  };
}
