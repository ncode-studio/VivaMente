/**
 * components/esercizi/families/associative-memory/items.ts
 *
 * Pool di 58 item concreti italiani con parola + emoji + categoria.
 * Usato per generare coppie semanticamente NON correlate (A e B da categorie diverse).
 */

export interface AMItem {
  id:        string;
  parola:    string;
  emoji:     string;
  categoria: string;
}

export const AM_ITEMS: readonly AMItem[] = [
  // animali (8)
  { id: "aquila",     parola: "Aquila",     emoji: "🦅", categoria: "animali" },
  { id: "orso",       parola: "Orso",       emoji: "🐻", categoria: "animali" },
  { id: "delfino",    parola: "Delfino",    emoji: "🐬", categoria: "animali" },
  { id: "pinguino",   parola: "Pinguino",   emoji: "🐧", categoria: "animali" },
  { id: "gufo",       parola: "Gufo",       emoji: "🦉", categoria: "animali" },
  { id: "farfalla",   parola: "Farfalla",   emoji: "🦋", categoria: "animali" },
  { id: "volpe",      parola: "Volpe",      emoji: "🦊", categoria: "animali" },
  { id: "giraffa",    parola: "Giraffa",    emoji: "🦒", categoria: "animali" },

  // frutta (7)
  { id: "anguria",    parola: "Anguria",    emoji: "🍉", categoria: "frutta"  },
  { id: "banana",     parola: "Banana",     emoji: "🍌", categoria: "frutta"  },
  { id: "fragola",    parola: "Fragola",    emoji: "🍓", categoria: "frutta"  },
  { id: "uva",        parola: "Uva",        emoji: "🍇", categoria: "frutta"  },
  { id: "ananas",     parola: "Ananas",     emoji: "🍍", categoria: "frutta"  },
  { id: "limone",     parola: "Limone",     emoji: "🍋", categoria: "frutta"  },
  { id: "mela",       parola: "Mela",       emoji: "🍎", categoria: "frutta"  },

  // cibi (8)
  { id: "pizza",      parola: "Pizza",      emoji: "🍕", categoria: "cibi"    },
  { id: "sushi",      parola: "Sushi",      emoji: "🍣", categoria: "cibi"    },
  { id: "hamburger",  parola: "Hamburger",  emoji: "🍔", categoria: "cibi"    },
  { id: "gelato",     parola: "Gelato",     emoji: "🍦", categoria: "cibi"    },
  { id: "torta",      parola: "Torta",      emoji: "🎂", categoria: "cibi"    },
  { id: "caffe",      parola: "Caffè",      emoji: "☕", categoria: "cibi"    },
  { id: "formaggio",  parola: "Formaggio",  emoji: "🧀", categoria: "cibi"    },
  { id: "pasta",      parola: "Pasta",      emoji: "🍝", categoria: "cibi"    },

  // natura (7)
  { id: "montagna",   parola: "Montagna",   emoji: "⛰️", categoria: "natura"  },
  { id: "vulcano",    parola: "Vulcano",    emoji: "🌋", categoria: "natura"  },
  { id: "albero",     parola: "Albero",     emoji: "🌳", categoria: "natura"  },
  { id: "fiore",      parola: "Fiore",      emoji: "🌸", categoria: "natura"  },
  { id: "fungo",      parola: "Fungo",      emoji: "🍄", categoria: "natura"  },
  { id: "sole",       parola: "Sole",       emoji: "☀️", categoria: "natura"  },
  { id: "luna",       parola: "Luna",       emoji: "🌙", categoria: "natura"  },

  // oggetti (8)
  { id: "chiave",     parola: "Chiave",     emoji: "🔑", categoria: "oggetti" },
  { id: "ombrello",   parola: "Ombrello",   emoji: "☂️", categoria: "oggetti" },
  { id: "orologio",   parola: "Orologio",   emoji: "⌚", categoria: "oggetti" },
  { id: "telefono",   parola: "Telefono",   emoji: "📱", categoria: "oggetti" },
  { id: "libro",      parola: "Libro",      emoji: "📚", categoria: "oggetti" },
  { id: "lampada",    parola: "Lampada",    emoji: "💡", categoria: "oggetti" },
  { id: "busta",      parola: "Busta",      emoji: "✉️", categoria: "oggetti" },
  { id: "pallone",    parola: "Pallone",    emoji: "⚽", categoria: "oggetti" },

  // veicoli (6)
  { id: "treno",      parola: "Treno",      emoji: "🚂", categoria: "veicoli" },
  { id: "aereo",      parola: "Aereo",      emoji: "✈️", categoria: "veicoli" },
  { id: "nave",       parola: "Nave",       emoji: "🚢", categoria: "veicoli" },
  { id: "bici",       parola: "Bicicletta", emoji: "🚲", categoria: "veicoli" },
  { id: "moto",       parola: "Moto",       emoji: "🏍️", categoria: "veicoli" },
  { id: "elicottero", parola: "Elicottero", emoji: "🚁", categoria: "veicoli" },

  // luoghi (7)
  { id: "spiaggia",   parola: "Spiaggia",   emoji: "🏖️", categoria: "luoghi"  },
  { id: "castello",   parola: "Castello",   emoji: "🏰", categoria: "luoghi"  },
  { id: "chiesa",     parola: "Chiesa",     emoji: "⛪", categoria: "luoghi"  },
  { id: "faro",       parola: "Faro",       emoji: "🗼", categoria: "luoghi"  },
  { id: "tenda",      parola: "Tenda",      emoji: "⛺", categoria: "luoghi"  },
  { id: "ospedale",   parola: "Ospedale",   emoji: "🏥", categoria: "luoghi"  },
  { id: "stadio",     parola: "Stadio",     emoji: "🏟️", categoria: "luoghi"  },

  // attività (7)
  { id: "musica",     parola: "Musica",     emoji: "🎵", categoria: "attività" },
  { id: "cinema",     parola: "Cinema",     emoji: "🎬", categoria: "attività" },
  { id: "pittura",    parola: "Pittura",    emoji: "🎨", categoria: "attività" },
  { id: "scienza",    parola: "Scienza",    emoji: "🔬", categoria: "attività" },
  { id: "sport",      parola: "Sport",      emoji: "🏆", categoria: "attività" },
  { id: "gioco",      parola: "Gioco",      emoji: "🎮", categoria: "attività" },
  { id: "foto",       parola: "Fotografia", emoji: "📷", categoria: "attività" },
];
