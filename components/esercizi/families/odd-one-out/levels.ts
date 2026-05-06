/**
 * components/esercizi/families/odd-one-out/levels.ts
 *
 * Configurazione livelli per Odd One Out (Famiglia 3, 2 esercizi:
 *   - odd_one_out_numeri_lettere
 *   - odd_one_out_parole_miste
 * ).
 *
 * Dominio cognitivo: Attenzione — attenzione selettiva / ricerca visiva.
 * Nota clinica: ai lv 16–20 (dimensione astratta) il costrutto coinvolge
 * anche ragionamento astratto e funzioni esecutive, ma la classificazione
 * primaria resta attentiva.
 *
 * Modello A (timer fisso):
 *   - 90s lv 1–10
 *   - 120s lv 11–20
 *
 * Le 2 varianti condividono **la stessa tabella livelli e la stessa logica**
 * (GDD §Varianti, riga 20). Differiscono solo in stimulusType e dataset.
 * Quindi un'unica tabella, un'unica getOddOneOutLevel, un'unica
 * micro-progressione: tutto vive qui. Le strategy specifiche per
 * stimolo (programmatico vs NVdB) vivono in `./stimuli/`.
 *
 * Decisioni implementative:
 *   - 20 livelli completi.
 *   - 4 dimensioni discriminanti progressive: categoriale_alto (lv 1–5),
 *     categoriale_medio (lv 6–10), semantico_contestuale (lv 11–15),
 *     astratto (lv 16–20).
 *   - 3 cambi di meccanica (lv 5↔6, lv 10↔11, lv 15↔16) → warning bidirezionale.
 *   - T.Lim per-trial introdotto solo da lv 13 (10000ms → 5000ms a lv 20).
 *     Lv 1–12: tLimMs=null (TrialFlow.tLimMs=null è supportato nativamente).
 *   - trialsPerSession in tabella è informativo: il Modello A termina a
 *     tempoScaduto, non a count. La colonna del GDD (riga 49) è valore
 *     atteso/desiderato, non vincolante.
 *   - sessionDurationMs è derivato dal GDD §Timer di sessione (riga 36),
 *     non un campo letterale della tabella.
 *
 * Micro-progressione doppia (GDD §Micro-progressione, riga 27):
 *   - PRIMARIA (lv 1–17): +1 nStimuli per trial bonus, ceiling 12, max +2.
 *     Gestita nativamente da TrialFlow.
 *   - SECONDARIA (lv 18–20, base già a 12): -1000ms tLimMs per step bonus,
 *     floor 3000ms. NON gestita da TrialFlow (supporta un solo parametro);
 *     l'Engine intercetta isBonus + nStimuli=12 e applica la riduzione
 *     via setState/ref.
 *
 * Riferimento: docs/gdd/families/odd-one-out.md
 */

import type { MicroProgressioneConfig } from "@/lib/exercise-types";

// ── Tipi ──────────────────────────────────────────────────────────────────────

/**
 * Dimensione discriminante del livello: definisce su quale criterio l'utente
 * deve trovare l'anomalia. Cambia 4 volte nel corso dei 20 livelli.
 */
export type DimensioneDiscriminante =
  | "categoriale_alto"
  | "categoriale_medio"
  | "semantico_contestuale"
  | "astratto";

export type OddOneOutLevelConfig = {
  /** Indice 1-based, 1–20. */
  livello: number;
  /** Numero di stimoli per trial (4–12). */
  nStimuli: number;
  /** Tipo di anomalia da cercare al livello. */
  dimensione: DimensioneDiscriminante;
  /**
   * T.Lim per-trial in ms. null lv 1–12 (nessun timeout per trial),
   * 10000..5000 lv 13–20 (introduzione progressiva).
   */
  tLimMs: number | null;
  /**
   * Numero atteso di trial per sessione (informativo). Il Modello A termina
   * a tempoScaduto, non a count: questo campo riflette la colonna "Trial"
   * della tabella GDD ma NON viene passato come trialValutativi a TrialFlow.
   */
  trialsPerSession: number;
  /**
   * Durata sessione in ms (timer fisso del Modello A): 90000 lv 1–10,
   * 120000 lv 11–20. Derivato da GDD §Timer di sessione.
   */
  sessionDurationMs: number;
};

// ── Tabella livelli ───────────────────────────────────────────────────────────
/**
 * Fonte: docs/gdd/families/odd-one-out.md §Tabella livelli (righe 47–70).
 * Trascrizione letterale, ordine livello crescente. Tabella condivisa tra
 * le 2 varianti (numeri_lettere e parole_miste).
 *
 * Verifica a campione:
 *   lv 1  → 4  stimoli, categoriale_alto,      null,  6  trial, 90000ms
 *   lv 11 → 9  stimoli, semantico_contestuale, null,  9  trial, 120000ms
 *   lv 13 → 10 stimoli, semantico_contestuale, 10000, 9  trial, 120000ms
 *   lv 20 → 12 stimoli, astratto,              5000,  10 trial, 120000ms
 */
export const ODD_ONE_OUT_LEVELS: readonly OddOneOutLevelConfig[] = [
  { livello:  1, nStimuli: 4, dimensione: "categoriale_alto",  tLimMs: null, trialsPerSession: 6, sessionDurationMs: 60000 },
  { livello:  2, nStimuli: 4, dimensione: "categoriale_alto",  tLimMs: null, trialsPerSession: 6, sessionDurationMs: 60000 },
  { livello:  3, nStimuli: 5, dimensione: "categoriale_alto",  tLimMs: null, trialsPerSession: 6, sessionDurationMs: 60000 },
  { livello:  4, nStimuli: 5, dimensione: "categoriale_alto",  tLimMs: null, trialsPerSession: 7, sessionDurationMs: 60000 },
  { livello:  5, nStimuli: 6, dimensione: "categoriale_alto",  tLimMs: null, trialsPerSession: 7, sessionDurationMs: 60000 },
  // ── Lv 6: cambio meccanica → categoriale medio (warning) ──
  { livello:  6, nStimuli: 6, dimensione: "categoriale_medio", tLimMs: null, trialsPerSession: 7, sessionDurationMs: 60000 },
  { livello:  7, nStimuli: 7, dimensione: "categoriale_medio", tLimMs: null, trialsPerSession: 8, sessionDurationMs: 60000 },
  { livello:  8, nStimuli: 7, dimensione: "categoriale_medio", tLimMs: null, trialsPerSession: 8, sessionDurationMs: 60000 },
  { livello:  9, nStimuli: 8, dimensione: "categoriale_medio", tLimMs: null, trialsPerSession: 8, sessionDurationMs: 60000 },
  { livello: 10, nStimuli: 8, dimensione: "categoriale_medio", tLimMs: null, trialsPerSession: 9, sessionDurationMs: 60000 },
] as const;

export function getOddOneOutLevel(livello: number): OddOneOutLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return ODD_ONE_OUT_LEVELS[clamped - 1];
}

// ── Micro-progressione primaria (gestita da TrialFlow) ────────────────────────
/**
 * Costanti micro-progressione PRIMARIA: +1 nStimuli per trial bonus.
 * valoreBase iniettato a runtime dall'Engine (= config.nStimuli del livello).
 *
 * Fonte GDD: docs/gdd/families/odd-one-out.md §Micro-progressione (riga 29):
 *   "Primario (lv 1–17): +1 stimolo per trial bonus, ceiling 12. Max +2 oltre base."
 *
 * Inattiva ai lv 18–20 perché il valoreBase è già 12 (= ceiling). In quei
 * livelli subentra la micro-progressione SECONDARIA (vedi sotto).
 */
export const MICRO_PROGRESSIONE_PRIMARIA_ODD = {
  delta:    1,
  maxDelta: 2,
  limite:   12,
} as const satisfies Omit<MicroProgressioneConfig, "valoreBase">;

// ── Micro-progressione secondaria (gestita dall'Engine, NON da TrialFlow) ────
/**
 * Micro-progressione SECONDARIA: -1000ms tLimMs per step bonus quando
 * nStimuli ha raggiunto il ceiling 12 (lv 18–20). Floor 3000ms.
 *
 * NON gestita da TrialFlow nativamente (TrialFlow supporta una sola
 * micro-progressione). L'Engine intercetta isBonus + nStimuli=12 e
 * applica la riduzione tLimMs via setState/ref. Pattern documentato
 * in OddOneOutTaskEngine.
 *
 * maxDelta=2 per simmetria con primaria. Floor 3000ms raggiunto solo
 * a lv 20 (5000 - 2000 = 3000); ai lv 18–19 il floor non viene toccato.
 *
 * Fonte GDD: docs/gdd/families/odd-one-out.md §Micro-progressione (riga 30):
 *   "Secondario (lv 18–20, base già a 12): il trial bonus riduce il T.Lim
 *    di -1000ms per step, floor 3000ms."
 *   maxSteps non dichiarato in GDD; risolto con simmetria primaria (vedi
 *   Domanda GDD #1 nel design doc).
 */
export const MICRO_PROGRESSIONE_SECONDARIA_ODD = {
  delta:    -1000,
  maxDelta: 2,
  limite:   3000,
} as const;

// ── Warning cambio meccanica ──────────────────────────────────────────────────

/**
 * Ritorna il payload del warning quando si attraversa una delle 3 soglie
 * di cambio dimensione discriminante (lv 5↔6, lv 10↔11, lv 15↔16),
 * in entrambe le direzioni. Per la prima sessione (livelloPrec === null)
 * ritorna sempre null: il tutorial copre l'introduzione del lv 1.
 *
 * Il testo NON cita né numeri/lettere né parole — funziona per entrambe le
 * varianti perché il cambio di meccanica è puramente cognitivo (su quale
 * criterio cercare la differenza), non legato al tipo di stimolo.
 *
 * Fonte: docs/gdd/families/odd-one-out.md §Cambi di meccanica → schermata
 *        di avviso (riga 72) + docs/gdd/shared/02-trial-flow.md §Cambi di
 *        livello con cambio di meccanica.
 */
export function getOddOneOutMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  // ── Soglia lv 5 ↔ lv 6: categoriale alto ↔ categoriale medio ──
  if (livelloPrec <= 5 && livelloCorrente >= 6) {
    return {
      titolo: "Ora la differenza è più sottile",
      testo:
        "Da questo livello gli elementi sono dello stesso tipo, ma uno appartiene " +
        "a una sotto-categoria diversa. Per esempio: tra numeri pari, uno dispari. " +
        "Tra frutti, una verdura.",
    };
  }
  if (livelloPrec >= 6 && livelloPrec <= 10 && livelloCorrente <= 5) {
    return {
      titolo: "La differenza torna netta",
      testo: "Da questo livello la differenza è di categoria — più facile individuarla.",
    };
  }

  // ── Soglia lv 10 ↔ lv 11: categoriale medio ↔ semantico contestuale ──
  if (livelloPrec <= 10 && livelloCorrente >= 11 && livelloCorrente <= 15) {
    return {
      titolo: "Ora la differenza è di contesto o uso",
      testo:
        "Da questo livello gli elementi appartengono alla stessa categoria, ma uno " +
        "non si usa nello stesso contesto. Per esempio: oggetti da cucina, ma uno " +
        "non c'entra.",
    };
  }
  if (livelloPrec >= 11 && livelloPrec <= 15 && livelloCorrente <= 10) {
    return {
      titolo: "La differenza torna di categoria",
      testo: "Da questo livello la differenza è tra categorie diverse — più facile.",
    };
  }

  // ── Soglia lv 15 ↔ lv 16: semantico contestuale ↔ astratto ──
  if (livelloPrec <= 15 && livelloCorrente >= 16) {
    return {
      titolo: "Ora la differenza è una proprietà nascosta",
      testo:
        "Da questo livello la differenza non è di categoria né di contesto, ma una " +
        "proprietà trasversale: numero di sillabe, lettera iniziale, multipli di un numero.",
    };
  }
  if (livelloPrec >= 16 && livelloCorrente <= 15) {
    return {
      titolo: "La differenza torna di contesto",
      testo: "Da questo livello la differenza è legata al contesto d'uso — più facile.",
    };
  }

  return null;
}
