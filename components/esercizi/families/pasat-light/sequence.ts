/**
 * components/esercizi/families/pasat-light/sequence.ts
 *
 * Generazione step-by-step per Pasat Light continuo.
 *
 * Una sessione è un flusso continuo di passi. La somma corrente si resetta
 * solo quando l'utente sbaglia (o non risponde in tempo): in quel caso si
 * inizia una nuova catena con una cifra "memorizza" e si prosegue.
 *
 * Vincoli generazione per passo:
 *   - −  : richiede risultato_corrente >= cifra (risultato >= 0)
 *   - ×  : richiede risultato_corrente * cifra <= 99 (per evitare esplosione)
 *   - ÷  : richiede cifra divisore di risultato_corrente (risultato intero)
 *   - Fallback su "+" se nessun'altra op è valida
 */

import type { PLOp } from "./levels";

// ── Tipi ───────────────────────────────────────────────────────────────────────

export interface PLPasso {
  cifraCorr: number;   // cifra mostrata (1-9)
  op:        PLOp;     // operazione tra risultato corrente e cifra
  risultato: number;   // risultato cumulativo atteso
}

// ── Generatore cifra di partenza (memorizza) ───────────────────────────────────

export function generaCifraIniziale(rng: () => number): number {
  return 2 + Math.floor(rng() * 8); // 2-9, evita 0/1
}

// ── Generatore di passo cumulativo ─────────────────────────────────────────────

export function generaPasso(
  risPrec: number,
  ops: PLOp[],
  rng: () => number,
): PLPasso {
  // Mescola le operazioni per evitare bias
  const shuffled = [...ops].sort(() => rng() - 0.5);

  for (const op of shuffled) {
    if (op === "+") {
      const cifra = 1 + Math.floor(rng() * 9);
      return { cifraCorr: cifra, op, risultato: risPrec + cifra };
    }
    if (op === "−") {
      const maxC = Math.min(9, risPrec);
      if (maxC < 1) continue;
      const cifra = 1 + Math.floor(rng() * maxC);
      return { cifraCorr: cifra, op, risultato: risPrec - cifra };
    }
    if (op === "×") {
      if (risPrec === 0) {
        const cifra = 1 + Math.floor(rng() * 9);
        return { cifraCorr: cifra, op, risultato: 0 };
      }
      const maxC = Math.min(9, Math.floor(99 / risPrec));
      if (maxC < 1) continue;
      const cifra = 1 + Math.floor(rng() * maxC);
      return { cifraCorr: cifra, op, risultato: risPrec * cifra };
    }
    if (op === "÷") {
      if (risPrec <= 0) continue;
      const divisori: number[] = [];
      for (let d = 1; d <= 9 && d <= risPrec; d++) {
        if (risPrec % d === 0) divisori.push(d);
      }
      if (divisori.length === 0) continue;
      const cifra = divisori[Math.floor(rng() * divisori.length)];
      return { cifraCorr: cifra, op, risultato: risPrec / cifra };
    }
  }

  // Fallback sicuro: addizione
  const cifra = 1 + Math.floor(rng() * 9);
  return { cifraCorr: cifra, op: "+", risultato: risPrec + cifra };
}
