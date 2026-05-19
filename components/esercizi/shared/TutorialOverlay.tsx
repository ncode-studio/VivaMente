"use client";

/**
 * TutorialOverlay — schermata tutorial multi-pagina condivisa da tutte le famiglie.
 *
 * Responsabilità: navigazione tra pagine, focus trap, Esc disabilitato, accessibilità.
 * Nessuna logica di persistenza (la gestisce page.tsx tramite mostraTutorial).
 * see docs/gdd/shared/02-trial-flow.md §Schermata tutorial
 */

import { useState, useRef, useEffect } from "react";
import type { TutorialConfig } from "@/lib/exercise-types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface TutorialOverlayProps {
  config: TutorialConfig;
  onComplete(): void;
}

// ── Costanti ──────────────────────────────────────────────────────────────────

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ID_TITOLO = "tutorial-overlay-titolo";
const ID_TESTO  = "tutorial-overlay-testo";

// ── Componente ────────────────────────────────────────────────────────────────

export function TutorialOverlay({ config, onComplete }: TutorialOverlayProps) {
  const { pagine } = config;
  const [paginaCorrente, setPaginaCorrente] = useState(0);

  const pagina       = pagine[paginaCorrente];
  const paginaTotali = pagine.length;
  const isUltima     = paginaCorrente === paginaTotali - 1;
  // Labelledby: titolo se presente, altrimenti il paragrafo testo
  const labelId      = pagina.titolo ? ID_TITOLO : ID_TESTO;

  const dialogRef   = useRef<HTMLDivElement>(null);
  const primarioRef = useRef<HTMLButtonElement>(null);

  // ── Focus iniziale e re-focus al cambio pagina ────────────────────────────
  // Focus sul pulsante primario ad ogni cambio pagina, incluso "← Indietro".
  // Scelta deliberata: riduce il carico cognitivo per utenti 60+ che non devono
  // cercare dove si trova il focus dopo ogni transizione.

  useEffect(() => {
    primarioRef.current?.focus();
  }, [paginaCorrente]);

  // ── Focus trap + Esc disabilitato (listener su window) ───────────────────
  // Listener su window anziché su dialogRef: cattura Tab anche se il focus
  // esce accidentalmente dal dialog (estensioni browser, scrollbar, ecc.).
  // Beneficio collaterale: Esc è disabilitato globalmente durante il tutorial,
  // coerente con la scelta di non consentire chiusure accidentali.

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); return; }
      if (e.key !== "Tab") return;

      const node = dialogRef.current;
      if (!node) return;

      // Se il focus è uscito dal dialog, riportalo sul pulsante primario
      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        primarioRef.current?.focus();
        return;
      }

      // Wrap-around: dal primo all'ultimo e viceversa
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // registrato una volta al mount; rimosso all'unmount

  // ── Navigazione ───────────────────────────────────────────────────────────

  function avanti() {
    if (isUltima) { onComplete(); return; }
    setPaginaCorrente(p => p + 1);
  }

  function indietro() {
    setPaginaCorrente(p => Math.max(0, p - 1));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Palette "atelier vintage" coerente con le famiglie più recenti
  // (Il Postino, Mosaicista, Restauratore). Tono carta crema + seppia.
  const BG        = "#F4ECD8";
  const CARD      = "#FBF5E5";
  const CARD_EDGE = "#E0CFA5";
  const INK       = "#3D2914";
  const INK_SOFT  = "#7A5A38";
  const ACCENT    = "#7A5A38";
  const SERIF     = "Georgia, 'Times New Roman', serif";
  const SANS      = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        padding: "44px 20px 32px",
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          flexGrow: 1,
        }}
      >
        {/* Eyebrow */}
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 700,
          color: INK_SOFT, letterSpacing: "0.18em",
          textTransform: "uppercase", textAlign: "center",
        }}>
          Come si gioca
        </p>

        {/* Titolo */}
        {pagina.titolo && (
          <h2
            id={ID_TITOLO}
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: INK,
              textAlign: "center",
              margin: 0,
              fontFamily: SERIF,
              letterSpacing: "-0.005em",
            }}
          >
            {pagina.titolo}
          </h2>
        )}

        {/* Indicatore pallini (solo multi-pagina) */}
        {paginaTotali > 1 && (
          <div
            style={{ display: "flex", justifyContent: "center", gap: 8 }}
            aria-hidden="true"
          >
            {Array.from({ length: paginaTotali }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: i === paginaCorrente ? ACCENT : "#D6C9A8",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        )}

        {/* Area demo: cartolina crema */}
        {pagina.demo != null && (
          <div
            style={{
              width: "100%",
              borderRadius: 6,
              background: CARD,
              border: `1.5px solid ${CARD_EDGE}`,
              padding: "20px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(61,41,20,0.10)",
            }}
          >
            {pagina.demo}
          </div>
        )}

        {/* Testo istruzioni in serif */}
        <div aria-live="polite">
          <p
            id={ID_TESTO}
            style={{
              fontSize: 17,
              lineHeight: 1.62,
              color: INK,
              textAlign: "center",
              margin: 0,
              fontFamily: SERIF,
            }}
          >
            {pagina.testo}
          </p>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {paginaCorrente > 0 && (
              <button
                onClick={indietro}
                style={{
                  padding: "13px 18px",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: `1.5px solid ${INK_SOFT}`,
                  background: "transparent",
                  color: INK_SOFT,
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: SANS,
                  letterSpacing: "0.02em",
                }}
              >
                ← Indietro
              </button>
            )}

            <button
              ref={primarioRef}
              onClick={avanti}
              style={{
                flex: 1,
                padding: "15px 18px",
                fontSize: isUltima ? 17 : 15,
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                background: ACCENT,
                color: "#FFFFFF",
                cursor: "pointer",
                fontFamily: SANS,
                letterSpacing: "0.02em",
                boxShadow: "0 1px 3px rgba(61,41,20,0.25)",
              }}
            >
              {isUltima ? "Ho capito — Inizia" : "Avanti →"}
            </button>
          </div>

          {!isUltima && (
            <button
              onClick={onComplete}
              style={{
                background: "none",
                border: "none",
                color: INK_SOFT,
                fontSize: 13,
                cursor: "pointer",
                padding: "6px",
                alignSelf: "center",
                fontFamily: SERIF,
                letterSpacing: "0.04em",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Salta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
