-- ─── Patch catalogo esercizi: deroghe GDD e decisioni di prodotto ────────────
--
-- Motivazioni:
--
--   1. SART numerico rimosso definitivamente (decisione prodotto — carico
--      cognitivo non adatto al target elderly; sostituito da Go/No-Go).
--
--   2. memoria_prospettica_event_based rimosso: il modello ibrido
--      time_based copre entrambe le varianti (trigger tempo + evento);
--      mantenere due esercizi separati confonde la rotazione giornaliera.
--
--   3. odd_one_out_parole_miste → odd_one_out_immagini: il registry TS
--      usa l'id "immagini"; il seed del 27/04 usava il nome GDD originale
--      "parole_miste". L'engine OddOneOutTaskEngine non discrimina tra le
--      due varianti via id, ma la rotazione giornaliera deve matchare il
--      registry — allineamo il DB.
--
--   4. Go/No-Go: session_timer_sec 90 → 60 (deroga UX: 60s è il timer
--      effettivo usato da GO_NOGO_TIMER_MS nel engine).
--
--   5. Odd One Out: session_timer_sec 90 → 60 (deroga UX: ODD_ONE_OUT_TIMER_MS
--      = 60s nel engine; T.Lim per trial = 8s).
--
-- Sicurezza delle operazioni:
--   - Non ci sono utenti reali; esercizi_del_giorno viene troncato o
--     ricalcolato al prossimo accesso (fetchOrCreateEserciziDelGiorno).
--   - La FK sessioni.esercizio_id è NOT VALID (migration 20260427000001),
--     quindi le righe storiche non bloccano il DELETE.
--   - La FK esercizi_del_giorno.esercizio_id è VALID, ma la tabella è
--     vuota o contiene solo dati di test → svuotiamo prima del DELETE.

-- ─── 0. Allarga il CHECK su session_timer_sec per ammettere 60s ──────────────
--
-- La migration 20260427000001 limitava i valori a (90, 120). Le deroghe UX
-- richiedono 60s per Go/No-Go e Odd One Out — aggiorniamo il vincolo prima
-- degli UPDATE, altrimenti falliscono per violazione di CHECK.
ALTER TABLE esercizi
  DROP CONSTRAINT IF EXISTS esercizi_session_timer_sec_check;

ALTER TABLE esercizi
  ADD CONSTRAINT esercizi_session_timer_sec_check
  CHECK (session_timer_sec IN (60, 90, 120));

-- ─── 1. Pulizia preventiva esercizi_del_giorno ───────────────────────────────
TRUNCATE TABLE esercizi_del_giorno;

-- ─── 1. Rimuovi SART ─────────────────────────────────────────────────────────
DELETE FROM esercizi WHERE id = 'sart_numerico';

-- ─── 2. Rimuovi Memoria Prospettica event_based ──────────────────────────────
DELETE FROM esercizi WHERE id = 'memoria_prospettica_event_based';

-- ─── 3. Rename odd_one_out_parole_miste → odd_one_out_immagini ───────────────
--
-- Non è possibile aggiornare una PK con FK valide referenziate; usiamo
-- DELETE + INSERT per garantire l'atomicità senza dipendere da deferred FK.
INSERT INTO esercizi
  (id, famiglia, nome, categoria_id, memoria_type,
   modello_sessione, session_timer_sec, trials_per_session,
   params, attivo, ordine_in_famiglia)
SELECT
  'odd_one_out_immagini'           AS id,
  famiglia, nome, categoria_id, memoria_type,
  modello_sessione, session_timer_sec, trials_per_session,
  params, attivo, ordine_in_famiglia
FROM esercizi
WHERE id = 'odd_one_out_parole_miste'
ON CONFLICT (id) DO NOTHING;

DELETE FROM esercizi WHERE id = 'odd_one_out_parole_miste';

-- ─── 4. Fix timer Go/No-Go: 90 → 60 ─────────────────────────────────────────
UPDATE esercizi
SET session_timer_sec = 60
WHERE id IN ('go_nogo_cromatico', 'go_nogo_semantico');

-- ─── 5. Fix timer Odd One Out: 90 → 60 ───────────────────────────────────────
UPDATE esercizi
SET session_timer_sec = 60
WHERE id IN ('odd_one_out_numeri_lettere', 'odd_one_out_immagini');

-- ─── Verifica finale (commentata — eseguire manualmente se utile) ─────────────
-- SELECT id, nome, session_timer_sec, attivo
-- FROM esercizi
-- ORDER BY categoria_id, famiglia, ordine_in_famiglia;
--
-- Esercizi attivi attesi: 39
-- Presenti per categoria:
--   memoria     : 18 (sequence_tap ×4, recall_grid ×3, comprensione ×4,
--                      lista ×4, prospettica ×1, associative ×1, cultura ×1)
--   attenzione  :  2 (odd_one_out ×2)
--   linguaggio  :  4 (verbal_fluency ×2, picture_naming, synonym_antonym)
--   esecutive   : 14 (sort_it ×2, hayling ×2, pasat ×1, updating_wm ×3,
--                      go_nogo ×2, stroop ×1, flanker ×1, word_chain ×2)
--   visuospaziali:  1 (path_tracing)
