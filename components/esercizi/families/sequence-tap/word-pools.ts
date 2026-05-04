/**
 * components/esercizi/families/sequence-tap/word-pools.ts
 *
 * Pool parole per Parole Forward (4–6 char) e Parole Backward (per lunghezza 3–7).
 * Criteri: nomi concreti, frequenza fondamentale (FO), senza caratteri accentati,
 * senza nomi propri, monosillabici o parolacce.
 */

/** Pool per Parole Forward — 100+ parole, 4–6 caratteri. */
export const POOL_PAROLE_FORWARD: readonly string[] = [
  // 4 caratteri
  "CANE", "PANE", "LUNA", "CASA", "SOLE", "MARE", "MELA", "ROSA", "LUCE", "MANO",
  "NASO", "TOPO", "ORSO", "RANA", "SALE", "VASO", "LAGO", "MURO", "RETE", "DITO",
  "CODA", "RAMO", "FILO", "NEVE", "ALBA", "GELO", "PALO", "NOCE", "SETA", "LANA",
  "TELA", "VELA", "ERBA", "ONDA", "SERA", "ARIA", "FICO", "PINO", "DADO", "FARO",
  // 5 caratteri
  "GATTO", "CARRO", "PORTA", "SCALA", "LIBRO", "PONTE", "FIUME", "BOSCO", "CAMPO",
  "TERRA", "BORSA", "NOTTE", "PENNA", "TORTA", "TRENO", "VENTO", "ZUCCA", "PASTA",
  "PIZZA", "BURRO", "CARNE", "PESCE", "RUOTA", "FORNO", "PIEDE", "TAZZA", "SPADA",
  "POLSO", "DONNA", "GONNA", "BIRRA", "PROVA", "QUOTA", "RADIO", "FORZA",
  // 6 caratteri
  "ALBERO", "CAVOLO", "GRILLO", "NEBBIA", "PANINO", "PATATA", "PIANTA", "RADICE",
  "SABBIA", "STELLA", "TAVOLO", "CANALE", "FOGLIO", "GELATO", "LIMONE", "MELONE",
  "PAVONE", "REGALO", "SCARPA", "SEDANO", "TORCIA", "SAPONE", "RICCIO", "PRANZO",
  "TESORO", "USCITA", "SPALLA", "PAGINA", "FIANCO", "COTONE", "BANANA", "CAROTA",
  "FRUTTO", "MAIALE", "ORTICA",
];

/**
 * Pool per Parole Backward — indicizzato per lunghezza parola (3–7).
 * Stessi criteri + esclusione caratteri accentati (tastiera alfabetica).
 */
export const POOL_PAROLE_BACKWARD: Readonly<Record<number, readonly string[]>> = {
  3: [
    "OCA", "UVA", "BUE", "ORO", "AGO", "BOA", "GAS", "BUS", "BAR",
    "ZIO", "RIO", "ECO", "FAX", "GEL", "PUB",
  ],
  4: [
    "CANE", "PANE", "LUNA", "CASA", "SOLE", "MARE", "MELA", "ROSA", "LUCE", "MANO",
    "NASO", "TOPO", "ORSO", "RANA", "SALE", "VASO", "LAGO", "MURO", "RETE", "DITO",
  ],
  5: [
    "GATTO", "CARRO", "PORTA", "SCALA", "LIBRO", "PONTE", "FIUME", "BOSCO", "CAMPO",
    "TERRA", "BORSA", "NOTTE", "PENNA", "TORTA", "TRENO", "VENTO", "ZUCCA", "PASTA",
    "PIZZA", "BURRO",
  ],
  6: [
    "ALBERO", "CAVOLO", "GRILLO", "NEBBIA", "PANINO", "PATATA", "PIANTA", "RADICE",
    "SABBIA", "STELLA", "TAVOLO", "CANALE", "FOGLIO", "GELATO", "LIMONE", "MELONE",
    "PAVONE", "REGALO", "SCARPA", "SEDANO",
  ],
  7: [
    "ANIMALE", "BOTTONE", "CANDELA", "CAVALLO", "COLLANA", "CORTILE", "CUSCINO",
    "FAGIOLO", "FONTANA", "FORESTA", "GIRAFFA", "LAMPADA", "MOSCONE", "PALLONE",
    "STIVALE", "TAMBURO", "UCCELLO", "VALIGIA", "VASSOIO", "VESTITO",
  ],
};
