"use client";

/**
 * WordChainSwitchingSession — dispatcher tra le 2 modalità:
 *   - selezione  (lv 1-3): griglia parole, l'utente le tappa alternando categoria.
 *   - produzione (lv 4+):  l'utente digita parole con la tastiera QWERTY,
 *                          validate contro il pool semantico.
 */

import type { StimoloWCS, RispostaWCS } from "./sequence";
import { SelezioneTrial } from "./SelezioneTrial";
import { ProduzioneTrial } from "./ProduzioneTrial";

type Props = {
  stimolo:    StimoloWCS;
  onRisposta: (r: RispostaWCS) => void;
};

export function WordChainSwitchingSession({ stimolo, onRisposta }: Props) {
  if (stimolo.variante === "produzione") {
    return <ProduzioneTrial stimolo={stimolo} onRisposta={onRisposta} />;
  }
  return <SelezioneTrial stimolo={stimolo} onRisposta={onRisposta} />;
}
