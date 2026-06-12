/**
 * validateWord.ts — validazione di una parola digitata in Verbal Fluency.
 *
 * Quattro esiti (nessuno è un "errore" lato UI — vedi VerbalFluencySession):
 *   - VALIDA            → conta nel punteggio, appare in verde
 *   - NON_NEL_DIZIONARIO→ non è parola italiana riconosciuta
 *   - REGOLA_VIOLATA    → parola reale ma fuori regola (lettera/categoria sbagliata)
 *   - DUPLICATA         → già inserita in questa sessione
 *
 * NON_NEL_DIZIONARIO e REGOLA_VIOLATA appaiono in grigio barrato e non contano.
 */

import { normalizzaParola } from "./dizionario";

export type EsitoValidazione =
  | "VALIDA"
  | "NON_NEL_DIZIONARIO"
  | "REGOLA_VIOLATA"
  | "DUPLICATA";

export interface ExerciseConfig {
  tipo: "fonemica" | "categoriale";
  /** Solo fonemica: lettera iniziale richiesta. */
  letter?: string;
  /** Solo categoriale: parole ammesse (già normalizzate). */
  categoryWordlist?: Set<string>;
  /** Dizionario italiano piatto (già normalizzato). */
  dizionario: Set<string>;
  /** Parole già accettate nella sessione corrente (già normalizzate). */
  sessionWords: Set<string>;
}

export function validateWord(word: string, config: ExerciseConfig): EsitoValidazione {
  const n = normalizzaParola(word);

  // Stringhe vuote o troppo corte: trattate come non riconosciute (mai errore).
  if (n.length < 2) return "NON_NEL_DIZIONARIO";

  // Duplicati: sessionWords contiene solo parole già accettate (valide).
  if (config.sessionWords.has(n)) return "DUPLICATA";

  if (config.tipo === "categoriale") {
    // La wordlist curata è autoritativa: se la parola c'è, è valida a
    // prescindere dal dizionario (copre anche termini rari non in frequenza).
    if (config.categoryWordlist?.has(n)) return "VALIDA";
    // Altrimenti distinguiamo "non è una parola" da "parola reale, fuori categoria".
    if (!config.dizionario.has(n)) return "NON_NEL_DIZIONARIO";
    return "REGOLA_VIOLATA";
  }

  // Fonemica: deve iniziare con la lettera assegnata ED essere parola italiana.
  const lettera = normalizzaParola(config.letter ?? "");
  if (lettera && !n.startsWith(lettera)) return "REGOLA_VIOLATA";
  if (!config.dizionario.has(n)) return "NON_NEL_DIZIONARIO";
  return "VALIDA";
}
