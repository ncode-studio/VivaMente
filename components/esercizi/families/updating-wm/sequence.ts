/**
 * components/esercizi/families/updating-wm/sequence.ts
 *
 * Tipi stimolo e generatori per Updating WM.
 *   StimoloUWM_PI  — Parole (single o updating multi-round, risposta scritta su QWERTY)
 *   StimoloUWM_N   — Numeri (trasformazione, risposta scritta su tastierino)
 */

import { UWM_ITEMS, type UWMItem } from "./items";
import type {
  UWMProprieta,
  UWMTransform,
  UWMTabALevel,
  UWMTabBLevel,
  UWMModalita,
} from "./levels";

// ── Tipi stimolo ───────────────────────────────────────────────────────────────

export type UWMDirezione = "massimo" | "minimo";

export interface UWMRound {
  items:          UWMItem[];    // stimoli mostrati in questo round
  rispostaAttesa: string;       // vincitore cumulativo fino a questo round (normalizzato)
}

export interface StimoloUWM_PI {
  variante:   "parole";
  modalita:   UWMModalita;
  proprieta:  UWMProprieta;
  direzione:  UWMDirezione;
  domanda:    string;           // mostrata solo nel cue iniziale
  rounds:     UWMRound[];       // 1 round per "single", >=2 per "updating"
  speedMs:    number;
}

export interface StimoloUWM_N {
  variante:       "numeri";
  cifre:          number[];
  trasf:          UWMTransform;
  risultato:      number[];
  rispostaAttesa: string;
  speedMs:        number;
  regola:         string;
}

export type StimoloUWM = StimoloUWM_PI | StimoloUWM_N;

/** Risposte raccolte dalla session.
 *  - PI: una stringa per round (length = rounds.length)
 *  - N: una sola stringa (length = 1) */
export type RispostaUWM = string[] | null;

// ── Normalizzazione per confronto stringhe ────────────────────────────────────

export function normalizzaUWM(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// ── Pool senza ripetizione (PI) ────────────────────────────────────────────────

export interface UWMPoolRef {
  pool:         UWMItem[];      // pool completo, mai modificato
  usedSession:  Set<string>;    // id già usati nella sessione corrente
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function creaUWMPoolRef(_rng: () => number): UWMPoolRef {
  return { pool: [...UWM_ITEMS], usedSession: new Set() };
}

// ── Generatore Parole ──────────────────────────────────────────────────────────

const DOMANDE: Record<UWMProprieta, Record<UWMDirezione, string>> = {
  dimensione: {
    massimo: "Quale era il più GRANDE?",
    minimo:  "Quale era il più PICCOLO?",
  },
  peso: {
    massimo: "Quale era il più PESANTE?",
    minimo:  "Quale era il più LEGGERO?",
  },
  prezzo: {
    massimo: "Quale era il più COSTOSO?",
    minimo:  "Quale era il MENO COSTOSO?",
  },
};

function valoreItem(item: UWMItem, prop: UWMProprieta): number {
  switch (prop) {
    case "dimensione": return item.dimensione;
    case "peso":       return item.peso;
    case "prezzo":     return item.prezzo;
  }
}

function trovaVincitore(items: UWMItem[], prop: UWMProprieta, dir: UWMDirezione): UWMItem | null {
  const vals = items.map((it) => valoreItem(it, prop));
  const target = dir === "massimo" ? Math.max(...vals) : Math.min(...vals);
  const winners = items.filter((it) => valoreItem(it, prop) === target);
  return winners.length === 1 ? winners[0] : null;
}

function pickRandomFromPool(
  poolRef: UWMPoolRef,
  n: number,
  excludeTrial: Set<string>,
  rng: () => number,
): UWMItem[] {
  // 1° tentativo: solo item non usati in sessione e non nel trial corrente
  let eligible = poolRef.pool.filter(
    (it) => !excludeTrial.has(it.id) && !poolRef.usedSession.has(it.id),
  );
  // Se non ce ne sono abbastanza, resetta il tracking di sessione e riprova
  if (eligible.length < n) {
    poolRef.usedSession.clear();
    eligible = poolRef.pool.filter((it) => !excludeTrial.has(it.id));
  }
  // Estrai N item davvero a caso (Fisher-Yates parziale)
  const shuffled = shuffle(eligible, rng);
  const picked   = shuffled.slice(0, n);
  picked.forEach((it) => {
    excludeTrial.add(it.id);
    poolRef.usedSession.add(it.id);
  });
  return picked;
}

export function generaStimoloPIInner(
  level: UWMTabALevel,
  nPerRound: number,
  poolRef: UWMPoolRef,
  rng: () => number,
): StimoloUWM_PI {
  // Proprietà e direzione (fisse per l'intero trial)
  const prop: UWMProprieta =
    level.proprieta[Math.floor(rng() * level.proprieta.length)];
  const dir: UWMDirezione = rng() < 0.5 ? "massimo" : "minimo";

  const rounds: UWMRound[] = [];
  const usedIds = new Set<string>();
  const allItems: UWMItem[] = [];

  for (let r = 0; r < level.nRounds; r++) {
    // Prova fino a 8 tentativi a generare un round con vincitore cumulativo univoco
    let roundItems: UWMItem[] = [];
    let cumWinner: UWMItem | null = null;

    for (let attempt = 0; attempt < 8 && cumWinner === null; attempt++) {
      // Salva stato per ripristino su fallimento
      const savedTrialIds   = new Set(usedIds);
      const savedSessionIds = new Set(poolRef.usedSession);

      roundItems = pickRandomFromPool(poolRef, nPerRound, usedIds, rng);
      const cumulativeItems = [...allItems, ...roundItems];
      cumWinner = trovaVincitore(cumulativeItems, prop, dir);

      if (cumWinner === null) {
        // Ripristina stato e riprova
        usedIds.clear();
        savedTrialIds.forEach((id) => usedIds.add(id));
        poolRef.usedSession.clear();
        savedSessionIds.forEach((id) => poolRef.usedSession.add(id));
      }
    }

    // Fallback: accetta anche con pareggio (usa il primo tra i vincitori)
    if (cumWinner === null) {
      const cumulativeItems = [...allItems, ...roundItems];
      const vals = cumulativeItems.map((it) => valoreItem(it, prop));
      const target = dir === "massimo" ? Math.max(...vals) : Math.min(...vals);
      cumWinner = cumulativeItems.find((it) => valoreItem(it, prop) === target) ?? cumulativeItems[0];
    }

    allItems.push(...roundItems);
    rounds.push({
      items: roundItems,
      rispostaAttesa: normalizzaUWM(cumWinner.parola),
    });
  }

  return {
    variante:  "parole",
    modalita:  level.modalita,
    proprieta: prop,
    direzione: dir,
    domanda:   DOMANDE[prop][dir],
    rounds,
    speedMs:   level.speedMs,
  };
}

// ── Generatore Numeri ──────────────────────────────────────────────────────────

function applica(cifra: number, trasf: UWMTransform): number {
  switch (trasf) {
    case "+1": return cifra + 1;
    case "-1": return cifra - 1;
    case "+2": return cifra + 2;
    case "-2": return cifra - 2;
  }
}

function rangePerTrasf(trasf: UWMTransform): [number, number] {
  switch (trasf) {
    case "+1": return [1, 8]; // risultati 2-9
    case "-1": return [2, 9]; // risultati 1-8
    case "+2": return [1, 7]; // risultati 3-9
    case "-2": return [3, 9]; // risultati 1-7
  }
}

export function generaStimoloN(
  level: UWMTabBLevel,
  nDigits: number,
  trasf: UWMTransform,
  rng: () => number,
): StimoloUWM_N {
  const [min, max] = rangePerTrasf(trasf);
  const cifre: number[] = [];
  for (let i = 0; i < nDigits; i++) {
    cifre.push(min + Math.floor(rng() * (max - min + 1)));
  }
  const risultato = cifre.map((c) => applica(c, trasf));

  const labels: Record<UWMTransform, string> = {
    "+1": "Aggiungi 1 a ogni numero",
    "-1": "Sottrai 1 a ogni numero",
    "+2": "Aggiungi 2 a ogni numero",
    "-2": "Sottrai 2 a ogni numero",
  };

  return {
    variante:       "numeri",
    cifre,
    trasf,
    risultato,
    rispostaAttesa: risultato.join(""),
    speedMs:        level.speedMs,
    regola:         labels[trasf],
  };
}
