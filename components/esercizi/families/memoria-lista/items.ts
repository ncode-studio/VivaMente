/**
 * components/esercizi/families/memoria-lista/items.ts
 *
 * Pool di 80 item concreti italiani con parola + emoji + categoria.
 * Usato per le varianti riconoscimento (parole e immagini).
 * Categorie: animali, frutta, verdura, cibi, bevande,
 *            abbigliamento, natura, oggetti, sport, musica.
 */

export interface MLWordItem {
  id:        string;
  parola:    string;
  emoji:     string;
  categoria: string;
}

export const ML_ITEMS: readonly MLWordItem[] = [
  // animali (12)
  { id: "gatto",       parola: "Gatto",       emoji: "🐱", categoria: "animali" },
  { id: "cane",        parola: "Cane",        emoji: "🐶", categoria: "animali" },
  { id: "coniglio",    parola: "Coniglio",    emoji: "🐰", categoria: "animali" },
  { id: "mucca",       parola: "Mucca",       emoji: "🐄", categoria: "animali" },
  { id: "maiale",      parola: "Maiale",      emoji: "🐷", categoria: "animali" },
  { id: "pecora",      parola: "Pecora",      emoji: "🐑", categoria: "animali" },
  { id: "gallina",     parola: "Gallina",     emoji: "🐔", categoria: "animali" },
  { id: "cavallo",     parola: "Cavallo",     emoji: "🐴", categoria: "animali" },
  { id: "pesce",       parola: "Pesce",       emoji: "🐟", categoria: "animali" },
  { id: "uccello",     parola: "Uccello",     emoji: "🐦", categoria: "animali" },
  { id: "farfalla",    parola: "Farfalla",    emoji: "🦋", categoria: "animali" },
  { id: "lumaca",      parola: "Lumaca",      emoji: "🐌", categoria: "animali" },

  // frutta (10)
  { id: "mela",        parola: "Mela",        emoji: "🍎", categoria: "frutta" },
  { id: "arancia",     parola: "Arancia",     emoji: "🍊", categoria: "frutta" },
  { id: "banana",      parola: "Banana",      emoji: "🍌", categoria: "frutta" },
  { id: "fragola",     parola: "Fragola",     emoji: "🍓", categoria: "frutta" },
  { id: "uva",         parola: "Uva",         emoji: "🍇", categoria: "frutta" },
  { id: "pesca",       parola: "Pesca",       emoji: "🍑", categoria: "frutta" },
  { id: "ciliegia",    parola: "Ciliegia",    emoji: "🍒", categoria: "frutta" },
  { id: "anguria",     parola: "Anguria",     emoji: "🍉", categoria: "frutta" },
  { id: "limone",      parola: "Limone",      emoji: "🍋", categoria: "frutta" },
  { id: "pera",        parola: "Pera",        emoji: "🍐", categoria: "frutta" },

  // verdura (8)
  { id: "carota",      parola: "Carota",      emoji: "🥕", categoria: "verdura" },
  { id: "pomodoro",    parola: "Pomodoro",    emoji: "🍅", categoria: "verdura" },
  { id: "melanzana",   parola: "Melanzana",   emoji: "🍆", categoria: "verdura" },
  { id: "mais",        parola: "Mais",        emoji: "🌽", categoria: "verdura" },
  { id: "broccolo",    parola: "Broccolo",    emoji: "🥦", categoria: "verdura" },
  { id: "cipolla",     parola: "Cipolla",     emoji: "🧅", categoria: "verdura" },
  { id: "peperone",    parola: "Peperone",    emoji: "🌶️", categoria: "verdura" },
  { id: "fungo",       parola: "Fungo",       emoji: "🍄", categoria: "verdura" },

  // cibi (8)
  { id: "pizza",       parola: "Pizza",       emoji: "🍕", categoria: "cibi" },
  { id: "pane",        parola: "Pane",        emoji: "🍞", categoria: "cibi" },
  { id: "formaggio",   parola: "Formaggio",   emoji: "🧀", categoria: "cibi" },
  { id: "uovo",        parola: "Uovo",        emoji: "🥚", categoria: "cibi" },
  { id: "gelato",      parola: "Gelato",      emoji: "🍦", categoria: "cibi" },
  { id: "torta",       parola: "Torta",       emoji: "🎂", categoria: "cibi" },
  { id: "biscotto",    parola: "Biscotto",    emoji: "🍪", categoria: "cibi" },
  { id: "hamburger",   parola: "Hamburger",   emoji: "🍔", categoria: "cibi" },

  // bevande (5)
  { id: "caffe",       parola: "Caffè",       emoji: "☕", categoria: "bevande" },
  { id: "vino",        parola: "Vino",        emoji: "🍷", categoria: "bevande" },
  { id: "birra",       parola: "Birra",       emoji: "🍺", categoria: "bevande" },
  { id: "latte",       parola: "Latte",       emoji: "🥛", categoria: "bevande" },
  { id: "te",          parola: "Tè",          emoji: "🍵", categoria: "bevande" },

  // abbigliamento (8)
  { id: "cappello",    parola: "Cappello",    emoji: "🎩", categoria: "abbigliamento" },
  { id: "scarpa",      parola: "Scarpa",      emoji: "👟", categoria: "abbigliamento" },
  { id: "borsa",       parola: "Borsa",       emoji: "👜", categoria: "abbigliamento" },
  { id: "guanto",      parola: "Guanto",      emoji: "🧤", categoria: "abbigliamento" },
  { id: "occhiali",    parola: "Occhiali",    emoji: "👓", categoria: "abbigliamento" },
  { id: "sciarpa",     parola: "Sciarpa",     emoji: "🧣", categoria: "abbigliamento" },
  { id: "anello",      parola: "Anello",      emoji: "💍", categoria: "abbigliamento" },
  { id: "orologio",    parola: "Orologio",    emoji: "⌚", categoria: "abbigliamento" },

  // natura (8)
  { id: "albero",      parola: "Albero",      emoji: "🌳", categoria: "natura" },
  { id: "fiore",       parola: "Fiore",       emoji: "🌸", categoria: "natura" },
  { id: "sole",        parola: "Sole",        emoji: "☀️", categoria: "natura" },
  { id: "luna",        parola: "Luna",        emoji: "🌙", categoria: "natura" },
  { id: "montagna",    parola: "Montagna",    emoji: "⛰️", categoria: "natura" },
  { id: "mare",        parola: "Mare",        emoji: "🌊", categoria: "natura" },
  { id: "neve",        parola: "Neve",        emoji: "❄️", categoria: "natura" },
  { id: "foglia",      parola: "Foglia",      emoji: "🍃", categoria: "natura" },

  // oggetti (8)
  { id: "chiave",      parola: "Chiave",      emoji: "🔑", categoria: "oggetti" },
  { id: "lampada",     parola: "Lampada",     emoji: "💡", categoria: "oggetti" },
  { id: "libro",       parola: "Libro",       emoji: "📚", categoria: "oggetti" },
  { id: "telefono",    parola: "Telefono",    emoji: "📱", categoria: "oggetti" },
  { id: "televisione", parola: "Televisione", emoji: "📺", categoria: "oggetti" },
  { id: "forbici",     parola: "Forbici",     emoji: "✂️", categoria: "oggetti" },
  { id: "matita",      parola: "Matita",      emoji: "✏️", categoria: "oggetti" },
  { id: "busta",       parola: "Busta",       emoji: "✉️", categoria: "oggetti" },

  // sport (8)
  { id: "calcio",         parola: "Calcio",        emoji: "⚽", categoria: "sport" },
  { id: "tennis",         parola: "Tennis",        emoji: "🎾", categoria: "sport" },
  { id: "nuoto",          parola: "Nuoto",         emoji: "🏊", categoria: "sport" },
  { id: "ciclismo",       parola: "Ciclismo",      emoji: "🚲", categoria: "sport" },
  { id: "pallacanestro",  parola: "Basket",        emoji: "🏀", categoria: "sport" },
  { id: "sci",            parola: "Sci",           emoji: "⛷️", categoria: "sport" },
  { id: "boxe",           parola: "Boxe",          emoji: "🥊", categoria: "sport" },
  { id: "trofeo",         parola: "Trofeo",        emoji: "🏆", categoria: "sport" },

  // musica (5)
  { id: "chitarra",    parola: "Chitarra",    emoji: "🎸", categoria: "musica" },
  { id: "pianoforte",  parola: "Pianoforte",  emoji: "🎹", categoria: "musica" },
  { id: "violino",     parola: "Violino",     emoji: "🎻", categoria: "musica" },
  { id: "tromba",      parola: "Tromba",      emoji: "🎺", categoria: "musica" },
  { id: "microfono",   parola: "Microfono",   emoji: "🎤", categoria: "musica" },
];
