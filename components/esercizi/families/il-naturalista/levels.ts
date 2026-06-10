/**
 * Livelli per "Il Naturalista".
 *
 * Dominio: Visuospaziale — RICERCA VISIVA DEL BERSAGLIO (#15). La scena è
 * affollata di tanti oggetti/creature (distrattori); il giocatore deve
 * scovare e toccare le istanze del BERSAGLIO mostrato come riferimento.
 * Toccare un distrattore è un errore. Niente zoom: gli sprite restano
 * sempre leggibili; la difficoltà è data da quantità di distrattori,
 * mimetismo, somiglianza target/distrattori, densità sfondo, movimento.
 *
 * Modello A — timer sessione 60s, scene a catena.
 *
 * Progressione (10 livelli):
 *   - lv 1–3 : 1 bersaglio tra 8–12 distrattori, sprite grandi, poco mimetismo
 *   - lv 4–7 : 2 bersagli tra 12–18 distrattori, scene più dense e mimetiche
 *   - lv 8–10: 3 bersagli tra 18–24 distrattori, scene affollatissime e mimetiche
 */

export const NATURALISTA_SESSION_TIMER_MS = 60_000;

/** Tipi di scena disponibili. Ogni livello campiona dal proprio pool. */
export type SceneKind =
  | "prato"
  | "prato-fiorito"
  | "prato-alpino"
  | "bosco-rado"
  | "bosco"
  | "bosco-fitto"
  | "sottobosco-autunnale"
  | "stagno-ninfee"
  | "fondale-chiaro"
  | "fondale-fitto"
  | "scogliera-marina";

export interface NaturalistaLevelConfig {
  livello: number;
  /** Numero di istanze del BERSAGLIO da trovare nella scena. */
  numTarget: number;
  /** Numero di distrattori (altre creature) che affollano la scena. */
  numDistrattori: number;
  /** Lato sprite creatura in unità SVG (viewBox 1000×700). */
  creaturaSizeUnits: number;
  /** Raggio area di click generoso intorno al centro sprite (unità SVG). */
  clickRadiusUnits: number;
  /** Pool di scene tra cui campionare. */
  scenePool: readonly SceneKind[];
  /**
   * Mimetismo 0–1: 0 = colori vivaci e contrastati con lo sfondo,
   * 1 = colori molto simili allo sfondo. Influenza tint, opacità e
   * sovrapposizione di elementi di primo piano.
   */
  mimetismo: number;
  /** Numero di creature che si muovono lentamente (deriva ellittica). */
  numMobili: number;
  /** Tempo limite per scena (ms): oltre, si passa avanti penalizzando le mancate. */
  tLimSceneMs: number;
  /** Densità di distrattori statici nello sfondo (foglie/sassi extra), 0–1. */
  densitaSfondo: number;
  /** Probabilità (0–1) che una creatura sia parzialmente occlusa da primo piano. */
  probOcclusione: number;
}

export const NATURALISTA_LEVELS: readonly NaturalistaLevelConfig[] = [
  // Ricerca del bersaglio: la scena si riempie di distrattori. La difficoltà
  // sale con numero di distrattori, mimetismo, scene dense e movimento.
  // clickRadius < distanza minima tra sprite per isolare il tap su un oggetto.
  { livello:  1, numTarget: 1, numDistrattori:  8, creaturaSizeUnits: 92, clickRadiusUnits: 56, scenePool: ["prato"],                                                  mimetismo: 0.10, numMobili: 0, tLimSceneMs: 18_000, densitaSfondo: 0.40, probOcclusione: 0.00 },
  { livello:  2, numTarget: 1, numDistrattori: 10, creaturaSizeUnits: 88, clickRadiusUnits: 54, scenePool: ["prato", "prato-fiorito"],                                 mimetismo: 0.18, numMobili: 0, tLimSceneMs: 20_000, densitaSfondo: 0.50, probOcclusione: 0.05 },
  { livello:  3, numTarget: 1, numDistrattori: 12, creaturaSizeUnits: 84, clickRadiusUnits: 52, scenePool: ["prato-fiorito", "stagno-ninfee", "bosco-rado"],           mimetismo: 0.24, numMobili: 0, tLimSceneMs: 32_000, densitaSfondo: 0.40, probOcclusione: 0.10 },
  { livello:  4, numTarget: 2, numDistrattori: 12, creaturaSizeUnits: 82, clickRadiusUnits: 50, scenePool: ["bosco-rado", "stagno-ninfee", "fondale-chiaro"],          mimetismo: 0.32, numMobili: 0, tLimSceneMs: 36_000, densitaSfondo: 0.50, probOcclusione: 0.15 },
  { livello:  5, numTarget: 2, numDistrattori: 14, creaturaSizeUnits: 78, clickRadiusUnits: 48, scenePool: ["bosco", "sottobosco-autunnale", "fondale-chiaro", "scogliera-marina"], mimetismo: 0.42, numMobili: 0, tLimSceneMs: 40_000, densitaSfondo: 0.58, probOcclusione: 0.20 },
  { livello:  6, numTarget: 2, numDistrattori: 16, creaturaSizeUnits: 74, clickRadiusUnits: 46, scenePool: ["bosco", "sottobosco-autunnale", "fondale-fitto", "prato-alpino"], mimetismo: 0.52, numMobili: 1, tLimSceneMs: 46_000, densitaSfondo: 0.66, probOcclusione: 0.25 },
  { livello:  7, numTarget: 2, numDistrattori: 18, creaturaSizeUnits: 72, clickRadiusUnits: 45, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.62, numMobili: 2, tLimSceneMs: 50_000, densitaSfondo: 0.74, probOcclusione: 0.30 },
  { livello:  8, numTarget: 3, numDistrattori: 18, creaturaSizeUnits: 70, clickRadiusUnits: 44, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "prato-alpino", "scogliera-marina"], mimetismo: 0.72, numMobili: 2, tLimSceneMs: 56_000, densitaSfondo: 0.82, probOcclusione: 0.35 },
  { livello:  9, numTarget: 3, numDistrattori: 20, creaturaSizeUnits: 66, clickRadiusUnits: 42, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.82, numMobili: 3, tLimSceneMs: 62_000, densitaSfondo: 0.90, probOcclusione: 0.40 },
  { livello: 10, numTarget: 3, numDistrattori: 24, creaturaSizeUnits: 62, clickRadiusUnits: 40, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.90, numMobili: 3, tLimSceneMs: 70_000, densitaSfondo: 1.00, probOcclusione: 0.45 },
] as const;

export function getNaturalistaLevel(livello: number): NaturalistaLevelConfig {
  return NATURALISTA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

/** Dimensione viewBox SVG di riferimento per tutte le scene. */
export const SCENE_VIEWBOX_W = 1000;
export const SCENE_VIEWBOX_H = 700;

/**
 * Mappa scena → set di creature plausibili per quel habitat.
 * Le creature sono nominate con il loro `CreatureKind` (vedi sprites.tsx).
 */
export const HABITAT_POOL: Record<SceneKind, readonly string[]> = {
  "prato":                ["farfalla", "ape", "coccinella", "bruco", "lumaca", "scarabeo"],
  "prato-fiorito":        ["farfalla", "ape", "coccinella", "libellula", "bruco", "lumaca"],
  "prato-alpino":         ["farfalla", "ape", "lucertola", "coccinella", "uccello", "ragno"],
  "bosco-rado":           ["uccello", "scoiattolo", "bruco", "ragno", "scarabeo", "lumaca"],
  "bosco":                ["uccello", "scoiattolo", "ragno", "scarabeo", "rana", "riccio"],
  "bosco-fitto":          ["uccello", "scoiattolo", "ragno", "scarabeo", "riccio", "lucertola"],
  "sottobosco-autunnale": ["riccio", "lumaca", "ragno", "scarabeo", "bruco", "rana"],
  "stagno-ninfee":        ["rana", "libellula", "pesce", "uccello", "lumaca"],
  "fondale-chiaro":       ["pesce", "stellaMarina", "granchio", "cavalluccio"],
  "fondale-fitto":        ["pesce", "medusa", "stellaMarina", "granchio", "cavalluccio"],
  "scogliera-marina":     ["granchio", "stellaMarina", "pesce", "uccello", "lumaca"],
};
