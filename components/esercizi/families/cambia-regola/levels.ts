/**
 * Livelli per "Cambia Regola" — Flessibilità attentiva · Task switching cued.
 *
 * Dominio: Attenzione (categoria_id = "attenzione").
 *
 * Costrutto: paradigma di task switching esplicitamente segnalato (cued
 * task switching). Variante semplificata del Wisconsin Card Sorting Test
 * adatta agli over 60: la regola attiva è SEMPRE mostrata in alto (no
 * scoperta induttiva del criterio), il task switching avviene quando la
 * regola cambia e l'utente deve aggiornare il proprio "mental set".
 *
 * Meccanica:
 *   - Una carta al centro (forma × colore × numero di copie).
 *   - Due "categorie" in basso (ciascuna una carta di riferimento).
 *   - Regola corrente in alto: COLORE | FORMA | NUMERO.
 *   - L'utente tappa la categoria la cui carta di riferimento condivide
 *     il valore della dimensione corrente con la carta centrale.
 *   - Trial corretto/errato → nuova carta dopo ISI breve.
 *   - Periodicamente (regolaChangeMs) la regola cambia con flash + banner.
 *
 * Curva difficoltà (10 livelli):
 *   - regoleAttive:   {2 → 3} dimensioni utilizzabili
 *   - regolaChangeMs: ogni quanto cambia la regola
 *   - tLimMs:         timeout per trial (omissione se superato)
 *   - isiMs:          pausa schermo vuoto tra carte (motoria)
 *   - distrattoriDim: se true, target condividono accidentalmente
 *                     valori delle dimensioni non-regola → costringe
 *                     ad applicare la regola attiva, non scorciatoie.
 *
 * Timer sessione: 60s (Modello A).
 */

export const CAMBIA_REGOLA_SESSION_TIMER_MS = 60_000;

export type Dimensione = "colore" | "forma" | "numero";
export const TUTTE_DIMENSIONI: readonly Dimensione[] = ["colore", "forma", "numero"];

export const ETICHETTA_DIM: Record<Dimensione, string> = {
  colore: "per COLORE",
  forma:  "per FORMA",
  numero: "per NUMERO",
};

export type Colore = "rosso" | "blu" | "giallo";
export type Forma  = "cerchio" | "quadrato" | "triangolo";
export type Numero = 1 | 2 | 3;

export const COLORI: readonly Colore[] = ["rosso", "blu", "giallo"];
export const FORME:  readonly Forma[]  = ["cerchio", "quadrato", "triangolo"];
export const NUMERI: readonly Numero[] = [1, 2, 3];

export const COLORE_HEX: Record<Colore, string> = {
  rosso:  "#DC2626",
  blu:    "#2563EB",
  giallo: "#EAB308",
};

export interface CambiaRegolaLevelConfig {
  livello:          number;
  regoleAttive:     readonly Dimensione[]; // sottoinsieme da cui pescare la regola
  regolaChangeMs:   number;
  tLimMs:           number;
  isiMs:            number;
  distrattoriDim:   boolean; // se true, target match accidentale su dim non-regola
}

export const CAMBIA_REGOLA_LEVELS: readonly CambiaRegolaLevelConfig[] = [
  // lv 1–2: 2 regole, ritmo lento, nessun match accidentale
  { livello:  1, regoleAttive: ["colore", "forma"], regolaChangeMs: 14000, tLimMs: 8000, isiMs: 500, distrattoriDim: false },
  { livello:  2, regoleAttive: ["colore", "forma"], regolaChangeMs: 12000, tLimMs: 7000, isiMs: 500, distrattoriDim: false },
  // lv 3–5: 3 regole
  { livello:  3, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs: 11000, tLimMs: 6500, isiMs: 450, distrattoriDim: false },
  { livello:  4, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  9500, tLimMs: 6000, isiMs: 400, distrattoriDim: false },
  { livello:  5, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  8500, tLimMs: 5500, isiMs: 400, distrattoriDim: true  },
  // lv 6–8: cambio più frequente + distrattori dimensionali
  { livello:  6, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  7500, tLimMs: 5000, isiMs: 350, distrattoriDim: true  },
  { livello:  7, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  6500, tLimMs: 4500, isiMs: 350, distrattoriDim: true  },
  { livello:  8, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  5500, tLimMs: 4000, isiMs: 300, distrattoriDim: true  },
  // lv 9–10: cambio molto frequente
  { livello:  9, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  4500, tLimMs: 3800, isiMs: 300, distrattoriDim: true  },
  { livello: 10, regoleAttive: ["colore", "forma", "numero"], regolaChangeMs:  3500, tLimMs: 3500, isiMs: 250, distrattoriDim: true  },
] as const;

export function getCambiaRegolaLevel(livello: number): CambiaRegolaLevelConfig {
  return CAMBIA_REGOLA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getCambiaRegolaMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 2 && livello === 3) {
    return {
      titolo: "Una regola in più!",
      testo:
        "Da questo livello si aggiunge anche la regola \"per NUMERO\". " +
        "Leggi sempre il banner in alto per sapere come ordinare.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 4 && livello === 5) {
    return {
      titolo: "Carte più ingannevoli!",
      testo:
        "Ora le carte possono assomigliarsi anche su altre caratteristiche. " +
        "Concentrati solo sulla regola del momento.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 7 && livello === 8) {
    return {
      titolo: "La regola cambia spesso!",
      testo:
        "La regola cambierà rapidamente. " +
        "Quando il banner lampeggia, leggilo subito prima di rispondere.",
    };
  }
  return null;
}
