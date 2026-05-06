"use client";

/**
 * OrdineNarrativoSession — sessione 2 fasi per MCT Ordine Narrativo.
 *
 * Flusso:
 *   1. lettura  — mostra testo; l'utente tappa "Ho letto — Prosegui"
 *   2. riordino — card (eventi + distrattori) mescolate nell'area sorgente;
 *                 l'utente le piazza in N slot numerati nell'ordine corretto.
 *                 Tap su card sorgente → seleziona; tap su slot → piazza lì.
 *                 Tap su slot già pieno → riporta la card in sorgente.
 *
 * UX: tap-to-select + tap-to-place (più affidabile del drag su touch elderly).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  StimoloOrdineNarrativo,
  RispostaOrdineNarrativo,
  EventoNarrativo,
} from "./sequence-ordine";

type Fase = "lettura" | "riordino";

type Props = {
  stimolo:      StimoloOrdineNarrativo;
  onRisposta:   (r: RispostaOrdineNarrativo) => void;
  tempoScaduto: boolean;
};

// ── Stato riordino ────────────────────────────────────────────────────────────

interface RiordinoState {
  pool:     string[];           // ids delle card ancora in sorgente
  slots:    (string | null)[];  // ids delle card piazzate in ogni slot
  selected: string | null;      // id della card sorgente selezionata
}

function initRiordino(stimolo: StimoloOrdineNarrativo): RiordinoState {
  return {
    pool:     stimolo.cardsPool.map((e) => e.id),
    slots:    Array(stimolo.nSlot).fill(null),
    selected: null,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OrdineNarrativoSession({
  stimolo,
  onRisposta,
  tempoScaduto,
}: Props) {
  const [fase,     setFase]     = useState<Fase>("lettura");
  const [riordino, setRiordino] = useState<RiordinoState>(() =>
    initRiordino(stimolo),
  );

  const completatoRef  = useRef(false);
  const stimoloRef     = useRef(stimolo);
  const onRispostaRef  = useRef(onRisposta);

  useLayoutEffect(() => { onRispostaRef.current = onRisposta; });
  useLayoutEffect(() => { stimoloRef.current    = stimolo;    });

  // ── tempoScaduto ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completatoRef.current) return;
    completatoRef.current = true;
    onRispostaRef.current(null);
  }, [tempoScaduto]);

  // ── Reset su cambio stimolo ────────────────────────────────────────────────
  useEffect(() => {
    completatoRef.current = false;
    setFase("lettura");
    setRiordino(initRiordino(stimolo));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimolo]);

  // ── Prosegui dopo lettura ─────────────────────────────────────────────────
  const handleProsegui = useCallback(() => {
    if (completatoRef.current) return;
    setFase("riordino");
  }, []);

  // ── Tap card in pool ──────────────────────────────────────────────────────
  const handleTapPool = useCallback((id: string) => {
    if (completatoRef.current) return;
    setRiordino((prev) => ({
      ...prev,
      selected: prev.selected === id ? null : id,
    }));
  }, []);

  // ── Tap su uno slot ───────────────────────────────────────────────────────
  const handleTapSlot = useCallback((slotIdx: number) => {
    if (completatoRef.current) return;
    setRiordino((prev) => {
      const { pool, slots, selected } = prev;
      const slotContent = slots[slotIdx];

      if (selected !== null) {
        // Piazza selected in questo slot
        const newSlots = [...slots];
        newSlots[slotIdx] = selected;
        const newPool = pool.filter((id) => id !== selected);
        // Se lo slot era già occupato, rimanda quella card in pool
        if (slotContent !== null) newPool.push(slotContent);
        return { pool: newPool, slots: newSlots, selected: null };
      }

      if (slotContent !== null) {
        // Nessuna selezione: rimanda la card in pool
        const newSlots = [...slots];
        newSlots[slotIdx] = null;
        return { pool: [...pool, slotContent], slots: newSlots, selected: null };
      }

      return prev;
    });
  }, []);

  // ── Conferma ──────────────────────────────────────────────────────────────
  const handleConferma = useCallback(() => {
    if (completatoRef.current) return;
    const filledSlots = riordino.slots.filter((s): s is string => s !== null);
    if (filledSlots.length < stimoloRef.current.nSlot) return;
    completatoRef.current = true;
    onRispostaRef.current({ slotIds: filledSlots });
  }, [riordino.slots]);

  // ── Mappa id → testo (lookup veloce) ──────────────────────────────────────
  const cardMap = useRef<Record<string, string>>({});
  useEffect(() => {
    const m: Record<string, string> = {};
    stimolo.cardsPool.forEach((e: EventoNarrativo) => { m[e.id] = e.testo; });
    cardMap.current = m;
  }, [stimolo]);

  const allFilled = riordino.slots.every((s) => s !== null);

  // ── Render lettura ─────────────────────────────────────────────────────────
  if (fase === "lettura") {
    return (
      <div className="flex flex-col items-start gap-4 px-4 py-4">
        <p style={{
          fontSize: "0.7rem", color: "#38BDF8", fontWeight: 700,
          letterSpacing: "0.08em",
        }}>
          LEGGI CON ATTENZIONE
        </p>
        <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
          Dopo ti chiederemo di rimettere in ordine i pezzi della storia.
        </p>
        <div style={{
          width: "100%", borderRadius: "1.25rem",
          backgroundColor: "#F8FAFC", border: "2px solid #CBD5E1",
          padding: "1.25rem",
        }}>
          <p style={{
            fontSize: "1.05rem", lineHeight: 1.75,
            color: "#1E293B", fontWeight: 400,
          }}>
            {stimolo.testo}
          </p>
        </div>
        <button
          onClick={handleProsegui}
          className="active:scale-95"
          style={{
            width: "100%", padding: "0.9rem",
            borderRadius: "0.9rem", fontSize: "1rem", fontWeight: 700,
            backgroundColor: "#1E3A5F", color: "#FFFFFF",
            border: "none", cursor: "pointer",
          }}
        >
          Ho letto — Prosegui
        </button>
      </div>
    );
  }

  // ── Render riordino ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* Header */}
      <p style={{
        fontSize: "0.7rem", color: "#7C3AED", fontWeight: 700,
        letterSpacing: "0.08em",
      }}>
        METTI IN ORDINE
      </p>
      <p style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
        Seleziona un pezzo, poi tocca il numero dove vuoi metterlo.
      </p>

      {/* Slot zone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {riordino.slots.map((slotId, idx) => (
          <button
            key={idx}
            onClick={() => handleTapSlot(idx)}
            className="active:scale-98"
            style={{
              width: "100%",
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.7rem 1rem",
              borderRadius: "0.85rem",
              border: slotId ? "2px solid #7C3AED" : "2px dashed #C4B5FD",
              backgroundColor: slotId ? "#F5F3FF" : "#FAFAFA",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{
              minWidth: "1.6rem", height: "1.6rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: slotId ? "#7C3AED" : "#E9D5FF",
              color: slotId ? "#FFFFFF" : "#7C3AED",
              fontSize: "0.8rem", fontWeight: 800,
              flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <span style={{
              fontSize: "0.9rem", fontWeight: slotId ? 600 : 400,
              color: slotId ? "#3730A3" : "#9CA3AF",
            }}>
              {slotId ? cardMap.current[slotId] : "Tocca per piazzare qui"}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        margin: "0.25rem 0",
      }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
        <p style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>
          PEZZI DISPONIBILI
        </p>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
      </div>

      {/* Pool zone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {riordino.pool.length === 0 ? (
          <p style={{
            fontSize: "0.85rem", color: "#94A3B8",
            textAlign: "center", padding: "0.5rem",
          }}>
            Tutti i pezzi sono stati piazzati.
          </p>
        ) : (
          riordino.pool.map((id) => {
            const isSelected = riordino.selected === id;
            return (
              <button
                key={id}
                onClick={() => handleTapPool(id)}
                className="active:scale-95"
                style={{
                  width: "100%", padding: "0.75rem 1rem",
                  borderRadius: "0.85rem", fontSize: "0.9rem", fontWeight: 600,
                  border: isSelected ? "2px solid #D97706" : "2px solid #D1D5DB",
                  backgroundColor: isSelected ? "#FEF3C7" : "#FFFFFF",
                  color: isSelected ? "#92400E" : "#111827",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: isSelected ? "0 0 0 3px #FDE68A" : "none",
                  transition: "background-color 80ms, border-color 80ms",
                }}
              >
                {cardMap.current[id]}
              </button>
            );
          })
        )}
      </div>

      {/* Conferma */}
      <button
        onClick={handleConferma}
        disabled={!allFilled}
        className="active:scale-95"
        style={{
          width: "100%", padding: "0.9rem",
          borderRadius: "0.9rem", fontSize: "1rem", fontWeight: 700,
          backgroundColor: allFilled ? "#1E3A5F" : "#CBD5E1",
          color: allFilled ? "#FFFFFF" : "#94A3B8",
          border: "none", cursor: allFilled ? "pointer" : "not-allowed",
          marginTop: "0.25rem",
          transition: "background-color 150ms",
        }}
      >
        Conferma ordine
      </button>
    </div>
  );
}
