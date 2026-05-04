/**
 * components/esercizi/families/memoria-prospettica/sequence.ts
 *
 * Genera il trial ibrido MP: stream di parole semantico + finestre temporali.
 *
 * Task ongoing: parole estratte da una coppia semantica scorrono a ISI fisso.
 *   L'utente tocca il bottone "✓ {etichetta}" sui target (paroleGo).
 * Task prospettico: finestre temporali schedulate ogni intervalS secondi.
 *   L'utente tocca "Ricordami" entro la finestra di tolleranza.
 *
 * Le coppie semantiche sono definite qui (no cross-import da go-nogo-semantico)
 * per mantenere le famiglie self-contained.
 */

import type { MPHybridLevelConfig, DistanzaCategorie } from "./levels";

// ── Coppia semantica ───────────────────────────────────────────────────────────

export interface CoppiaSemantica {
  readonly etichetta:  string;
  readonly paroleGo:   readonly string[];
  readonly paroleNogo: readonly string[];
}

// ── Tipi esportati ────────────────────────────────────────────────────────────

export type StimoloMP = {
  /** ID posizionale 0-based. */
  id:    number;
  parola: string;
  /** true = parola target (paroleGo) da tappare. */
  isGo:  boolean;
};

export type TrialMPHybrid = {
  coppia:          CoppiaSemantica;
  sequenza:        StimoloMP[];
  /** Istanti target (ms da inizio Fase 2): [interval×1, ..., interval×nWindows]. */
  intervalliMs:    number[];
  /** Tolleranza ± in ms entro cui il tap "Ricordami" è accettato. */
  toleranceMs:     number;
  durationMs:      number;
  nWindows:        number;
  distractorISIMs: number;
};

export type RispostaMP = {
  finestreTotali:           number;
  finestreCorrette:         number;
  ricordamiFalsiTap:        number;
  distrattoriTargetTotali:  number;
  distrattoriTargetTappati: number;
  distrattoriFalsiTap:      number;
};

// ── Costanti ──────────────────────────────────────────────────────────────────

/** Quota di stimoli Go nello stream (50% target / 50% non-target). */
export const QUOTA_GO = 0.5;

// ── Coppie semantiche per distanza ────────────────────────────────────────────

const COPPIE_DISTANTE: readonly CoppiaSemantica[] = [
  {
    etichetta: "Animali",
    paroleGo:  ["cane", "gatto", "leone", "aquila", "rana", "orso", "tigre", "lupo", "cervo", "volpe", "topo", "coniglio", "capra", "pecora", "mucca"],
    paroleNogo:["sedia", "tavolo", "lampada", "porta", "finestra", "cuscino", "tappeto", "specchio", "scaffale", "armadio", "forbici", "martello", "chiave", "bottone", "moneta"],
  },
  {
    etichetta: "Cibi",
    paroleGo:  ["pane", "pasta", "riso", "carne", "pesce", "uovo", "mela", "pera", "pollo", "insalata", "carota", "formaggio", "latte", "burro", "pizza"],
    paroleNogo:["treno", "aereo", "nave", "moto", "bus", "camion", "bici", "taxi", "tram", "elicottero", "metro", "furgone", "carro", "scooter", "yacht"],
  },
  {
    etichetta: "Sport",
    paroleGo:  ["calcio", "tennis", "nuoto", "corsa", "ciclismo", "boxe", "golf", "sci", "rugby", "pallavolo", "basket", "judo", "karate", "vela", "tiro"],
    paroleNogo:["medico", "avvocato", "pilota", "cuoco", "insegnante", "ingegnere", "muratore", "chimico", "fisico", "dentista", "infermiere", "notaio", "farmacista", "architetto", "magistrato"],
  },
];

const COPPIE_MODERATA: readonly CoppiaSemantica[] = [
  {
    etichetta: "Animali domestici",
    paroleGo:  ["cane", "gatto", "coniglio", "criceto", "pappagallo", "tartaruga", "cavia", "canarino", "cincillà", "furretto"],
    paroleNogo:["leone", "tigre", "orso", "lupo", "volpe", "giaguaro", "leopardo", "rinoceronte", "gorilla", "zebra"],
  },
  {
    etichetta: "Frutti",
    paroleGo:  ["mela", "pera", "uva", "kiwi", "mango", "fragola", "pesca", "prugna", "ciliegia", "fico", "banana", "arancia", "limone", "melone", "albicocca"],
    paroleNogo:["carota", "zucchina", "melanzana", "pomodoro", "sedano", "cipolla", "aglio", "broccoli", "cavolo", "spinaci", "lattuga", "rucola", "finocchio", "porro", "ravanello"],
  },
  {
    etichetta: "Mobili",
    paroleGo:  ["sedia", "tavolo", "letto", "armadio", "divano", "libreria", "comodino", "scrivania", "poltrona", "cassettiera", "panca", "consolle", "vetrina", "sgabello", "dondolo"],
    paroleNogo:["frigorifero", "lavatrice", "forno", "lavastoviglie", "microonde", "televisore", "aspirapolvere", "asciugatrice", "bollitore", "tostapane", "frullatore", "condizionatore", "stufa", "ventilatore", "ferro"],
  },
];

const COPPIE_VICINA: readonly CoppiaSemantica[] = [
  {
    etichetta: "Sport individuali",
    paroleGo:  ["nuoto", "tennis", "golf", "boxe", "judo", "karate", "sci", "atletica", "ginnastica", "ciclismo", "equitazione", "scherma", "tiro", "surf", "triathlon"],
    paroleNogo:["calcio", "basket", "pallavolo", "rugby", "hockey", "baseball", "polo", "pallanuoto", "handball", "cricket", "curling", "softball", "lacrosse", "remo", "waterpolo"],
  },
  {
    etichetta: "Professioni sanitarie",
    paroleGo:  ["medico", "infermiere", "dentista", "farmacista", "psicologo", "chirurgo", "veterinario", "fisioterapista", "radiologo", "pediatra"],
    paroleNogo:["ingegnere", "architetto", "muratore", "elettricista", "idraulico", "falegname", "meccanico", "saldatore", "geometra", "tecnico"],
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function pickCoppia(distanza: DistanzaCategorie, rng: () => number): CoppiaSemantica {
  const pool =
    distanza === "distante" ? COPPIE_DISTANTE
    : distanza === "moderata" ? COPPIE_MODERATA
    : COPPIE_VICINA;
  return pool[Math.floor(rng() * pool.length)];
}

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── generaTrialMPHybrid ───────────────────────────────────────────────────────

/**
 * Genera il trial ibrido: sequenza di parole + finestre temporali.
 *
 * @param level  Configurazione livello da getMPHybridLevel.
 * @param rng    RNG iniettabile (Math.random in produzione, deterministica nei test).
 */
export function generaTrialMPHybrid(
  level: MPHybridLevelConfig,
  rng: () => number,
): TrialMPHybrid {
  const coppia = pickCoppia(level.distanzaCategorie, rng);
  const nStimoli = Math.ceil(level.durationMs / level.distractorISIMs);

  const goPool   = shuffled(coppia.paroleGo, rng);
  const nogoPool = shuffled(coppia.paroleNogo, rng);

  const sequenza: StimoloMP[] = [];
  let goIdx = 0, nogoIdx = 0;
  for (let i = 0; i < nStimoli; i++) {
    const isGo = rng() < QUOTA_GO;
    const parola = isGo
      ? goPool[goIdx++ % goPool.length]
      : nogoPool[nogoIdx++ % nogoPool.length];
    sequenza.push({ id: i, parola, isGo });
  }

  const intervalMs   = level.intervalS * 1000;
  const intervalliMs = Array.from({ length: level.nWindows }, (_, i) => intervalMs * (i + 1));

  return {
    coppia,
    sequenza,
    intervalliMs,
    toleranceMs:     level.toleranceS * 1000,
    durationMs:      level.durationMs,
    nWindows:        level.nWindows,
    distractorISIMs: level.distractorISIMs,
  };
}
