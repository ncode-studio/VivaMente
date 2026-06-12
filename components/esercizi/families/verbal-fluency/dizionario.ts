/**
 * dizionario.ts — caricamento del dizionario italiano per Verbal Fluency.
 *
 * Il dizionario è un elenco piatto di ~150k parole italiane comuni
 * (public/dictionaries/it/parole-it.txt), pre-generato a build time da fonti
 * MIT da scripts/build-italian-wordset.mjs. A runtime lo carichiamo UNA sola
 * volta in un Set tenuto a livello di modulo: ogni validazione è poi un
 * Set.has() in O(1).
 *
 * Perché un Set pre-generato e non un motore di spelling a runtime: gli
 * spell-checker Hunspell-based espandono gli affissi in memoria, bloccano il
 * thread del browser per decine di secondi e vanno in OOM su mobile.
 *
 * Le parole nel file sono già normalizzate come normalizzaParola() qui sotto
 * (lowercase + accenti → ASCII), così il confronto con l'input utente è coerente.
 */

const DIZIONARIO_URL = "/dictionaries/it/parole-it.txt";

let dizionarioPromise: Promise<Set<string>> | null = null;

/** Normalizzazione condivisa: lowercase + rimozione accenti. */
export function normalizzaParola(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u");
}

/**
 * Carica (una sola volta) il dizionario e lo tiene in memoria.
 * Chiamate successive restituiscono lo stesso Set senza rifetchare.
 */
export function caricaDizionario(): Promise<Set<string>> {
  if (!dizionarioPromise) {
    dizionarioPromise = fetch(DIZIONARIO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Dizionario non disponibile (${r.status})`);
        return r.text();
      })
      .then((testo) => {
        const set = new Set<string>();
        for (const riga of testo.split("\n")) {
          if (riga) set.add(riga);
        }
        return set;
      })
      .catch((err) => {
        // In caso di errore, azzera la promise così un retry può riprovare.
        dizionarioPromise = null;
        throw err;
      });
  }
  return dizionarioPromise;
}

/** True se il dizionario è già stato caricato e tenuto in memoria. */
export function dizionarioPronto(): boolean {
  return dizionarioPromise !== null;
}
