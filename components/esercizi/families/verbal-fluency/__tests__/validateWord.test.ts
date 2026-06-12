import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateWord } from "../validateWord";
import { getWordlist } from "../wordlists.generated";

// Carica il dizionario reale (lo stesso file servito a runtime) in un Set.
let dizionario: Set<string>;
beforeAll(() => {
  const p = join(process.cwd(), "public/dictionaries/it/parole-it.txt");
  dizionario = new Set(readFileSync(p, "utf8").split("\n").filter(Boolean));
});

describe("validateWord — fluenza fonemica", () => {
  const base = () => ({
    tipo: "fonemica" as const,
    letter: "s",
    dizionario,
    sessionWords: new Set<string>(),
  });

  it("parola italiana che inizia con la lettera → VALIDA", () => {
    expect(validateWord("sole", base())).toBe("VALIDA");
    expect(validateWord("Strada", base())).toBe("VALIDA"); // case-insensitive
  });

  it("parola con lettera sbagliata → REGOLA_VIOLATA", () => {
    expect(validateWord("cane", base())).toBe("REGOLA_VIOLATA");
  });

  it("non-parola che inizia con la lettera → NON_NEL_DIZIONARIO", () => {
    expect(validateWord("sxqz", base())).toBe("NON_NEL_DIZIONARIO");
  });

  it("parola già usata → DUPLICATA", () => {
    const cfg = { ...base(), sessionWords: new Set(["sole"]) };
    expect(validateWord("sole", cfg)).toBe("DUPLICATA");
  });
});

describe("validateWord — fluenza categoriale", () => {
  const base = () => ({
    tipo: "categoriale" as const,
    categoryWordlist: getWordlist("animali"),
    dizionario,
    sessionWords: new Set<string>(),
  });

  it("parola della categoria → VALIDA", () => {
    expect(validateWord("elefante", base())).toBe("VALIDA");
    expect(validateWord("Cane", base())).toBe("VALIDA");
  });

  it("parola reale ma fuori categoria → REGOLA_VIOLATA", () => {
    expect(validateWord("tavolo", base())).toBe("REGOLA_VIOLATA");
  });

  it("non-parola → NON_NEL_DIZIONARIO", () => {
    expect(validateWord("xyzkw", base())).toBe("NON_NEL_DIZIONARIO");
  });

  it("duplicato → DUPLICATA", () => {
    const cfg = { ...base(), sessionWords: new Set(["cane"]) };
    expect(validateWord("cane", cfg)).toBe("DUPLICATA");
  });

  it("termine raro presente in wordlist ma non in dizionario → VALIDA (wordlist autoritativa)", () => {
    // 'capesante' è in animali ma non nel dizionario di frequenza.
    expect(dizionario.has("capesante")).toBe(false);
    expect(validateWord("capesante", base())).toBe("VALIDA");
  });
});
