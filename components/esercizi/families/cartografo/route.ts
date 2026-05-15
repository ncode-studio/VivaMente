import type { MapDef } from "./maps";

// Direzioni: 0=Nord, 1=Est, 2=Sud, 3=Ovest
export type Dir = 0 | 1 | 2 | 3;

export const DIR_NAMES: Record<Dir, string> = {
  0: "Nord",
  1: "Est",
  2: "Sud",
  3: "Ovest",
};

export const DIR_ARROWS: Record<Dir, string> = {
  0: "↑",
  1: "→",
  2: "↓",
  3: "←",
};

const DELTAS: Record<Dir, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

export type Action = "dritto" | "destra" | "sinistra" | "indietro";

export interface State {
  x: number;
  y: number;
  dir: Dir;
}

export interface RouteStep {
  action: Action;
  /** Stato dopo l'azione */
  after: State;
  /** Landmark presente sull'intersezione PRIMA della curva, se da usare nel testo */
  landmarkNome?: string;
}

export interface Route {
  start: State;
  steps: RouteStep[];
  end: State;
}

function turn(dir: Dir, action: Action): Dir {
  switch (action) {
    case "dritto":
      return dir;
    case "destra":
      return ((dir + 1) % 4) as Dir;
    case "sinistra":
      return ((dir + 3) % 4) as Dir;
    case "indietro":
      return ((dir + 2) % 4) as Dir;
  }
}

function step(state: State, action: Action): State {
  const newDir = turn(state.dir, action);
  const [dx, dy] = DELTAS[newDir];
  return { x: state.x + dx, y: state.y + dy, dir: newDir };
}

function inBounds(s: State, map: MapDef): boolean {
  return s.x >= 0 && s.y >= 0 && s.x < map.cols && s.y < map.rows;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GenerateOptions {
  steps: number;
  allowIndietro: boolean;
  useLandmarkRefs: boolean;
  /** RNG opzionale (default Math.random). */
  rng?: () => number;
}

/**
 * Genera un percorso random valido (tutto dentro la mappa) di `steps` passi.
 * Strategia: random walk con backtracking se ci si incastra.
 */
export function generateRoute(map: MapDef, opts: GenerateOptions): Route {
  const rng = opts.rng ?? Math.random;
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const start: State = {
      x: Math.floor(rng() * map.cols),
      y: Math.floor(rng() * map.rows),
      dir: Math.floor(rng() * 4) as Dir,
    };
    // Garantisci che il primo passo "dritto" sia possibile
    const firstNext = step(start, "dritto");
    if (!inBounds(firstNext, map)) continue;

    const steps: RouteStep[] = [];
    let cur = start;
    let indietroUsato = false;
    let lastAction: Action | null = null;
    let ok = true;

    for (let i = 0; i < opts.steps; i++) {
      const candidates: Action[] = ["dritto", "destra", "sinistra"];
      if (opts.allowIndietro && !indietroUsato && i > 0 && lastAction !== "indietro") {
        candidates.push("indietro");
      }
      // Filtra azioni che porterebbero fuori mappa
      const valid = candidates.filter((a) => inBounds(step(cur, a), map));
      if (valid.length === 0) {
        ok = false;
        break;
      }
      // Bias: evita ripetere troppi "dritto" in fila, ma non escludere
      const action = pick(shuffled(valid, rng), rng);
      const after = step(cur, action);
      if (action === "indietro") indietroUsato = true;

      // Riferimento landmark: se all'intersezione corrente (prima della curva)
      // c'è un landmark e l'azione è una curva (non dritto), può essere citato.
      let landmarkNome: string | undefined;
      if (opts.useLandmarkRefs && action !== "dritto") {
        const lm = map.landmarks.find((l) => l.x === cur.x && l.y === cur.y);
        if (lm && rng() < 0.7) landmarkNome = lm.nome;
      }

      steps.push({ action, after, landmarkNome });
      cur = after;
      lastAction = action;
    }

    if (ok) {
      return { start, steps, end: cur };
    }
  }

  // Fallback: percorso minimo "dritto" dall'angolo
  const fallback: Route = {
    start: { x: 0, y: 0, dir: 1 },
    steps: [],
    end: { x: 0, y: 0, dir: 1 },
  };
  let cur = fallback.start;
  for (let i = 0; i < Math.min(opts.steps, map.cols - 1); i++) {
    const after = step(cur, "dritto");
    fallback.steps.push({ action: "dritto", after });
    cur = after;
  }
  fallback.end = cur;
  return fallback;
}

// ── Conversione passi in testo ───────────────────────────────────────────────

const ACTION_TXT: Record<Action, string> = {
  dritto: "vai dritto",
  destra: "gira a destra",
  sinistra: "gira a sinistra",
  indietro: "torna indietro",
};

export function stepToText(s: RouteStep, _index: number): string {
  const action = ACTION_TXT[s.action];
  if (s.landmarkNome) {
    return `arrivato a ${s.landmarkNome}, ${action}`;
  }
  // Variazione naturale: primo passo "Parti e vai dritto" → "vai dritto"
  return action.charAt(0).toUpperCase() + action.slice(1);
}

// ── Generazione opzioni di risposta (posizione) ──────────────────────────────

export interface PositionOption {
  x: number;
  y: number;
  isCorrect: boolean;
}

/**
 * Genera N opzioni di posizione con il target sempre incluso.
 * I distrattori sono punti random sulla mappa, diversi tra loro e dal target.
 */
export function generatePositionOptions(
  end: State,
  map: MapDef,
  count: number,
  rng: () => number = Math.random
): PositionOption[] {
  const opts: PositionOption[] = [{ x: end.x, y: end.y, isCorrect: true }];
  const used = new Set<string>([`${end.x},${end.y}`]);
  let safety = 0;
  while (opts.length < count && safety++ < 500) {
    const x = Math.floor(rng() * map.cols);
    const y = Math.floor(rng() * map.rows);
    const key = `${x},${y}`;
    if (used.has(key)) continue;
    used.add(key);
    opts.push({ x, y, isCorrect: false });
  }
  return shuffled(opts, rng);
}
