"use client";

/**
 * VerbalFluencySession — finestra temporale per produzione lessicale.
 *
 * Flusso:
 *   - Carica il dizionario italiano (una volta, in memoria) mostrando un loader
 *     discreto "Preparazione esercizio…"; il countdown parte solo a dizionario pronto.
 *   - Mostra categoria/lettera + countdown visivo (da tLimMs a 0).
 *   - L'utente digita parole e preme "Aggiungi" o Invio. validateWord() restituisce
 *     uno dei 4 esiti.
 *   - Nessun feedback rosso: parola valida → verde con animazione + contatore;
 *     parola non valida/duplicata/fuori regola → grigio barrata, non conta.
 *   - L'input si svuota dopo ogni inserimento (valido o no).
 *   - Allo scadere del countdown chiama onRisposta({ parole, errori, score }).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { StimoloVF, RispostaVF } from "./sequence";
import { caricaDizionario, normalizzaParola } from "./dizionario";
import { validateWord, type ExerciseConfig } from "./validateWord";
import { getWordlist } from "./wordlists.generated";

type Props = {
  stimolo:      StimoloVF;
  onRisposta:   (r: RispostaVF) => void;
  tempoScaduto: boolean;
};

/** Voce mostrata nella lista: parola digitata + se è stata contata (valida). */
type Voce = { parola: string; valida: boolean };

export function VerbalFluencySession({ stimolo, onRisposta, tempoScaduto }: Props) {
  const [dizionario, setDizionario] = useState<Set<string> | null>(null);
  const [input,      setInput]      = useState("");
  const [voci,       setVoci]       = useState<Voce[]>([]);
  const [msRimasti,  setMsRimasti]  = useState(stimolo.tLimMs);
  // Per fluenza alternata: indice categoria corrente (0 = cat1, 1 = cat2).
  const [catTurno,   setCatTurno]   = useState(0);

  const completatoRef  = useRef(false);
  const startTimeRef   = useRef<number | null>(null);
  const valideRef      = useRef<string[]>([]);   // parole valide (per RispostaVF)
  const usateRef       = useRef<Set<string>>(new Set()); // normalizzate, per dedup
  const erroriRef      = useRef(0);
  const stimoloRef     = useRef(stimolo);
  const onRispostaRef  = useRef(onRisposta);
  const inputRef       = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── Caricamento dizionario (una sola volta, cache di modulo) ────────────────
  useEffect(() => {
    let vivo = true;
    caricaDizionario()
      .then((set) => { if (vivo) setDizionario(set); })
      .catch(() => { if (vivo) setDizionario(new Set()); }); // fallback: solo regole
    return () => { vivo = false; };
  }, []);

  // ── Reset su cambio stimolo ────────────────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    startTimeRef.current  = null;
    valideRef.current     = [];
    usateRef.current      = new Set();
    erroriRef.current     = 0;
    setInput("");
    setVoci([]);
    setCatTurno(0);
    setMsRimasti(stimolo.tLimMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Countdown — parte solo quando il dizionario è pronto ───────────────────
  useEffect(() => {
    if (!dizionario) return;
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
    const id = setInterval(() => {
      const start = startTimeRef.current ?? Date.now();
      const rimasti = Math.max(0, stimoloRef.current.tLimMs - (Date.now() - start));
      setMsRimasti(rimasti);
      if (rimasti === 0) {
        clearInterval(id);
        concludi();
      }
    }, 200);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dizionario, stimolo]);

  // ── tempoScaduto (sessione globale) ───────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto) return;
    concludi();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoScaduto]);

  const concludi = useCallback(() => {
    if (completatoRef.current) return;
    completatoRef.current = true;
    const p = valideRef.current;
    onRispostaRef.current({ parole: p, errori: erroriRef.current, score: p.length });
  }, []);

  // ── Costruzione config di validazione per il turno corrente ─────────────────
  function configCorrente(s: StimoloVF, dict: Set<string>): ExerciseConfig {
    if (s.variante === "fonemica") {
      return { tipo: "fonemica", letter: s.categoria, dizionario: dict, sessionWords: usateRef.current };
    }
    // semantica o alternata → categoriale
    const catId = s.variante === "alternata" && catTurno === 1
      ? (s.categoria2Id ?? s.categoriaId)
      : s.categoriaId;
    return {
      tipo: "categoriale",
      categoryWordlist: getWordlist(catId),
      dizionario: dict,
      sessionWords: usateRef.current,
    };
  }

  // ── Aggiungi parola ───────────────────────────────────────────────────────
  const handleAggiungi = useCallback(() => {
    if (completatoRef.current || !dizionario) return;
    const s = stimoloRef.current;
    const grezza = input.trim();
    setInput(""); // si svuota sempre, valida o no
    if (!grezza) return;

    const esito = validateWord(grezza, configCorrente(s, dizionario));
    const valida = esito === "VALIDA";

    if (valida) {
      const norm = normalizzaParola(grezza);
      usateRef.current.add(norm);
      valideRef.current = [...valideRef.current, grezza];
      if (s.variante === "alternata") setCatTurno((t) => (t + 1) % 2);
    } else {
      erroriRef.current++;
    }

    setVoci((v) => [...v, { parola: grezza, valida }]);
    setTimeout(() => inputRef.current?.focus(), 20);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, dizionario, catTurno]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); handleAggiungi(); }
    },
    [handleAggiungi],
  );

  // ── Loader dizionario ──────────────────────────────────────────────────────
  if (!dizionario) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
        <div
          className="animate-spin"
          style={{
            width: "2rem", height: "2rem", borderRadius: "9999px",
            border: "3px solid #E2E8F0", borderTopColor: "#1E3A5F",
          }}
        />
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#64748B" }}>
          Preparazione esercizio…
        </p>
      </div>
    );
  }

  // ── Derivati di rendering ──────────────────────────────────────────────────
  const pct       = msRimasti / stimolo.tLimMs;
  const secsLeft  = Math.ceil(msRimasti / 1000);
  const barColor  = pct > 0.5 ? "#22C55E" : pct > 0.25 ? "#F59E0B" : "#EF4444";
  const isSemantica = stimolo.variante === "semantica";
  const isAlternata = stimolo.variante === "alternata";
  const validCount  = voci.filter((v) => v.valida).length;
  const categoriaAttuale = isAlternata && catTurno === 1 && stimolo.categoria2
    ? stimolo.categoria2
    : stimolo.categoria;

  return (
    <div className="flex flex-col items-start gap-3 px-4 py-4">

      {/* Badge variante */}
      <p style={{
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
        color: isAlternata ? "#15803D" : isSemantica ? "#0369A1" : "#7C3AED",
      }}>
        {isAlternata ? "FLUENZA ALTERNATA"
          : isSemantica ? "FLUENZA SEMANTICA" : "FLUENZA FONEMICA"}
      </p>

      {/* Categoria / Lettera */}
      <div style={{
        width: "100%", borderRadius: "1.25rem",
        backgroundColor: isAlternata ? "#F0FDF4" : isSemantica ? "#F0F9FF" : "#F5F3FF",
        border: `2px solid ${isAlternata ? "#BBF7D0" : isSemantica ? "#BAE6FD" : "#DDD6FE"}`,
        padding: "1rem 1.25rem",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
      }}>
        {isAlternata ? (
          <>
            <p style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 600 }}>
              Ora scrivi
            </p>
            <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#14532D" }}>
              {categoriaAttuale}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#15803D", fontWeight: 600 }}>
              poi alterna con: <strong>{catTurno === 0 ? stimolo.categoria2 : stimolo.categoria}</strong> — in {secsLeft}s
            </p>
          </>
        ) : isSemantica ? (
          <>
            <p style={{ fontSize: "0.75rem", color: "#0369A1", fontWeight: 600 }}>
              Scrivi quanti più
            </p>
            <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0C4A6E" }}>
              {stimolo.categoria}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#0369A1", fontWeight: 600 }}>
              riesci in {secsLeft}s
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.75rem", color: "#7C3AED", fontWeight: 600 }}>
              Scrivi parole che iniziano con
            </p>
            <p style={{ fontSize: "3rem", fontWeight: 900, color: "#3730A3", lineHeight: 1 }}>
              {stimolo.categoria}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#7C3AED", fontWeight: 600 }}>
              Niente nomi propri
            </p>
          </>
        )}
      </div>

      {/* Countdown */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          flex: 1, height: "8px", borderRadius: "4px",
          backgroundColor: "#E2E8F0", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: "4px",
            width: `${pct * 100}%`,
            backgroundColor: barColor,
            transition: "width 0.2s linear, background-color 0.3s",
          }} />
        </div>
        <span style={{
          fontSize: "1rem", fontWeight: 700,
          color: pct < 0.25 ? "#EF4444" : "#475569",
          minWidth: "2.5rem", textAlign: "right",
        }}>
          {secsLeft}s
        </span>
      </div>

      {/* Input */}
      <div style={{ width: "100%", display: "flex", gap: "0.5rem" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSemantica ? "Scrivi qui…" : `Lettera ${stimolo.categoria}…`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            flex: 1, padding: "0.8rem 1rem",
            borderRadius: "0.85rem", fontSize: "1rem", fontWeight: 600,
            border: "2px solid #CBD5E1", outline: "none",
            backgroundColor: "#FFFFFF", color: "#111827",
          }}
        />
        <button
          onClick={handleAggiungi}
          disabled={input.trim().length === 0}
          className="active:scale-95"
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "0.85rem", fontSize: "0.9rem", fontWeight: 700,
            backgroundColor: input.trim().length > 0 ? "#1E3A5F" : "#CBD5E1",
            color: "#FFFFFF", border: "none", cursor: input.trim().length > 0 ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          Aggiungi
        </button>
      </div>

      {/* Contatore */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
          Parole trovate
        </p>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16A34A" }}>
          {validCount}
        </span>
      </div>

      {/* Lista: valide in verde (animate), non valide in grigio barrato */}
      {voci.length > 0 && (
        <div style={{
          width: "100%", maxHeight: "150px", overflowY: "auto",
          borderRadius: "0.75rem", border: "1px solid #E2E8F0",
          backgroundColor: "#F8FAFC", padding: "0.5rem 0.75rem",
          display: "flex", flexWrap: "wrap", gap: "0.4rem",
        }}>
          {[...voci].reverse().map((v, i) => (
            v.valida ? (
              <span
                key={voci.length - i}
                className="animate-in fade-in zoom-in-95 duration-300"
                style={{
                  fontSize: "0.85rem", fontWeight: 700,
                  color: "#166534", backgroundColor: "#DCFCE7",
                  borderRadius: "0.5rem", padding: "0.2rem 0.55rem",
                }}
              >
                {v.parola}
              </span>
            ) : (
              <span
                key={voci.length - i}
                style={{
                  fontSize: "0.85rem", fontWeight: 600,
                  color: "#94A3B8", backgroundColor: "#F1F5F9",
                  textDecoration: "line-through",
                  borderRadius: "0.5rem", padding: "0.2rem 0.55rem",
                }}
              >
                {v.parola}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}
