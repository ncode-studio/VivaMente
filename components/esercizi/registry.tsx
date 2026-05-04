import type { ComponentType } from "react";
import type { GameEngineProps } from "@/lib/exercise-types";
import { GoNogoTaskEngine } from "./families/go-nogo/GoNogoTaskEngine";
import { GO_NOGO_TIMER_MS } from "./families/go-nogo/_deroghe";
import { GoNogoSemanticoTaskEngine, GO_NOGO_SEMANTICO_TIMER_MS } from "./families/go-nogo-semantico/GoNogoSemanticoTaskEngine";
import { FlankerTaskEngine } from "./families/flanker-task/FlankerTaskEngine";
import { getFlankerLevel } from "./families/flanker-task/levels";
import { StroopTaskEngine } from "./families/stroop/StroopTaskEngine";
import { getStroopLevel } from "./families/stroop/levels";
import { OddOneOutTaskEngine } from "./families/odd-one-out/OddOneOutTaskEngine";
import { ODD_ONE_OUT_TIMER_MS } from "./families/odd-one-out/_deroghe";
import { MemoriaProspetticaTaskEngine } from "./families/memoria-prospettica/MemoriaProspetticaTaskEngine";
import { RecallGridMBTTaskEngine } from "./families/recall-grid/RecallGridMBTTaskEngine";
import { RecallGridMLTTaskEngine } from "./families/recall-grid/RecallGridMLTTaskEngine";
import { getRecallGridMBTLevel } from "./families/recall-grid/levels";

// ── Wrapper inline per Recall Grid MBT (discrimina stimulusType) ─────────────

const RecallGridParoleMBTEngine = (p: GameEngineProps) => (
  <RecallGridMBTTaskEngine {...p} stimulusType="parole" />
);
const RecallGridImmaginiMBTEngine = (p: GameEngineProps) => (
  <RecallGridMBTTaskEngine {...p} stimulusType="immagini" />
);

/**
 * Entry del registry per una famiglia di esercizi.
 * Contiene il componente engine e i metadati che page.tsx ha bisogno
 * per orchestrare la sessione (durata timer per Modello A, ecc.).
 */
export interface FamilyEntry {
  Engine: ComponentType<GameEngineProps>;

  /**
   * Durata di sessione in ms per il Modello A (timer-based).
   * Famiglie Modello B (trial-based) restituiscono null e page.tsx non
   * avvia il timer — la sessione termina via trialValutativi raggiunti.
   */
  getSessionDurationMs(livello: number): number | null;
}

/**
 * Mappa esercizio_id → FamilyEntry.
 *
 * Chiave: id dell'esercizio (corrisponde a esercizi.id nel DB e al
 * parametro [id] nella URL di page.tsx).
 *
 * Famiglie multi-esercizio (es. Sequence Tap, Recall Grid) mappano più
 * chiavi alla stessa FamilyEntry. Il game engine riceverà esercizioId in
 * GameEngineProps per discriminare la variante interna.
 *
 * Per aggiungere una nuova famiglia: importare il suo Engine, definire
 * getSessionDurationMs (null per Modello B), aggiungere le entry per
 * tutti gli id JSON in docs/gdd/shared/07-catalog.md.
 */
export const ENGINE_REGISTRY: Record<string, FamilyEntry> = {

  // ── Famiglia 2: Recall Grid — 3 varianti ──────────────────────────────────
  recall_grid_parole_mbt: {
    Engine: RecallGridParoleMBTEngine,
    getSessionDurationMs: (livello) => getRecallGridMBTLevel(livello).sessionDurationMs,
  },
  recall_grid_immagini_mbt: {
    Engine: RecallGridImmaginiMBTEngine,
    getSessionDurationMs: (livello) => getRecallGridMBTLevel(livello).sessionDurationMs,
  },
  recall_grid_immagini_mlt: {
    Engine: RecallGridMLTTaskEngine,
    getSessionDurationMs: () => null,  // Modello B
  },

  // ── Famiglia 12: Go/No-Go Cromatico (Modello A timer 60s — deroga UX) ─────
  go_nogo_cromatico: {
    Engine: GoNogoTaskEngine,
    getSessionDurationMs: () => GO_NOGO_TIMER_MS,
  },

  // ── Go/No-Go Semantico (Modello A timer 60s) ─────────────────────────────
  go_nogo_semantico: {
    Engine: GoNogoSemanticoTaskEngine,
    getSessionDurationMs: () => GO_NOGO_SEMANTICO_TIMER_MS,
  },

  // ── Famiglia 15: Stroop Task (Modello A — timer-based) ───────────────────
  stroop_classico: {
    Engine: StroopTaskEngine,
    getSessionDurationMs: (livello) => getStroopLevel(livello).sessionDurationMs,
  },

  // ── Famiglia 17: Flanker Task (Modello A — timer-based) ──────────────────
  flanker_frecce: {
    Engine: FlankerTaskEngine,
    getSessionDurationMs: (livello) => getFlankerLevel(livello).sessionDurationMs,
  },

  // ── Famiglia 3: Odd One Out — 2 varianti (Modello A — timer-based) ──────
  odd_one_out_numeri_lettere: {
    Engine: OddOneOutTaskEngine,
    getSessionDurationMs: () => ODD_ONE_OUT_TIMER_MS,
  },
  odd_one_out_immagini: {
    Engine: OddOneOutTaskEngine,
    getSessionDurationMs: () => ODD_ONE_OUT_TIMER_MS,
  },

  // ── Famiglia 10: Memoria Prospettica — 2 varianti (Modello B — single trial) ──
  memoria_prospettica_event_based: {
    Engine: MemoriaProspetticaTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_prospettica_time_based: {
    Engine: MemoriaProspetticaTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Da aggiungere progressivamente (una entry per id JSON del catalogo) ──
  // sequence_tap_numeri_forward:           { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_numeri_backward:          { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_parole_forward:           { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_parole_backward:          { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sort_it_percettivo:                    { Engine: SortItEngine,                getSessionDurationMs: () => null },
  // sort_it_semantico:                     { Engine: SortItEngine,                getSessionDurationMs: () => null },
  // hayling_ab:                            { Engine: HaylingGameEngine,           getSessionDurationMs: () => null },
  // hayling_b_only:                        { Engine: HaylingGameEngine,           getSessionDurationMs: () => null },
  // pasat_light_visivo:                    { Engine: PasatLightEngine,            getSessionDurationMs: (l) => getPasatLevel(l).sessionDurationMs },
  // updating_wm_parole:                    { Engine: UpdatingWmEngine,            getSessionDurationMs: () => null },
  // updating_wm_immagini:                  { Engine: UpdatingWmEngine,            getSessionDurationMs: () => null },
  // updating_wm_numeri:                    { Engine: UpdatingWmEngine,            getSessionDurationMs: () => null },
  // memoria_comprensione_fattuale_mbt:     { Engine: MemoriaComprensioneTestoEngine, getSessionDurationMs: () => null },
  // memoria_comprensione_inferenziale_mbt: { Engine: MemoriaComprensioneTestoEngine, getSessionDurationMs: () => null },
  // memoria_comprensione_ordine_narrativo: { Engine: MemoriaComprensioneTestoEngine, getSessionDurationMs: () => null },
  // memoria_comprensione_fattuale_mlt:     { Engine: MemoriaComprensioneTestoEngine, getSessionDurationMs: () => null },
  // memoria_lista_parole_rievocazione:     { Engine: MemoriaListaEngine,          getSessionDurationMs: () => null },
  // memoria_lista_immagini_rievocazione:   { Engine: MemoriaListaEngine,          getSessionDurationMs: () => null },
  // memoria_lista_parole_riconoscimento:   { Engine: MemoriaListaEngine,          getSessionDurationMs: () => null },
  // memoria_lista_immagini_riconoscimento: { Engine: MemoriaListaEngine,          getSessionDurationMs: () => null },
  // go_nogo_semantico:                      { Engine: GoNogoTaskEngine,            getSessionDurationMs: () => null },
  // go_nogo_semantico:                     { Engine: GoNoGoEngine,                getSessionDurationMs: (l) => getGoNoGoLevel(l).sessionDurationMs },
  // picture_naming:                        { Engine: LinguaggioDenominazioneEngine, getSessionDurationMs: () => null },
  // synonym_antonym_decision:              { Engine: LinguaggioDenominazioneEngine, getSessionDurationMs: () => null },
  // path_tracing:                          { Engine: PathTracingEngine,           getSessionDurationMs: () => null },
  // cultura_generale:                      { Engine: ConoscenzaGeneraleEngine,    getSessionDurationMs: () => null },
  // word_chain_alfabetico:                 { Engine: WordChainEngine,             getSessionDurationMs: () => null },
  // word_chain_switching_categoriale:      { Engine: WordChainSwitchingEngine,    getSessionDurationMs: () => null },
  // associative_memory:                    { Engine: AssociativeMemoryEngine,     getSessionDurationMs: () => null },
  // verbal_fluency_semantica:              { Engine: VerbalFluencyEngine,         getSessionDurationMs: () => null },
  // verbal_fluency_fonemica:               { Engine: VerbalFluencyEngine,         getSessionDurationMs: () => null },
};

/**
 * Ritorna la FamilyEntry corrispondente, oppure null se l'id non è
 * registrato (esercizio non ancora implementato o URL non valida).
 * Page.tsx gestisce il null mostrando un messaggio user-friendly senza
 * esporre dettagli tecnici all'utente.
 */
export function getFamily(esercizioId: string): FamilyEntry | null {
  return ENGINE_REGISTRY[esercizioId] ?? null;
}
