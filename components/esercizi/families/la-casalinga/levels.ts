/**
 * Livelli per "La Casalinga" — Memoria visuospaziale · Change detection in scena.
 *
 * Dominio: Visuospaziali (categoria_id = "visuospaziali").
 * Modello: B (trial-based) — 5 trial valutativi per sessione, niente timer di sessione.
 *
 * Ogni trial:
 *   1. fase MEMO: scena cucina con N oggetti su 1–3 superfici; candela che brucia
 *      durante il countdown di memorizzazione.
 *   2. fase RECALL: scena modificata; l'utente tocca gli slot che ritiene cambiati
 *      (oggetto spostato, mancante, sostituito o capovolto).
 *   3. fase FEEDBACK: highlight verde (hit) / rosso (miss/false alarm).
 *
 * Progressione 10 livelli:
 *   - oggetti: 3 → 12
 *   - superfici: 1 (lv 1–3) → 2 (lv 4–6) → 3 (lv 7–10)
 *   - cambiamenti per trial: 1 (lv 1–3) → 2 (lv 4–7) → 3 (lv 8–10)
 *   - tempo memorizzazione: 12s → 5s
 *   - dal lv 6 introdotto il "flip" (cambio orientamento) tra i tipi di modifica
 */

export type Superficie = "mensola" | "piano" | "tavolo";
export type TipoModifica = "moved" | "removed" | "swapped" | "flipped";

export interface CasalingaLevelConfig {
  livello: number;
  /** Numero totale di oggetti distribuiti nella scena. */
  nOggetti: number;
  /** Superfici attive (ordine di rendering top→bottom). */
  superfici: readonly Superficie[];
  /** Slot disponibili per ciascuna superficie attiva. */
  slotPerSuperficie: number;
  /** Numero di slot che cambieranno nella fase recall. */
  nCambiamenti: number;
  /** Tipi di modifica permessi per il livello. */
  modificheAmmesse: readonly TipoModifica[];
  /** Durata della fase di memorizzazione in ms (ignorata se memoManuale=true). */
  memoMs: number;
  /**
   * Se true, niente countdown automatico: la fase di memorizzazione termina
   * solo quando l'utente preme "Sono pronto". La candela non viene mostrata.
   * Usato sui primi livelli per ridurre l'ansia da tempo.
   */
  memoManuale?: boolean;
}

export const CASALINGA_LEVELS: readonly CasalingaLevelConfig[] = [
  // Curva: si fa crescere UNA variabile per volta (oggetti / superfici / cambiamenti / tempo).
  // Meccanica: si toccano SOLO gli oggetti che sono cambiati. Gli spazi vuoti
  // non sono cliccabili (niente "removed" — solo moved / swapped / flipped).
  { livello:  1, nOggetti:  3, superfici: ["piano"],                       slotPerSuperficie: 4, nCambiamenti: 1, modificheAmmesse: ["moved"],                          memoMs: 15_000, memoManuale: true },
  { livello:  2, nOggetti:  4, superfici: ["piano"],                       slotPerSuperficie: 5, nCambiamenti: 1, modificheAmmesse: ["moved"],                          memoMs: 14_000 },
  { livello:  3, nOggetti:  4, superfici: ["piano"],                       slotPerSuperficie: 5, nCambiamenti: 1, modificheAmmesse: ["moved", "swapped"],               memoMs: 13_000 },
  // L4: introduce la 2ª superficie ma resta a 1 solo cambiamento.
  { livello:  4, nOggetti:  5, superfici: ["mensola", "piano"],            slotPerSuperficie: 4, nCambiamenti: 1, modificheAmmesse: ["moved", "swapped"],               memoMs: 13_000 },
  // L5: due superfici consolidate, passa a 2 cambiamenti.
  { livello:  5, nOggetti:  5, superfici: ["mensola", "piano"],            slotPerSuperficie: 4, nCambiamenti: 2, modificheAmmesse: ["moved", "swapped"],               memoMs: 12_000 },
  { livello:  6, nOggetti:  6, superfici: ["mensola", "piano"],            slotPerSuperficie: 4, nCambiamenti: 2, modificheAmmesse: ["moved", "swapped"],               memoMs: 11_000 },
  // L7: introduce il flip; numero oggetti e superfici invariati.
  { livello:  7, nOggetti:  7, superfici: ["mensola", "piano"],            slotPerSuperficie: 5, nCambiamenti: 2, modificheAmmesse: ["moved", "swapped", "flipped"],    memoMs: 10_000 },
  // L8: introduce la 3ª superficie ma cambiamenti restano 2.
  { livello:  8, nOggetti:  8, superfici: ["mensola", "piano", "tavolo"],  slotPerSuperficie: 4, nCambiamenti: 2, modificheAmmesse: ["moved", "swapped", "flipped"],    memoMs: 10_000 },
  { livello:  9, nOggetti:  9, superfici: ["mensola", "piano", "tavolo"],  slotPerSuperficie: 4, nCambiamenti: 3, modificheAmmesse: ["moved", "swapped", "flipped"],    memoMs:  9_000 },
  { livello: 10, nOggetti: 10, superfici: ["mensola", "piano", "tavolo"],  slotPerSuperficie: 4, nCambiamenti: 3, modificheAmmesse: ["moved", "swapped", "flipped"],    memoMs:  8_000 },
] as const;

export const CASALINGA_TRIAL_VALUTATIVI = 5;

export function getCasalingaLevel(livello: number): CasalingaLevelConfig {
  return CASALINGA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

export function getCasalingaMechanicWarning(
  livelloPrec: number | null,
  livello: number,
): { titolo: string; testo: string } | null {
  if (livelloPrec !== null && livelloPrec <= 3 && livello === 4) {
    return {
      titolo: "Più superfici",
      testo: "Da questo livello gli oggetti possono trovarsi sia sulla mensola che sul piano. Osserva entrambi.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 4 && livello === 5) {
    return {
      titolo: "Due cambiamenti",
      testo: "Da ora le cose che cambiano possono essere due. Guarda con calma prima di rispondere.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 6 && livello === 7) {
    return {
      titolo: "Anche l'orientamento",
      testo: "Da ora alcuni oggetti possono essere capovolti o ruotati. Anche un cambio di verso conta come cambiamento.",
    };
  }
  if (livelloPrec !== null && livelloPrec <= 7 && livello === 8) {
    return {
      titolo: "Il tavolo",
      testo: "Ora c'è anche il tavolo apparecchiato. Tre superfici da tenere a mente.",
    };
  }
  return null;
}
