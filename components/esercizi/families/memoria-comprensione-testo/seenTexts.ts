/**
 * components/esercizi/families/memoria-comprensione-testo/seenTexts.ts
 *
 * Anti-ripetizione cross-sessione PERSISTENTE per Memoria di Prosa
 * (Memoria e Comprensione del Testo — varianti fattuale, inferenziale, mlt,
 * ordine narrativo).
 *
 * A differenza del pool in-memory (useRef) usato in precedenza — che si
 * azzerava ad ogni refresh — questo modulo salva su localStorage la storia dei
 * testi mostrati, per utente e per "tipo" di esercizio, con il timestamp di
 * presentazione. La selezione del testo prima di ogni trial applica la regola:
 *
 *   1. escludi i testi visti negli ultimi 21 giorni;
 *   2. se il pool risultante è vuoto, escludi solo quelli visti negli ultimi 7;
 *   3. se ancora vuoto, usa i testi meno recenti (seenAt minimo, "il più
 *      vecchio per primo"), scegliendo a caso tra i pari-merito.
 *
 * `tipo` è la chiave di partizione: in VivaMente i testi non hanno sottotipi
 * narrativi/descrittivi/procedurali (sono tutti narrativi), quindi si traccia
 * per variante d'esercizio — "fattuale" | "inferenziale" | "mlt" | "ordine".
 */

const STORAGE_KEY = "vm_mct_seentexts_v1";
const DAY_MS = 86_400_000;
const FINESTRA_PRIMARIA_MS = 21 * DAY_MS;
const FINESTRA_FALLBACK_MS = 7 * DAY_MS;

/** Cap per (utente, tipo): conserva solo le presentazioni più recenti. */
const MAX_ENTRIES_PER_TIPO = 200;

export interface SeenEntry {
  textId: string;
  seenAt: number; // epoch ms
}

/** userKey → tipo → cronologia presentazioni. */
type SeenStore = Record<string, Record<string, SeenEntry[]>>;

function userKey(userId: string | null): string {
  return userId ?? "guest";
}

function caricaStore(): SeenStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SeenStore) : {};
  } catch {
    return {};
  }
}

function salvaStore(store: SeenStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage saturo o non disponibile: ignora silenziosamente.
  }
}

function entriesFor(store: SeenStore, userId: string | null, tipo: string): SeenEntry[] {
  return store[userKey(userId)]?.[tipo] ?? [];
}

/** Mappa textId → seenAt più recente, a partire dalla cronologia. */
function seenAtById(entries: readonly SeenEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) {
    if (!e || typeof e.textId !== "string" || typeof e.seenAt !== "number") continue;
    const prev = m.get(e.textId);
    if (prev === undefined || e.seenAt > prev) m.set(e.textId, e.seenAt);
  }
  return m;
}

/**
 * Seleziona un testo dal pool `candidati` evitando le ripetizioni recenti.
 * Ritorna null solo se `candidati` è vuoto.
 */
export function selezionaTesto<T extends { id: string }>(
  candidati: readonly T[],
  tipo: string,
  userId: string | null,
  now: number,
  rng: () => number,
): T | null {
  if (candidati.length === 0) return null;

  const seen = seenAtById(entriesFor(caricaStore(), userId, tipo));
  // Età dall'ultima presentazione; mai visto = +Infinity (massima priorità).
  const eta = (id: string) => now - (seen.get(id) ?? -Infinity);

  // 1) esclude visti negli ultimi 21 giorni
  let pool = candidati.filter((t) => eta(t.id) >= FINESTRA_PRIMARIA_MS);

  // 2) fallback: esclude solo quelli visti negli ultimi 7 giorni
  if (pool.length === 0) {
    pool = candidati.filter((t) => eta(t.id) >= FINESTRA_FALLBACK_MS);
  }

  // 3) fallback finale: i testi meno recenti (seenAt minimo, "il più vecchio
  //    per primo"); a parità di anzianità si sceglie a caso.
  if (pool.length === 0) {
    let minSeen = Infinity;
    for (const t of candidati) {
      const s = seen.get(t.id) ?? 0;
      if (s < minSeen) minSeen = s;
    }
    pool = candidati.filter((t) => (seen.get(t.id) ?? 0) === minSeen);
  }

  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Registra la presentazione di un testo (persistente). Da chiamare al momento
 * in cui il testo viene mostrato all'utente.
 */
export function registraVisto(
  textId: string,
  tipo: string,
  userId: string | null,
  now: number,
): void {
  const store = caricaStore();
  const uk = userKey(userId);
  if (!store[uk]) store[uk] = {};
  const list = store[uk][tipo] ?? [];
  list.push({ textId, seenAt: now });
  store[uk][tipo] = list.slice(-MAX_ENTRIES_PER_TIPO);
  salvaStore(store);
}

/**
 * Seleziona e registra in un colpo solo. Ritorna il testo scelto (o null se il
 * pool è vuoto). La registrazione immediata fa sì che lo stesso testo non
 * riappaia nei trial successivi della stessa sessione (rientra nella finestra
 * dei 21 giorni).
 */
export function selezionaERegistra<T extends { id: string }>(
  candidati: readonly T[],
  tipo: string,
  userId: string | null,
  now: number,
  rng: () => number,
): T | null {
  const scelto = selezionaTesto(candidati, tipo, userId, now, rng);
  if (scelto) registraVisto(scelto.id, tipo, userId, now);
  return scelto;
}
