/**
 * components/esercizi/families/word-chain-switching/levels.ts
 *
 * Livelli per Word Chain Switching (lv 1–10).
 * Modello A — timer 60s.
 *
 * Due modalità:
 *   - selezione  (lv 1-3): vengono mostrate N parole, l'utente tappa quelle giuste alternando categoria.
 *   - produzione (lv 4-10): l'utente PRODUCE le parole digitandole sulla tastiera QWERTY,
 *                            alternando le due categorie. Una validazione semantica decide
 *                            se la parola appartiene alla categoria attesa.
 *
 * Progressione: nWords crescente, targetTimeMs decrescente, distanza semantica
 * (alta → media) crescente in difficoltà.
 *
 * Micro-progressione: targetTimeMs −2000ms per trial bonus, max −2 step, floor 15s.
 */

export type WCSSemanticDistance = "alta" | "media";
export type WCSModalita         = "selezione" | "produzione";

export interface WCSLevelConfig {
  livello:          number;
  modalita:         WCSModalita;
  nWords:           number;   // sempre multiplo di 2
  tLimMs:           number;
  targetTimeMs:     number;
  distanza:         WCSSemanticDistance;
  trialsPerSession: number;
}

export const SESSION_TIMER_MS    = 60_000;
export const WCS_TARGET_FLOOR_MS = 15_000;

export const WCS_LEVELS: readonly WCSLevelConfig[] = [
  { livello:  1, modalita: "selezione",  nWords:  6, tLimMs: 40_000, targetTimeMs: 30_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  2, modalita: "selezione",  nWords:  6, tLimMs: 40_000, targetTimeMs: 28_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  3, modalita: "selezione",  nWords:  8, tLimMs: 50_000, targetTimeMs: 37_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  4, modalita: "produzione", nWords:  6, tLimMs: 50_000, targetTimeMs: 40_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  5, modalita: "produzione", nWords:  6, tLimMs: 50_000, targetTimeMs: 38_000, distanza: "alta",  trialsPerSession: 3 },
  { livello:  6, modalita: "produzione", nWords:  8, tLimMs: 60_000, targetTimeMs: 50_000, distanza: "media", trialsPerSession: 3 },
  { livello:  7, modalita: "produzione", nWords:  8, tLimMs: 60_000, targetTimeMs: 48_000, distanza: "media", trialsPerSession: 3 },
  { livello:  8, modalita: "produzione", nWords: 10, tLimMs: 70_000, targetTimeMs: 58_000, distanza: "media", trialsPerSession: 3 },
  { livello:  9, modalita: "produzione", nWords: 10, tLimMs: 70_000, targetTimeMs: 55_000, distanza: "media", trialsPerSession: 3 },
  { livello: 10, modalita: "produzione", nWords: 12, tLimMs: 80_000, targetTimeMs: 65_000, distanza: "media", trialsPerSession: 3 },
];

export function getWCSLevel(livello: number): WCSLevelConfig {
  return WCS_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getWCSMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === 3 && livelloCorrente === 4) {
    return {
      titolo: "Ora scrivi tu le parole",
      testo:  "Da questo livello le parole non vengono mostrate. Devi inventarle e digitarle sulla tastiera, alternando le due categorie. Tocca ✓ per confermare ogni parola.",
    };
  }
  if (livelloPrec === 5 && livelloCorrente === 6) {
    return {
      titolo: "Categorie più vicine",
      testo:  "Da questo livello le due categorie sono semanticamente più vicine (es. cibi e frutta): serve più attenzione per distinguerle.",
    };
  }
  return null;
}
