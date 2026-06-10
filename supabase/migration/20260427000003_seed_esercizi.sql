-- ─── Seed catalogo esercizi (GDD shared/07-catalog.md) ──────────────────────
--
-- 41 esercizi attivi, 21 famiglie.
-- Fonte degli ID: mappa JSON id → famiglia in shared/07-catalog.md.
-- Il campo `params` è '{}'::jsonb per tutti: verrà popolato con i parametri
-- per-livello quando il game engine di ciascuna famiglia sarà implementato
-- (leggere prima docs/gdd/families/<famiglia>.md).
--
-- Colonne:
--   modello_sessione  : 'timer' (default 90s) | 'completamento' (N trial fissi)
--   session_timer_sec : 90 o 120; NULL per completamento
--   trials_per_session: numero trial per sessione; NULL per timer (da aggiornare
--                       per ogni famiglia con modello completamento)
--   memoria_type      : 'mbt' | 'mlt' | NULL (NULL per domini non di memoria)
--   ordine_in_famiglia: ordine di visualizzazione dentro la famiglia (1-based)

INSERT INTO esercizi
  (id, famiglia, nome, categoria_id, memoria_type, modello_sessione, session_timer_sec, trials_per_session, ordine_in_famiglia)
VALUES

-- ── Famiglia 1: Sequence Tap (Memoria) ───────────────────────────────────────
  ('sequence_tap_numeri_forward',
   'Sequence Tap', 'Sequenza Numeri — In Avanti',
   'memoria', 'mbt', 'timer', 90, NULL, 1),

  ('sequence_tap_numeri_backward',
   'Sequence Tap', 'Sequenza Numeri — Al Contrario',
   'memoria', 'mbt', 'timer', 90, NULL, 2),

  ('sequence_tap_parole_forward',
   'Sequence Tap', 'Sequenza Parole — In Avanti',
   'memoria', 'mbt', 'timer', 90, NULL, 3),

  ('sequence_tap_parole_backward',
   'Sequence Tap', 'Sequenza Parole — Al Contrario',
   'memoria', 'mbt', 'timer', 90, NULL, 4),

-- ── Famiglia 2: Recall Grid (Memoria) ────────────────────────────────────────
  ('recall_grid_parole_mbt',
   'Recall Grid', 'Griglia di Parole — Breve Termine',
   'memoria', 'mbt', 'timer', 90, NULL, 1),

  -- #4 "Dov'era quell'immagine": Modello A timer 60s (no contatore trial)
  ('recall_grid_immagini_mbt',
   'Recall Grid', 'Griglia di Immagini — Breve Termine',
   'memoria', 'mbt', 'timer', 60, NULL, 2),

  -- MLT: delay lungo + task distrattore → sessione a completamento trial
  ('recall_grid_immagini_mlt',
   'Recall Grid', 'Griglia di Immagini — Lungo Termine',
   'memoria', 'mlt', 'completamento', NULL, NULL, 3),

-- ── Famiglia 3: Odd One Out (Attenzione) ─────────────────────────────────────
  ('odd_one_out_numeri_lettere',
   'Odd One Out', 'Trova l''Intruso — Numeri e Lettere',
   'attenzione', NULL, 'timer', 90, NULL, 1),

  ('odd_one_out_parole_miste',
   'Odd One Out', 'Trova l''Intruso — Parole',
   'attenzione', NULL, 'timer', 90, NULL, 2),

-- ── Famiglia 4: Sort It (Esecutive) ──────────────────────────────────────────
  ('sort_it_percettivo',
   'Sort It', 'Ordina — Percettivo',
   'esecutive', NULL, 'timer', 90, NULL, 1),

  ('sort_it_semantico',
   'Sort It', 'Ordina — Semantico',
   'esecutive', NULL, 'timer', 90, NULL, 2),

-- ── Famiglia 5: Hayling Game (Esecutive) ─────────────────────────────────────
  ('hayling_ab',
   'Hayling Game', 'Completamento Frasi — A+B',
   'esecutive', NULL, 'timer', 90, NULL, 1),

  ('hayling_b_only',
   'Hayling Game', 'Completamento Frasi — Solo B',
   'esecutive', NULL, 'timer', 90, NULL, 2),

-- ── Famiglia 6: Pasat Light (Esecutive — riclassificato da Memoria) ──────────
  ('pasat_light_visivo',
   'Pasat Light', 'PASAT Visivo',
   'esecutive', NULL, 'timer', 90, NULL, 1),

-- ── Famiglia 7: Updating WM (Esecutive — riclassificato da Memoria) ──────────
  ('updating_wm_parole',
   'Updating WM', 'Aggiornamento — Parole',
   'esecutive', NULL, 'timer', 90, NULL, 1),

  ('updating_wm_immagini',
   'Updating WM', 'Aggiornamento — Immagini',
   'esecutive', NULL, 'timer', 90, NULL, 2),

  ('updating_wm_numeri',
   'Updating WM', 'Aggiornamento — Numeri',
   'esecutive', NULL, 'timer', 90, NULL, 3),

-- ── Famiglia 8: Memoria e Comprensione del Testo (Memoria) ───────────────────
  -- Testi da leggere + domande: sessione a completamento trial
  ('memoria_comprensione_fattuale_mbt',
   'Memoria e Comprensione del Testo', 'Testo e Memoria — Fattuale Breve Termine',
   'memoria', 'mbt', 'completamento', NULL, NULL, 1),

  ('memoria_comprensione_inferenziale_mbt',
   'Memoria e Comprensione del Testo', 'Testo e Memoria — Inferenza Breve Termine',
   'memoria', 'mbt', 'completamento', NULL, NULL, 2),

  ('memoria_comprensione_ordine_narrativo',
   'Memoria e Comprensione del Testo', 'Testo e Memoria — Ordine Narrativo',
   'memoria', NULL, 'completamento', NULL, NULL, 3),

  ('memoria_comprensione_fattuale_mlt',
   'Memoria e Comprensione del Testo', 'Testo e Memoria — Fattuale Lungo Termine',
   'memoria', 'mlt', 'completamento', NULL, NULL, 4),

-- ── Famiglia 9: Memoria Lista (Memoria) ──────────────────────────────────────
  ('memoria_lista_parole_rievocazione',
   'Memoria Lista', 'Lista di Parole — Rievocazione',
   'memoria', NULL, 'completamento', NULL, NULL, 1),

  ('memoria_lista_immagini_rievocazione',
   'Memoria Lista', 'Lista di Immagini — Rievocazione',
   'memoria', NULL, 'completamento', NULL, NULL, 2),

  ('memoria_lista_parole_riconoscimento',
   'Memoria Lista', 'Lista di Parole — Riconoscimento',
   'memoria', NULL, 'completamento', NULL, NULL, 3),

  ('memoria_lista_immagini_riconoscimento',
   'Memoria Lista', 'Lista di Immagini — Riconoscimento',
   'memoria', NULL, 'completamento', NULL, NULL, 4),

-- ── Famiglia 10: Memoria Prospettica (Memoria) ───────────────────────────────
  -- Sessioni a struttura temporale vincolata (durationMin / intervalS)
  ('memoria_prospettica_event_based',
   'Memoria Prospettica', 'Memoria Prospettica — Evento',
   'memoria', NULL, 'completamento', NULL, NULL, 1),

  ('memoria_prospettica_time_based',
   'Memoria Prospettica', 'Memoria Prospettica — Tempo',
   'memoria', NULL, 'completamento', NULL, NULL, 2),

-- ── Famiglia 11: SART (Attenzione) ───────────────────────────────────────────
  -- sequenceLength fisso per sessione → completamento
  ('sart_numerico',
   'SART', 'SART Numerico',
   'attenzione', NULL, 'completamento', NULL, NULL, 1),

-- ── Famiglia 12: Go/No-Go (Esecutive) ────────────────────────────────────────
  ('go_nogo_cromatico',
   'Go/No-Go', 'Go/No-Go — Colori',
   'esecutive', NULL, 'timer', 90, NULL, 1),

  ('go_nogo_semantico',
   'Go/No-Go', 'Go/No-Go — Semantico',
   'esecutive', NULL, 'timer', 90, NULL, 2),

-- ── Famiglia 15: Stroop (Esecutive) ──────────────────────────────────────────
  ('stroop_classico',
   'Stroop', 'Stroop Classico',
   'esecutive', NULL, 'timer', 90, NULL, 1),

-- ── Famiglia 17: Flanker Task (Esecutive) ────────────────────────────────────
  ('flanker_frecce',
   'Flanker Task', 'Flanker — Frecce',
   'esecutive', NULL, 'timer', 90, NULL, 1),

-- ── Famiglia 19: Verbal Fluency (Linguaggio) ─────────────────────────────────
  -- 1 trial per sessione, il timer è il tempo del trial → completamento
  ('verbal_fluency_semantica',
   'Verbal Fluency', 'Fluenza Verbale — Semantica',
   'linguaggio', NULL, 'completamento', NULL, 1, 1),

  ('verbal_fluency_fonemica',
   'Verbal Fluency', 'Fluenza Verbale — Fonemica',
   'linguaggio', NULL, 'completamento', NULL, 1, 2),

-- ── Famiglia 20: Linguaggio e Denominazione (Linguaggio) ─────────────────────
  ('picture_naming',
   'Linguaggio e Denominazione', 'Denominazione — Immagini',
   'linguaggio', NULL, 'timer', 90, NULL, 1),

  ('synonym_antonym_decision',
   'Linguaggio e Denominazione', 'Sinonimi e Antonimi',
   'linguaggio', NULL, 'timer', 90, NULL, 2),

-- ── Famiglia 22: Path Tracing (Visuospaziale) ────────────────────────────────
  ('path_tracing',
   'Path Tracing', 'Traccia il Percorso',
   'visuospaziali', NULL, 'timer', 90, NULL, 1),

-- ── Famiglia 24: Conoscenza Generale (Memoria) ───────────────────────────────
  ('cultura_generale',
   'Conoscenza Generale', 'Cultura Generale',
   'memoria', NULL, 'timer', 90, NULL, 1),

-- ── Word Chain (Esecutive) ────────────────────────────────────────────────────
  ('word_chain_alfabetico',
   'Word Chain', 'Catena di Parole — Alfabetico',
   'esecutive', NULL, 'timer', 90, NULL, 1),

-- ── Word Chain Switching (Esecutive) ─────────────────────────────────────────
  ('word_chain_switching_categoriale',
   'Word Chain Switching', 'Catena di Parole — Categoriale',
   'esecutive', NULL, 'timer', 90, NULL, 1),

-- ── Associative Memory (Memoria) ─────────────────────────────────────────────
  -- 3 varianti (parola+immagine, immagine+immagine, parola+parola) gestite
  -- tramite params.stimulusType; un solo record in tabella (tabella unica)
  ('associative_memory',
   'Associative Memory', 'Memoria Associativa',
   'memoria', NULL, 'completamento', NULL, NULL, 1);
