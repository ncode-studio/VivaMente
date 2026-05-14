/**
 * components/esercizi/families/updating-wm/items.ts
 *
 * Pool item per Updating WM Parole.
 * 60 item con metadati dimensione, peso, prezzo (tutti 1–10).
 * Calibrati per utente 60+ italiano (oggetti concreti, noti).
 *
 * Scale:
 *   dimensione: 1 = microscopico         … 10 = enormissimo
 *   peso:       1 = imponderabile        … 10 = pesantissimo
 *   prezzo:     1 = senza valore di mercato … 10 = costosissimo
 */

export interface UWMItem {
  id:         string;
  emoji:      string;
  parola:     string;
  dimensione: number; // 1-10
  peso:       number; // 1-10
  prezzo:     number; // 1-10
}

export const UWM_ITEMS: readonly UWMItem[] = [
  // ── Minuscoli (dim 1–2) ───────────────────────────────────────────────────
  { id: "formica",     emoji: "🐜", parola: "Formica",     dimensione: 1,  peso: 1,  prezzo: 1  },
  { id: "moneta",      emoji: "🪙", parola: "Moneta",      dimensione: 1,  peso: 2,  prezzo: 2  },
  { id: "fiore",       emoji: "🌸", parola: "Fiore",       dimensione: 2,  peso: 1,  prezzo: 3  },
  { id: "matita",      emoji: "✏️", parola: "Matita",      dimensione: 2,  peso: 1,  prezzo: 2  },
  { id: "fragola",     emoji: "🍓", parola: "Fragola",     dimensione: 2,  peso: 1,  prezzo: 1  },
  { id: "uovo",        emoji: "🥚", parola: "Uovo",        dimensione: 2,  peso: 2,  prezzo: 1  },
  { id: "telefono",    emoji: "📱", parola: "Telefono",    dimensione: 2,  peso: 2,  prezzo: 5  },

  // ── Piccoli (dim 3–4) ─────────────────────────────────────────────────────
  { id: "limone",      emoji: "🍋", parola: "Limone",      dimensione: 3,  peso: 2,  prezzo: 1  },
  { id: "mela",        emoji: "🍎", parola: "Mela",        dimensione: 3,  peso: 2,  prezzo: 1  },
  { id: "scarpa",      emoji: "👟", parola: "Scarpa",      dimensione: 3,  peso: 2,  prezzo: 3  },
  { id: "coniglio",    emoji: "🐇", parola: "Coniglio",    dimensione: 3,  peso: 3,  prezzo: 3  },
  { id: "libro",       emoji: "📚", parola: "Libro",       dimensione: 3,  peso: 3,  prezzo: 3  },
  { id: "gatto",       emoji: "🐱", parola: "Gatto",       dimensione: 3,  peso: 4,  prezzo: 2  },
  { id: "zaino",       emoji: "🎒", parola: "Zaino",       dimensione: 3,  peso: 4,  prezzo: 3  },
  { id: "ombrello",    emoji: "☂️", parola: "Ombrello",    dimensione: 4,  peso: 2,  prezzo: 3  },
  { id: "pallone",     emoji: "🏀", parola: "Pallone",     dimensione: 4,  peso: 2,  prezzo: 2  },
  { id: "computer",    emoji: "💻", parola: "Computer",    dimensione: 4,  peso: 3,  prezzo: 6  },
  { id: "cane",        emoji: "🐕", parola: "Cane",        dimensione: 4,  peso: 4,  prezzo: 4  },
  { id: "chitarra",    emoji: "🎸", parola: "Chitarra",    dimensione: 5,  peso: 4,  prezzo: 5  },
  { id: "maiale",      emoji: "🐖", parola: "Maiale",      dimensione: 4,  peso: 5,  prezzo: 4  },

  // ── Medi (dim 5–6) ────────────────────────────────────────────────────────
  { id: "sedia",       emoji: "🪑", parola: "Sedia",       dimensione: 4,  peso: 5,  prezzo: 3  },
  { id: "roccia",      emoji: "🪨", parola: "Roccia",      dimensione: 4,  peso: 8,  prezzo: 1  },
  { id: "pecora",      emoji: "🐑", parola: "Pecora",      dimensione: 5,  peso: 5,  prezzo: 4  },
  { id: "valigia",     emoji: "🧳", parola: "Valigia",     dimensione: 5,  peso: 5,  prezzo: 4  },
  { id: "tenda",       emoji: "⛺", parola: "Tenda",       dimensione: 6,  peso: 5,  prezzo: 5  },
  { id: "bicicletta",  emoji: "🚲", parola: "Bicicletta",  dimensione: 6,  peso: 6,  prezzo: 5  },
  { id: "vasca",       emoji: "🛁", parola: "Vasca",       dimensione: 6,  peso: 8,  prezzo: 4  },
  { id: "motorino",    emoji: "🛵", parola: "Motorino",    dimensione: 6,  peso: 7,  prezzo: 6  },
  { id: "barile",      emoji: "🛢️", parola: "Barile",      dimensione: 4,  peso: 6,  prezzo: 2  },
  { id: "ape",         emoji: "🐝", parola: "Ape",         dimensione: 1,  peso: 1,  prezzo: 1  },
  { id: "lucertola",   emoji: "🦎", parola: "Lucertola",   dimensione: 3,  peso: 2,  prezzo: 1  },
  { id: "pollo",       emoji: "🐔", parola: "Pollo",       dimensione: 3,  peso: 3,  prezzo: 2  },

  // ── Medio-grandi (dim 6–8) ────────────────────────────────────────────────
  { id: "divano",      emoji: "🛋️", parola: "Divano",      dimensione: 7,  peso: 7,  prezzo: 5  },
  { id: "letto",       emoji: "🛏️", parola: "Letto",       dimensione: 7,  peso: 7,  prezzo: 5  },
  { id: "armadio",     emoji: "🗄️", parola: "Armadio",     dimensione: 7,  peso: 7,  prezzo: 6  },
  { id: "pianoforte",  emoji: "🎹", parola: "Pianoforte",  dimensione: 7,  peso: 8,  prezzo: 7  },
  { id: "albero",      emoji: "🌳", parola: "Albero",      dimensione: 7,  peso: 6,  prezzo: 4  },
  { id: "orso",        emoji: "🐻", parola: "Orso",        dimensione: 7,  peso: 7,  prezzo: 2  },
  { id: "leone",       emoji: "🦁", parola: "Leone",       dimensione: 7,  peso: 7,  prezzo: 2  },
  { id: "cavallo",     emoji: "🐎", parola: "Cavallo",     dimensione: 7,  peso: 7,  prezzo: 7  },
  { id: "mucca",       emoji: "🐄", parola: "Mucca",       dimensione: 7,  peso: 8,  prezzo: 5  },
  { id: "barca",       emoji: "⛵", parola: "Barca",       dimensione: 7,  peso: 6,  prezzo: 7  },

  // ── Grandi (dim 8–9) ─────────────────────────────────────────────────────
  { id: "auto",        emoji: "🚗", parola: "Automobile",  dimensione: 7,  peso: 8,  prezzo: 7  },
  { id: "giraffa",     emoji: "🦒", parola: "Giraffa",     dimensione: 8,  peso: 7,  prezzo: 2  },
  { id: "rinoceronte", emoji: "🦏", parola: "Rinoceronte", dimensione: 8,  peso: 10, prezzo: 2  },
  { id: "ippopotamo",  emoji: "🦛", parola: "Ippopotamo",  dimensione: 8,  peso: 10, prezzo: 2  },
  { id: "elicottero",  emoji: "🚁", parola: "Elicottero",  dimensione: 8,  peso: 8,  prezzo: 9  },
  { id: "camion",      emoji: "🚚", parola: "Camion",      dimensione: 8,  peso: 9,  prezzo: 8  },
  { id: "autobus",     emoji: "🚌", parola: "Autobus",     dimensione: 8,  peso: 9,  prezzo: 8  },
  { id: "dinosauro",   emoji: "🦕", parola: "Dinosauro",   dimensione: 9,  peso: 9,  prezzo: 2  },
  { id: "elefante",    emoji: "🐘", parola: "Elefante",    dimensione: 9,  peso: 10, prezzo: 3  },

  // ── Enormi (dim 9–10) ────────────────────────────────────────────────────
  { id: "aereo",       emoji: "✈️", parola: "Aereo",       dimensione: 9,  peso: 9,  prezzo: 10 },
  { id: "treno",       emoji: "🚂", parola: "Treno",       dimensione: 9,  peso: 9,  prezzo: 10 },
  { id: "palazzo",     emoji: "🏢", parola: "Palazzo",     dimensione: 9,  peso: 10, prezzo: 9  },
  { id: "casa",        emoji: "🏠", parola: "Casa",        dimensione: 9,  peso: 10, prezzo: 8  },
  { id: "nave",        emoji: "🚢", parola: "Nave",        dimensione: 10, peso: 10, prezzo: 10 },
  { id: "balena",      emoji: "🐋", parola: "Balena",      dimensione: 10, peso: 10, prezzo: 1  },
  { id: "montagna",    emoji: "🏔️", parola: "Montagna",    dimensione: 10, peso: 10, prezzo: 1  },
  { id: "piramide",    emoji: "🔺", parola: "Piramide",    dimensione: 9,  peso: 10, prezzo: 2  },
];
