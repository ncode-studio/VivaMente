/**
 * Pool emoji per Rilevamento del Cambiamento.
 *
 * 36 emoji in 6 categorie (6 per categoria) — visivamente diversi tra categorie,
 * il che rende il change "inter" immediatamente rilevabile.
 *
 * COPPIE_SIMILI: coppie visivamente prossime usate per cambiamenti "intra" (lv 6–10),
 * dove l'utente deve distinguere emoji simili tra loro — compito più difficile.
 */

export const EMOJI_POOL: readonly string[] = [
  // Animali
  "🐶", "🐱", "🐰", "🦊", "🐸", "🐧",
  // Frutta
  "🍎", "🍊", "🍋", "🍇", "🍓", "🍒",
  // Simboli/natura
  "⭐", "🌙", "☀️", "❤️", "💎", "🔔",
  // Fiori/piante
  "🌸", "🌻", "🌴", "🍄", "🌈", "🌵",
  // Veicoli
  "🚗", "✈️", "🚢", "🚂", "🚁", "🛵",
  // Giochi/sport
  "⚽", "🎵", "🎈", "🎂", "🎯", "🎪",
] as const;

// Coppie con alta somiglianza visiva (usate per cambiamenti "intra", lv 6–10)
export const COPPIE_SIMILI: readonly [string, string][] = [
  ["🐶", "🐱"],  // animali domestici
  ["🐰", "🐸"],  // piccoli, occhi grandi
  ["🍎", "🍒"],  // rossi
  ["🍊", "🍋"],  // agrumi
  ["⭐", "🌙"],  // notte
  ["🌸", "🌻"],  // fiori
  ["🚗", "🚁"],  // veicoli
  ["⚽", "🎯"],  // rotondi
  ["🎵", "🔔"],  // suono
  ["❤️", "🎈"],  // rossi arrotondati
] as const;
