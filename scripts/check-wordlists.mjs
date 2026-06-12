/**
 * scripts/check-wordlists.mjs — QA delle wordlist semantiche.
 * Conta le parole per categoria, segnala duplicati interni e parole non presenti
 * nel dizionario italiano (potenziali refusi o termini rari da rivedere).
 *
 * Uso: node scripts/check-wordlists.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WL = join(ROOT, "components/esercizi/families/verbal-fluency/wordlists.generated.ts");
const DICT = join(ROOT, "public/dictionaries/it/parole-it.txt");

const norm = (s) =>
  s.toLowerCase()
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u");

const dict = new Set(readFileSync(DICT, "utf8").split("\n").filter(Boolean));
const src = readFileSync(WL, "utf8");

// Estrae il blocco RAW e poi ogni "categoria: [ ... ]".
const rawBlock = src.slice(src.indexOf("VF_WORDLISTS_RAW"), src.indexOf("VF_WORDLISTS:"));
const catRe = /(\w+):\s*\[([\s\S]*?)\]/g;
let m;
let totParole = 0;
const report = [];
const tuttiMancanti = [];
while ((m = catRe.exec(rawBlock))) {
  const id = m[1];
  const words = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const normWords = words.map(norm);
  const seen = new Set();
  const dups = [];
  const mancanti = [];
  for (let i = 0; i < normWords.length; i++) {
    const n = normWords[i];
    if (seen.has(n)) dups.push(words[i]);
    seen.add(n);
    if (!dict.has(n)) mancanti.push(words[i]);
  }
  const uniche = seen.size;
  totParole += uniche;
  report.push({ id, totali: words.length, uniche, dups, mancanti });
  mancanti.forEach((w) => tuttiMancanti.push(`${id}:${w}`));
}

console.log("CATEGORIA            TOT  UNICHE  DUP  NON-IN-DIZ");
console.log("─".repeat(70));
for (const r of report) {
  console.log(
    r.id.padEnd(20),
    String(r.totali).padStart(4),
    String(r.uniche).padStart(6),
    String(r.dups.length).padStart(5),
    String(r.mancanti.length).padStart(6),
    r.dups.length ? "  DUP:" + r.dups.join(",") : "",
  );
}
console.log("─".repeat(70));
console.log(`${report.length} categorie, ${totParole} parole uniche totali`);
console.log(`\nParole NON nel dizionario (${tuttiMancanti.length}):`);
console.log(tuttiMancanti.join("  "));
