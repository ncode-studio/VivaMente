import { describe, it, expect } from "vitest";
import {
  creaPoolRef,
  generaSynonymAntonym,
} from "@/components/esercizi/families/linguaggio-denominazione/sequence";
import {
  POOL_SA_BASSA,
  type SARelazione,
} from "@/components/esercizi/families/linguaggio-denominazione/word-pools";

// ── RNG deterministica (mulberry32) ───────────────────────────────────────────
// Stessa funzione usata nei test SART/Stroop/Odd One Out — duplicata inline.

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

const chiave = (s: { target: string; probe: string }) => `${s.target}|${s.probe}`;

/** Cardinalità del segmento (relazione) nel pool bassa. */
function dimSegmentoBassa(rel: SARelazione): number {
  return POOL_SA_BASSA.filter((x) => x.relazione === rel).length;
}

/** Genera `n` stimoli a difficoltà bassa con seed deterministico. */
function generaSequenza(n: number, seed: number) {
  const poolRef = creaPoolRef(mulberry32(seed));
  return Array.from({ length: n }, () =>
    generaSynonymAntonym("bassa", 5000, poolRef),
  );
}

// ── Test ──────────────────────────────────────────────────────────────────────

describe("Synonym/Antonym — rotazione ciclica senza ripetizioni", () => {
  it("non mostra mai la stessa coppia due volte di fila", () => {
    const seq = generaSequenza(600, 12345);
    for (let i = 1; i < seq.length; i++) {
      expect(chiave(seq[i])).not.toBe(chiave(seq[i - 1]));
    }
  });

  it("mostra ogni coppia di una relazione esattamente una volta prima di ripeterla", () => {
    const seq = generaSequenza(600, 777);

    for (const rel of ["sinonimo", "contrario", "non_correlato"] as SARelazione[]) {
      const dim = dimSegmentoBassa(rel);
      const perRel = seq.filter((s) => s.relazioneCorrelta === rel).map(chiave);

      // Primo ciclo completo: `dim` coppie tutte distinte.
      const primoCiclo = perRel.slice(0, dim);
      expect(new Set(primoCiclo).size).toBe(dim);

      // Secondo ciclo completo: di nuovo tutte distinte.
      const secondoCiclo = perRel.slice(dim, dim * 2);
      expect(new Set(secondoCiclo).size).toBe(dim);
    }
  });

  it("rimescola l'ordine ad ogni nuovo ciclo (ordine diverso dal precedente)", () => {
    const seq = generaSequenza(600, 2024);

    for (const rel of ["sinonimo", "contrario", "non_correlato"] as SARelazione[]) {
      const dim = dimSegmentoBassa(rel);
      const perRel = seq.filter((s) => s.relazioneCorrelta === rel).map(chiave);

      const primoCiclo = perRel.slice(0, dim).join(",");
      const secondoCiclo = perRel.slice(dim, dim * 2).join(",");

      expect(secondoCiclo).not.toBe(primoCiclo);
    }
  });

  it("al reset, la prima coppia del nuovo ciclo è diversa dall'ultima del vecchio", () => {
    const seq = generaSequenza(600, 99);

    for (const rel of ["sinonimo", "contrario", "non_correlato"] as SARelazione[]) {
      const dim = dimSegmentoBassa(rel);
      const perRel = seq.filter((s) => s.relazioneCorrelta === rel).map(chiave);

      // Confronta fine del ciclo k con inizio del ciclo k+1, per ogni reset.
      for (let inizio = dim; inizio + dim <= perRel.length; inizio += dim) {
        expect(perRel[inizio]).not.toBe(perRel[inizio - 1]);
      }
    }
  });

  it("mantiene il target sempre coerente con la relazione dichiarata", () => {
    const seq = generaSequenza(120, 55);
    for (const s of seq) {
      const match = POOL_SA_BASSA.find(
        (x) => x.target === s.target && x.probe === s.probe,
      );
      expect(match).toBeDefined();
      expect(match!.relazione).toBe(s.relazioneCorrelta);
    }
  });
});
