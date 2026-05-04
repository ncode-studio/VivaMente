/**
 * components/esercizi/families/memoria-prospettica/sequence.ts
 *
 * Genera il trial ibrido MP: stream di parole semantico + finestre temporali.
 *
 * Regola: nessuna parola si ripete nella sessione. La generazione avviene
 * senza rimpiazzo: le parole go e nogo sono mescolate separatamente, poi
 * interleaved casualmente. I pool hanno ≥28 parole per coprire il caso
 * peggiore (lv 6-7: ceil(150000/2800) = 54 stimoli → ~27 go + 27 nogo).
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
  id:    number;
  parola: string;
  isGo:  boolean;
};

export type TrialMPHybrid = {
  coppia:          CoppiaSemantica;
  sequenza:        StimoloMP[];
  intervalliMs:    number[];
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

export const QUOTA_GO = 0.5;

// ── Coppie semantiche — pool ≥28 parole per lato ─────────────────────────────

const COPPIE_DISTANTE: readonly CoppiaSemantica[] = [
  {
    etichetta: "Animali",
    paroleGo:  ["cane", "gatto", "leone", "aquila", "rana", "orso", "tigre", "lupo", "cervo", "volpe", "topo", "coniglio", "capra", "pecora", "mucca", "cavallo", "elefante", "scimmia", "delfino", "pinguino", "zebra", "gufo", "cigno", "tartaruga", "serpente", "lepre", "riccio", "falco"],
    paroleNogo:["sedia", "tavolo", "lampada", "porta", "finestra", "cuscino", "tappeto", "specchio", "scaffale", "armadio", "forbici", "martello", "chiave", "orologio", "borsa", "libro", "penna", "vaso", "tazza", "piatto", "forchetta", "cucchiaio", "pentola", "padella", "bicchiere", "coperta", "candela", "ombrello"],
  },
  {
    etichetta: "Cibi",
    paroleGo:  ["pane", "pasta", "riso", "carne", "pesce", "uovo", "mela", "pera", "pollo", "insalata", "carota", "formaggio", "latte", "burro", "pizza", "patata", "fagioli", "tonno", "salmone", "zucchero", "olio", "sale", "prosciutto", "mozzarella", "ricotta", "polenta", "biscotto", "gelato"],
    paroleNogo:["treno", "aereo", "nave", "moto", "bus", "camion", "bici", "taxi", "tram", "elicottero", "metro", "furgone", "scooter", "yacht", "jeep", "monopattino", "motoscafo", "canoa", "kayak", "autocarro", "pullman", "gondola", "carrozza", "fuoristrada", "ciclomotore", "tandem", "razzo", "sottomarino"],
  },
  {
    etichetta: "Sport",
    paroleGo:  ["calcio", "tennis", "nuoto", "corsa", "ciclismo", "boxe", "golf", "sci", "rugby", "pallavolo", "basket", "judo", "karate", "vela", "tiro", "ginnastica", "atletica", "equitazione", "surf", "scherma", "pattinaggio", "arrampicata", "triathlon", "sollevamento", "lotta", "taekwondo", "canottaggio", "biathlon"],
    paroleNogo:["medico", "avvocato", "pilota", "cuoco", "insegnante", "ingegnere", "muratore", "chimico", "fisico", "dentista", "infermiere", "notaio", "farmacista", "architetto", "magistrato", "psicologo", "geografo", "biologo", "agronomo", "veterinario", "pompiere", "poliziotto", "vigile", "giudice", "diplomatico", "astronomo", "geologo", "filosofo"],
  },
];

const COPPIE_MODERATA: readonly CoppiaSemantica[] = [
  {
    etichetta: "Animali domestici",
    paroleGo:  ["cane", "gatto", "coniglio", "criceto", "pappagallo", "tartaruga", "cavia", "canarino", "cincillà", "furretto", "iguana", "labrador", "cocker", "barboncino", "siamese", "persiano", "beagle", "carlino", "bulldog", "chihuahua", "husky", "golden", "setter", "boxer", "volpino", "maltese", "pastore", "bassotto"],
    paroleNogo:["leone", "tigre", "orso", "lupo", "volpe", "giaguaro", "leopardo", "rinoceronte", "gorilla", "zebra", "bisonte", "alce", "lince", "ghepardo", "iene", "mangusta", "coyote", "bufalo", "gnu", "tapiro", "opossum", "lemure", "puma", "gibbone", "babbuino", "facocero", "orice", "wombat"],
  },
  {
    etichetta: "Frutti",
    paroleGo:  ["mela", "pera", "uva", "kiwi", "mango", "fragola", "pesca", "prugna", "ciliegia", "fico", "banana", "arancia", "limone", "melone", "albicocca", "papaya", "cocco", "ribes", "mora", "lampone", "ananas", "cocomero", "mandarino", "pompelmo", "dattero", "avocado", "melograno", "clementina"],
    paroleNogo:["carota", "zucchina", "melanzana", "pomodoro", "sedano", "cipolla", "aglio", "broccoli", "cavolo", "spinaci", "lattuga", "rucola", "finocchio", "porro", "ravanello", "barbabietola", "carciofo", "asparago", "zucca", "peperone", "cetriolo", "cavolfiore", "piselli", "fave", "bieta", "cicoria", "verza", "topinambur"],
  },
  {
    etichetta: "Mobili",
    paroleGo:  ["sedia", "tavolo", "letto", "armadio", "divano", "libreria", "comodino", "scrivania", "poltrona", "cassettiera", "panca", "consolle", "vetrina", "sgabello", "dondolo", "credenza", "canterano", "buffet", "specchiera", "toeletta", "guardaroba", "mensola", "cassapanca", "tavolino", "divanetto", "poggiapiedi", "appendiabiti", "scaffale"],
    paroleNogo:["frigorifero", "lavatrice", "forno", "lavastoviglie", "microonde", "televisore", "aspirapolvere", "asciugatrice", "bollitore", "tostapane", "frullatore", "condizionatore", "stufa", "ventilatore", "ferro", "phon", "freezer", "robot", "impastatrice", "centrifuga", "gelatiera", "vaporiera", "affettatrice", "piastra", "deumidificatore", "radiatore", "purificatore", "igienizzatore"],
  },
];

const COPPIE_VICINA: readonly CoppiaSemantica[] = [
  {
    etichetta: "Sport individuali",
    paroleGo:  ["nuoto", "tennis", "golf", "boxe", "judo", "karate", "sci", "atletica", "ginnastica", "ciclismo", "equitazione", "scherma", "tiro", "surf", "triathlon", "canottaggio", "sollevamento", "lotta", "taekwondo", "pattinaggio", "arrampicata", "biathlon", "maratona", "pentathlon", "fioretto", "bob", "trampolino", "volteggio"],
    paroleNogo:["calcio", "basket", "pallavolo", "rugby", "hockey", "baseball", "polo", "pallanuoto", "handball", "cricket", "curling", "softball", "lacrosse", "waterpolo", "dodgeball", "netball", "frisbee", "tamburello", "futsal", "floorball", "pelota", "bocce", "cheerleading", "kabaddi", "korfball", "petanque", "shinty", "sepak"],
  },
  {
    etichetta: "Professioni sanitarie",
    paroleGo:  ["medico", "infermiere", "dentista", "farmacista", "psicologo", "chirurgo", "veterinario", "fisioterapista", "radiologo", "pediatra", "cardiologo", "ginecologo", "ortopedico", "anestesista", "oculista", "dermatologo", "reumatologo", "ematologo", "oncologo", "nefrologo", "urologo", "neurologo", "endocrinologo", "immunologo", "patologo", "allergologo", "gastroenterologo", "pneumologo"],
    paroleNogo:["ingegnere", "architetto", "muratore", "elettricista", "idraulico", "falegname", "meccanico", "saldatore", "geometra", "tecnico", "programmatore", "costruttore", "carrozziere", "tornitore", "fresatore", "gruista", "ponteggiatore", "cablatore", "installatore", "operatore", "manutentore", "riparatore", "assemblatore", "collaudatore", "progettista", "disegnatore", "pianificatore", "calibratore"],
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
 * Genera il trial ibrido senza ripetizione di parole.
 *
 * Algoritmo:
 *   1. Calcola nGo e nNogo dal numero totale di stimoli richiesti.
 *   2. Pesca esattamente nGo parole dal pool go (senza rimpiazzo) e nNogo
 *      dal pool nogo (senza rimpiazzo).
 *   3. Interleave i due insiemi casualmente → sequenza finale.
 *
 * Se un pool è più piccolo del necessario (non dovrebbe accadere con pool ≥28
 * e i parametri attuali), usa quante parole disponibili e la sessione risulta
 * leggermente più breve.
 */
export function generaTrialMPHybrid(
  level: MPHybridLevelConfig,
  rng: () => number,
): TrialMPHybrid {
  const coppia  = pickCoppia(level.distanzaCategorie, rng);
  const nStimoli = Math.ceil(level.durationMs / level.distractorISIMs);

  const goPool   = shuffled(coppia.paroleGo,   rng);
  const nogoPool = shuffled(coppia.paroleNogo, rng);

  const nGo   = Math.min(Math.round(nStimoli * QUOTA_GO), goPool.length);
  const nNogo = Math.min(nStimoli - nGo, nogoPool.length);

  const items = shuffled(
    [
      ...goPool.slice(0, nGo).map((p) => ({ parola: p, isGo: true  as const })),
      ...nogoPool.slice(0, nNogo).map((p) => ({ parola: p, isGo: false as const })),
    ],
    rng,
  );

  const sequenza: StimoloMP[] = items.map((item, i) => ({
    id: i,
    parola: item.parola,
    isGo:   item.isGo,
  }));

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
