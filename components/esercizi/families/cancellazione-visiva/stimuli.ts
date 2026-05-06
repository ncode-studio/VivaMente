import type { CancellazioneVisivaLevelConfig } from "./levels";

export interface StimoloCancellazione {
  target:        string;
  celle:         string[];
  targetIndices: number[];
  righe:         number;
  colonne:       number;
}

export type RispostaCancellazione = { toccate: number[] } | null;

// ── Pool per categoria ────────────────────────────────────────────────────────
//
// Ogni categoria ha un pool ampio. A runtime si sceglie casualmente
// target e distrattori in base al livello di similarità richiesto.

const POOLS: Record<string, readonly string[]> = {
  animali:  ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦉"],
  frutti:   ["🍎","🍊","🍋","🍇","🍓","🍑","🍒","🍌","🍐","🍉","🍈","🥝","🍍","🥭","🫐","🍅"],
  veicoli:  ["🚗","🚕","🚙","🚌","🚓","🚑","🚒","🚐","🛻","🚲","🛵","🚁","✈️","🚂","🛳️"],
  cibo:     ["🍕","🍔","🌮","🍜","🍣","🍩","🎂","🍦","🍪","🥐","🥚","🥞","🍞","🧆","🌯"],
  fiori:    ["🌸","🌺","🌻","🌹","🌷","🌼","💐","🌾","🍀","🌿","🍃","🌵","🌴"],
  oggetti:  ["💎","👑","🔑","🎈","🎀","🎁","💌","📦","🧸","🎭","🎨","🖼️","🎪","🪆"],
  // pool ad alta similarità interna — usati solo per difficoltà "alta"
  faccine:  ["😀","😃","😄","😁","😆","😊","🙂","😉","😋","😌","😍","😘","😗","😙"],
  lune:     ["🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌛","🌜"],
  cerchi:   ["🔴","🟠","🟡","🟢","🔵","🟣","⚫","🟤","⚪"],
};

const BASSA_CATS = ["animali","frutti","veicoli","cibo","fiori","oggetti"] as const;
const MEDIA_CATS = ["animali","frutti","veicoli","cibo","fiori"]           as const;
const ALTA_CATS  = ["faccine","lune","cerchi"]                             as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function sampleWithoutReplacement(
  total: number,
  n:     number,
  rng:   () => number,
): number[] {
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (total - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n);
}

function pickEmoji(
  similarity: "bassa" | "media" | "alta",
  rng:        () => number,
): { targetEmoji: string; distractors: readonly string[] } {
  if (similarity === "bassa") {
    // target da una categoria, distrattori da una categoria diversa
    const allCats  = [...BASSA_CATS];
    const tCatIdx  = Math.floor(rng() * allCats.length);
    const tCat     = allCats[tCatIdx];
    const dCat     = pickRandom(allCats.filter((_, i) => i !== tCatIdx), rng);
    const targetEmoji = pickRandom(POOLS[tCat], rng);
    return { targetEmoji, distractors: POOLS[dCat] };
  }

  if (similarity === "media") {
    // target e distrattori dalla stessa categoria semantica
    const cat  = pickRandom(MEDIA_CATS, rng);
    const pool = POOLS[cat];
    const targetEmoji = pickRandom(pool, rng);
    return { targetEmoji, distractors: pool.filter((e) => e !== targetEmoji) };
  }

  // alta — pool con emoji visivamente quasi identiche
  const cat  = pickRandom(ALTA_CATS, rng);
  const pool = POOLS[cat];
  const targetEmoji = pickRandom(pool, rng);
  return { targetEmoji, distractors: pool.filter((e) => e !== targetEmoji) };
}

// ── Generatore griglia ────────────────────────────────────────────────────────

export function generaGriglia(
  config: CancellazioneVisivaLevelConfig,
  rng:    () => number,
): StimoloCancellazione {
  const { righe, colonne, nTarget, similarity } = config;
  const nCelle = righe * colonne;

  const { targetEmoji, distractors } = pickEmoji(similarity, rng);
  const targetIndices = sampleWithoutReplacement(nCelle, nTarget, rng);
  const targetSet     = new Set(targetIndices);

  const celle: string[] = Array.from({ length: nCelle }, (_, i) =>
    targetSet.has(i) ? targetEmoji : pickRandom(distractors, rng),
  );

  return { target: targetEmoji, celle, targetIndices, righe, colonne };
}
