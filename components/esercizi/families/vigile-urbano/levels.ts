/**
 * Livelli per "Il Vigile Urbano" (Attenzione spaziale · Multi-focus).
 *
 * Incrocio a croce visto dall'alto: i veicoli entrano dai 4 ingressi
 * cardinali (N, S, E, W) e si muovono verso il centro dell'intersezione.
 * Ogni ingresso ha un semaforo a una "stop line" prima del centro.
 *
 * Default: tutti i semafori ROSSI. Tap sul semaforo → toggle verde/rosso.
 *
 * Regola: il vigile autorizza UN tipo di veicolo alla volta (es. "solo bus").
 * La regola cambia periodicamente nei livelli alti.
 *
 * Comportamento al raggiungimento della stop line:
 *   - verde → il veicolo passa l'incrocio
 *   - rosso → si ferma; dopo waitMs svanisce (uscita)
 *
 * Accuratezza valutativa = (autorizzati_passati + nonautorizzati_fermati) /
 *                         (autorizzati_spawn + nonautorizzati_spawn)
 *
 * Curva difficoltà (10 livelli):
 *   - numIngressi: 2 → 3 → 4 (sempre più punti da monitorare)
 *   - poolTipi:    2 → 6  (più tipi di veicoli circolanti)
 *   - crossMs:     tempo dall'ingresso alla stop line (velocità veicoli)
 *   - spawnMs:     intervallo medio tra spawn nello stesso ingresso
 *   - maxActive:   veicoli simultanei per ingresso
 *   - ruleChangeMs: ogni quanto cambia la categoria autorizzata
 *                   (Infinity = regola fissa per tutta la sessione)
 *   - targetRate:  probabilità che uno spawn sia del tipo autorizzato
 *   - waitMs:      tempo che il veicolo resta fermo davanti al semaforo
 *                  rosso prima di andarsene
 *
 * Timer sessione: 60s (Modello A — coerente con le altre attenzione arcade).
 */

export const VU_SESSION_TIMER_MS = 60_000;

/** Lato (in px) dell'area di gioco quadrata. */
export const VU_BOARD_PX = 440;

/** Larghezza sprite veicolo (px). Sta comodo dentro mezza corsia. */
export const VU_VEHICLE_W = 38;

/** Lunghezza sprite veicolo (px). Determina anche il min-gap di coda. */
export const VU_VEHICLE_L = 60;

/** Larghezza totale della strada (px). Divisa in due semi-corsie. */
export const VU_LANE_W_PX = 130;

/** Distanza dal centro dell'incrocio alla stop line (px). */
export const VU_STOPLINE_FROM_CENTER_PX = 88;

/** Dimensione semaforo (px). Tap target ampio. */
export const VU_LIGHT_PX = 52;

/** Catalogo tipi di veicolo (ordine = introduzione progressiva). */
export const VU_TIPI = [
  { id: "auto",     emoji: "🚗", nome: "Auto"     },
  { id: "bus",      emoji: "🚌", nome: "Autobus"  },
  { id: "moto",     emoji: "🏍️", nome: "Moto"     },
  { id: "bici",     emoji: "🚲", nome: "Bici"     },
  { id: "camion",   emoji: "🚚", nome: "Camion"   },
  { id: "trattore", emoji: "🚜", nome: "Trattore" },
] as const;

export type VuTipoId = typeof VU_TIPI[number]["id"];

/** I 4 ingressi cardinali. Direzione di moto = verso il centro. */
export type VuIngresso = "N" | "S" | "E" | "W";

export const VU_INGRESSI_ALL: readonly VuIngresso[] = ["N", "S", "E", "W"] as const;

export interface VuLevelConfig {
  livello:       number;
  numIngressi:   number;        // 2..4
  poolSize:      number;        // numero tipi attivi (2..6)
  crossMs:       number;        // ingresso → stop line
  spawnMs:       number;        // intervallo spawn per ingresso
  maxActive:     number;        // veicoli max per ingresso
  ruleChangeMs:  number;        // ogni quanto cambia la categoria autorizzata
  targetRate:    number;        // probabilità spawn = autorizzato
  waitMs:        number;        // attesa al rosso prima di svanire
}

export const VU_LEVELS: readonly VuLevelConfig[] = [
  // lv 1-2: 2 ingressi (N,S), 2 tipi, regola fissa
  { livello:  1, numIngressi: 2, poolSize: 2, crossMs: 7000, spawnMs: 2800, maxActive: 2, ruleChangeMs: Infinity, targetRate: 0.55, waitMs: 2200 },
  { livello:  2, numIngressi: 2, poolSize: 2, crossMs: 6500, spawnMs: 2500, maxActive: 2, ruleChangeMs: Infinity, targetRate: 0.55, waitMs: 2200 },
  // lv 3: 3 ingressi, 3 tipi, regola ancora fissa
  { livello:  3, numIngressi: 3, poolSize: 3, crossMs: 6000, spawnMs: 2300, maxActive: 2, ruleChangeMs: Infinity, targetRate: 0.50, waitMs: 2000 },
  // lv 4-5: 3 ingressi, regola comincia a cambiare
  { livello:  4, numIngressi: 3, poolSize: 3, crossMs: 5500, spawnMs: 2100, maxActive: 3, ruleChangeMs: 14_000, targetRate: 0.48, waitMs: 2000 },
  { livello:  5, numIngressi: 3, poolSize: 4, crossMs: 5000, spawnMs: 1900, maxActive: 3, ruleChangeMs: 12_000, targetRate: 0.45, waitMs: 1900 },
  // lv 6-7: 4 ingressi, cambio regola più rapido
  { livello:  6, numIngressi: 4, poolSize: 4, crossMs: 4600, spawnMs: 1750, maxActive: 3, ruleChangeMs: 10_000, targetRate: 0.42, waitMs: 1800 },
  { livello:  7, numIngressi: 4, poolSize: 5, crossMs: 4200, spawnMs: 1600, maxActive: 3, ruleChangeMs:  8_500, targetRate: 0.40, waitMs: 1700 },
  // lv 8-9: 4 ingressi, ritmo elevato
  { livello:  8, numIngressi: 4, poolSize: 5, crossMs: 3800, spawnMs: 1500, maxActive: 4, ruleChangeMs:  7_000, targetRate: 0.38, waitMs: 1600 },
  { livello:  9, numIngressi: 4, poolSize: 6, crossMs: 3500, spawnMs: 1400, maxActive: 4, ruleChangeMs:  5_500, targetRate: 0.36, waitMs: 1500 },
  // lv 10: 4 ingressi, cambio regola frequente
  { livello: 10, numIngressi: 4, poolSize: 6, crossMs: 3200, spawnMs: 1300, maxActive: 4, ruleChangeMs:  4_500, targetRate: 0.35, waitMs: 1400 },
] as const;

export function getVuLevel(livello: number): VuLevelConfig {
  return VU_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

/** Ingressi attivi per il livello (ordine deterministico). */
export function getVuIngressiAttivi(numIngressi: number): readonly VuIngresso[] {
  // lv 1-2 (2 ingressi): N,S
  // lv 3-5 (3 ingressi): N,S,E
  // lv 6-10 (4 ingressi): N,S,E,W
  return VU_INGRESSI_ALL.slice(0, numIngressi);
}

export function getVuMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 2 && livello === 3) {
    return {
      titolo: "Nuovo ingresso!",
      testo:
        "Da questo livello si aggiunge un terzo ingresso da est. " +
        "Devi tenere d'occhio anche quel semaforo.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 3 && livello >= 4 && livello <= 5) {
    return {
      titolo: "La regola cambia!",
      testo:
        "Da questo livello il vigile può cambiare il tipo di veicolo da far passare. " +
        "Controlla sempre il cartello in alto.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 5 && livello === 6) {
    return {
      titolo: "Quattro ingressi!",
      testo:
        "Adesso i veicoli arrivano da tutte e quattro le direzioni. " +
        "Respira e tieni d'occhio i quattro semafori.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 8 && livello === 9) {
    return {
      titolo: "Traffico intenso!",
      testo:
        "Più veicoli, più veloci, regola che cambia spesso. " +
        "Mantieni la calma — un semaforo alla volta.",
    };
  }
  return null;
}
