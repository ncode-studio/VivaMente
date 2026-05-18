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

// ── Stato pool senza ripetizione ───────────────────────────────────────────────

export interface LDPoolRef {
  sin_b: SAItem[]; idxSinB: number;
  con_b: SAItem[]; idxConB: number;
  nc_b:  SAItem[]; idxNcB:  number;
  sin_m: SAItem[]; idxSinM: number;
  con_m: SAItem[]; idxConM: number;
  nc_m:  SAItem[]; idxNcM:  number;
  rng: () => number;
  saQueue: SARelazione[];
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
    sin_b: byRel(POOL_SA_BASSA as SAItem[], "sinonimo"),      idxSinB: 0,
    con_b: byRel(POOL_SA_BASSA as SAItem[], "contrario"),     idxConB: 0,
    nc_b:  byRel(POOL_SA_BASSA as SAItem[], "non_correlato"), idxNcB:  0,
    sin_m: byRel(POOL_SA_MEDIA as SAItem[], "sinonimo"),      idxSinM: 0,
    con_m: byRel(POOL_SA_MEDIA as SAItem[], "contrario"),     idxConM: 0,
    nc_m:  byRel(POOL_SA_MEDIA as SAItem[], "non_correlato"), idxNcM:  0,
    rng,
    saQueue: [],
  };
}

const RELAZIONI_BASE: SARelazione[] = ["sinonimo", "contrario", "non_correlato"];

export function generaSynonymAntonym(
  difficoltà: LDDifficoltà,
  tLimMs: number,
  poolRef: LDPoolRef,
): StimoloSA {
  if (poolRef.saQueue.length === 0) {
    poolRef.saQueue = shuffle(RELAZIONI_BASE, poolRef.rng);
  }
  const relazione = poolRef.saQueue.shift()!;

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
