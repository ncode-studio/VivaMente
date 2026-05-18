/**
 * Livelli per "Il Naturalista".
 *
 * Dominio: Visuospaziale — ricerca visiva figura/sfondo. Il giocatore
 * trova tutte le creature nascoste nella scena e le tocca per "catturarle"
 * sul taccuino del naturalista. Niente zoom: le creature restano sempre
 * leggibili; la difficoltà è data da mimetismo, densità sfondo, numero
 * creature, movimento.
 *
 * Modello A — timer sessione 90s, scene a catena.
 *
 * Progressione (10 livelli):
 *   - lv 1–2 : 3 creature grandi, scene semplici, no camouflage
 *   - lv 3–5 : 4–5 creature, scene più ricche, lieve mimetismo
 *   - lv 6–7 : 6 creature, scene dense, 1–2 si muovono lentamente
 *   - lv 8–10: 7–8 creature mimetizzate, scene densissime, fino a 3 si muovono
 */

export const NATURALISTA_SESSION_TIMER_MS = 90_000;

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
  /** Numero di creature da nascondere. */
  numCreature: number;
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
  // Sprite grandi all'inizio (~130u su 1000), scendono fino a ~62u al lv10:
  // restano sempre leggibili senza zoom. La difficoltà sale via mimetismo,
  // numero, scene dense e movimento.
  { livello:  1, numCreature: 3, creaturaSizeUnits: 130, clickRadiusUnits: 95, scenePool: ["prato"],                                                  mimetismo: 0.00, numMobili: 0, tLimSceneMs: 26_000, densitaSfondo: 0.15, probOcclusione: 0.00 },
  { livello:  2, numCreature: 3, creaturaSizeUnits: 118, clickRadiusUnits: 88, scenePool: ["prato", "prato-fiorito"],                                 mimetismo: 0.10, numMobili: 0, tLimSceneMs: 28_000, densitaSfondo: 0.25, probOcclusione: 0.00 },
  { livello:  3, numCreature: 4, creaturaSizeUnits: 108, clickRadiusUnits: 82, scenePool: ["prato-fiorito", "stagno-ninfee", "bosco-rado"],           mimetismo: 0.20, numMobili: 0, tLimSceneMs: 32_000, densitaSfondo: 0.35, probOcclusione: 0.15 },
  { livello:  4, numCreature: 5, creaturaSizeUnits:  98, clickRadiusUnits: 76, scenePool: ["bosco-rado", "stagno-ninfee", "fondale-chiaro"],          mimetismo: 0.30, numMobili: 0, tLimSceneMs: 36_000, densitaSfondo: 0.45, probOcclusione: 0.25 },
  { livello:  5, numCreature: 5, creaturaSizeUnits:  90, clickRadiusUnits: 72, scenePool: ["bosco", "sottobosco-autunnale", "fondale-chiaro", "scogliera-marina"], mimetismo: 0.42, numMobili: 0, tLimSceneMs: 40_000, densitaSfondo: 0.55, probOcclusione: 0.35 },
  { livello:  6, numCreature: 6, creaturaSizeUnits:  82, clickRadiusUnits: 66, scenePool: ["bosco", "sottobosco-autunnale", "fondale-fitto", "prato-alpino"], mimetismo: 0.52, numMobili: 1, tLimSceneMs: 46_000, densitaSfondo: 0.65, probOcclusione: 0.45 },
  { livello:  7, numCreature: 6, creaturaSizeUnits:  76, clickRadiusUnits: 62, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.62, numMobili: 2, tLimSceneMs: 50_000, densitaSfondo: 0.75, probOcclusione: 0.55 },
  { livello:  8, numCreature: 7, creaturaSizeUnits:  72, clickRadiusUnits: 58, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "prato-alpino", "scogliera-marina"], mimetismo: 0.72, numMobili: 2, tLimSceneMs: 56_000, densitaSfondo: 0.82, probOcclusione: 0.65 },
  { livello:  9, numCreature: 7, creaturaSizeUnits:  68, clickRadiusUnits: 56, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.82, numMobili: 3, tLimSceneMs: 62_000, densitaSfondo: 0.90, probOcclusione: 0.75 },
  { livello: 10, numCreature: 8, creaturaSizeUnits:  62, clickRadiusUnits: 52, scenePool: ["bosco-fitto", "sottobosco-autunnale", "fondale-fitto", "scogliera-marina"], mimetismo: 0.90, numMobili: 3, tLimSceneMs: 70_000, densitaSfondo: 1.00, probOcclusione: 0.80 },
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
