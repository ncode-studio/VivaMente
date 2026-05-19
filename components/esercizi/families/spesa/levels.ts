/**
 * Levels per "Spesa al supermercato".
 *
 * Dominio: Memoria — il giocatore memorizza una lista di alimenti, poi
 * cerca quegli alimenti tra molti altri sullo scaffale del supermercato.
 *
 * Modello B (trial-based, no timer sessione).
 */

export interface SpesaLevelConfig {
  livello:          number;
  /** Numero di alimenti nella lista da memorizzare. */
  nLista:           number;
  /** Numero totale di alimenti mostrati nello scaffale (lista + distrattori). */
  nScaffale:        number;
  /** Tempo di esposizione della lista in ms (auto-avanza, ma c'è anche "Ho letto"). */
  esposizioneMs:    number;
  /** Trial per sessione. */
  trialsPerSession: number;
  /** Timer per fase shopping (ms). null = niente timer. */
  shoppingTimerMs:  number | null;
}

export const SPESA_LEVELS: readonly SpesaLevelConfig[] = [
  { livello:  1, nLista: 3, nScaffale: 10, esposizioneMs:  9_000, trialsPerSession: 3, shoppingTimerMs: 25_000 },
  { livello:  2, nLista: 4, nScaffale: 12, esposizioneMs: 10_000, trialsPerSession: 3, shoppingTimerMs: 25_000 },
  { livello:  3, nLista: 4, nScaffale: 14, esposizioneMs: 10_000, trialsPerSession: 3, shoppingTimerMs: 28_000 },
  { livello:  4, nLista: 5, nScaffale: 16, esposizioneMs: 11_000, trialsPerSession: 3, shoppingTimerMs: 28_000 },
  { livello:  5, nLista: 5, nScaffale: 18, esposizioneMs: 11_000, trialsPerSession: 3, shoppingTimerMs: 30_000 },
  { livello:  6, nLista: 6, nScaffale: 20, esposizioneMs: 12_000, trialsPerSession: 3, shoppingTimerMs: 30_000 },
  { livello:  7, nLista: 6, nScaffale: 22, esposizioneMs: 12_000, trialsPerSession: 3, shoppingTimerMs: 32_000 },
  { livello:  8, nLista: 7, nScaffale: 24, esposizioneMs: 13_000, trialsPerSession: 3, shoppingTimerMs: 32_000 },
  { livello:  9, nLista: 7, nScaffale: 26, esposizioneMs: 13_000, trialsPerSession: 2, shoppingTimerMs: 35_000 },
  { livello: 10, nLista: 8, nScaffale: 30, esposizioneMs: 14_000, trialsPerSession: 2, shoppingTimerMs: 35_000 },
];

export function getSpesaLevel(livello: number): SpesaLevelConfig {
  return SPESA_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}

// ── Catalogo alimenti (emoji + nome) ─────────────────────────────────────────
export interface Alimento {
  id:    string;
  emoji: string;
  nome:  string;
}

export const ALIMENTI: readonly Alimento[] = [
  { id: "mela",        emoji: "🍎", nome: "Mela" },
  { id: "pera",        emoji: "🍐", nome: "Pera" },
  { id: "banana",      emoji: "🍌", nome: "Banana" },
  { id: "arancia",     emoji: "🍊", nome: "Arancia" },
  { id: "uva",         emoji: "🍇", nome: "Uva" },
  { id: "fragola",     emoji: "🍓", nome: "Fragole" },
  { id: "anguria",     emoji: "🍉", nome: "Anguria" },
  { id: "pesca",       emoji: "🍑", nome: "Pesca" },
  { id: "kiwi",        emoji: "🥝", nome: "Kiwi" },
  { id: "ananas",      emoji: "🍍", nome: "Ananas" },
  { id: "limone",      emoji: "🍋", nome: "Limone" },
  { id: "ciliegie",    emoji: "🍒", nome: "Ciliegie" },
  { id: "pomodoro",    emoji: "🍅", nome: "Pomodoro" },
  { id: "carota",      emoji: "🥕", nome: "Carota" },
  { id: "broccoli",    emoji: "🥦", nome: "Broccoli" },
  { id: "mais",        emoji: "🌽", nome: "Mais" },
  { id: "peperoncino", emoji: "🌶️", nome: "Peperoncino" },
  { id: "patata",      emoji: "🥔", nome: "Patata" },
  { id: "melanzana",   emoji: "🍆", nome: "Melanzana" },
  { id: "cipolla",     emoji: "🧅", nome: "Cipolla" },
  { id: "aglio",       emoji: "🧄", nome: "Aglio" },
  { id: "pane",        emoji: "🍞", nome: "Pane" },
  { id: "croissant",   emoji: "🥐", nome: "Croissant" },
  { id: "baguette",    emoji: "🥖", nome: "Baguette" },
  { id: "formaggio",   emoji: "🧀", nome: "Formaggio" },
  { id: "uova",        emoji: "🥚", nome: "Uova" },
  { id: "latte",       emoji: "🥛", nome: "Latte" },
  { id: "burro",       emoji: "🧈", nome: "Burro" },
  { id: "yogurt",      emoji: "🍶", nome: "Yogurt" },
  { id: "pollo",       emoji: "🍗", nome: "Pollo" },
  { id: "carne",       emoji: "🥩", nome: "Carne" },
  { id: "pesce",       emoji: "🐟", nome: "Pesce" },
  { id: "gamberi",     emoji: "🦐", nome: "Gamberi" },
  { id: "pasta",       emoji: "🍝", nome: "Pasta" },
  { id: "riso",        emoji: "🍚", nome: "Riso" },
  { id: "pizza",       emoji: "🍕", nome: "Pizza" },
  { id: "miele",       emoji: "🍯", nome: "Miele" },
  { id: "cioccolato",  emoji: "🍫", nome: "Cioccolato" },
  { id: "biscotti",    emoji: "🍪", nome: "Biscotti" },
  { id: "torta",       emoji: "🍰", nome: "Torta" },
  { id: "gelato",      emoji: "🍦", nome: "Gelato" },
  { id: "caffe",       emoji: "☕", nome: "Caffè" },
  { id: "the",         emoji: "🍵", nome: "Tè" },
  { id: "succo",       emoji: "🧃", nome: "Succo" },
  { id: "olio",        emoji: "🫒", nome: "Olio" },
  { id: "sale",        emoji: "🧂", nome: "Sale" },
];
