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
  /** Coppie già viste nella sessione (chiave = `${target}|${probe}`).
   *  Garantisce che la stessa coppia non si ripeta. */
  visti: Set<string>;
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
    visti: new Set(),
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

  const pick = (): SAItem => {
    if (difficoltà === "bassa") {
      if (relazione === "sinonimo")  return poolRef.sin_b[poolRef.idxSinB++ % poolRef.sin_b.length];
      if (relazione === "contrario") return poolRef.con_b[poolRef.idxConB++ % poolRef.con_b.length];
      return poolRef.nc_b[poolRef.idxNcB++ % poolRef.nc_b.length];
    }
    if (relazione === "sinonimo")  return poolRef.sin_m[poolRef.idxSinM++ % poolRef.sin_m.length];
    if (relazione === "contrario") return poolRef.con_m[poolRef.idxConM++ % poolRef.con_m.length];
    return poolRef.nc_m[poolRef.idxNcM++ % poolRef.nc_m.length];
  };

  // Dedup: scarta coppie già viste nella sessione. Limite di tentativi =
  // dimensione del segmento corrente (oltre quel limite il pool è
  // esaurito e si accetta la ripetizione).
  const segLen = (() => {
    if (difficoltà === "bassa") {
      if (relazione === "sinonimo")  return poolRef.sin_b.length;
      if (relazione === "contrario") return poolRef.con_b.length;
      return poolRef.nc_b.length;
    }
    if (relazione === "sinonimo")  return poolRef.sin_m.length;
    if (relazione === "contrario") return poolRef.con_m.length;
    return poolRef.nc_m.length;
  })();

  let item = pick();
  let safety = 0;
  while (poolRef.visti.has(`${item.target}|${item.probe}`) && safety < segLen) {
    item = pick();
    safety++;
  }
  poolRef.visti.add(`${item.target}|${item.probe}`);

  return {
    modo: "synonym_antonym",
    target: item.target,
    probe: item.probe,
    relazioneCorrelta: item.relazione,
    tLimMs,
  };
}
