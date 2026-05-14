/**
 * Livelli per L'Osservatorio Stellare (Sustained Attention / Vigilance).
 *
 * Dominio: Attenzione — vigilanza prolungata, rilevamento di stimoli rari.
 * Riferimento: Mackworth Clock Test (1948), Continuous Performance Task.
 *
 * Meccanica:
 *   Un cielo notturno con ~40 stelle che "brillano" tutte con lo stesso pattern
 *   di base (twinkle lento, sfasato casualmente). Ogni tot secondi UNA stella
 *   diventa target: pulsa più velocemente, è leggermente più grande/dorata,
 *   con un'aura calda. La differenza è OVVIA al lv1, MOLTO SOTTILE al lv10.
 *
 *   La stella target resta visibile come tale per una "finestra" (targetWindowMs).
 *   Se l'utente la tocca → hit. Se la finestra scade → miss.
 *   Se l'utente tocca una stella non target → false alarm.
 *
 *   Target rate ≈ 10% del tempo: con window ~2.5s e gap medio ~7s → ~26% window;
 *   per il giocatore il "lavoro attivo" è quel ~10% del tempo in cui c'è un target
 *   visibile a cui rispondere — il resto è attesa vigile.
 *
 * Progressione:
 *   - targetSizeMul   1.7 → 1.05 : la target si distingue sempre meno per dimensione
 *   - targetGlow      0.95 → 0.20 : meno aura calda
 *   - targetHueDeg    55 → 8     : meno virata cromatica verso il caldo
 *   - targetPulseMul  4.0 → 1.4  : pulsa sempre meno velocemente rispetto al baseline
 *   - targetWindowMs  2400 → 900 : la target rimane meno tempo prima di "scomparire"
 *   - targetGapMs     3200 → 5400: i target diventano più rari → vigilanza più lunga
 *
 * Timer sessione: 60s (Modello A, flusso continuo — vigilanza).
 */

export const OS_SESSION_TIMER_MS = 60_000;
export const OS_GAME_H_PX        = 460;

/** Numero stelle ambient: il cielo "vive" anche senza target. */
export const OS_AMBIENT_STARS = 42;

export interface OsservatorioLevelConfig {
  livello:         number;
  /** Moltiplicatore size della stella target rispetto a ambient (>=1). */
  targetSizeMul:   number;
  /** Intensità del glow extra (0..1). */
  targetGlow:      number;
  /** Hue shift verso il caldo (gradi). */
  targetHueDeg:    number;
  /** Moltiplicatore frequenza pulse della target rispetto al baseline ambient (>=1). */
  targetPulseMul:  number;
  /** Quanto resta visibile la target prima di reset / "scomparsa" (ms). */
  targetWindowMs:  number;
  /** Gap medio tra la fine di un target e l'inizio del successivo (ms). */
  targetGapMs:     number;
}

export const OS_LEVELS: readonly OsservatorioLevelConfig[] = [
  { livello:  1, targetSizeMul: 1.70, targetGlow: 0.95, targetHueDeg: 55, targetPulseMul: 4.0, targetWindowMs: 2400, targetGapMs: 3200 },
  { livello:  2, targetSizeMul: 1.55, targetGlow: 0.85, targetHueDeg: 48, targetPulseMul: 3.6, targetWindowMs: 2150, targetGapMs: 3500 },
  { livello:  3, targetSizeMul: 1.42, targetGlow: 0.75, targetHueDeg: 42, targetPulseMul: 3.2, targetWindowMs: 1950, targetGapMs: 3800 },
  { livello:  4, targetSizeMul: 1.32, targetGlow: 0.65, targetHueDeg: 36, targetPulseMul: 2.8, targetWindowMs: 1750, targetGapMs: 4100 },
  { livello:  5, targetSizeMul: 1.25, targetGlow: 0.55, targetHueDeg: 30, targetPulseMul: 2.5, targetWindowMs: 1550, targetGapMs: 4400 },
  { livello:  6, targetSizeMul: 1.18, targetGlow: 0.46, targetHueDeg: 25, targetPulseMul: 2.2, targetWindowMs: 1400, targetGapMs: 4700 },
  { livello:  7, targetSizeMul: 1.14, targetGlow: 0.38, targetHueDeg: 20, targetPulseMul: 1.9, targetWindowMs: 1250, targetGapMs: 5000 },
  { livello:  8, targetSizeMul: 1.10, targetGlow: 0.31, targetHueDeg: 16, targetPulseMul: 1.7, targetWindowMs: 1100, targetGapMs: 5200 },
  { livello:  9, targetSizeMul: 1.07, targetGlow: 0.25, targetHueDeg: 12, targetPulseMul: 1.5, targetWindowMs:  980, targetGapMs: 5300 },
  { livello: 10, targetSizeMul: 1.05, targetGlow: 0.20, targetHueDeg:  8, targetPulseMul: 1.4, targetWindowMs:  900, targetGapMs: 5400 },
] as const;

export function getOsservatorioLevel(livello: number): OsservatorioLevelConfig {
  return OS_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getOsservatorioMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 3 && livello >= 4) {
    return {
      titolo: "La differenza si fa sottile",
      testo:
        "Da questo livello la stella speciale si distingue molto meno. " +
        "Guarda con calma tutto il cielo e fidati del tuo occhio.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 7 && livello >= 8) {
    return {
      titolo: "Vigilanza fine",
      testo:
        "La stella speciale ora è quasi identica alle altre. " +
        "Cerca un pulsare appena diverso — non c'è fretta.",
    };
  }
  return null;
}
