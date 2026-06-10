import type { ComponentType } from "react";
import type { GameEngineProps } from "@/lib/exercise-types";
import type { ImplementedExerciseId } from "./implemented-ids";
import { GoNogoTaskEngine } from "./families/go-nogo/GoNogoTaskEngine";
import { GO_NOGO_TIMER_MS } from "./families/go-nogo/_deroghe";
import { GoNogoSemanticoTaskEngine, GO_NOGO_SEMANTICO_TIMER_MS } from "./families/go-nogo-semantico/GoNogoSemanticoTaskEngine";
import { SimonTaskEngine } from "./families/simon/SimonTaskEngine";
import { SESSION_TIMER_MS as SIMON_TIMER_MS } from "./families/simon/levels";
import { OddOneOutTaskEngine } from "./families/odd-one-out/OddOneOutTaskEngine";
import { ODD_ONE_OUT_TIMER_MS } from "./families/odd-one-out/_deroghe";
import { MemoriaProspetticaTaskEngine } from "./families/memoria-prospettica/MemoriaProspetticaTaskEngine";
import { SequenceTapTaskEngine } from "./families/sequence-tap/SequenceTapTaskEngine";
import { SESSION_TIMER_MS as ST_TIMER_MS } from "./families/sequence-tap/levels";
import { RecallGridMBTTaskEngine } from "./families/recall-grid/RecallGridMBTTaskEngine";
import { RecallGridMLTTaskEngine } from "./families/recall-grid/RecallGridMLTTaskEngine";
import { LinguaggioDenominazioneTaskEngine } from "./families/linguaggio-denominazione/LinguaggioDenominazioneTaskEngine";
import { CulturaGeneraleTaskEngine } from "./families/conoscenza-generale/CulturaGeneraleTaskEngine";
import { SESSION_TIMER_MS as CG_TIMER_MS } from "./families/conoscenza-generale/levels";
import { PasatLightTaskEngine } from "./families/pasat-light/PasatLightTaskEngine";
import { SESSION_TIMER_MS as PL_TIMER_MS } from "./families/pasat-light/levels";
import { UpdatingWMTaskEngine } from "./families/updating-wm/UpdatingWMTaskEngine";
import { SESSION_TIMER_MS as UWM_TIMER_MS } from "./families/updating-wm/levels";
import { WordChainTaskEngine } from "./families/word-chain/WordChainTaskEngine";
import { SESSION_TIMER_MS as WC_TIMER_MS } from "./families/word-chain/levels";
import { WordChainSwitchingTaskEngine } from "./families/word-chain-switching/WordChainSwitchingTaskEngine";
import { SESSION_TIMER_MS as WCS_TIMER_MS } from "./families/word-chain-switching/levels";
import { AssociativeMemoryTaskEngine } from "./families/associative-memory/AssociativeMemoryTaskEngine";
import { SESSION_TIMER_MS as AM_TIMER_MS } from "./families/associative-memory/levels";
import { MemoriaListaTaskEngine } from "./families/memoria-lista/MemoriaListaTaskEngine";
import { MemoriaComprensioneTestoTaskEngine } from "./families/memoria-comprensione-testo/MemoriaComprensioneTestoTaskEngine";
import { MemoriaComprensioneTestoMLTTaskEngine } from "./families/memoria-comprensione-testo/MemoriaComprensioneTestoMLTTaskEngine";
import { OrdineNarrativoTaskEngine } from "./families/memoria-comprensione-testo/OrdineNarrativoTaskEngine";
import { VerbalFluencyTaskEngine } from "./families/verbal-fluency/VerbalFluencyTaskEngine";
import { CancellazioneVisivaTaskEngine } from "./families/cancellazione-visiva/CancellazioneVisivaTaskEngine";
import { CV_SESSION_TIMER_MS } from "./families/cancellazione-visiva/levels";
import { RilevamentoCambiamentoTaskEngine } from "./families/rilevamento-cambiamento/RilevamentoCambiamentoTaskEngine";
import { RILEVAMENTO_SESSION_TIMER_MS } from "./families/rilevamento-cambiamento/levels";
import { FallingObjectsTaskEngine } from "./families/falling-objects/FallingObjectsTaskEngine";
import { FALL_SESSION_TIMER_MS } from "./families/falling-objects/levels";
import { GuardianoGiardinoTaskEngine } from "./families/guardiano-giardino/GuardianoGiardinoTaskEngine";
import { GG_SESSION_TIMER_MS } from "./families/guardiano-giardino/levels";
import { OsservatorioStellareTaskEngine } from "./families/osservatorio-stellare/OsservatorioStellareTaskEngine";
import { OS_SESSION_TIMER_MS } from "./families/osservatorio-stellare/levels";
import { PescatoreTaskEngine } from "./families/pescatore/PescatoreTaskEngine";
import { PESCATORE_SESSION_TIMER_MS } from "./families/pescatore/levels";
import { VivaioTaskEngine } from "./families/vivaio/VivaioTaskEngine";
import { VIVAIO_SESSION_TIMER_MS } from "./families/vivaio/levels";
import { IlPostinoTaskEngine } from "./families/il-postino/IlPostinoTaskEngine";
import { POSTINO_SESSION_TIMER_MS } from "./families/il-postino/levels";
import { AnalogoTaskEngine } from "./families/analogo/AnalogoTaskEngine";
import { SESSION_TIMER_MS as ANALOGO_TIMER_MS } from "./families/analogo/levels";
import { MaestroBottegaTaskEngine } from "./families/maestro-bottega/MaestroBottegaTaskEngine";
import { MAESTRO_SESSION_TIMER_MS } from "./families/maestro-bottega/levels";
import { CorrettoreBozzeTaskEngine } from "./families/correttore-bozze/CorrettoreBozzeTaskEngine";
import { CORRETTORE_SESSION_TIMER_MS } from "./families/correttore-bozze/levels";
import { FalegnameTaskEngine } from "./families/falegname/FalegnameTaskEngine";
import { SESSION_TIMER_MS as FALEGNAME_TIMER_MS } from "./families/falegname/levels";
import { CasalingaTaskEngine } from "./families/la-casalinga/CasalingaTaskEngine";
import { IlMosaicistaTaskEngine } from "./families/il-mosaicista/IlMosaicistaTaskEngine";
import { MOSAICISTA_SESSION_TIMER_MS } from "./families/il-mosaicista/levels";
import { CartografoTaskEngine } from "./families/cartografo/CartografoTaskEngine";
import { RestauratoreTaskEngine } from "./families/il-restauratore/RestauratoreTaskEngine";
import { PostinoBorgoTaskEngine } from "./families/postino-borgo/PostinoBorgoTaskEngine";
import { IlNaturalistaTaskEngine } from "./families/il-naturalista/IlNaturalistaTaskEngine";
import { NATURALISTA_SESSION_TIMER_MS } from "./families/il-naturalista/levels";
import { SpesaTaskEngine } from "./families/spesa/SpesaTaskEngine";

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
// Tipizzato come Record<ImplementedExerciseId, …>: TypeScript impone che le
// chiavi qui coincidano 1:1 con IMPLEMENTED_EXERCISE_IDS (implemented-ids.ts),
// segnalando sia chiavi mancanti sia chiavi in eccesso → niente drift.
export const ENGINE_REGISTRY: Record<ImplementedExerciseId, FamilyEntry> = {

  // ── Famiglia 2: Recall Grid — 3 varianti ──────────────────────────────────
  recall_grid_parole_mbt: {
    Engine: RecallGridParoleMBTEngine,
    getSessionDurationMs: () => null,  // Modello B — timer non usato
  },
  recall_grid_immagini_mbt: {
    Engine: RecallGridImmaginiMBTEngine,
    // #4 "Dov'era quell'immagine": Modello A — timer 60s al posto del contatore
    // trial. La variante parole resta Modello B (trial-based).
    getSessionDurationMs: () => 60_000,
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

  // ── Famiglia 17: Simon Spaziale (Modello A — timer 60s) ──────────────────
  simon_spaziale: {
    Engine: SimonTaskEngine,
    getSessionDurationMs: () => SIMON_TIMER_MS,
  },

  // ── Famiglia 3: Odd One Out — variante immagini (numeri/lettere rimosso) ──
  odd_one_out_immagini: {
    Engine: OddOneOutTaskEngine,
    getSessionDurationMs: () => ODD_ONE_OUT_TIMER_MS,
  },

  // ── Famiglia 10: Memoria Prospettica Ibrida (Modello B — single trial) ──────
  memoria_prospettica_time_based: {
    Engine: MemoriaProspetticaTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Famiglia 1: Sequence Tap — 4 varianti (Modello A — timer 90s) ───────────
  sequence_tap_numeri_forward: {
    Engine: SequenceTapTaskEngine,
    getSessionDurationMs: () => ST_TIMER_MS,
  },
  sequence_tap_numeri_backward: {
    Engine: SequenceTapTaskEngine,
    getSessionDurationMs: () => ST_TIMER_MS,
  },
  sequence_tap_parole_forward: {
    Engine: SequenceTapTaskEngine,
    getSessionDurationMs: () => ST_TIMER_MS,
  },
  sequence_tap_parole_backward: {
    Engine: SequenceTapTaskEngine,
    getSessionDurationMs: () => ST_TIMER_MS,
  },

  // ── Famiglia 6: Pasat Light (Modello A — timer 90s) ─────────────────────────
  pasat_light_visivo: {
    Engine: PasatLightTaskEngine,
    getSessionDurationMs: () => PL_TIMER_MS,
  },

  // ── Famiglia 24: Conoscenza Generale (Modello A — timer 90s) ────────────────
  cultura_generale: {
    Engine: CulturaGeneraleTaskEngine,
    getSessionDurationMs: () => CG_TIMER_MS,
  },

  // ── Famiglia 7: Updating WM ─────────────────────────────────────────────────
  // updating_wm_parole: Modello B trial-based (no timer di sessione, termina
  // ai trialsPerSession). updating_wm_numeri: resta Modello A con timer.
  updating_wm_parole: {
    Engine: UpdatingWMTaskEngine,
    getSessionDurationMs: () => null,
  },
  updating_wm_numeri: {
    Engine: UpdatingWMTaskEngine,
    getSessionDurationMs: () => UWM_TIMER_MS,
  },

  // ── Word Chain (Modello A — timer 90s) ───────────────────────────────────────
  word_chain_alfabetico: {
    Engine: WordChainTaskEngine,
    getSessionDurationMs: () => WC_TIMER_MS,
  },

  // ── Word Chain Switching (Modello A — timer 90s) ──────────────────────────
  word_chain_switching_categoriale: {
    Engine: WordChainSwitchingTaskEngine,
    getSessionDurationMs: () => WCS_TIMER_MS,
  },

  // ── Associative Memory (Modello A — timer 60s, 3 varianti random) ──────────
  associative_memory: {
    Engine: AssociativeMemoryTaskEngine,
    getSessionDurationMs: () => AM_TIMER_MS,
  },

  // ── Famiglia 8: Memoria Comprensione Testo MBT (Modello B, 2 varianti) ──────
  memoria_comprensione_fattuale_mbt: {
    Engine: MemoriaComprensioneTestoTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_comprensione_inferenziale_mbt: {
    Engine: MemoriaComprensioneTestoTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_comprensione_fattuale_mlt: {
    Engine: MemoriaComprensioneTestoMLTTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_comprensione_ordine_narrativo: {
    Engine: OrdineNarrativoTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Famiglia 19: Verbal Fluency — 2 varianti (Modello B — 1 trial con timer interno) ─
  verbal_fluency_semantica: {
    Engine: VerbalFluencyTaskEngine,
    getSessionDurationMs: () => null,
  },
  verbal_fluency_fonemica: {
    Engine: VerbalFluencyTaskEngine,
    getSessionDurationMs: () => null,
  },
  verbal_fluency_alternata: {
    Engine: VerbalFluencyTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Cancellazione Visiva (Modello A — timer 60s, extra GDD) ─────────────────
  cancellazione_visiva: {
    Engine: CancellazioneVisivaTaskEngine,
    getSessionDurationMs: () => CV_SESSION_TIMER_MS,
  },

  // ── Stimoli Cadenti (Falling Go/No-Go, Modello A — timer 60s) ───────────────
  stimoli_cadenti: {
    Engine: FallingObjectsTaskEngine,
    getSessionDurationMs: () => FALL_SESSION_TIMER_MS,
  },

  // ── Il Guardiano del Giardino (Go/No-Go orizzontale, Modello A — timer 60s) ─
  guardiano_giardino: {
    Engine: GuardianoGiardinoTaskEngine,
    getSessionDurationMs: () => GG_SESSION_TIMER_MS,
  },

  // ── L'Osservatorio Stellare (vigilanza prolungata, Modello A — timer 60s) ───
  osservatorio_stellare: {
    Engine: OsservatorioStellareTaskEngine,
    getSessionDurationMs: () => OS_SESSION_TIMER_MS,
  },

  // ── Il Pescatore (attenzione divisa · dual task, Modello A — timer 60s) ─────
  pescatore: {
    Engine: PescatoreTaskEngine,
    getSessionDurationMs: () => PESCATORE_SESSION_TIMER_MS,
  },

  // ── Il Vivaio (esecutive · task switching inferenziale, Modello A — timer 60s) ─
  il_vivaio: {
    Engine: VivaioTaskEngine,
    getSessionDurationMs: () => VIVAIO_SESSION_TIMER_MS,
  },

  // ── Il Postino (linguaggio · completamento proverbi e modi di dire, Modello A — timer 60s) ─
  il_postino: {
    Engine: IlPostinoTaskEngine,
    getSessionDurationMs: () => POSTINO_SESSION_TIMER_MS,
  },

  // ── L'Analogo (linguaggio · analogie verbali illustrate, Modello B trial-based) ─
  analogo: {
    Engine: AnalogoTaskEngine,
    getSessionDurationMs: () => ANALOGO_TIMER_MS,
  },

  // ── Il Maestro di Bottega (linguaggio · denominazione su definizione, Modello A — timer 60s) ─
  maestro_bottega: {
    Engine: MaestroBottegaTaskEngine,
    getSessionDurationMs: () => MAESTRO_SESSION_TIMER_MS,
  },

  // ── Il Correttore di Bozze (linguaggio · rilevamento errori lessicali/sintattici, Modello A — timer 60s) ─
  correttore_bozze: {
    Engine: CorrettoreBozzeTaskEngine,
    getSessionDurationMs: () => CORRETTORE_SESSION_TIMER_MS,
  },

  // ── Il Mosaicista (visuospaziale · drag-and-drop frammenti mosaico, Modello A — timer 90s) ─
  il_mosaicista: {
    Engine: IlMosaicistaTaskEngine,
    getSessionDurationMs: () => MOSAICISTA_SESSION_TIMER_MS,
  },

  // ── Il Naturalista (visuospaziale · ricerca visiva figura/sfondo, Modello A — timer 90s) ─
  il_naturalista: {
    Engine: IlNaturalistaTaskEngine,
    getSessionDurationMs: () => NATURALISTA_SESSION_TIMER_MS,
  },

  // ── Il Postino del Borgo (visuospaziale · path planning con vincoli, Modello B — 2 trial, no timer) ─
  postino_borgo: {
    Engine: PostinoBorgoTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Il Falegname (visuospaziale · rotazione mentale, Modello A — timer 60s) ─
  il_falegname: {
    Engine: FalegnameTaskEngine,
    getSessionDurationMs: () => FALEGNAME_TIMER_MS,
  },

  // ── La Casalinga (visuospaziale · change detection in scena, Modello B — 5 trial, no timer) ─
  la_casalinga: {
    Engine: CasalingaTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Il Restauratore (visuospaziale · find the differences su dipinti, Modello B — 3 trial, no timer) ─
  il_restauratore: {
    Engine: RestauratoreTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Rilevamento del Cambiamento (Change Detection, Modello A — timer 90s) ──
  rilevamento_cambiamento: {
    Engine: RilevamentoCambiamentoTaskEngine,
    getSessionDurationMs: () => RILEVAMENTO_SESSION_TIMER_MS,
  },

  // Path Tracing rimosso (#29).

  // ── Il Cartografo (visuospaziale · navigazione mentale, Modello B 3 trial) ─
  cartografo: {
    Engine: CartografoTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Spesa al supermercato (memoria — Modello B) ─────────────────────────────
  spesa: {
    Engine: SpesaTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Famiglia 9: Memoria Lista — Riconoscimento (Modello B, 2 varianti) ──────
  memoria_lista_parole_riconoscimento: {
    Engine: MemoriaListaTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_lista_immagini_riconoscimento: {
    Engine: MemoriaListaTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_lista_immagini_rievocazione: {
    Engine: MemoriaListaTaskEngine,
    getSessionDurationMs: () => null,
  },
  memoria_lista_parole_rievocazione: {
    Engine: MemoriaListaTaskEngine,
    getSessionDurationMs: () => null,
  },

  // ── Famiglia 20: Linguaggio e Denominazione — solo Synonym/Antonym ──────────
  synonym_antonym_decision: {
    Engine: LinguaggioDenominazioneTaskEngine,
    getSessionDurationMs: () => 60_000,
  },

  // ── Da aggiungere progressivamente (una entry per id JSON del catalogo) ──
  // sequence_tap_numeri_forward:           { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_numeri_backward:          { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_parole_forward:           { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // sequence_tap_parole_backward:          { Engine: SequenceTapEngine,           getSessionDurationMs: () => null },
  // pasat_light_visivo: già registrato sopra
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
  return (ENGINE_REGISTRY as Record<string, FamilyEntry>)[esercizioId] ?? null;
}
