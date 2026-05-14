"use client";

/**
 * FallingObjectsSession — sessione gioco Stimoli Cadenti.
 *
 *   ⭐  GO    — tocca subito
 *   emoji NO-GO — ignora; se tappata, errore ma gioco continua
 *   💣  BOMB  — non toccare mai; se tappata → game over immediato
 *
 * Posizione X casuale nell'area (niente colonne fisse).
 * Posizione Y aggiornata via setInterval ogni 50ms.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import { GAME_H_PX, STIMOLO_SIZE_PX, type FallLevelConfig } from "./levels";

// ── Costanti ───────────────────────────────────────────────────────────────────

const FALL_FROM  = -(STIMOLO_SIZE_PX + 18);
const FALL_TO    = GAME_H_PX + 20;
const FALL_RANGE = FALL_TO - FALL_FROM;

// Zona sicura per il centro X dello stimolo (percentuale)
const X_MIN_PCT = 12;
const X_MAX_PCT = 88;
// Separazione minima tra centri X (percentuale) per evitare sovrapposizioni
const X_MIN_SEP = 22;

const GO_EMOJIS   = ["⭐", "🌟", "💫", "✨"];
const NOGO_EMOJIS = ["🍎", "🍋", "🍇", "🎈", "🌸", "🦋", "🍦", "🌺", "🍄", "🐸", "🎭", "🌙"];
const BOMB_EMOJI  = "💣";
const HALF        = STIMOLO_SIZE_PX / 2;

// Palette colori condivisa tra tutti i tipi di stimolo —
// il giocatore non può fare affidamento sul colore, solo sull'emoji.
const BUBBLE_STYLES: { bg: string; border: string }[] = [
  { bg: "linear-gradient(135deg,#3B82F6,#1D4ED8)", border: "#1E40AF" },
  { bg: "linear-gradient(135deg,#8B5CF6,#6D28D9)", border: "#4C1D95" },
  { bg: "linear-gradient(135deg,#F97316,#C2410C)", border: "#9A3412" },
  { bg: "linear-gradient(135deg,#EC4899,#BE185D)", border: "#9D174D" },
  { bg: "linear-gradient(135deg,#14B8A6,#0F766E)", border: "#0D5E58" },
  { bg: "linear-gradient(135deg,#EF4444,#B91C1C)", border: "#991B1B" },
  { bg: "linear-gradient(135deg,#EAB308,#A16207)", border: "#854D0E" },
  { bg: "linear-gradient(135deg,#22C55E,#15803D)", border: "#166534" },
  { bg: "linear-gradient(135deg,#06B6D4,#0E7490)", border: "#155E75" },
  { bg: "linear-gradient(135deg,#6366F1,#4338CA)", border: "#3730A3" },
];

// ── CSS ────────────────────────────────────────────────────────────────────────

const ANIM = `
@keyframes fo-sway {
  0%, 100% { transform: translateX(0); }
  30%      { transform: translateX(-7px); }
  70%      { transform: translateX(7px); }
}
@keyframes fo-hit-burst {
  0%   { transform: scale(1);   opacity: 1; }
  40%  { transform: scale(1.9); opacity: 0.8; }
  100% { transform: scale(0.1); opacity: 0; }
}
@keyframes fo-err-shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-8px); }
  40%     { transform: translateX(8px); }
  60%     { transform: translateX(-6px); }
  80%     { transform: translateX(6px); }
}
@keyframes fo-bomb-explode {
  0%   { transform: scale(1);   opacity: 1; }
  25%  { transform: scale(2.5); opacity: 1; }
  60%  { transform: scale(4);   opacity: 0.5; }
  100% { transform: scale(5.5); opacity: 0; }
}
@keyframes fo-gameover-in {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fo-flash-err {
  0%   { opacity: 0; }
  20%  { opacity: 0.35; }
  100% { opacity: 0; }
}
@keyframes fo-flash-bomb {
  0%   { opacity: 0; }
  10%  { opacity: 0.65; }
  100% { opacity: 0; }
}
`;

// ── Tipi ───────────────────────────────────────────────────────────────────────

type TipoStimolo = "go" | "nogo" | "bomb";

interface StimoloCadente {
  id:        number;
  tipo:      TipoStimolo;
  emoji:     string;
  bg:        string;
  border:    string;
  centerPct: number;
  spawnAt:   number;
  fallMs:    number;
  topPx:     number;
}

interface StimoloTappato {
  id:        number;
  tipo:      TipoStimolo;
  esito:     "ok" | "err";
  emoji:     string;
  bg:        string;
  border:    string;
  centerPct: number;
  topPx:     number;
  tapAt:     number;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function computeTop(spawnAt: number, fallMs: number): number {
  return FALL_FROM + Math.min(1, (Date.now() - spawnAt) / fallMs) * FALL_RANGE;
}

/** Opacity: fade-in nei primi 80px visibili, fade-out negli ultimi 90px. */
function computeOpacity(topPx: number): number {
  const FADE_IN_END   = 40;               // completamente visibile a top=40px
  const FADE_OUT_START = GAME_H_PX - 110; // inizia a sparire a 110px dal fondo
  if (topPx < FADE_IN_END) {
    return Math.max(0, (topPx - FALL_FROM) / (FADE_IN_END - FALL_FROM));
  }
  if (topPx > FADE_OUT_START) {
    return Math.max(0, 1 - (topPx - FADE_OUT_START) / (GAME_H_PX - FADE_OUT_START));
  }
  return 1;
}

/** Sceglie una posizione X casuale evitando sovrapposizioni con stimoli esistenti. */
function pickCenterPct(existing: number[]): number {
  const range = X_MAX_PCT - X_MIN_PCT;
  for (let i = 0; i < 12; i++) {
    const pct = X_MIN_PCT + Math.random() * range;
    if (existing.every((p) => Math.abs(p - pct) >= X_MIN_SEP)) return pct;
  }
  // fallback: posizione casuale senza controllo
  return X_MIN_PCT + Math.random() * range;
}

function stimoloLeft(centerPct: number): string {
  return `calc(${centerPct}% - ${HALF}px)`;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  config:       FallLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function FallingObjectsSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  const [cadenti,      setCadenti]      = useState<StimoloCadente[]>([]);
  const [tappati,      setTappati]      = useState<StimoloTappato[]>([]);
  const [flashType,    setFlashType]    = useState<"none" | "err" | "bomb">("none");
  const [bombaEsplosa, setBombaEsplosa] = useState(false);

  const goTotRef     = useRef(0);
  const goHitRef     = useRef(0);
  const nogoTotRef   = useRef(0);
  const nogoErrRef   = useRef(0);
  const bombTotRef   = useRef(0);
  const nextIdRef    = useRef(0);
  const lastSpawnRef = useRef<number>(0);
  const completedRef = useRef(false);
  const configRef    = useRef(config);

  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => { onReady(); }, []); // eslint-disable-line

  // ── Finalizza sessione ────────────────────────────────────────────────────────

  const finalizza = useCallback((bombaTappata: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const goTot = goTotRef.current;
    const acc   = goTot > 0 ? goHitRef.current / goTot : 0;
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo: Math.round(acc * 100),
      metriche: {
        go_totale:     goTot,
        go_hit:        goHitRef.current,
        nogo_totale:   nogoTotRef.current,
        nogo_err:      nogoErrRef.current,
        bomb_totale:   bombTotRef.current,
        bomba_esplosa: bombaTappata ? 1 : 0,
      },
    } as unknown as SessionResult);
  }, []); // eslint-disable-line

  // ── Game loop ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (completedRef.current) return;

    const id = setInterval(() => {
      if (completedRef.current) return;

      const now = Date.now();
      const cfg = configRef.current;

      // Aggiorna posizioni e rimuovi usciti
      setCadenti((prev) =>
        prev
          .map((s) => ({ ...s, topPx: computeTop(s.spawnAt, s.fallMs) }))
          .filter((s) => now - s.spawnAt < s.fallMs),
      );
      setTappati((prev) => prev.filter((t) => now - t.tapAt < 500));

      // Spawn
      if (now - lastSpawnRef.current >= cfg.isiMs) {
        setCadenti((prev) => {
          if (prev.length >= cfg.maxActive) return prev;

          lastSpawnRef.current = now;

          const centerPct = pickCenterPct(prev.map((s) => s.centerPct));

          const r = Math.random();
          let tipo: TipoStimolo;
          if      (r < cfg.bombRate)               tipo = "bomb";
          else if (r < cfg.bombRate + cfg.nogoRate) tipo = "nogo";
          else                                      tipo = "go";

          const emoji = tipo === "bomb" ? BOMB_EMOJI
                      : tipo === "nogo" ? NOGO_EMOJIS[Math.floor(Math.random() * NOGO_EMOJIS.length)]
                      : GO_EMOJIS[Math.floor(Math.random() * GO_EMOJIS.length)];

          if      (tipo === "go")   goTotRef.current++;
          else if (tipo === "nogo") nogoTotRef.current++;
          else                      bombTotRef.current++;

          const style = BUBBLE_STYLES[Math.floor(Math.random() * BUBBLE_STYLES.length)];

          return [
            ...prev,
            { id: nextIdRef.current++, tipo, emoji, bg: style.bg, border: style.border, centerPct, spawnAt: now, fallMs: cfg.fallMs, topPx: FALL_FROM },
          ];
        });
      }
    }, 50);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Tempo scaduto ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (tempoScaduto) finalizza(false);
  }, [tempoScaduto, finalizza]);

  // ── Handler tap ───────────────────────────────────────────────────────────────

  const handleTap = useCallback((s: StimoloCadente) => {
    if (completedRef.current) return;
    setCadenti((prev) => prev.filter((x) => x.id !== s.id));

    const base = { id: s.id, tipo: s.tipo, emoji: s.emoji, bg: s.bg, border: s.border, centerPct: s.centerPct, topPx: s.topPx, tapAt: Date.now() };

    if (s.tipo === "go") {
      goHitRef.current++;
      setTappati((p) => [...p, { ...base, esito: "ok" }]);

    } else if (s.tipo === "nogo") {
      nogoErrRef.current++;
      setFlashType("err");
      setTimeout(() => setFlashType("none"), 400);
      setTappati((p) => [...p, { ...base, esito: "err" }]);

    } else {
      setBombaEsplosa(true);
      setFlashType("bomb");
      setTappati((p) => [...p, { ...base, esito: "err" }]);
      setTimeout(() => finalizza(true), 1800);
    }
  }, [finalizza]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", userSelect: "none" }}>
      <style>{ANIM}</style>

      {/* Area di gioco */}
      <div style={{
        position: "relative", width: "100%", height: GAME_H_PX,
        backgroundColor: "#F8FAFF", overflow: "hidden",
        backgroundImage: "radial-gradient(circle at 50% 0%, #EEF4FF 0%, #F8FAFF 70%)",
      }}>

        {/* Flash penalità */}
        {flashType === "err" && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
            backgroundColor: "#F59E0B",
            animation: "fo-flash-err 400ms ease-out forwards",
          }} />
        )}
        {flashType === "bomb" && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
            backgroundColor: "#DC2626",
            animation: "fo-flash-bomb 600ms ease-out forwards",
          }} />
        )}

        {/* Game over overlay */}
        {bombaEsplosa && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 25,
            backgroundColor: "rgba(0,0,0,0.78)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.75rem",
            animation: "fo-gameover-in 350ms ease-out both",
          }}>
            <span style={{ fontSize: "4rem", lineHeight: 1 }}>💣</span>
            <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
              Bomba!
            </p>
            <p style={{ fontSize: "0.9rem", color: "#FCA5A5", margin: 0, fontWeight: 600 }}>
              Partita interrotta
            </p>
          </div>
        )}

        {/* Stimoli cadenti */}
        {cadenti.map((s) => (
          <button
            key={s.id}
            onClick={() => handleTap(s)}
            style={{
              position:       "absolute",
              top:            s.topPx,
              left:           stimoloLeft(s.centerPct),
              width:          STIMOLO_SIZE_PX,
              height:         STIMOLO_SIZE_PX,
              borderRadius:   "50%",
              background:     s.bg,
              border:         `3px solid ${s.border}`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "2.2rem",
              lineHeight:     1,
              cursor:         "pointer",
              padding:        0,
              zIndex:         10,
              opacity:        computeOpacity(s.topPx),
              animation:      s.tipo === "go" ? "fo-sway 1000ms ease-in-out infinite" : undefined,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {s.emoji}
          </button>
        ))}

        {/* Pavimento — gli oggetti scompaiono "sotto terra" anziché tagliarsi al bordo */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 64,
          pointerEvents: "none",
          zIndex: 12,
        }}>
          {/* Linea di terra con bagliore */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(to right, transparent 0%, #6366F1 20%, #818CF8 50%, #6366F1 80%, transparent 100%)",
            opacity: 0.45,
          }} />
          {/* Sfumatura che copre gli oggetti mentre scendono */}
          <div style={{
            position: "absolute", top: 2, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(to top, #F8FAFF 0%, #F8FAFF 50%, rgba(248,250,255,0.85) 75%, transparent 100%)",
          }} />
        </div>

        {/* Effetti tap */}
        {tappati.map((t) => (
          <div key={t.id} style={{
            position:  "absolute",
            top:       t.topPx,
            left:      stimoloLeft(t.centerPct),
            width:     STIMOLO_SIZE_PX,
            height:    STIMOLO_SIZE_PX,
            borderRadius: "50%",
            background:   t.bg,
            border:       `3px solid ${t.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", lineHeight: 1,
            animation: t.esito === "ok"
              ? "fo-hit-burst 420ms ease-out forwards"
              : t.tipo === "bomb"
              ? "fo-bomb-explode 600ms ease-out forwards"
              : "fo-err-shake 350ms ease-out forwards",
            pointerEvents: "none", zIndex: 11,
          }}>
            {t.emoji}
          </div>
        ))}
      </div>

    </div>
  );
}
