import { ALIMENTI, type Alimento } from "./levels";

export interface StimoloSpesa {
  lista:           Alimento[];   // da memorizzare
  scaffale:        Alimento[];   // lista + distrattori, mescolati
  esposizioneMs:   number;
  shoppingTimerMs: number | null;
}

export interface RispostaSpesa {
  selezionati: string[]; // id alimenti toccati nello scaffale
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SpesaPoolRef {
  /** Set degli id alimenti già usati come "lista" in trial precedenti
   *  della stessa sessione (evita ripetizioni). */
  visti: Set<string>;
}

export function creaSpesaPoolRef(): SpesaPoolRef {
  return { visti: new Set() };
}

export function generaStimoloSpesa(
  nLista:          number,
  nScaffale:       number,
  esposizioneMs:   number,
  shoppingTimerMs: number | null,
  poolRef:         SpesaPoolRef,
  rng:             () => number,
): StimoloSpesa {
  // Lista: cerca prima alimenti non già visti.
  const fresh   = ALIMENTI.filter(a => !poolRef.visti.has(a.id));
  const ordered = shuffle(fresh.length >= nLista ? fresh : [...ALIMENTI], rng);
  const lista   = ordered.slice(0, nLista);
  lista.forEach(a => poolRef.visti.add(a.id));

  // Distrattori: dal resto del catalogo.
  const listaIds = new Set(lista.map(a => a.id));
  const rest     = ALIMENTI.filter(a => !listaIds.has(a.id));
  const nDistr   = Math.max(0, nScaffale - lista.length);
  const distr    = shuffle(rest, rng).slice(0, nDistr);

  const scaffale = shuffle([...lista, ...distr], rng);
  return { lista, scaffale, esposizioneMs, shoppingTimerMs };
}
