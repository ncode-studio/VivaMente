import { createClient } from "@/lib/supabase/client";
import { calcolaProgressione, type UserLevelStato, type EventoProgressione } from "@/lib/progression";

// ─── Tipi esportati ───────────────────────────────────────────────────────────

export interface MedagliaDefinizione {
  id: string;
  nome: string;
  giorni: number;
  guadagnata_at: string | null;
}

export async function fetchMedaglie(): Promise<MedagliaDefinizione[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("medaglie")
    .select("id, nome, giorni")
    .order("giorni", { ascending: true });
  return (data ?? []).map((m) => ({
    id: m.id as string,
    nome: m.nome as string,
    giorni: m.giorni as number,
    guadagnata_at: null,
  }));
}

export interface MessaggioReale {
  id: string;
  mittente: string;
  relazione: string;
  data: string;
  testo: string;
  letto: boolean;
}

export interface EserciziDelGiornoItem {
  id: string;          // esercizio_id
  nome: string;        // da esercizi.nome (nuovo schema GDD)
  categoria_id: string;
  completato: boolean;
  risultato: { tempo_secondi: number; accuratezza: number } | null;
}

export interface ProgressoGiorno {
  giorno: string;
  esercizi: number;
  memoria: number;
  attenzione: number;
  linguaggio: number;
  esecutive: number;
  visuospaziali: number;
}

export interface SessioneRecente {
  titolo: string;
  categoria: string;
  score: number;
  data: string;
  icona: string;
  trend: "crescita" | "stabile" | "calo";
}

export interface FamiliareRecord {
  id: string;
  nome: string;
  relazione: string;
  telefono: string;
  collegato_at: string;
  permessi: { attivita: boolean; medaglie: boolean; progressi: boolean };
}

export type TrendCategoria = "crescita" | "stabile" | "calo";

export interface ScoreCategoria {
  categoria: string;
  icona: string;
  colore: string;
  score: number;
  trend: "crescita" | "stabile" | "calo";
  livello: number;
  sessioni: number;
  descrizione: string;
  storico: Array<{ label: string; score: number }>;
  storicoLivello: Array<{ label: string; livello: number }>;
}

export interface StoricoGiorno {
  data: string;
  sessioni: Array<{
    nome_esercizio: string;
    categoria: string;
    icona: string;
    livello: number;
    score: number;
  }>;
}

// ─── Costanti ────────────────────────────────────────────────────────────────

const CATEGORIE_ORDER = ["memoria", "attenzione", "linguaggio", "esecutive", "visuospaziali"] as const;


const ICONE_CAT: Record<string, string> = {
  memoria: "brain", attenzione: "target", linguaggio: "chat",
  esecutive: "puzzle", visuospaziali: "eye",
};

const COLORI_CAT: Record<string, string> = {
  memoria: "#2563EB", attenzione: "#7C3AED", linguaggio: "#16A34A",
  esecutive: "#D97706", visuospaziali: "#0F766E",
};

const NOMI_CAT: Record<string, string> = {
  memoria: "Memoria", attenzione: "Attenzione", linguaggio: "Linguaggio",
  esecutive: "Esecutive", visuospaziali: "Visuospaziali",
};

// ─── Profilo utente ───────────────────────────────────────────────────────────

export async function createUserProfile({
  userId, nome, telefono, email, canale_notifica, orario_notifica, consenso_notifiche,
}: {
  userId: string; nome: string; telefono: string; email: string | null;
  canale_notifica: string; orario_notifica: string; consenso_notifiche: boolean;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("users").upsert({
    id: userId, nome, telefono: telefono || null, email: email || null,
    canale_notifica, orario_notifica: orario_notifica || "09:00",
    consenso_notifiche, current_streak: 0, last_activity_date: null,
  });
  if (error) throw error;
  const categorie = ["memoria", "attenzione", "linguaggio", "esecutive", "visuospaziali"];
  await supabase.from("user_levels").upsert(
    categorie.map((cat) => ({ user_id: userId, categoria_id: cat, livello_corrente: 1 })),
    { onConflict: "user_id,categoria_id", ignoreDuplicates: true }
  );
}

export async function initUserData(userId: string) {
  const supabase = createClient();

  const [{ data: profile }, { data: userMedaglie }, { count: eserciziFattiOggi }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("user_medaglie").select("medaglia_id, guadagnata_at").eq("user_id", userId),
      supabase
        .from("sessioni")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date().toISOString().split("T")[0]),
    ]);

  if (!profile) return null;

  return {
    userId,
    nome: profile.nome as string,
    cognome: (profile.cognome ?? "") as string,
    telefono: (profile.telefono ?? "") as string,
    email: (profile.email ?? "") as string,
    anno_nascita: (profile.anno_nascita ?? 0) as number,
    orario_notifica: (profile.orario_notifica ?? "09:00") as string,
    canale_notifica: (profile.canale_notifica ?? "email") as import("@/lib/store").CanalNotifica,
    consenso_notifiche: (profile.consenso_notifiche ?? false) as boolean,
    streak: (profile.current_streak ?? 0) as number,
    lastActivityDate: (profile.last_activity_date ?? null) as string | null,
    medaglie: (userMedaglie ?? []).map((m) => m.medaglia_id as string),
    medaglieDate: Object.fromEntries((userMedaglie ?? []).map((m) => [m.medaglia_id as string, m.guadagnata_at as string])),
    eserciziFattiOggi: eserciziFattiOggi ?? 0,
    isGuest: false,
  };
}

// ─── Sessioni ─────────────────────────────────────────────────────────────────

export async function salvaSessione({
  userId, esercizioId, categoriaId, score, livello, accuratezzaValutativa, durata, metriche,
}: {
  userId: string;
  esercizioId: string;
  categoriaId: string | null;
  score: number;
  livello: number;
  accuratezzaValutativa: number;
  durata: number;
  metriche: Record<string, number> | null;
}) {
  const supabase = createClient();
  await supabase.from("sessioni").insert({
    user_id: userId,
    esercizio_id: esercizioId,
    categoria_id: categoriaId,
    score: Math.round(score),
    accuratezza: Math.round(accuratezzaValutativa * 100),
    durata: Math.round(durata),
    livello,
    metriche: metriche ?? null,
    completato: true,
  });
}

/**
 * Restituisce il livello dell'ultima sessione completata dall'utente per
 * questo esercizio. null = nessuna sessione precedente OR sessioni storiche
 * pre-migration con livello NULL (clinicamente: trattate come "primo accesso").
 */
export async function fetchUltimoLivelloEsercizio(
  userId: string,
  esercizioId: string,
): Promise<number | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessioni")
    .select("livello")
    .eq("user_id", userId)
    .eq("esercizio_id", esercizioId)
    .not("livello", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  return (data && data.length > 0) ? (data[0].livello as number) : null;
}

// ─── Streak e medaglie ────────────────────────────────────────────────────────

export async function aggiornaStreak(
  userId: string, streakCorrente: number, lastActivityDate: string | null
): Promise<number> {
  const supabase = createClient();
  const oggi = new Date().toISOString().split("T")[0];
  const ieri = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  if (lastActivityDate === oggi) return streakCorrente;

  const nuovoStreak = lastActivityDate === ieri ? streakCorrente + 1 : 1;

  await supabase
    .from("users")
    .update({ current_streak: nuovoStreak, last_activity_date: oggi })
    .eq("id", userId);

  return nuovoStreak;
}

export async function controllaNuoveMedaglie(
  userId: string, nuovoStreak: number, medaglieGiaOttenute: string[]
): Promise<string[]> {
  const supabase = createClient();

  let query = supabase.from("medaglie").select("id").lte("giorni", nuovoStreak);
  if (medaglieGiaOttenute.length > 0) {
    query = query.not("id", "in", `(${medaglieGiaOttenute.map((m) => `"${m}"`).join(",")})`);
  }

  const { data: nuove } = await query;
  if (!nuove || nuove.length === 0) return [];

  const ids = nuove.map((m) => m.id as string);
  await supabase.from("user_medaglie").insert(ids.map((id) => ({ user_id: userId, medaglia_id: id })));

  return ids;
}

// ─── Esercizi del giorno ──────────────────────────────────────────────────────

export async function fetchOrCreateEserciziDelGiorno(userId: string): Promise<EserciziDelGiornoItem[]> {
  const supabase = createClient();
  const oggi = new Date().toISOString().split("T")[0];

  // Verifica se esistono già per oggi
  const { data: existing } = await supabase
    .from("esercizi_del_giorno")
    .select("esercizio_id, categoria_id, completato")
    .eq("user_id", userId)
    .eq("data", oggi);

  const rows = (existing && existing.length > 0)
    ? existing
    : await createEserciziDelGiornoRegolaaN(supabase, userId, oggi);

  // Recupera i nomi dalla tabella esercizi (schema nuovo: campo "nome")
  const ids = rows.map((r: { esercizio_id: string }) => r.esercizio_id);
  const { data: info } = await supabase
    .from("esercizi")
    .select("id, nome")
    .in("id", ids);

  const nomiMap = Object.fromEntries((info ?? []).map((e) => [e.id as string, e.nome as string]));

  return CATEGORIE_ORDER.map((cat) => {
    const row = rows.find((r: { categoria_id: string }) => r.categoria_id === cat);
    if (!row) return null;
    return {
      id: row.esercizio_id,
      nome: nomiMap[row.esercizio_id] ?? row.esercizio_id,
      categoria_id: cat,
      completato: row.completato ?? false,
      risultato: null,
    } as EserciziDelGiornoItem;
  }).filter(Boolean) as EserciziDelGiornoItem[];
}

/**
 * Crea le 5 assegnazioni giornaliere usando la Regola N del GDD.
 *
 * Regola N (docs/gdd/shared/01-session-rules.md):
 * Un esercizio non può essere riproposto finché non sono stati selezionati
 * tutti gli altri esercizi dello stesso dominio dopo la sua ultima apparizione.
 *
 * Implementazione: per ogni dominio, gli ultimi (N−1) esercizi mostrati formano
 * l'insieme dei "recenti esclusi". L'esercizio da mostrare è scelto a caso
 * tra quelli non presenti nei recenti. Se per qualsiasi motivo tutti risultano
 * recenti (pool ridotto o primo utilizzo), si usa l'intero pool.
 *
 * Query: 2 fetch batch invece di 10 query sequenziali (5 domini × 2 tabelle).
 */
async function createEserciziDelGiornoRegolaaN(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  oggi: string
): Promise<Array<{ esercizio_id: string; categoria_id: string; completato: boolean }>> {
  // Fetch 1: pool attivo per tutti i domini
  const { data: tuttiEsercizi } = await supabase
    .from("esercizi")
    .select("id, categoria_id")
    .eq("attivo", true)
    .order("categoria_id", { ascending: true })
    .order("ordine_in_famiglia", { ascending: true });

  // Fetch 2: storico esercizi_del_giorno per questo utente (ultimi 100 entry)
  // 100 copre l'intera rotazione anche per il dominio con il pool più grande (~20 esercizi)
  const { data: history } = await supabase
    .from("esercizi_del_giorno")
    .select("esercizio_id, categoria_id")
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .limit(100);

  // Raggruppa per dominio
  const poolPerDominio: Record<string, string[]> = {};
  for (const e of (tuttiEsercizi ?? [])) {
    const cat = e.categoria_id as string;
    (poolPerDominio[cat] = poolPerDominio[cat] ?? []).push(e.id as string);
  }

  // La storia per dominio è in ordine data DESC (preservato dal limit globale)
  const storicoPerDominio: Record<string, string[]> = {};
  for (const h of (history ?? [])) {
    const cat = h.categoria_id as string;
    (storicoPerDominio[cat] = storicoPerDominio[cat] ?? []).push(h.esercizio_id as string);
  }

  const toInsert = CATEGORIE_ORDER.map((cat) => {
    const pool = poolPerDominio[cat] ?? [];
    if (pool.length === 0) {
      throw new Error(`Nessun esercizio attivo per il dominio "${cat}". Eseguire la migration seed.`);
    }

    // Regola N: escludi i (pool.length − 1) esercizi mostrati più di recente
    const nEsclusi = pool.length - 1;
    const recenti = new Set((storicoPerDominio[cat] ?? []).slice(0, nEsclusi));
    const eleggibili = pool.filter(id => !recenti.has(id));

    // Fallback: se eleggibili è vuoto (pool cambiato o primo giorno) usa tutto il pool
    const candidati = eleggibili.length > 0 ? eleggibili : pool;
    const esercizioId = candidati[Math.floor(Math.random() * candidati.length)];

    return { user_id: userId, esercizio_id: esercizioId, categoria_id: cat, data: oggi, completato: false };
  });

  await supabase
    .from("esercizi_del_giorno")
    .upsert(toInsert, { onConflict: "user_id,data,categoria_id" });

  return toInsert.map((t) => ({
    esercizio_id: t.esercizio_id,
    categoria_id: t.categoria_id,
    completato: false,
  }));
}

export async function marcaEsercizioCompletato(userId: string, esercizioId: string): Promise<void> {
  const supabase = createClient();
  const oggi = new Date().toISOString().split("T")[0];
  await supabase
    .from("esercizi_del_giorno")
    .update({ completato: true })
    .eq("user_id", userId)
    .eq("esercizio_id", esercizioId)
    .eq("data", oggi);
}

// ─── Livelli utente ───────────────────────────────────────────────────────────

export async function fetchUserLevels(userId: string): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_levels")
    .select("categoria_id, livello_corrente")
    .eq("user_id", userId);

  if (!data) return {};
  return Object.fromEntries(data.map((r) => [r.categoria_id as string, r.livello_corrente as number]));
}

/**
 * Aggiorna la progressione adattiva dopo una sessione completata.
 *
 * Logica: docs/gdd/shared/03-progression.md — valutazione inter-livello.
 * Chiama calcolaProgressione (funzione pura in lib/progression.ts) e
 * persiste il nuovo stato in user_levels.
 *
 * @param userId              ID dell'utente
 * @param categoriaId         Slug del dominio cognitivo (es. 'memoria')
 * @param accuratezzaValutativa - Accuratezza calcolata SOLO sui trial valutativi
 *   (esclusi i trial bonus). Range 0.0–1.0. Vedi docs/gdd/shared/03-progression.md.
 */
export async function aggiornaProgressione(
  userId: string,
  categoriaId: string,
  accuratezzaValutativa: number
): Promise<{ evento: EventoProgressione; livelloNuovo: number }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_levels")
    .select("livello_corrente, ultime_accuratezze, sessioni_sotto_60_consecutive")
    .eq("user_id", userId)
    .eq("categoria_id", categoriaId)
    .single();

  if (error || !data) {
    throw new Error(`user_levels non trovato per userId=${userId} categoria=${categoriaId}`);
  }

  const stato: UserLevelStato = {
    livello_corrente: data.livello_corrente as number,
    ultime_accuratezze: (data.ultime_accuratezze as number[]) ?? [],
    sessioni_sotto_60_consecutive: (data.sessioni_sotto_60_consecutive as number) ?? 0,
  };

  const risultato = calcolaProgressione(stato, accuratezzaValutativa);

  await supabase
    .from("user_levels")
    .update({
      livello_corrente: risultato.livello_corrente,
      ultime_accuratezze: risultato.ultime_accuratezze,
      sessioni_sotto_60_consecutive: risultato.sessioni_sotto_60_consecutive,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("categoria_id", categoriaId);

  return { evento: risultato.evento, livelloNuovo: risultato.livello_corrente };
}

// ─── Dashboard data (home page) ───────────────────────────────────────────────

export async function fetchProgressiSettimanali(userId: string): Promise<ProgressoGiorno[]> {
  const supabase = createClient();

  // Lunedì della settimana corrente
  const now = new Date();
  const daysFromMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("sessioni")
    .select("created_at, categoria_id")
    .eq("user_id", userId)
    .gte("created_at", monday.toISOString());

  const GIORNI_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return GIORNI_IT.map((giorno, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const daySessions = (data ?? []).filter((s) =>
      new Date(s.created_at as string).toISOString().split("T")[0] === dateStr
    );

    const row: ProgressoGiorno = {
      giorno, esercizi: daySessions.length,
      memoria: 0, attenzione: 0, linguaggio: 0, esecutive: 0, visuospaziali: 0,
    };
    for (const s of daySessions) {
      const cat = s.categoria_id as string;
      if (cat && cat in row) (row as unknown as Record<string, number>)[cat]++;
    }
    return row;
  });
}

export async function fetchSessioniRecenti(userId: string): Promise<SessioneRecente[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessioni")
    .select("esercizio_id, categoria_id, score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!data || data.length === 0) return [];

  const oggi = new Date().toISOString().split("T")[0];
  const ieri = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Recupera nomi (nuovo schema: campo "nome" invece di "titolo")
  const ids = Array.from(new Set(data.map((s) => s.esercizio_id as string).filter(Boolean)));
  const { data: eInfo } = await supabase.from("esercizi").select("id, nome").in("id", ids);
  const nomi = Object.fromEntries((eInfo ?? []).map((e) => [e.id as string, e.nome as string]));

  return data.map((s, i) => {
    const sessionDate = new Date(s.created_at as string).toISOString().split("T")[0];
    const dataStr = sessionDate === oggi ? "Oggi" : sessionDate === ieri ? "Ieri"
      : `${Math.floor((Date.now() - new Date(s.created_at as string).getTime()) / 86400000)} giorni fa`;

    const prevScore = i < data.length - 1 ? (data[i + 1].score as number ?? 0) : (s.score as number ?? 0);
    const score = s.score as number ?? 0;
    const trend: "crescita" | "stabile" | "calo" = score > prevScore ? "crescita" : score < prevScore ? "calo" : "stabile";

    return {
      titolo: nomi[s.esercizio_id as string] ?? (s.esercizio_id as string) ?? "Esercizio",
      categoria: NOMI_CAT[s.categoria_id as string] ?? (s.categoria_id as string) ?? "",
      score,
      data: dataStr,
      icona: ICONE_CAT[s.categoria_id as string] ?? "brain",
      trend,
    };
  });
}

// ─── Messaggi ────────────────────────────────────────────────────────────────

export async function fetchMessaggi(userId: string): Promise<MessaggioReale[]> {
  const supabase = createClient();

  const oggi = new Date().toISOString().split("T")[0];
  const ieri = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const MESI_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  const { data, error } = await supabase
    .from("messaggi")
    .select("id, testo, letto, created_at, familiari!messaggi_familiare_id_fkey(nome, relazione)")
    .eq("destinatario_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => {
    const dateStr = new Date(row.created_at as string).toISOString().split("T")[0];
    let dataFormattata: string;
    if (dateStr === oggi) dataFormattata = "Oggi";
    else if (dateStr === ieri) dataFormattata = "Ieri";
    else {
      const d = new Date(row.created_at as string);
      dataFormattata = `${d.getDate()} ${MESI_IT[d.getMonth()]}`;
    }

    const familiare = Array.isArray(row.familiari) ? row.familiari[0] : row.familiari;
    return {
      id: row.id as string,
      mittente: (familiare?.nome ?? "") as string,
      relazione: (familiare?.relazione ?? "") as string,
      data: dataFormattata,
      testo: row.testo as string,
      letto: row.letto as boolean,
    };
  });
}

export async function segnaMessaggioLetto(messaggioId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("messaggi")
    .update({ letto: true })
    .eq("id", messaggioId);
}

// ─── Dati progressi (pagina progressi) ───────────────────────────────────────

export async function fetchDatiProgressi(userId: string): Promise<{
  scoreCategorie: ScoreCategoria[];
  storicoSessioni: StoricoGiorno[];
  totaleSettimanaScorsa: number;
  progressiSettimanali: ProgressoGiorno[];
}> {
  const supabase = createClient();

  const trenta = new Date();
  trenta.setDate(trenta.getDate() - 30);

  const [
    { data: sessions },
    { data: levels },
    { data: sessSettScorsa },
  ] = await Promise.all([
    supabase
      .from("sessioni")
      .select("esercizio_id, categoria_id, score, created_at")
      .eq("user_id", userId)
      .gte("created_at", trenta.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("user_levels")
      .select("categoria_id, livello_corrente")
      .eq("user_id", userId),
    supabase
      .from("sessioni")
      .select("created_at, categoria_id")
      .eq("user_id", userId)
      .gte("created_at", (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString(); })())
      .lt("created_at", (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString(); })()),
  ]);

  const livelloMap = Object.fromEntries((levels ?? []).map((l) => [l.categoria_id as string, l.livello_corrente as number]));

  // Calcola giorni-sessione completi (5/5 categorie in un giorno) negli ultimi 30 giorni
  const daysCatMap: Record<string, Set<string>> = {};
  for (const s of (sessions ?? [])) {
    const day = new Date(s.created_at as string).toISOString().split("T")[0];
    if (!daysCatMap[day]) daysCatMap[day] = new Set();
    daysCatMap[day].add(s.categoria_id as string);
  }
  const completeDays = Object.keys(daysCatMap).filter((day) =>
    CATEGORIE_ORDER.every((cat) => daysCatMap[day].has(cat))
  );

  // Calcola giorni-sessione completi nella settimana precedente
  const prevDaysCatMap: Record<string, Set<string>> = {};
  for (const s of (sessSettScorsa ?? [])) {
    const day = new Date(s.created_at as string).toISOString().split("T")[0];
    if (!prevDaysCatMap[day]) prevDaysCatMap[day] = new Set();
    prevDaysCatMap[day].add(s.categoria_id as string);
  }
  const totaleSettimanaScorsa = Object.keys(prevDaysCatMap).filter((day) =>
    CATEGORIE_ORDER.every((cat) => prevDaysCatMap[day].has(cat))
  ).length;

  // Score categorie
  const scoreCategorie: ScoreCategoria[] = CATEGORIE_ORDER.map((cat) => {
    const catSessions = (sessions ?? []).filter((s) => s.categoria_id === cat);
    const score = catSessions.length > 0
      ? Math.round(catSessions.reduce((sum, s) => sum + (s.score as number ?? 0), 0) / catSessions.length)
      : 0;
    const livello = livelloMap[cat] ?? 1;

    // Trend: confronto ultimi 7 vs precedenti 7
    const now = Date.now();
    const ultimi7 = catSessions.filter((s) => Date.now() - new Date(s.created_at as string).getTime() < 7 * 86400000);
    const prec7 = catSessions.filter((s) => {
      const age = (now - new Date(s.created_at as string).getTime()) / 86400000;
      return age >= 7 && age < 14;
    });
    const avgUltimi = ultimi7.length > 0 ? ultimi7.reduce((sum, s) => sum + (s.score as number ?? 0), 0) / ultimi7.length : score;
    const avgPrec = prec7.length > 0 ? prec7.reduce((sum, s) => sum + (s.score as number ?? 0), 0) / prec7.length : avgUltimi;
    const trend: "crescita" | "stabile" | "calo" = avgUltimi > avgPrec + 2 ? "crescita" : avgUltimi < avgPrec - 2 ? "calo" : "stabile";

    // Storico score: raggruppa per giorno
    const MESI_SHORT_SYNC = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    const byDay: Record<string, number[]> = {};
    for (const s of catSessions) {
      const d = new Date(s.created_at as string);
      const day = `${d.getDate()} ${MESI_SHORT_SYNC[d.getMonth()]}`;
      (byDay[day] = byDay[day] ?? []).push(s.score as number ?? 0);
    }
    const storico = Object.entries(byDay).map(([label, scores]) => ({
      label,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    return {
      categoria: NOMI_CAT[cat] ?? cat,
      icona: ICONE_CAT[cat] ?? "brain",
      colore: COLORI_CAT[cat] ?? "#2563EB",
      score,
      trend,
      livello,
      sessioni: completeDays.length,
      descrizione: `${NOMI_CAT[cat] ?? cat} al ${score}%`,
      storico,
      storicoLivello: storico.length > 0
        ? storico.map((s) => ({ label: s.label, livello }))
        : [{ label: "Oggi", livello }],
    };
  });

  // Storico per giorno (ultimi 30 giorni)
  const giornoMap: Record<string, StoricoGiorno["sessioni"]> = {};
  for (const s of (sessions ?? [])) {
    const day = new Date(s.created_at as string).toISOString().split("T")[0];
    (giornoMap[day] = giornoMap[day] ?? []).push({
      nome_esercizio: s.esercizio_id as string ?? "Esercizio",
      categoria: NOMI_CAT[s.categoria_id as string] ?? (s.categoria_id as string) ?? "",
      icona: ICONE_CAT[s.categoria_id as string] ?? "brain",
      livello: 1,
      score: s.score as number ?? 0,
    });
  }
  const storicoSessioni: StoricoGiorno[] = Object.entries(giornoMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, sessioni]) => ({ data, sessioni }));

  // Progressi settimanali (riusa la funzione)
  const progressiSettimanali = await fetchProgressiSettimanali(userId);

  return {
    scoreCategorie,
    storicoSessioni,
    totaleSettimanaScorsa: totaleSettimanaScorsa ?? 0,
    progressiSettimanali,
  };
}

/**
 * Trend per dominio cognitivo, calcolato confrontando le due sessioni più
 * recenti DELLO STESSO dominio. Diversamente da fetchSessioniRecenti (ultime 6
 * sessioni globali), garantisce che ogni dominio abbia il proprio trend anche
 * quando non rientra nelle sessioni più recenti in assoluto.
 *
 * Ritorna una mappa keyed per slug categoria (es. "esecutive"). Le categorie
 * senza sessioni non compaiono nella mappa.
 */
export async function fetchTrendCategorie(userId: string): Promise<Record<string, TrendCategoria>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessioni")
    .select("categoria_id, score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const result: Record<string, TrendCategoria> = {};
  if (!data) return result;

  for (const cat of CATEGORIE_ORDER) {
    const catSessions = data.filter((s) => s.categoria_id === cat);
    if (catSessions.length === 0) continue;
    const latest = (catSessions[0].score as number) ?? 0;
    const prev = catSessions.length > 1 ? ((catSessions[1].score as number) ?? 0) : latest;
    result[cat] = latest > prev ? "crescita" : latest < prev ? "calo" : "stabile";
  }
  return result;
}

// ─── Inviti familiari ─────────────────────────────────────────────────────────

/**
 * Persiste le modifiche al profilo dell'utente sulla tabella users.
 * Solo i campi forniti vengono aggiornati.
 */
export async function salvaProfilo(
  userId: string,
  updates: { nome?: string; telefono?: string; email?: string },
): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, string | null> = {};
  if (updates.nome !== undefined) patch.nome = updates.nome;
  if (updates.telefono !== undefined) patch.telefono = updates.telefono || null;
  if (updates.email !== undefined) patch.email = updates.email || null;
  if (Object.keys(patch).length === 0) return;
  await supabase.from("users").update(patch).eq("id", userId);
}

/**
 * Familiari collegati al senior. La riga in `familiari` viene creata dalla RPC
 * get_familiare_dashboard quando il familiare apre la dashboard via token; qui
 * il senior (autenticato) li legge tramite la policy RLS "Familiari: read own".
 */
export async function fetchFamiliari(userId: string): Promise<FamiliareRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("familiari")
    .select("id, nome, relazione, telefono, collegato_at, permessi")
    .eq("user_id", userId)
    .order("collegato_at", { ascending: false });

  return (data ?? []).map((f) => ({
    id: f.id as string,
    nome: f.nome as string,
    relazione: f.relazione as string,
    telefono: (f.telefono ?? "") as string,
    collegato_at: f.collegato_at as string,
    permessi: (f.permessi as FamiliareRecord["permessi"]) ?? { attivita: true, medaglie: true, progressi: true },
  }));
}

/**
 * Rimuove un familiare collegato e invalida i relativi link d'invito.
 *
 * Delega all'API route /api/familiari/rimuovi che usa la service_role per
 * marcare gli inviti come 'expired' (operazione bloccata dalla RLS lato client),
 * così il link di accesso via token smette di funzionare: la RPC
 * get_familiare_dashboard scarta gli inviti con status = 'expired'.
 *
 * @returns true se l'operazione lato server è andata a buon fine.
 */
export async function eliminaFamiliare(familiareId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/familiari/rimuovi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familiareId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function creaInvito({
  userId, nome, relazione, contatto = "",
}: {
  userId: string; nome: string; relazione: string; contatto?: string;
}): Promise<string> {
  const supabase = createClient();
  const token = Math.random().toString(36).slice(2, 10).toUpperCase() +
                Math.random().toString(36).slice(2, 10).toUpperCase();
  await supabase.from("inviti").insert({
    token,
    mittente_id: userId,
    nome_destinatario: nome,
    contatto,
    relazione,
    status: "pending",
  });
  return token;
}

// ─── Familiare (accesso via token, senza auth) ────────────────────────────────

export interface FamiliareDashboard {
  senior: { nome: string; genere: "M" | "F" | null; current_streak: number };
  invito: { relazione: string; nome_destinatario: string };
  familiare_id: string;
  esercizi_oggi: Array<{ esercizio_id: string; categoria_id: string; completato: boolean }>;
  sessioni_recenti: Array<{ categoria_id: string; score: number; created_at: string }>;
  messaggi_inviati: Array<{ id: string; testo: string; letto: boolean; created_at: string; categoria: string }>;
  error?: string;
}

export async function fetchFamiliareDashboard(token: string): Promise<FamiliareDashboard | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_familiare_dashboard", { p_token: token });
  if (error || !data || data.error) return null;
  return data as FamiliareDashboard;
}

export async function inviaMessaggioFamiliare(token: string, testo: string, categoria: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("invia_messaggio_familiare", {
    p_token: token,
    p_testo: testo,
    p_categoria: categoria,
  });
  if (error || !data?.success) return false;
  return true;
}

// ─── Helpers per page.tsx (mount iniziale) ────────────────────────────────────

/**
 * Restituisce i dati dell'esercizio dato il suo id, oppure null se non
 * esiste o è inattivo. Page.tsx chiama questa al mount per validare
 * l'URL parameter [id] e ottenere nome + categoria_id.
 */
export async function fetchEsercizioById(
  esercizioId: string,
): Promise<{ id: string; nome: string; categoria_id: string } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("esercizi")
    .select("id, nome, categoria_id")
    .eq("id", esercizioId)
    .eq("attivo", true)
    .limit(1)
    .single();

  if (!data) return null;
  return {
    id: data.id as string,
    nome: data.nome as string,
    categoria_id: data.categoria_id as string,
  };
}

/**
 * Restituisce tutti gli esercizi attivi appartenenti a un dominio, ordinati
 * per ordine_in_famiglia. Usata dalla libreria esercizi per popolare la lista
 * "Altri esercizi" della tab corrente.
 */
export async function fetchEserciziAttiviPerCategoria(
  categoriaId: string,
): Promise<Array<{ id: string; nome: string; categoria_id: string; session_timer_sec: number | null }>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("esercizi")
    .select("id, nome, categoria_id, session_timer_sec")
    .eq("categoria_id", categoriaId)
    .eq("attivo", true)
    .order("ordine_in_famiglia", { ascending: true });

  return (data ?? []).map((e) => ({
    id: e.id as string,
    nome: e.nome as string,
    categoria_id: e.categoria_id as string,
    session_timer_sec: (e.session_timer_sec as number | null) ?? null,
  }));
}

/**
 * Conta le sessioni completate dall'utente per questo esercizio.
 * Usata da page.tsx per calcolare mostraTutorial = (count === 0).
 * Include anche sessioni storiche pre-migration (livello NULL):
 * se l'utente ha già visto l'esercizio sotto qualsiasi schema, non
 * mostriamo il tutorial.
 */
export async function contaSessioniPerEsercizio(
  userId: string,
  esercizioId: string,
): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("sessioni")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("esercizio_id", esercizioId)
    .eq("completato", true);

  return count ?? 0;
}
