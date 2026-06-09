/**
 * Elenco degli esercizi effettivamente IMPLEMENTATI (con engine registrato).
 *
 * Modulo volutamente "leggero": contiene solo stringhe, nessun import di
 * componenti/engine. Così può essere importato anche da `lib/sync.ts` (che è
 * caricato app-wide via UserInit) senza trascinare l'intero grafo degli engine
 * nel bundle di ogni pagina.
 *
 * ⚠️ Deve restare allineato 1:1 con le chiavi di `ENGINE_REGISTRY`
 * (components/esercizi/registry.tsx). L'allineamento è garantito a
 * compile-time: il registry è tipizzato `Record<ImplementedExerciseId, …>`,
 * quindi TypeScript segnala sia chiavi mancanti sia chiavi in eccesso.
 *
 * Usato da `createEserciziDelGiornoRegolaaN` per non assegnare mai come
 * esercizio del giorno un esercizio "in arrivo" / non ancora implementato.
 */
export const IMPLEMENTED_EXERCISE_IDS = [
  // Recall Grid
  "recall_grid_parole_mbt",
  "recall_grid_immagini_mbt",
  "recall_grid_immagini_mlt",
  // Go/No-Go
  "go_nogo_cromatico",
  "go_nogo_semantico",
  // Simon
  "simon_spaziale",
  // Odd One Out
  "odd_one_out_immagini",
  // Memoria Prospettica
  "memoria_prospettica_time_based",
  // Sequence Tap
  "sequence_tap_numeri_forward",
  "sequence_tap_numeri_backward",
  "sequence_tap_parole_forward",
  "sequence_tap_parole_backward",
  // Pasat Light
  "pasat_light_visivo",
  // Conoscenza Generale
  "cultura_generale",
  // Updating WM
  "updating_wm_parole",
  "updating_wm_numeri",
  // Word Chain
  "word_chain_alfabetico",
  "word_chain_switching_categoriale",
  // Associative Memory
  "associative_memory",
  // Memoria Comprensione Testo
  "memoria_comprensione_fattuale_mbt",
  "memoria_comprensione_inferenziale_mbt",
  "memoria_comprensione_fattuale_mlt",
  "memoria_comprensione_ordine_narrativo",
  // Verbal Fluency
  "verbal_fluency_semantica",
  "verbal_fluency_fonemica",
  "verbal_fluency_alternata",
  // Cancellazione Visiva
  "cancellazione_visiva",
  // Stimoli Cadenti
  "stimoli_cadenti",
  // Guardiano del Giardino
  "guardiano_giardino",
  // Osservatorio Stellare
  "osservatorio_stellare",
  // Pescatore
  "pescatore",
  // Il Vivaio
  "il_vivaio",
  // Il Postino
  "il_postino",
  // Analogo
  "analogo",
  // Maestro di Bottega
  "maestro_bottega",
  // Correttore di Bozze
  "correttore_bozze",
  // Il Mosaicista
  "il_mosaicista",
  // Il Naturalista
  "il_naturalista",
  // Il Postino del Borgo
  "postino_borgo",
  // Il Falegname
  "il_falegname",
  // La Casalinga
  "la_casalinga",
  // Il Restauratore
  "il_restauratore",
  // Rilevamento del Cambiamento
  "rilevamento_cambiamento",
  // Il Cartografo
  "cartografo",
  // Spesa
  "spesa",
  // Memoria Lista
  "memoria_lista_parole_riconoscimento",
  "memoria_lista_immagini_riconoscimento",
  "memoria_lista_immagini_rievocazione",
  "memoria_lista_parole_rievocazione",
  // Linguaggio e Denominazione
  "synonym_antonym_decision",
] as const;

export type ImplementedExerciseId = (typeof IMPLEMENTED_EXERCISE_IDS)[number];

export const IMPLEMENTED_EXERCISE_ID_SET: ReadonlySet<string> = new Set(IMPLEMENTED_EXERCISE_IDS);
