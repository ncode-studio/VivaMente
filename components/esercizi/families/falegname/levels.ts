/**
 * "Il Falegname" — rotazione mentale di pezzi di legno sagomati.
 *
 * Famiglia visuospaziale. Modello A (timer di sessione 60s).
 *
 * Progressione 10 livelli:
 *   L1–L4 : rotazione 2D nel piano (un asse), angoli via via più "ostili"
 *   L5–L6 : introduce la 3ª dimensione (vista prospettica con rotazione 3D)
 *   L7    : compare il distrattore SPECCHIATO oltre a quelli ruotati
 *   L8–L9 : oggetti complessi con parti asimmetriche + specchio + 3D
 *   L10   : combinazione massima — rotazione 3D + specchio + distrattori
 *           dello stesso gruppo semantico, T.Lim più stringente
 *
 * T.Lim per trial: cala da 10s (L1) a 5s (L10) per mantenere pressione
 * temporale crescente. Combinato col timer 60s di sessione, l'utente fa
 * tra 6 e 12 trial per sessione a seconda della velocità e del livello.
 */

export interface FalegnameLevelConfig {
  livello:          number;
  /** Tempo limite per singolo trial (ms). */
  tLimMs:           number;
  /** 2 = solo rotazione nel piano XY; 3 = rotazione con prospettiva 3D. */
  dimensioni:       2 | 3;
  /** Massimo angolo di rotazione applicato a target/opzioni (in gradi). */
  angoloMax:        number;
  /** Se true, un distrattore è il target specchiato (scaleX(-1)). */
  conSpecchio:      boolean;
  /** Se true, distrattori dallo stesso gruppo semantico del target. */
  stessoGruppo:     boolean;
  /**
   * Quante delle 3 opzioni-distrattore sono VARIANTI del target (stesso
   * oggetto ma con piccole modifiche, es. manico più corto). I rimanenti
   * distrattori sono altri oggetti (dal gruppo se stessoGruppo).
   *   0 = nessuna variante (L1–L2)
   *   1 = un near-miss del target (L3–L8)
   *   2 = due near-miss (L9–L10, scenario "tutti simili")
   */
  numVarianti:      0 | 1 | 2;
  /**
   * Bande di complessità delle sagome ammesse per il TARGET di questo livello.
   *   [1]       = solo lettere intagliate (R, F, G, J, L, P)
   *   [2]       = solo utensili (chiave, martello, accetta, cacciavite)
   *   [3]       = solo lame/animali (sega, falce, pesce, gatto, …)
   *   [1, 2]    = mix livelli iniziali
   *   [2, 3]    = mix livelli intermedi
   *   [1, 2, 3] = tutto il catalogo (solo L8+ per massima varietà)
   * Garantisce che ogni livello abbia il suo "mondo visivo" caratteristico.
   */
  bandeComplessita: readonly (1 | 2 | 3)[];
  /** Etichetta UX per badge "livello". */
  etichetta:        string;
}

/** Modello A: timer di sessione fisso 60s. */
export const SESSION_TIMER_MS = 60_000;

/** Floor T.Lim per micro-progressione (non scendere mai sotto). */
export const FLOOR_TLIM_FALEGNAME = 3500;

export const FALEGNAME_LEVELS: readonly FalegnameLevelConfig[] = [
  // L1–L2: solo lettere intagliate — Cooper & Shepard, paradigma "puro"
  { livello:  1, tLimMs:  7000, dimensioni: 2, angoloMax:  90, conSpecchio: false, stessoGruppo: false, numVarianti: 0, bandeComplessita: [1],       etichetta: "Lettere · 90°"   },
  { livello:  2, tLimMs:  6500, dimensioni: 2, angoloMax: 135, conSpecchio: false, stessoGruppo: false, numVarianti: 0, bandeComplessita: [1],       etichetta: "Lettere · 135°"  },
  // L3: lettere + introduzione near-miss
  { livello:  3, tLimMs:  8500, dimensioni: 2, angoloMax: 180, conSpecchio: false, stessoGruppo: true,  numVarianti: 1, bandeComplessita: [1],       etichetta: "Near-miss"       },
  // L4: passaggio agli utensili — nuovo mondo visivo
  { livello:  4, tLimMs:  8000, dimensioni: 2, angoloMax: 180, conSpecchio: false, stessoGruppo: true,  numVarianti: 1, bandeComplessita: [2],       etichetta: "Utensili"        },
  // L5: utensili + introduzione prospettiva 3D
  { livello:  5, tLimMs:  8000, dimensioni: 3, angoloMax: 135, conSpecchio: false, stessoGruppo: false, numVarianti: 1, bandeComplessita: [2],       etichetta: "Prospettiva"     },
  // L6: lame e animali — terzo mondo visivo
  { livello:  6, tLimMs:  7000, dimensioni: 3, angoloMax: 180, conSpecchio: false, stessoGruppo: true,  numVarianti: 1, bandeComplessita: [3],       etichetta: "Forme organiche" },
  // L7: lettere + utensili con specchio (mondo "carving" + "bottega")
  { livello:  7, tLimMs:  7000, dimensioni: 3, angoloMax: 180, conSpecchio: true,  stessoGruppo: false, numVarianti: 1, bandeComplessita: [1, 2],    etichetta: "Specchio"        },
  // L8: utensili + lame/natura/animali — apre l'intero catalogo "non-lettere"
  { livello:  8, tLimMs:  6500, dimensioni: 3, angoloMax: 180, conSpecchio: true,  stessoGruppo: true,  numVarianti: 1, bandeComplessita: [2, 3],    etichetta: "Bottega mista"   },
  // L9: tutto il catalogo + 2 near-miss
  { livello:  9, tLimMs:  6000, dimensioni: 3, angoloMax: 180, conSpecchio: true,  stessoGruppo: true,  numVarianti: 2, bandeComplessita: [1, 2, 3], etichetta: "Maestro"         },
  // L10: tutto il catalogo, scenario max, T.Lim più stringente
  { livello: 10, tLimMs:  5000, dimensioni: 3, angoloMax: 180, conSpecchio: true,  stessoGruppo: true,  numVarianti: 2, bandeComplessita: [1, 2, 3], etichetta: "Gran Maestro"    },
];

export function getFalegnameLevel(livello: number): FalegnameLevelConfig {
  const idx = Math.min(10, Math.max(1, livello)) - 1;
  return FALEGNAME_LEVELS[idx];
}
