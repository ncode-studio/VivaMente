-- #1 — Rinomina gli esercizi con nomi tecnici in nomi divertenti e coerenti
-- col tono "artigiano/quotidiano" del resto dell'app (Il Mosaicista, Il
-- Restauratore, Il Postino del Borgo, ...). Dove esisteva già un soprannome
-- d'uso (Vai o Fermati, Testa Aggiornata, Non Dimenticare, Catena di Parole)
-- viene adottato quello.
--
-- Questa migration gira DOPO il seed: aggiorna solo il campo user-facing
-- `nome`. Il campo `famiglia` (grouping interno) resta invariato.

-- ── Memoria ─────────────────────────────────────────────────────────────────
update esercizi set nome = 'Il Filo dei Numeri'                       where id = 'sequence_tap_numeri_forward';
update esercizi set nome = 'Il Filo dei Numeri — all''Indietro'       where id = 'sequence_tap_numeri_backward';
update esercizi set nome = 'Il Filo delle Parole'                     where id = 'sequence_tap_parole_forward';
update esercizi set nome = 'Il Filo delle Parole — all''Indietro'     where id = 'sequence_tap_parole_backward';

update esercizi set nome = 'Lo Scaffale delle Parole'                 where id = 'recall_grid_parole_mbt';
update esercizi set nome = 'Lo Scaffale delle Immagini'              where id = 'recall_grid_immagini_mbt';
update esercizi set nome = 'Lo Scaffale delle Immagini — a Lungo'    where id = 'recall_grid_immagini_mlt';

update esercizi set nome = 'La Lista del Mercato — Parole da Scrivere'      where id = 'memoria_lista_parole_rievocazione';
update esercizi set nome = 'La Lista del Mercato — Immagini da Scegliere'   where id = 'memoria_lista_immagini_rievocazione';
update esercizi set nome = 'La Lista del Mercato — Parole da Riconoscere'   where id = 'memoria_lista_parole_riconoscimento';
update esercizi set nome = 'La Lista del Mercato — Immagini da Riconoscere' where id = 'memoria_lista_immagini_riconoscimento';

update esercizi set nome = 'Il Lettore Attento — Fatti'              where id = 'memoria_comprensione_fattuale_mbt';
update esercizi set nome = 'Il Lettore Attento — Tra le Righe'       where id = 'memoria_comprensione_inferenziale_mbt';
update esercizi set nome = 'Il Lettore Attento — In Ordine'         where id = 'memoria_comprensione_ordine_narrativo';
update esercizi set nome = 'Il Lettore Attento — a Distanza'        where id = 'memoria_comprensione_fattuale_mlt';

update esercizi set nome = 'Non Dimenticare — all''Evento'           where id = 'memoria_prospettica_event_based';
update esercizi set nome = 'Non Dimenticare — al Momento Giusto'     where id = 'memoria_prospettica_time_based';

update esercizi set nome = 'Le Coppie'                               where id = 'associative_memory';
update esercizi set nome = 'Il Salotto del Sapere'                   where id = 'cultura_generale';

-- ── Attenzione ──────────────────────────────────────────────────────────────
update esercizi set nome = 'Trova l''Intruso — Numeri e Lettere'     where id = 'odd_one_out_numeri_lettere';
update esercizi set nome = 'Trova l''Intruso — Parole'               where id = 'odd_one_out_parole_miste';
update esercizi set nome = 'Trova l''Intruso — Immagini'             where id = 'odd_one_out_immagini';
update esercizi set nome = 'La Sentinella'                           where id = 'sart_numerico';

-- ── Funzioni esecutive ──────────────────────────────────────────────────────
update esercizi set nome = 'Il Cernitore — a Vista'                  where id = 'sort_it_percettivo';
update esercizi set nome = 'Il Cernitore — a Senso'                  where id = 'sort_it_semantico';

update esercizi set nome = 'Il Finale a Sorpresa — con Aiuto'        where id = 'hayling_ab';
update esercizi set nome = 'Il Finale a Sorpresa'                    where id = 'hayling_b_only';

update esercizi set nome = 'Il Contabile Veloce'                     where id = 'pasat_light_visivo';

update esercizi set nome = 'Testa Aggiornata — Parole'               where id = 'updating_wm_parole';
update esercizi set nome = 'Testa Aggiornata — Immagini'             where id = 'updating_wm_immagini';
update esercizi set nome = 'Testa Aggiornata — Numeri'               where id = 'updating_wm_numeri';

update esercizi set nome = 'Vai o Fermati — Colori'                  where id = 'go_nogo_cromatico';
update esercizi set nome = 'Vai o Fermati — Categorie'               where id = 'go_nogo_semantico';

update esercizi set nome = 'Il Colore Birichino'                     where id = 'stroop_classico';
update esercizi set nome = 'Le Frecce Dispettose'                    where id = 'flanker_frecce';

update esercizi set nome = 'Catena di Parole'                        where id = 'word_chain_alfabetico';
update esercizi set nome = 'Catena di Parole a Sorpresa'             where id = 'word_chain_switching_categoriale';

-- ── Linguaggio ──────────────────────────────────────────────────────────────
update esercizi set nome = 'Il Fiume di Parole — per Tema'           where id = 'verbal_fluency_semantica';
update esercizi set nome = 'Il Fiume di Parole — per Lettera'        where id = 'verbal_fluency_fonemica';

update esercizi set nome = 'Le Parole Giuste — Dai un Nome'          where id = 'picture_naming';
update esercizi set nome = 'Le Parole Giuste — Simili e Contrari'    where id = 'synonym_antonym_decision';

-- ── Visuospaziali ───────────────────────────────────────────────────────────
update esercizi set nome = 'Il Labirinto'                            where id = 'path_tracing';
