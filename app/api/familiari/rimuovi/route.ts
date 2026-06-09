import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Rimuove un familiare collegato e invalida i relativi link d'invito.
 *
 * Usa la service_role (che bypassa la RLS) per marcare gli inviti come
 * 'expired' — operazione altrimenti bloccata dalla RLS sulla tabella inviti.
 * L'identità del richiedente è verificata via sessione (cookie) prima di agire,
 * e ogni operazione è vincolata al suo user_id, così un utente può rimuovere
 * solo i propri familiari.
 */
export async function POST(req: Request) {
  let familiareId: string | undefined;
  try {
    ({ familiareId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }
  if (!familiareId) {
    return NextResponse.json({ error: "familiareId mancante" }, { status: 400 });
  }

  // 1. Verifica utente autenticato (client anon con cookie di sessione)
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // 2. Client admin (service_role) — bypassa la RLS
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // 3. Recupera il familiare e verifica che appartenga al richiedente
  const { data: familiare } = await admin
    .from("familiari")
    .select("id, nome, user_id")
    .eq("id", familiareId)
    .single();

  if (!familiare || familiare.user_id !== user.id) {
    return NextResponse.json({ error: "Familiare non trovato" }, { status: 404 });
  }

  // 4. Invalida i link: marca come scaduti gli inviti relativi a questa persona
  await admin
    .from("inviti")
    .update({ status: "expired" })
    .eq("mittente_id", user.id)
    .eq("nome_destinatario", familiare.nome);

  // 5. Elimina il collegamento del familiare
  await admin
    .from("familiari")
    .delete()
    .eq("id", familiare.id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
