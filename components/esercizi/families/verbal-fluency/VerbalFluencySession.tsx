"use client";

/**
 * VerbalFluencySession — finestra temporale per produzione lessicale.
 *
 * Flusso:
 *   - Mostra categoria/lettera + countdown visivo (da tLimMs a 0).
 *   - L'utente digita parole una alla volta e preme "Aggiungi" o Invio.
 *   - Parole accettate appaiono in lista; duplicate/invalide mostrano errore.
 *   - Allo scadere del countdown chiama onRisposta({ parole, score }).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { StimoloVF, RispostaVF } from "./sequence";
import { hasWordlist, isInWordlist } from "./wordlists";

type Props = {
  stimolo:      StimoloVF;
  onRisposta:   (r: RispostaVF) => void;
  tempoScaduto: boolean;
};

type EsitoInput =
  | "ok"
  | "duplicata"
  | "lettera_errata"
  | "troppo_corta"
  | "non_riconosciuta"
  | "non_valida"
  | null;

export function VerbalFluencySession({ stimolo, onRisposta, tempoScaduto }: Props) {
  const [input,      setInput]      = useState("");
  const [parole,     setParole]     = useState<string[]>([]);
  const [msRimasti,  setMsRimasti]  = useState(stimolo.tLimMs);
  const [esito,      setEsito]      = useState<EsitoInput>(null);
  // Per fluenza alternata: indice categoria corrente (0 = cat1, 1 = cat2).
  const [catTurno,   setCatTurno]   = useState(0);

  const completatoRef  = useRef(false);
  const startTimeRef   = useRef(Date.now());
  const paroleRef      = useRef<string[]>([]);
  const usateRef       = useRef<Set<string>>(new Set());
  const erroriRef      = useRef(0);
  const stimoloRef     = useRef(stimolo);
  const onRispostaRef  = useRef(onRisposta);
  const inputRef       = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });
  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });

  // ── Reset su cambio stimolo ────────────────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    startTimeRef.current  = Date.now();
    paroleRef.current     = [];
    usateRef.current      = new Set();
    erroriRef.current     = 0;
    setInput("");
    setParole([]);
    setMsRimasti(stimolo.tLimMs);
    setEsito(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (completatoRef.current) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const rimasti = Math.max(0, stimoloRef.current.tLimMs - elapsed);
      setMsRimasti(rimasti);
      if (rimasti === 0) {
        clearInterval(id);
        if (!completatoRef.current) {
          completatoRef.current = true;
          const p = paroleRef.current;
          onRispostaRef.current({ parole: p, errori: erroriRef.current, score: p.length });
        }
      }
    }, 200);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── tempoScaduto (sessione globale) ───────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    completatoRef.current = true;
    const p = paroleRef.current;
    onRispostaRef.current({ parole: p, errori: erroriRef.current, score: p.length });
  }, [tempoScaduto]);

  // ── Aggiungi parola ───────────────────────────────────────────────────────
  const handleAggiungi = useCallback(() => {
    if (completatoRef.current) return;
    const s = stimoloRef.current;
    const parola = input.trim();
    if (!parola) return;

    if (parola.length < 3) {
      // troppo corta: non conta come errore, è solo un nudge UX
      setEsito("troppo_corta"); setInput(""); return;
    }

    const norm = parola.toLowerCase()
      .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u");

    // Sanity filter: solo lettere (a-z), almeno una vocale, non tutte
    // uguali — blocca "zzzzz", "qwerty", "123" senza richiedere wordlist.
    const soloLettere = /^[a-z]+$/.test(norm);
    const haVocale    = /[aeiou]/.test(norm);
    const tutteUguali = norm.length > 0 && norm.split("").every(c => c === norm[0]);
    if (!soloLettere || !haVocale || tutteUguali) {
      erroriRef.current++;
      setEsito("non_valida"); setInput(""); return;
    }

    if (usateRef.current.has(norm)) {
      setEsito("duplicata"); setInput(""); return;
    }

    if (s.variante === "fonemica") {
      const letteraNorm = s.categoria.toLowerCase()
        .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
        .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
        .replace(/[ùúûü]/g, "u");
      if (!norm.startsWith(letteraNorm)) {
        erroriRef.current++;
        setEsito("lettera_errata"); setInput(""); return;
      }
    } else if (s.variante === "semantica" && hasWordlist(s.categoriaId)) {
      if (!isInWordlist(s.categoriaId, norm)) {
        erroriRef.current++;
        setEsito("non_riconosciuta"); setInput(""); return;
      }
    } else if (s.variante === "alternata") {
      // Categoria attesa per questo turno.
      const catIdAttesa = catTurno === 0 ? s.categoriaId : (s.categoria2Id ?? s.categoriaId);
      if (hasWordlist(catIdAttesa) && !isInWordlist(catIdAttesa, norm)) {
        erroriRef.current++;
        setEsito("non_riconosciuta"); setInput(""); return;
      }
    }

    // Accettata
    usateRef.current.add(norm);
    const newParole = [...paroleRef.current, parola];
    paroleRef.current = newParole;
    setParole(newParole);
    setEsito("ok");
    setInput("");
    if (s.variante === "alternata") {
      setCatTurno((t) => (t + 1) % 2);
    }
    setTimeout(() => inputRef.current?.focus(), 20);
  }, [input, catTurno]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); handleAggiungi(); }
    },
    [handleAggiungi],
  );

  // Azzera esito dopo 1.2s
  useEffect(() => {
    if (!esito) return;
    const t = setTimeout(() => setEsito(null), 1200);
    return () => clearTimeout(t);
  }, [esito]);

  const pct       = msRimasti / stimolo.tLimMs;
  const secsLeft  = Math.ceil(msRimasti / 1000);
  const barColor  = pct > 0.5 ? "#22C55E" : pct > 0.25 ? "#F59E0B" : "#EF4444";
  const isSemantica = stimolo.variante === "semantica";
  const isAlternata = stimolo.variante === "alternata";
  const categoriaAttuale = isAlternata && catTurno === 1 && stimolo.categoria2
    ? stimolo.categoria2
    : stimolo.categoria;

  const esitoMsg: Record<NonNullable<EsitoInput>, string> = {
    ok:               "✓ Aggiunta!",
    duplicata:        "Già inserita",
    lettera_errata:   `Deve iniziare con ${stimolo.categoria}`,
    troppo_corta:     "Parola troppo corta",
    non_riconosciuta: "Non riconosciuta in questa categoria",
    non_valida:       "Parola non valida",
  };

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

      {/* Feedback input */}
      {esito && (
        <p style={{
          fontSize: "0.8rem", fontWeight: 600,
          color: esito === "ok" ? "#16A34A" : "#DC2626",
        }}>
          {esitoMsg[esito]}
        </p>
      )}

      {/* Contatore + lista */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
          Parole inserite
        </p>
        <span style={{
          fontSize: "1.1rem", fontWeight: 800, color: "#1E3A5F",
        }}>
          {parole.length}
        </span>
      </div>

      {parole.length > 0 && (
        <div style={{
          width: "100%", maxHeight: "140px", overflowY: "auto",
          borderRadius: "0.75rem", border: "1px solid #E2E8F0",
          backgroundColor: "#F8FAFC", padding: "0.5rem 0.75rem",
          display: "flex", flexWrap: "wrap", gap: "0.4rem",
        }}>
          {[...parole].reverse().map((p, i) => (
            <span key={i} style={{
              fontSize: "0.85rem", fontWeight: 600,
              color: "#1E3A5F", backgroundColor: "#DBEAFE",
              borderRadius: "0.5rem", padding: "0.2rem 0.5rem",
            }}>
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
