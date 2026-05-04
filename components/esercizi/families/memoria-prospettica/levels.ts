/**
 * components/esercizi/families/memoria-prospettica/levels.ts
 *
 * Configurazione livelli per Memoria Prospettica Ibrida (Famiglia 10, 1 esercizio:
 *   - memoria_prospettica_time_based
 * ).
 *
 * Struttura: dual-task ibrido PM + attenzione selettiva.
 *   - Task ongoing: stream di parole con categoria target da tappare (bottone 1).
 *   - Task prospettico: premere "Ricordami" ogni intervalS secondi (bottone 2).
 *
 * L'orologio mm:ss è sempre visibile — la progressione della difficoltà PM
 * avviene esclusivamente tramite intervallo crescente e tolleranza decrescente.
 *
 * Modello B (sessione a completamento):
 *   La sessione termina dopo nWindows finestre prospettiche.
 *   durationMs = intervalS × nWindows × 1000 + TIME_BUFFER_FINALE_MS.
 *
 * Progressione su due assi sovrapposti:
 *   - PM: intervallo 30s→60s, tolleranza ±20s→±5s
 *   - Ongoing: stream più veloce (2500→1500ms ISI) + categorie semanticamente
 *     più vicine (distante→moderata→vicina)
 *
 * Accuratezza: N_finestre_corrette / N_finestre_totali.
 * Micro-progressione: non applicata (sessione single continuous trial).
 *
 * Riferimento: docs/gdd/families/memoria-prospettica.md
 */

// ── Tipi ──────────────────────────────────────────────────────────────────────

/**
 * Distanza semantica tra categoria target e distrattori nel task ongoing.
 * Determina la difficoltà dell'attenzione selettiva concorrente.
 *   distante  = categorie chiaramente diverse (Animali vs Oggetti)
 *   moderata  = stessa macro-categoria, sotto-categorie diverse (Dom. vs Selvatici)
 *   vicina    = categorie molto simili (Mobili vs Elettrodomestici)
 */
export type DistanzaCategorie = "distante" | "moderata" | "vicina";

export interface MPHybridLevelConfig {
  /** Indice 1-based, 1–10. */
  livello: number;
  /** Intervallo target tra finestre prospettiche in secondi (30, 45, 60). */
  intervalS: number;
  /** Tolleranza temporale ± in secondi entro cui il tap è accettato. */
  toleranceS: number;
  /** Numero di finestre prospettiche programmate nella sessione (2–4). */
  nWindows: number;
  /** ISI tra stimoli del task ongoing in ms (1500–2500). */
  distractorISIMs: number;
  /** Distanza semantica tra categoria target e distrattori. */
  distanzaCategorie: DistanzaCategorie;
  /**
   * Durata Fase 2 in ms.
   * Calcolato: intervalS × nWindows × 1000 + TIME_BUFFER_FINALE_MS.
   */
  durationMs: number;
}

// ── Costante buffer ────────────────────────────────────────────────────────────

/**
 * Buffer post-ultima finestra in ms. Concede tempo per il tap conclusivo
 * prima che la sessione termini automaticamente.
 */
export const TIME_BUFFER_FINALE_MS = 15_000;

// ── Tabella livelli ────────────────────────────────────────────────────────────
/**
 * Fonte: docs/gdd/families/memoria-prospettica.md §Tabella livelli.
 *
 * durationMs = intervalS × nWindows × 1000 + TIME_BUFFER_FINALE_MS.
 * Verifica a campione:
 *   lv 1  → 30×3×1000 + 15000 = 105000  (~1m45s) ✓
 *   lv 3  → 30×4×1000 + 15000 = 135000  (~2m15s) ✓
 *   lv 5  → 45×3×1000 + 15000 = 150000  (~2m30s) ✓
 *   lv 8  → 60×2×1000 + 15000 = 135000  (~2m15s) ✓
 *
 * Soglie di cambio meccanica:
 *   lv 4→5: intervallo 30s→45s + categorie distante→moderata
 *   lv 7→8: intervallo 45s→60s + categorie moderata→vicina
 */
export const MP_HYBRID_LEVELS: readonly MPHybridLevelConfig[] = [
  { livello:  1, intervalS: 30, toleranceS: 20, nWindows: 3, distractorISIMs: 3500, distanzaCategorie: "distante", durationMs: 105_000 },
  { livello:  2, intervalS: 30, toleranceS: 15, nWindows: 3, distractorISIMs: 3300, distanzaCategorie: "distante", durationMs: 105_000 },
  { livello:  3, intervalS: 30, toleranceS: 10, nWindows: 4, distractorISIMs: 3300, distanzaCategorie: "distante", durationMs: 135_000 },
  { livello:  4, intervalS: 30, toleranceS: 10, nWindows: 4, distractorISIMs: 3000, distanzaCategorie: "distante", durationMs: 135_000 },
  // ── Lv 5: intervallo 30s → 45s + distante → moderata (warning) ──
  { livello:  5, intervalS: 45, toleranceS: 10, nWindows: 3, distractorISIMs: 3000, distanzaCategorie: "moderata", durationMs: 150_000 },
  { livello:  6, intervalS: 45, toleranceS: 10, nWindows: 3, distractorISIMs: 2800, distanzaCategorie: "moderata", durationMs: 150_000 },
  { livello:  7, intervalS: 45, toleranceS:  5, nWindows: 3, distractorISIMs: 2800, distanzaCategorie: "moderata", durationMs: 150_000 },
  // ── Lv 8: intervallo 45s → 60s + moderata → vicina (warning) ──
  { livello:  8, intervalS: 60, toleranceS:  5, nWindows: 2, distractorISIMs: 2600, distanzaCategorie: "vicina",   durationMs: 135_000 },
  { livello:  9, intervalS: 60, toleranceS:  5, nWindows: 2, distractorISIMs: 2600, distanzaCategorie: "vicina",   durationMs: 135_000 },
  { livello: 10, intervalS: 60, toleranceS:  5, nWindows: 2, distractorISIMs: 2500, distanzaCategorie: "vicina",   durationMs: 135_000 },
] as const;

// ── Lookup livello con clamp ──────────────────────────────────────────────────

export function getMPHybridLevel(livello: number): MPHybridLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return MP_HYBRID_LEVELS[clamped - 1];
}

// ── Warning cambio meccanica ──────────────────────────────────────────────────

/**
 * Ritorna il payload del warning alle 2 soglie di cambio meccanica
 * (lv 4↔5 e lv 7↔8), in entrambe le direzioni.
 * Per la prima sessione (livelloPrec === null) ritorna sempre null.
 */
export function getMPMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  // ── Soglia lv 4 ↔ lv 5: intervallo 30s → 45s + categorie più vicine ──
  if (livelloPrec <= 4 && livelloCorrente >= 5 && livelloCorrente <= 7) {
    return {
      titolo: "L'intervallo si allunga",
      testo:
        "Da questo livello dovrai premere 'Ricordami' ogni 45 secondi invece di 30. " +
        "Anche le parole sullo schermo saranno più difficili da distinguere.",
    };
  }
  if (livelloPrec >= 5 && livelloPrec <= 7 && livelloCorrente <= 4) {
    return {
      titolo: "L'intervallo torna breve",
      testo:
        "Da questo livello l'intervallo torna a 30 secondi e le categorie di parole " +
        "sono di nuovo molto diverse tra loro — più semplice.",
    };
  }

  // ── Soglia lv 7 ↔ lv 8: intervallo 45s → 60s + categorie vicine ──
  if (livelloPrec <= 7 && livelloCorrente >= 8) {
    return {
      titolo: "L'intervallo si allunga ancora",
      testo:
        "Da questo livello dovrai premere 'Ricordami' ogni 60 secondi. " +
        "Le parole sullo schermo appartengono a categorie molto simili tra loro — " +
        "presta attenzione a entrambi i compiti.",
    };
  }
  if (livelloPrec >= 8 && livelloCorrente <= 7) {
    return {
      titolo: "L'intervallo torna a 45 secondi",
      testo:
        "Da questo livello l'intervallo è di 45 secondi e le categorie di parole " +
        "sono più facili da distinguere.",
    };
  }

  return null;
}
