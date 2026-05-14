import { EMOJI_POOL, COPPIE_SIMILI } from "./items";
import type { RilevamentoLevelConfig, TipoChange } from "./levels";

export interface StimoloRilevamento {
  scenaA:     string[];    // N emoji — scena originale
  scenaB:     string[];    // N emoji — una diversa (= il cambiamento)
  changeIdx:  number;      // indice dell'elemento cambiato in scenaB
  sceneMs:    number;
  blankMs:    number;
  tipoChange: TipoChange;
  tLimMs:     number;
}

export type RispostaRilevamento = {
  idxTappato: number;
  tempoMs:    number;
} | null;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generaStimoloRilevamento(
  config: RilevamentoLevelConfig,
  rng: () => number,
): StimoloRilevamento {
  const shuffledPool = shuffle([...EMOJI_POOL], rng);
  const scenaA = shuffledPool.slice(0, config.nItem);

  const changeIdx = Math.floor(rng() * config.nItem);
  const emojiOriginale = scenaA[changeIdx];

  let emojiNuova: string;

  if (config.tipoChange === "intra") {
    const pairEntry = COPPIE_SIMILI.find(
      ([a, b]) => a === emojiOriginale || b === emojiOriginale,
    );
    if (pairEntry) {
      const candidate = pairEntry[0] === emojiOriginale ? pairEntry[1] : pairEntry[0];
      // Se la coppia simile è già nella scena, fallback a inter
      emojiNuova = scenaA.includes(candidate)
        ? pickAlterna(scenaA, shuffledPool, rng)
        : candidate;
    } else {
      emojiNuova = pickAlterna(scenaA, shuffledPool, rng);
    }
  } else {
    emojiNuova = pickAlterna(scenaA, shuffledPool, rng);
  }

  const scenaB = [...scenaA];
  scenaB[changeIdx] = emojiNuova;

  return {
    scenaA,
    scenaB,
    changeIdx,
    sceneMs:    config.sceneMs,
    blankMs:    config.blankMs,
    tipoChange: config.tipoChange,
    tLimMs:     config.tLimMsPerTrial,
  };
}

function pickAlterna(
  scenaA: string[],
  shuffledPool: string[],
  rng: () => number,
): string {
  const candidate = shuffledPool.find((e) => !scenaA.includes(e));
  if (candidate) return candidate;
  const full = shuffle([...EMOJI_POOL], rng);
  return full.find((e) => !scenaA.includes(e)) ?? EMOJI_POOL[EMOJI_POOL.length - 1];
}
