/**
 * components/esercizi/families/go-nogo/_deroghe.ts
 *
 * DEROGHE GDD UX-DRIVEN per Go/No-Go cromatico (decisione 2026-04-30).
 *
 * Scelte UX-driven (fonte: test browser sull'utente):
 *   1. Modello sessione: GDD prescrive "modello B — sessione a completamento
 *      dei blocchi previsti" (riga 39). Deroga: Modello A timer fisso 60s.
 *   2. N distrattori (No-Go): GDD prescrive distinzione binaria 1 Go vs 1 No-Go
 *      (riga 13). Deroga: da lv 3+ il pool No-Go scala fino a 6 colori distinti.
 *   3. sequenceLength ignorata: con timer fisso, la sessione termina a 60s
 *      indipendentemente dal numero di stimoli mostrati.
 *
 * Per tornare al GDD strict:
 *   - GO_NOGO_TIMER_MS = 0 (tornerà a Modello B)
 *   - GO_NOGO_N_DISTRATTORI_LV3_PLUS = false
 *
 * Riferimento: docs/gdd/families/go-nogo.md
 */

/** Durata sessione in ms. 60_000 = deroga; 0 = GDD strict (Modello B). */
export const GO_NOGO_TIMER_MS = 60_000;

/**
 * Abilita scaling N distrattori da lv 3+. true = deroga; false = GDD strict
 * (sempre 1 vs 1).
 */
export const GO_NOGO_N_DISTRATTORI_LV3_PLUS = true;

/**
 * ISI inter-stimolo in ms — pausa schermo vuoto post-stimolo prima del prossimo.
 * Deroga UX-driven 2026-04-30: ISI progressivo decrescente col livello.
 * Lv 1: 400ms (calmo per senior naive), lv 12+: 100ms (vicino al GDD strict).
 *
 * GDD shared/02-trial-flow.md prescrive 500ms standard; Go/No-Go GDD originale
 * prescrive 0 (flusso continuo). La curva qui è una via di mezzo:
 * accomoda l'utente senior ai livelli bassi e converge al GDD ai livelli alti.
 *
 * Per tornare a flusso continuo GDD: ritornare 0.
 */
export function getIsiMs(livello: number): number {
  // Step di 50ms ogni 2 livelli, range [400, 100].
  // lv 1: 400, lv 2-3: 350, lv 4-5: 300, lv 6-7: 250, lv 8-9: 200, lv 10-11: 150, lv 12+: 100.
  if (livello <= 1)  return 400;
  if (livello <= 3)  return 350;
  if (livello <= 5)  return 300;
  if (livello <= 7)  return 250;
  if (livello <= 9)  return 200;
  if (livello <= 11) return 150;
  return 100;
}

/**
 * Tipo feedback per TrialFlow.
 *   "standard"   — verde 300ms su corretto + rosso 300ms su errore (deroga UX-driven).
 *   "error-only" — solo rosso su errore, niente verde (GDD strict).
 *
 * GDD families/go-nogo.md §38 prescrive "error-only" per non interrompere
 * il flusso continuo (paradigma Robertson 1997). Deroga UX-driven 2026-04-30:
 * "standard" per dare conferma positiva sui tap corretti e sui nogo
 * correttamente non tappati (utente senior beneficia del rinforzo).
 *
 * Per tornare al GDD strict: GO_NOGO_FEEDBACK_TYPE = "error-only".
 */
export const GO_NOGO_FEEDBACK_TYPE: "standard" | "error-only" = "standard";

/**
 * Numero di colori distrattori (No-Go) per livello.
 *
 * Deprecato a favore del campo `nDistrattori` nel `GoNogoLevelConfig`
 * (vedi `levels.ts`). Mantenuto come fallback se la deroga è disattivata.
 * Quando GO_NOGO_N_DISTRATTORI_LV3_PLUS=false, ritorna sempre 1.
 */
export function getNDistrattori(livello: number, nDistrattoriConfig: number): number {
  if (!GO_NOGO_N_DISTRATTORI_LV3_PLUS) return 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void livello;
  return nDistrattoriConfig;
}
