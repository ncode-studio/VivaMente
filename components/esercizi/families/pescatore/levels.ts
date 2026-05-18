/**
 * Livelli per "Il Pescatore" (Attenzione divisa · Dual task).
 *
 * Due zone d'acqua affiancate:
 *   - Lago (sinistra): regola FISSA per tutta la sessione. Pesca solo
 *     la specie target del lago.
 *   - Mare (destra): regola che cambia periodicamente durante la sessione.
 *     Pesca solo la specie target corrente del mare.
 *
 * I pesci nuotano orizzontalmente all'interno della propria zona.
 *
 * Curva difficoltà (10 livelli):
 *   - poolSize: numero di specie diverse presenti (target + distrattori)
 *   - crossMs:  tempo di traversata di una zona (più basso = più veloce)
 *   - spawnMs:  intervallo medio tra spawn nella stessa zona
 *   - maxActive: pesci massimi simultanei per zona
 *   - regolaMareChangeMs: ogni quanto cambia il target nel mare
 *
 * Timer sessione: 60s (Modello A — coerente con le altre famiglie attenzione arcade).
 */

export const PESCATORE_SESSION_TIMER_MS = 60_000;

/** Altezza area di gioco in px. */
export const PESC_GAME_H_PX = 420;
/** Diametro hit-area del pesce in px (over 60: target grandi). */
export const PESC_SPRITE_SIZE_PX = 72;

/**
 * Catalogo specie (10). Render via SVG flat in sprites.tsx (niente emoji).
 * Ordine = ordine di introduzione progressiva nei livelli.
 * Le forme di silhouette sono scelte per essere visivamente molto diverse
 * fra loro (palla, anguilla, cavalluccio, coda velo, coda falcata, fuso).
 */
export const PESC_SPECIE = [
  { id: "trota",        nome: "Trota"            },
  { id: "salmone",      nome: "Salmone"          },
  { id: "spigola",      nome: "Spigola"          },
  { id: "pesce_rosso",  nome: "Pesce rosso"      },
  { id: "tonno",        nome: "Tonno"            },
  { id: "persico",      nome: "Persico"          },
  { id: "pesce_palla",  nome: "Pesce palla"      },
  { id: "anguilla",     nome: "Anguilla"         },
  { id: "sgombro",      nome: "Sgombro"          },
  { id: "cavalluccio",  nome: "Cavalluccio"      },
] as const;

export type PescSpecieId = typeof PESC_SPECIE[number]["id"];

export interface PescLevelConfig {
  livello:             number;
  poolSize:            number;   // numero di specie attive (2..6)
  crossMs:             number;   // tempo per attraversare la zona
  spawnMs:             number;   // intervallo tra spawn nella stessa zona
  maxActive:           number;   // pesci max per zona simultanei
  regolaMareChangeMs:  number;   // ogni quanto cambia il target del mare
  targetRate:          number;   // probabilità che uno spawn sia il target di zona
}

export const PESC_LEVELS: readonly PescLevelConfig[] = [
  // lv 1: introduttivo — regola mare FISSA per tutta la sessione (no task switching)
  { livello:  1, poolSize:  2, crossMs: 4800, spawnMs: 2200, maxActive: 2, regolaMareChangeMs: 90_000, targetRate: 0.55 },
  // lv 2: introduzione del cambio regola mare (1–2 cambi in 60s)
  { livello:  2, poolSize:  3, crossMs: 4400, spawnMs: 2000, maxActive: 2, regolaMareChangeMs: 22_000, targetRate: 0.52 },
  // lv 3–5: introduzione progressiva
  { livello:  3, poolSize:  4, crossMs: 4000, spawnMs: 1850, maxActive: 3, regolaMareChangeMs: 11_000, targetRate: 0.50 },
  { livello:  4, poolSize:  5, crossMs: 3700, spawnMs: 1700, maxActive: 3, regolaMareChangeMs: 10_000, targetRate: 0.48 },
  { livello:  5, poolSize:  6, crossMs: 3400, spawnMs: 1550, maxActive: 3, regolaMareChangeMs:  8_500, targetRate: 0.45 },
  // lv 6–7: pool ampio
  { livello:  6, poolSize:  7, crossMs: 3100, spawnMs: 1450, maxActive: 4, regolaMareChangeMs:  7_000, targetRate: 0.42 },
  { livello:  7, poolSize:  8, crossMs: 2800, spawnMs: 1350, maxActive: 4, regolaMareChangeMs:  6_000, targetRate: 0.40 },
  // lv 8–9: quasi tutto il catalogo
  { livello:  8, poolSize:  9, crossMs: 2500, spawnMs: 1250, maxActive: 4, regolaMareChangeMs:  5_000, targetRate: 0.38 },
  { livello:  9, poolSize: 10, crossMs: 2300, spawnMs: 1200, maxActive: 5, regolaMareChangeMs:  4_500, targetRate: 0.36 },
  // lv 10: tutte le 10 specie, ritmo serrato
  { livello: 10, poolSize: 10, crossMs: 2100, spawnMs: 1100, maxActive: 5, regolaMareChangeMs:  4_000, targetRate: 0.35 },
] as const;

export function getPescLevel(livello: number): PescLevelConfig {
  return PESC_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getPescMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec === 1 && livello === 2) {
    return {
      titolo: "Il mare cambia regola!",
      testo:
        "Da questo livello il target del mare cambia ogni tanto. " +
        "Controlla l'insegna in alto a destra per sapere quale pesce raccogliere.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 3 && livello === 4) {
    return {
      titolo: "Nuove specie nell'acqua!",
      testo:
        "Da questo livello compaiono pesci di forme molto diverse. " +
        "Osserva bene il target di ciascuna zona — ignora gli altri.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 5 && livello === 6) {
    return {
      titolo: "Il mare cambia più spesso!",
      testo:
        "Il target del mare ora cambia più frequentemente. " +
        "Tieni d'occhio l'insegna in alto a destra.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 7 && livello === 8) {
    return {
      titolo: "Acque agitate!",
      testo:
        "Quasi tutte le specie sono in gioco e l'acqua è più animata. " +
        "Respira e mantieni la calma — un pesce alla volta.",
    };
  }
  return null;
}
