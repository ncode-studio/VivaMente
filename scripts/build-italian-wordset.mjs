/**
 * scripts/build-italian-wordset.mjs
 *
 * Costruisce l'elenco piatto di parole italiane usato a runtime dalla
 * validazione di Verbal Fluency Fonemica.
 *
 * Sorgenti — entrambe con licenza permissiva (MIT), nessun copyleft:
 *   - napolux/paroleitaliane  (MIT) — lessico italiano (forme flesse incluse)
 *       · 280000_parole_italiane.txt  → vocabolario "è una parola italiana?"
 *         (già privo di nomi propri per costruzione)
 *   - hermitdave/FrequencyWords (MIT) — lista di frequenza (2018/it/it_full.txt)
 *       → ordina per uso reale e taglia alle parole più comuni
 *
 * Nota: NON si sottrae una lista di nomi propri, perché contiene cognomi/toponimi
 * (Sole, Isola, Rosa, Luna…) che coincidono con parole comuni e le cancellerebbe.
 *
 * Nota: una precedente versione usava il dizionario Hunspell di titoBouzout, ma
 * è GPL (copyleft) — inadatto a un'app commerciale che spedisce il file al
 * browser. Qui le fonti sono MIT e il risultato è ridistribuibile liberamente.
 *
 * Perché build-time e non a runtime: l'elenco viene caricato una volta in un Set
 * e le validazioni sono Set.has() in O(1); così evitiamo motori di spelling
 * pesanti nel browser (OOM su mobile).
 *
 * Input (dev-only, gitignored — scripts/dict-src/, riscaricabili dai repo sopra).
 * Output (committato, servito a runtime): public/dictionaries/it/parole-it.txt
 *
 * Esegui una tantum:  node scripts/build-italian-wordset.mjs
 */

import { writeFileSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "dict-src");
const OUT_DIR = join(__dirname, "..", "public", "dictionaries", "it");
const LESSICO = join(SRC_DIR, "napolux_280k.txt");
const FREQ = join(SRC_DIR, "freq_it.txt");
const OUT = join(OUT_DIR, "parole-it.txt");

// Cap sulle parole più frequenti. ~180k copre >99% della produzione lessicale
// di un parlante adulto, mantenendo file e memoria contenuti.
const MAX_PAROLE = 180000;

// Stessa normalizzazione della sessione (normalizza() in sequence.ts).
function normalizza(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u");
}
const isParolaSemplice = (n) => n.length >= 2 && /^[a-z]+$/.test(n);

const t0 = Date.now();

// ── 1. Vocabolario italiano (MIT) ─────────────────────────────────────────────
console.log("1/3 Lessico italiano (napolux, MIT)…");
const valide = new Set(
  readFileSync(LESSICO, "utf8")
    .split(/\r?\n/)
    .map(normalizza)
    .filter(isParolaSemplice),
);
console.log(`    parole valide: ${valide.size}`);

// ── 2. Intersezione con la frequenza (MIT), in ordine di frequenza ────────────
console.log("2/3 Intersezione con lista di frequenza (hermitdave, MIT)…");
const ordinate = [];
const visti = new Set();
for (const line of readFileSync(FREQ, "utf8").split("\n")) {
  const sp = line.indexOf(" ");
  if (sp < 0) continue;
  const n = normalizza(line.slice(0, sp));
  if (!isParolaSemplice(n) || visti.has(n) || !valide.has(n)) continue;
  visti.add(n);
  ordinate.push(n);
}
console.log(`    parole valide presenti nella lista di frequenza: ${ordinate.length}`);

// ── 3. Taglio e scrittura ─────────────────────────────────────────────────────
const tenute = ordinate.slice(0, MAX_PAROLE).sort();
writeFileSync(OUT, tenute.join("\n") + "\n", "utf8");
const sizeMB = statSync(OUT).size / 1048576;
console.log(
  `3/3 Scritte ${tenute.length} parole (cap ${MAX_PAROLE}).\n` +
    `    file: ${OUT} (${sizeMB.toFixed(2)} MB)\n` +
    `    completato in ${Date.now() - t0}ms`,
);
