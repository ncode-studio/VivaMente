/**
 * components/esercizi/families/memoria-prospettica/levels.ts
 *
 * Configurazione livelli per Memoria Prospettica (Famiglia 10, 2 esercizi:
 *   - memoria_prospettica_event_based
 *   - memoria_prospettica_time_based
 * ).
 *
 * Dominio cognitivo: Memoria — classe **MP** (Memoria Prospettica),
 * NON MBT né MLT. Vedi docs/gdd/shared/04-memory-types.md riga 53:
 *
 *   "La Memoria Prospettica ha una struttura temporale particolare...
 *    la scheda famiglia la classifica come MP con regole proprie."
 *
 * Implicazioni:
 *   - NON usa la palla rimbalzante MLT (distrattore motorio-visivo).
 *   - Distrattore semantico: stream emoji con categoria target da tappare.
 *   - Niente tabella delay shared MLT — il "delay" è il task distrattore
 *     stesso, durata configurabile per livello.
 *
 * Modello B (sessione a completamento):
 *   `single_continuous_trial` → trialValutativi=1 lato TrialFlow,
 *   tLimMs=null. La durata vive nel mini-engine MemoriaProspetticaSession
 *   (timer interno = durationMs del livello).
 *
 * Le 2 varianti condividono la struttura sessione (Fase 1 istruzione + Fase
 * 2 task continuo con bottone "Ricordami") e le 2 soglie di cambio meccanica
 * (lv 6↔7, lv 12↔13). Differiscono nel meccanismo di trigger:
 *   - event-based: cue visivo embedded nello stream, salianza decrescente.
 *   - time-based:  trigger temporale a intervalli, orologio modulato.
 *
 * Micro-progressione: NON applicata (GDD §Micro-progressione, riga 26).
 * La sessione è un singolo trial continuo — niente trial bonus possibile.
 *
 * Riferimento: docs/gdd/families/memoria-prospettica.md
 */

// ── Tipi base ─────────────────────────────────────────────────────────────────

/**
 * Salianza del cue prospettico nello stream distrattore (event-based).
 * Decrescente per livello — cue progressivamente più simile ai distrattori.
 */
export type CueSalience = "alta" | "media" | "bassa";

/**
 * Visibilità dell'orologio in alto (time-based).
 *   piena   = mm:ss sempre visibile (lv 1–6).
 *   ridotta = solo mm, scompare 28s ogni 30s, ricompare 2s (lv 7–12).
 *   assente = nessun orologio (lv 13–20).
 */
export type ClockVisibility = "piena" | "ridotta" | "assente";

export type TipoTrigger = "event" | "time";

// ── Discriminated union livello ───────────────────────────────────────────────

type MPLevelBase = {
  /** Indice 1-based, 1–20. */
  livello: number;
  /** Numero di finestre prospettiche programmate nella sessione (3–6). */
  nWindows: number;
  /** ISI tra stimoli del distrattore in ms (1100–3000). */
  distractorISIMs: number;
  /**
   * Durata della Fase 2 (task continuo) in ms.
   *   event-based: GDD durationMin × 60_000.
   *   time-based:  intervalS × nWindows × 1000 + TIME_BUFFER_FINALE_MS.
   */
  durationMs: number;
};

export type MPLevelEvent = MPLevelBase & {
  tipo: "event";
  /** Salianza del cue prospettico al livello corrente. */
  cueSalience: CueSalience;
};

export type MPLevelTime = MPLevelBase & {
  tipo: "time";
  /** Intervallo target tra finestre in secondi (30, 60, 90, 120). */
  intervalS: number;
  /** Tolleranza temporale ± in secondi (5, 10, 20 — decrescente). */
  toleranceS: number;
  /** Visibilità dell'orologio. */
  clockVisibility: ClockVisibility;
};

export type MPLevelConfig = MPLevelEvent | MPLevelTime;

// ── Costanti ──────────────────────────────────────────────────────────────────

/**
 * Durata della finestra di accettazione del tap "Ricordami" event-based,
 * espressa in numero di ISI distrattore. Risolto da Domanda GDD #1 nel
 * design doc: K=3 ISI proporzionale al ritmo dello stream (lv 1: 9000ms,
 * lv 20: 3300ms). Esportata per calibrazione futura.
 */
export const FINESTRA_EVENT_K_ISI = 3;

/**
 * Buffer post-ultima finestra time-based, in ms. Concede ±15s per il tap
 * conclusivo prima di terminare la sessione.
 */
export const TIME_BUFFER_FINALE_MS = 15_000;

// ── Tabella livelli event-based ───────────────────────────────────────────────
/**
 * Fonte: docs/gdd/families/memoria-prospettica.md §Esercizio 1 — Tabella
 * livelli (righe 54–75). Trascrizione letterale.
 *
 * `durationMs` calcolato da `durationMin` GDD × 60_000.
 *
 * Verifica a campione:
 *   lv 1  → 2 min, 3 fin, alta, 3000ms ISI → durationMs 120_000
 *   lv 7  → 4 min, 4 fin, media, 2000ms ISI → durationMs 240_000
 *   lv 13 → 6 min, 5 fin, bassa, 1500ms ISI → durationMs 360_000
 *   lv 20 → 8 min, 6 fin, bassa, 1100ms ISI → durationMs 480_000
 */
export const EVENT_LEVELS: readonly MPLevelEvent[] = [
  { livello:  1, tipo: "event", nWindows: 3, distractorISIMs: 3000, cueSalience: "alta",  durationMs: 120_000 },
  { livello:  2, tipo: "event", nWindows: 3, distractorISIMs: 2800, cueSalience: "alta",  durationMs: 120_000 },
  { livello:  3, tipo: "event", nWindows: 3, distractorISIMs: 2500, cueSalience: "alta",  durationMs: 180_000 },
  { livello:  4, tipo: "event", nWindows: 4, distractorISIMs: 2500, cueSalience: "alta",  durationMs: 180_000 },
  { livello:  5, tipo: "event", nWindows: 4, distractorISIMs: 2200, cueSalience: "alta",  durationMs: 180_000 },
  { livello:  6, tipo: "event", nWindows: 4, distractorISIMs: 2000, cueSalience: "alta",  durationMs: 240_000 },
  // ── Lv 7: cambio meccanica → cueSalience media (warning) ──
  { livello:  7, tipo: "event", nWindows: 4, distractorISIMs: 2000, cueSalience: "media", durationMs: 240_000 },
  { livello:  8, tipo: "event", nWindows: 4, distractorISIMs: 1800, cueSalience: "media", durationMs: 240_000 },
  { livello:  9, tipo: "event", nWindows: 5, distractorISIMs: 1800, cueSalience: "media", durationMs: 300_000 },
  { livello: 10, tipo: "event", nWindows: 5, distractorISIMs: 1600, cueSalience: "media", durationMs: 300_000 },
] as const;

// ── Tabella livelli time-based ────────────────────────────────────────────────
/**
 * Fonte: docs/gdd/families/memoria-prospettica.md §Esercizio 2 — Tabella
 * livelli (righe 103–124). Trascrizione letterale.
 *
 * `durationMs` calcolato da `intervalS × nWindows × 1000 + TIME_BUFFER_FINALE_MS`.
 *
 * Verifica a campione:
 *   lv 1  → 30s, 3 fin, ±20, piena   → 30×3×1000 + 15_000 = 105_000
 *   lv 7  → 60s, 3 fin, ±20, ridotta → 60×3×1000 + 15_000 = 195_000
 *   lv 11 → 120s, 4 fin, ±10, ridotta → 120×4×1000 + 15_000 = 495_000
 *   lv 13 → 120s, 4 fin, ±10, assente → 120×4×1000 + 15_000 = 495_000
 *   lv 20 → 120s, 4 fin, ±5,  assente → 120×4×1000 + 15_000 = 495_000
 */
export const TIME_LEVELS: readonly MPLevelTime[] = [
  { livello:  1, tipo: "time", nWindows: 3, distractorISIMs: 3000, intervalS: 30, toleranceS: 20, clockVisibility: "piena",   durationMs: 105_000 },
  { livello:  2, tipo: "time", nWindows: 3, distractorISIMs: 2800, intervalS: 30, toleranceS: 20, clockVisibility: "piena",   durationMs: 105_000 },
  { livello:  3, tipo: "time", nWindows: 3, distractorISIMs: 2500, intervalS: 30, toleranceS: 20, clockVisibility: "piena",   durationMs: 105_000 },
  { livello:  4, tipo: "time", nWindows: 3, distractorISIMs: 2500, intervalS: 30, toleranceS: 20, clockVisibility: "piena",   durationMs: 105_000 },
  { livello:  5, tipo: "time", nWindows: 3, distractorISIMs: 2200, intervalS: 60, toleranceS: 20, clockVisibility: "piena",   durationMs: 195_000 },
  { livello:  6, tipo: "time", nWindows: 3, distractorISIMs: 2000, intervalS: 60, toleranceS: 20, clockVisibility: "piena",   durationMs: 195_000 },
  // ── Lv 7: cambio meccanica → clockVisibility ridotta (warning) ──
  { livello:  7, tipo: "time", nWindows: 3, distractorISIMs: 2000, intervalS: 60, toleranceS: 20, clockVisibility: "ridotta", durationMs: 195_000 },
  { livello:  8, tipo: "time", nWindows: 3, distractorISIMs: 1800, intervalS: 90, toleranceS: 10, clockVisibility: "ridotta", durationMs: 285_000 },
  { livello:  9, tipo: "time", nWindows: 3, distractorISIMs: 1800, intervalS: 90, toleranceS: 10, clockVisibility: "ridotta", durationMs: 285_000 },
  { livello: 10, tipo: "time", nWindows: 3, distractorISIMs: 1600, intervalS: 90, toleranceS: 10, clockVisibility: "ridotta", durationMs: 285_000 },
] as const;

// ── Lookup livelli con clamp ──────────────────────────────────────────────────

/**
 * Ritorna la configurazione del livello event-based, clampando l'input al
 * range [1, 20]. Pattern allineato a getOddOneOutLevel / getSartLevel.
 */
export function getMPLevelEvent(livello: number): MPLevelEvent {
  const clamped = Math.min(10, Math.max(1, livello));
  return EVENT_LEVELS[clamped - 1];
}

export function getMPLevelTime(livello: number): MPLevelTime {
  const clamped = Math.min(10, Math.max(1, livello));
  return TIME_LEVELS[clamped - 1];
}

// ── Warning cambio meccanica ──────────────────────────────────────────────────

/**
 * Ritorna il payload del warning quando si attraversa una delle 2 soglie
 * di cambio meccanica (lv 6↔7, lv 12↔13), in entrambe le direzioni.
 *
 * I testi sono distinti per `tipoTrigger` perché la natura del cambio è
 * diversa:
 *   - event: salianza del cue (alta → media → bassa).
 *   - time:  visibilità orologio (piena → ridotta → assente).
 *
 * Per la prima sessione (livelloPrec === null) ritorna sempre null:
 * l'introduzione iniziale è coperta dal tutorial.
 *
 * Niente hardcoding di numeri di livello nei testi (i numeri di livello
 * cambieranno in futuro se la tabella verrà ricalibrata).
 *
 * Fonte: docs/gdd/families/memoria-prospettica.md §Tabella livelli +
 *        docs/gdd/shared/02-trial-flow.md §Cambi di livello con cambio
 *        di meccanica.
 */
export function getMPMechanicWarning(
  livelloPrec: number | null,
  livelloCorrente: number,
  tipoTrigger: TipoTrigger,
): { titolo: string; testo: string } | null {
  if (livelloPrec === null) return null;

  if (tipoTrigger === "event") {
    // ── Soglia lv 6 ↔ lv 7: cueSalience alta ↔ media ──
    if (livelloPrec <= 6 && livelloCorrente >= 7 && livelloCorrente <= 12) {
      return {
        titolo: "Il segnale diventa più sottile",
        testo:
          "Da questo livello l'oggetto da ricordare appartiene alla stessa famiglia " +
          "degli altri sullo schermo, ma è di un tipo diverso. Per esempio: tra cibi " +
          "generici, un tipo specifico di frutto.",
      };
    }
    if (livelloPrec >= 7 && livelloPrec <= 12 && livelloCorrente <= 6) {
      return {
        titolo: "Il segnale torna evidente",
        testo:
          "Da questo livello l'oggetto da ricordare è di una famiglia chiaramente " +
          "diversa dagli altri — più facile riconoscerlo.",
      };
    }

    // ── Soglia lv 12 ↔ lv 13: cueSalience media ↔ bassa ──
    if (livelloPrec <= 12 && livelloCorrente >= 13) {
      return {
        titolo: "Il segnale è quasi indistinguibile",
        testo:
          "Da questo livello l'oggetto da ricordare è molto simile agli altri sullo " +
          "schermo. Serve attenzione fine per riconoscerlo.",
      };
    }
    if (livelloPrec >= 13 && livelloCorrente <= 12) {
      return {
        titolo: "Il segnale torna distinguibile",
        testo:
          "Da questo livello l'oggetto da ricordare è ancora simile agli altri ma " +
          "riconoscibile con attenzione media.",
      };
    }

    return null;
  }

  // tipoTrigger === "time"
  // ── Soglia lv 6 ↔ lv 7: clockVisibility piena ↔ ridotta ──
  if (livelloPrec <= 6 && livelloCorrente >= 7 && livelloCorrente <= 12) {
    return {
      titolo: "L'orologio scompare ogni tanto",
      testo:
        "Da questo livello l'orologio in alto non è sempre visibile: scompare per " +
        "qualche secondo e ricompare. Continua a tenere a mente il tempo.",
    };
  }
  if (livelloPrec >= 7 && livelloPrec <= 12 && livelloCorrente <= 6) {
    return {
      titolo: "L'orologio torna sempre visibile",
      testo:
        "Da questo livello l'orologio in alto è sempre visibile — più facile tenere " +
        "il tempo.",
    };
  }

  // ── Soglia lv 12 ↔ lv 13: clockVisibility ridotta ↔ assente ──
  if (livelloPrec <= 12 && livelloCorrente >= 13) {
    return {
      titolo: "Niente più orologio",
      testo:
        "Da questo livello l'orologio scompare del tutto. Devi tenere a mente il " +
        "tempo da solo.",
    };
  }
  if (livelloPrec >= 13 && livelloCorrente <= 12) {
    return {
      titolo: "L'orologio torna a comparire",
      testo:
        "Da questo livello l'orologio compare di nuovo, anche se solo a tratti — " +
        "più facile orientarsi.",
    };
  }

  return null;
}
