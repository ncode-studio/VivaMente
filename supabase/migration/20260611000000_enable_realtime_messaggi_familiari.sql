-- Abilita Supabase Realtime su `messaggi` e `familiari` per la sincronizzazione
-- live lato senior (UserInit sottoscrive postgres_changes su queste tabelle).
-- Senza questo, le subscription si collegano ma non ricevono eventi.
--
-- Idempotente: aggiunge le tabelle alla publication `supabase_realtime` solo
-- se non già presenti. Da eseguire una volta nel SQL editor di Supabase
-- (DDL: non applicabile via REST).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messaggi'
  ) then
    execute 'alter publication supabase_realtime add table public.messaggi';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'familiari'
  ) then
    execute 'alter publication supabase_realtime add table public.familiari';
  end if;
end $$;
