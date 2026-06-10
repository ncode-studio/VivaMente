"use client";

/**
 * TutorialOverlay — schermata tutorial condivisa da tutte le famiglie.
 *
 * Struttura di riferimento: L'Osservatorio Stellare.
 *   occhiello "Come si gioca" → titolo → anteprima (demo) → 3 righe-istruzione
 *   → CTA. Accento per categoria (config.accent), colori dell'app.
 *
 * Supporta più pagine (Avanti/Indietro/Salta) quando la meccanica è complessa.
 * Retrocompatibile: se una pagina usa `testo` invece di `righe`, mostra il
 * paragrafo introduttivo.
 *
 * Responsabilità: navigazione, focus trap, Esc disabilitato, accessibilità.
 * Nessuna persistenza (la gestisce page.tsx tramite mostraTutorial).
 * see docs/gdd/shared/02-trial-flow.md §Schermata tutorial
 */

import { useState, useRef, useEffect } from "react";
import type { TutorialConfig } from "@/lib/exercise-types";
import { COLORS } from "@/lib/design-tokens";

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

/** Accento di default (blu) quando la famiglia non specifica config.accent. */
const DEFAULT_ACCENT = "#1891B1";

// ── Riga-istruzione ─────────────────────────────────────────────────────────

function RigaIstruzione({ icona, testo, accent }: { icona: string; testo: string; accent: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 14px", borderRadius: 14,
      background: COLORS.surface, border: `1.5px solid ${COLORS.border}`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem", lineHeight: 1,
      }}>
        {icona}
      </div>
      <p style={{ fontSize: 14, color: COLORS.inkPrimary, lineHeight: 1.4, margin: 0 }}>
        {testo}
      </p>
    </div>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TutorialOverlay({ config, onComplete }: TutorialOverlayProps) {
  const { pagine, accent = DEFAULT_ACCENT, ctaLabel } = config;
  const [paginaCorrente, setPaginaCorrente] = useState(0);

  const pagina       = pagine[paginaCorrente];
  const paginaTotali = pagine.length;
  const isUltima     = paginaCorrente === paginaTotali - 1;
  const labelId      = pagina.titolo ? ID_TITOLO : ID_TESTO;

  const dialogRef   = useRef<HTMLDivElement>(null);
  const primarioRef = useRef<HTMLButtonElement>(null);

  // ── Focus iniziale e re-focus al cambio pagina ────────────────────────────
  useEffect(() => {
    primarioRef.current?.focus();
  }, [paginaCorrente]);

  // ── Focus trap + Esc disabilitato (listener su window) ───────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); return; }
      if (e.key !== "Tab") return;

      const node = dialogRef.current;
      if (!node) return;

      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        primarioRef.current?.focus();
        return;
      }

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
  }, []);

  // ── Navigazione ───────────────────────────────────────────────────────────

  function avanti() {
    if (isUltima) { onComplete(); return; }
    setPaginaCorrente(p => p + 1);
  }

  function indietro() {
    setPaginaCorrente(p => Math.max(0, p - 1));
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
        background: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        padding: "44px 20px 32px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          flexGrow: 1,
        }}
      >
        {/* Occhiello */}
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 800,
          color: accent, letterSpacing: "0.12em",
          textTransform: "uppercase", textAlign: "center",
        }}>
          Come si gioca
        </p>

        {/* Titolo */}
        {pagina.titolo && (
          <h2
            id={ID_TITOLO}
            style={{
              fontSize: 24, fontWeight: 900,
              color: COLORS.inkPrimary, textAlign: "center", margin: 0,
              lineHeight: 1.15,
            }}
          >
            {pagina.titolo}
          </h2>
        )}

        {/* Indicatore pallini (solo multi-pagina) */}
        {paginaTotali > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }} aria-hidden="true">
            {Array.from({ length: paginaTotali }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: i === paginaCorrente ? accent : COLORS.border,
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        )}

        {/* Anteprima / demo */}
        {pagina.demo != null && (
          <div
            style={{
              width: "100%",
              borderRadius: 12,
              background: COLORS.surface,
              border: `1.5px solid ${COLORS.border}`,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {pagina.demo}
          </div>
        )}

        {/* Paragrafo introduttivo opzionale (retrocompat / contesto breve) */}
        {pagina.testo && (
          <p
            id={ID_TESTO}
            aria-live="polite"
            style={{
              fontSize: 15, lineHeight: 1.5,
              color: COLORS.inkSecondary, textAlign: "center", margin: 0,
            }}
          >
            {pagina.testo}
          </p>
        )}

        {/* Righe-istruzione (struttura Osservatorio) */}
        {pagina.righe && pagina.righe.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pagina.righe.map((r, i) => (
              <RigaIstruzione key={i} icona={r.icona} testo={r.testo} accent={accent} />
            ))}
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {/* Pulsanti */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {paginaCorrente > 0 && (
              <button
                onClick={indietro}
                style={{
                  padding: "14px 18px", fontSize: 15, fontWeight: 700,
                  borderRadius: 12, border: `1.5px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.inkSecondary,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                ← Indietro
              </button>
            )}

            <button
              ref={primarioRef}
              onClick={avanti}
              style={{
                flex: 1, padding: "15px 18px",
                fontSize: 16, fontWeight: 800,
                borderRadius: 12, border: "none",
                background: accent, color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              {isUltima ? (ctaLabel ?? "Ho capito — Inizia") : "Avanti →"}
            </button>
          </div>

          {!isUltima && (
            <button
              onClick={onComplete}
              style={{
                background: "none", border: "none",
                color: COLORS.inkMuted, fontSize: 13, cursor: "pointer",
                padding: "6px", alignSelf: "center",
                textDecoration: "underline", textUnderlineOffset: 3,
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
