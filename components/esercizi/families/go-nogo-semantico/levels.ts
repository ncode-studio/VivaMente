/**
 * Livelli Go/No-Go Semantico (esercizio_id: go_nogo_semantico).
 *
 * Dominio cognitivo: Linguaggio + Funzioni Esecutive — accesso lessicale +
 * inibizione della risposta su categoria semantica.
 *
 * Progressione per distanza semantica tra categoria target e distrattori:
 *   Lv  1-5 : categorie molto distanti (Animali vs Oggetti di casa)
 *   Lv  6-10: categorie moderate      (Animali domestici vs selvatici)
 *   Lv 11-15: categorie vicine        (Mammiferi vs Rettili)
 *   Lv 16-20: massima difficoltà      (proprietà astratte)
 *
 * Timer sessione: 60s fisso (Modello A — stessa deroga del cromatico).
 * T.Lim più alto del cromatico: leggere + classificare > percepire un colore.
 */

// ── Coppia semantica ───────────────────────────────────────────────────────────

/**
 * Una coppia semantica definisce la regola di sessione:
 * - `etichetta`: mostrata in header ("Tocca solo gli [Animali]")
 * - `paroleGo`:  parole target che l'utente deve toccare
 * - `paroleNogo`: parole distrattore che l'utente deve ignorare
 */
export interface CoppiaSemantica {
  readonly etichetta:  string;
  readonly paroleGo:   readonly string[];
  readonly paroleNogo: readonly string[];
}

// ── Configurazione livello ─────────────────────────────────────────────────────

export interface GoNogoSemanticoLevelConfig {
  livello:        number;
  tLimMs:         number;
  coppieAmmesse:  readonly CoppiaSemantica[];
}

// ── Dataset coppie semantiche ──────────────────────────────────────────────────
//
// Regola: paroleNogo devono essere della stessa lunghezza/frequenza
// delle paroleGo per evitare bias percettivi (una parola molto rara
// o molto lunga sarebbe "strana" indipendentemente dalla categoria).

// — Lv 1-5: distanza massima —

const ANIMALI_VS_OGGETTI: CoppiaSemantica = {
  etichetta: "Animali",
  paroleGo:  ["cane", "gatto", "leone", "aquila", "rana", "orso", "tigre", "lupo", "cervo", "volpe", "topo", "coniglio", "capra", "pecora", "mucca", "cavallo", "elefante", "giraffa", "scimmia", "delfino"],
  paroleNogo:["sedia", "tavolo", "lampada", "porta", "finestra", "cuscino", "tappeto", "specchio", "scaffale", "armadio", "forbici", "martello", "chiave", "bottone", "moneta", "orologio", "borsa", "libro", "penna", "vaso"],
};

const CIBI_VS_VEICOLI: CoppiaSemantica = {
  etichetta: "Cibi",
  paroleGo:  ["pane", "pasta", "riso", "carne", "pesce", "uovo", "mela", "pera", "pollo", "insalata", "carota", "formaggio", "latte", "burro", "pizza", "patata", "fagioli", "tonno", "salmone", "farina"],
  paroleNogo:["treno", "aereo", "nave", "moto", "bus", "camion", "bici", "taxi", "tram", "elicottero", "monopattino", "yacht", "ferry", "metro", "furgone", "carro", "jeep", "scooter", "imbarcazione", "carrello"],
};

const FRUTTI_VS_STRUMENTI: CoppiaSemantica = {
  etichetta: "Frutti",
  paroleGo:  ["mela", "pera", "uva", "mango", "fico", "lime", "kiwi", "prugna", "ciliegia", "banana", "arancia", "limone", "fragola", "pesca", "melone", "albicocca", "ananas", "papaya", "cocco", "melograno"],
  paroleNogo:["martello", "chiodo", "pinza", "sega", "filo", "vite", "livella", "trapano", "scalpello", "morsetto", "lima", "squadra", "pialla", "grimaldello", "leva", "cacciavite", "metro", "spatola", "coltello", "uncino"],
};

const SPORT_VS_PROFESSIONI: CoppiaSemantica = {
  etichetta: "Sport",
  paroleGo:  ["calcio", "tennis", "nuoto", "corsa", "ciclismo", "boxe", "golf", "sci", "rugby", "pallavolo", "basket", "judo", "karate", "vela", "tiro", "ginnastica", "atletica", "equitazione", "surf", "scherma"],
  paroleNogo:["medico", "avvocato", "pilota", "cuoco", "insegnante", "ingegnere", "muratore", "chimico", "fisico", "dentista", "infermiere", "notaio", "farmacista", "architetto", "magistrato", "psicologo", "geografo", "biologo", "agronomo", "veterinario"],
};

const COLORI_VS_NUMERI: CoppiaSemantica = {
  etichetta: "Colori",
  paroleGo:  ["rosso", "blu", "verde", "giallo", "viola", "arancio", "nero", "bianco", "grigio", "marrone", "azzurro", "beige", "rosa", "indaco", "turchese", "ocra", "magenta", "cremisi", "avorio", "bronzo"],
  paroleNogo:["uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "tredici", "venti", "trenta", "cento", "mille", "zero", "mezzo", "doppio"],
};

// — Lv 6-10: distanza moderata —

const ANIMALI_DOMESTICI_VS_SELVATICI: CoppiaSemantica = {
  etichetta: "Animali domestici",
  paroleGo:  ["cane", "gatto", "coniglio", "criceto", "pappagallo", "tartaruga", "pesce", "topo", "cavia", "canarino", "cincillà", "furretto", "iguana", "serpente", "rana", "cockatiel", "labrador", "persiano", "siamese", "beagle"],
  paroleNogo:["leone", "tigre", "orso", "lupo", "volpe", "giaguaro", "leopardo", "rinoceronte", "ippopotamo", "elefante", "gorilla", "scimmia", "zebra", "bisonte", "alce", "lince", "ghepardo", "iene", "mangusta", "coyote"],
};

const FRUTTI_VS_VERDURE: CoppiaSemantica = {
  etichetta: "Frutti",
  paroleGo:  ["mela", "pera", "uva", "kiwi", "mango", "fragola", "pesca", "prugna", "ciliegia", "fico", "banana", "arancia", "limone", "melone", "albicocca", "papaya", "cocco", "ribes", "mora", "lampone"],
  paroleNogo:["carota", "zucchina", "melanzana", "pomodoro", "sedano", "cipolla", "aglio", "broccoli", "cavolo", "spinaci", "lattuga", "rucola", "finocchio", "porro", "ravanello", "barbabietola", "carciofo", "asparago", "zucca", "peperone"],
};

const MOBILI_VS_ELETTRODOMESTICI: CoppiaSemantica = {
  etichetta: "Mobili",
  paroleGo:  ["sedia", "tavolo", "letto", "armadio", "divano", "libreria", "comodino", "scrivania", "poltrona", "cassettiera", "panca", "specchiera", "credenza", "canterano", "ottomana", "consolle", "vetrina", "buffet", "sgabello", "dondolo"],
  paroleNogo:["frigorifero", "lavatrice", "forno", "lavastoviglie", "microonde", "televisore", "aspirapolvere", "asciugatrice", "lavello", "bollitore", "tostapane", "frullatore", "robot", "condizionatore", "stufa", "ventilatore", "ferro", "macchina", "freezer", "phon"],
};

const PROFESSIONI_SANITARIE_VS_TECNICHE: CoppiaSemantica = {
  etichetta: "Professioni sanitarie",
  paroleGo:  ["medico", "infermiere", "dentista", "farmacista", "psicologo", "chirurgo", "veterinario", "ostetrica", "fisioterapista", "radiologo", "otorinolaringoiatra", "pediatra", "cardiologo", "ginecologo", "ortopedico", "anestesista", "oculista", "dermatologo", "reumatologo", "ematologo"],
  paroleNogo:["ingegnere", "architetto", "muratore", "elettricista", "idraulico", "falegname", "meccanico", "saldatore", "geometra", "tecnico", "operatore", "programmatore", "costruttore", "carrozziere", "tornitore", "fresatore", "gruista", "ponteggiatore", "cablatore", "installatore"],
};

const SPORT_INDIVIDUALI_VS_SQUADRA: CoppiaSemantica = {
  etichetta: "Sport individuali",
  paroleGo:  ["nuoto", "tennis", "golf", "boxe", "judo", "karate", "sci", "atletica", "ginnastica", "ciclismo", "equitazione", "scherma", "tiro", "surf", "arrampicata", "triathlon", "canottaggio", "sollevamento", "lotta", "taekwondo"],
  paroleNogo:["calcio", "basket", "pallavolo", "rugby", "hockey", "baseball", "polo", "pallanuoto", "dodgeball", "handball", "cricket", "lacrosse", "curling", "bob", "rowing", "waterpolo", "softball", "ultimate", "cabestan", "remo"],
};

// ── Tabella livelli ────────────────────────────────────────────────────────────

export const GO_NOGO_SEMANTICO_LEVELS: readonly GoNogoSemanticoLevelConfig[] = [
  // lv 1-5: distanza massima, T.Lim ampio
  { livello:  1, tLimMs: 2000, coppieAmmesse: [ANIMALI_VS_OGGETTI,             CIBI_VS_VEICOLI]                   },
  { livello:  2, tLimMs: 1900, coppieAmmesse: [ANIMALI_VS_OGGETTI,             FRUTTI_VS_STRUMENTI]               },
  { livello:  3, tLimMs: 1800, coppieAmmesse: [CIBI_VS_VEICOLI,                SPORT_VS_PROFESSIONI]              },
  { livello:  4, tLimMs: 1700, coppieAmmesse: [FRUTTI_VS_STRUMENTI,            COLORI_VS_NUMERI]                  },
  { livello:  5, tLimMs: 1600, coppieAmmesse: [SPORT_VS_PROFESSIONI,           COLORI_VS_NUMERI]                  },
  // lv 6-10: distanza moderata
  { livello:  6, tLimMs: 1500, coppieAmmesse: [ANIMALI_DOMESTICI_VS_SELVATICI, FRUTTI_VS_VERDURE]                 },
  { livello:  7, tLimMs: 1400, coppieAmmesse: [FRUTTI_VS_VERDURE,              MOBILI_VS_ELETTRODOMESTICI]        },
  { livello:  8, tLimMs: 1300, coppieAmmesse: [MOBILI_VS_ELETTRODOMESTICI,     PROFESSIONI_SANITARIE_VS_TECNICHE] },
  { livello:  9, tLimMs: 1200, coppieAmmesse: [PROFESSIONI_SANITARIE_VS_TECNICHE, SPORT_INDIVIDUALI_VS_SQUADRA]  },
  { livello: 10, tLimMs: 1100, coppieAmmesse: [ANIMALI_DOMESTICI_VS_SELVATICI, SPORT_INDIVIDUALI_VS_SQUADRA]      },
] as const;

export function getGoNogoSemanticoLevel(livello: number): GoNogoSemanticoLevelConfig {
  const clamped = Math.min(10, Math.max(1, livello));
  return GO_NOGO_SEMANTICO_LEVELS[clamped - 1];
}
