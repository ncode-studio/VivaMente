"use client";

/**
 * PescatoreSession — sessione "Il Pescatore".
 *
 * Due zone d'acqua affiancate:
 *   - LAGO  (sinistra): target FISSO per tutta la sessione
 *   - MARE  (destra)  : target che cambia ogni regolaMareChangeMs
 *
 * I pesci nuotano orizzontalmente all'interno della propria zona,
 * con direzione casuale e Y casuale. Lo specchio d'acqua è suddiviso
 * a metà dalla colonna centrale (riva).
 *
 * Accuratezza valutativa =
 *   (target tappati correttamente + non-target lasciati passare) /
 *   (target spawnati + non-target spawnati)
 *
 * Conta come errore:
 *   - tap su pesce non-target  (commissione)
 *   - target lasciato uscire dalla zona  (omissione)
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  PESC_GAME_H_PX,
  PESC_SPRITE_SIZE_PX,
  PESC_SPECIE,
  type PescLevelConfig,
  type PescSpecieId,
} from "./levels";
import { PesceSprite } from "./sprites";

// ── CSS animazioni ────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes pesc-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes pesc-catch-glow {
  0%   { transform: scale(1);   opacity: 0.9; }
  60%  { transform: scale(1.6); opacity: 0.5; }
  100% { transform: scale(2.1); opacity: 0; }
}
@keyframes pesc-shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  50%      { transform: translateX(6px);  }
  75%      { transform: translateX(-3px); }
}
@keyframes pesc-bubble-up {
  0%   { transform: translate(0, 0)        scale(0.9); opacity: 0; }
  10%  { opacity: 0.6; }
  50%  { transform: translate(8px, -180px) scale(1.05); opacity: 0.55; }
  90%  { opacity: 0.35; }
  100% { transform: translate(-6px, -380px) scale(0.5); opacity: 0; }
}
@keyframes pesc-rule-flash {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(56,189,248,0.65); }
  50%  { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(56,189,248,0);   }
  100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(56,189,248,0);    }
}

/* ── Acqua animata ───────────────────────────────────────────────────────── */

@keyframes pesc-wave-shift-1 {
  0%   { transform: translateX(0);     }
  100% { transform: translateX(-120px); }
}
@keyframes pesc-wave-shift-2 {
  0%   { transform: translateX(0);     }
  100% { transform: translateX(-160px); }
}
@keyframes pesc-wave-shift-3 {
  0%   { transform: translateX(0);     }
  100% { transform: translateX(-90px);  }
}
@keyframes pesc-caustic-shimmer {
  0%, 100% { opacity: 0.16; transform: translateX(0)    skewX(-12deg); }
  50%      { opacity: 0.42; transform: translateX(14px) skewX(-12deg); }
}
@keyframes pesc-caustic-shimmer-2 {
  0%, 100% { opacity: 0.10; transform: translateX(0)     skewX(-12deg); }
  50%      { opacity: 0.32; transform: translateX(-10px) skewX(-12deg); }
}
@keyframes pesc-particle-drift {
  0%   { transform: translate(0, 0);          opacity: 0; }
  20%  { opacity: 0.55; }
  100% { transform: translate(60px, -40px);   opacity: 0; }
}
@keyframes pesc-particle-drift-rev {
  0%   { transform: translate(0, 0);           opacity: 0; }
  20%  { opacity: 0.5; }
  100% { transform: translate(-50px, -55px);   opacity: 0; }
}
@keyframes pesc-ripple-pulse {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 0.55; }
}
`;

// ── Tipi runtime ──────────────────────────────────────────────────────────────

type Zona = "lago" | "mare";

interface PesceAttivo {
  id:        number;
  zona:      Zona;
  specie:    PescSpecieId;
  /** Posizione Y in px (fissa per la durata della traversata). */
  topPx:     number;
  /** 1 = nuota verso destra, -1 = verso sinistra. */
  direzione: 1 | -1;
  spawnAt:   number;
  crossMs:   number;
  /** % posizione X all'interno della zona (0..100). */
  xPct:      number;
}

interface FeedbackTap {
  id:        number;
  zona:      Zona;
  specie:    PescSpecieId;
  direzione: 1 | -1;
  esito:     "ok" | "err";
  topPx:     number;
  xPct:      number;
  tapAt:     number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function computeXPct(spawnAt: number, crossMs: number, direzione: 1 | -1): number {
  const t = Math.min(1.05, (Date.now() - spawnAt) / crossMs);
  const from = direzione === 1 ? -14 : 114;
  const to   = direzione === 1 ? 114 : -14;
  return from + t * (to - from);
}

/** Range Y di spawn (px dal top dell'area di gioco). Margine per HUD e fondale. */
const Y_MIN = 58;
const Y_MAX = PESC_GAME_H_PX - PESC_SPRITE_SIZE_PX - 24;

function pickTopPx(esistenti: readonly PesceAttivo[]): number {
  const minDist = PESC_SPRITE_SIZE_PX * 0.9;
  for (let i = 0; i < 6; i++) {
    const candidate = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
    if (esistenti.every((s) => Math.abs(s.topPx - candidate) > minDist)) return candidate;
  }
  return Y_MIN + Math.random() * (Y_MAX - Y_MIN);
}

function pickSpecie(pool: readonly PescSpecieId[], target: PescSpecieId, targetRate: number): PescSpecieId {
  if (Math.random() < targetRate) return target;
  // Distrattori = pool \ {target}; se pool è solo {target} (impossibile a poolSize≥2 ma per sicurezza), ritorna target.
  const distrattori = pool.filter((s) => s !== target);
  if (distrattori.length === 0) return target;
  return distrattori[Math.floor(Math.random() * distrattori.length)];
}

function pickNewTarget(pool: readonly PescSpecieId[], current: PescSpecieId): PescSpecieId {
  const candidati = pool.filter((s) => s !== current);
  if (candidati.length === 0) return current;
  return candidati[Math.floor(Math.random() * candidati.length)];
}


// ── Bolle decorative (sfondo) ─────────────────────────────────────────────────

interface Bubble { id: number; leftPct: number; sizePx: number; durMs: number; delayMs: number; }

function makeBubbles(n: number): Bubble[] {
  return Array.from({ length: n }, (_, i) => ({
    id:       i,
    leftPct:  3 + Math.random() * 94,
    sizePx:   4 + Math.random() * 12,
    durMs:    4500 + Math.random() * 3000,
    delayMs:  Math.random() * 5000,
  }));
}

// ── Particelle di plancton in deriva ─────────────────────────────────────────

interface Particle { id: number; leftPct: number; topPct: number; sizePx: number; durMs: number; delayMs: number; reverse: boolean; }

function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id:       i,
    leftPct:  Math.random() * 100,
    topPct:   15 + Math.random() * 75,
    sizePx:   2 + Math.random() * 3,
    durMs:    6000 + Math.random() * 5000,
    delayMs:  Math.random() * 6000,
    reverse:  Math.random() < 0.5,
  }));
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  config:       PescLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PescatoreSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  // Pool specie per il livello (slice deterministico — sempre le prime poolSize del catalogo).
  // Stabile fra render → no flicker dei target.
  const poolRef = useRef<PescSpecieId[]>(
    PESC_SPECIE.slice(0, config.poolSize).map((s) => s.id),
  );

  // Target lago: scelto una sola volta, FISSO per tutta la sessione.
  const targetLagoRef = useRef<PescSpecieId>(
    poolRef.current[Math.floor(Math.random() * poolRef.current.length)],
  );

  // Target mare: cambia ogni regolaMareChangeMs.
  const [targetMare, setTargetMare] = useState<PescSpecieId>(() => {
    const initial = pickNewTarget(poolRef.current, targetLagoRef.current);
    return initial;
  });
  const targetMareRef = useRef<PescSpecieId>(targetMare);
  useLayoutEffect(() => { targetMareRef.current = targetMare; }, [targetMare]);

  const [ruleMareFlash, setRuleMareFlash] = useState(0); // chiave per ri-trigger animazione

  const [pesci,    setPesci]    = useState<PesceAttivo[]>([]);
  const [feedback, setFeedback] = useState<FeedbackTap[]>([]);

  // Tracking accuratezza
  const targetSpawnLago = useRef(0);
  const targetHitLago   = useRef(0);
  const targetMissLago  = useRef(0);
  const nontargSpawnLago = useRef(0);
  const nontargTapLago   = useRef(0);

  const targetSpawnMare = useRef(0);
  const targetHitMare   = useRef(0);
  const targetMissMare  = useRef(0);
  const nontargSpawnMare = useRef(0);
  const nontargTapMare   = useRef(0);

  const nextIdRef        = useRef(0);
  const lastSpawnLagoRef = useRef(0);
  const lastSpawnMareRef = useRef(0);
  const lastRuleChangeRef = useRef(Date.now());
  const completedRef     = useRef(false);
  const configRef        = useRef(config);

  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => { onReady(); }, []); // eslint-disable-line

  // Bolle e particelle decorative (statiche per zona, generate una volta).
  const bubblesLagoRef    = useRef<Bubble[]>(makeBubbles(11));
  const bubblesMareRef    = useRef<Bubble[]>(makeBubbles(11));
  const particlesLagoRef  = useRef<Particle[]>(makeParticles(14));
  const particlesMareRef  = useRef<Particle[]>(makeParticles(14));

  // ── Game loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (completedRef.current) return;

    const id = setInterval(() => {
      if (completedRef.current) return;

      const now = Date.now();
      const cfg = configRef.current;

      // Aggiorna posizioni + rileva uscite (miss su target).
      setPesci((prev) => {
        const out: PesceAttivo[] = [];
        for (const p of prev) {
          if (now - p.spawnAt >= p.crossMs) {
            const isTarget = p.zona === "lago"
              ? p.specie === targetLagoRef.current
              : p.specie === targetMareRef.current;
            if (isTarget) {
              if (p.zona === "lago") targetMissLago.current++;
              else                   targetMissMare.current++;
            }
            continue;
          }
          out.push({ ...p, xPct: computeXPct(p.spawnAt, p.crossMs, p.direzione) });
        }
        return out;
      });

      setFeedback((prev) => prev.filter((f) => now - f.tapAt < 500));

      // Cambio regola mare.
      if (now - lastRuleChangeRef.current >= cfg.regolaMareChangeMs) {
        lastRuleChangeRef.current = now;
        const next = pickNewTarget(poolRef.current, targetMareRef.current);
        if (next !== targetMareRef.current) {
          setTargetMare(next);
          setRuleMareFlash((k) => k + 1);
        }
      }

      // Spawn lago.
      if (now - lastSpawnLagoRef.current >= cfg.spawnMs) {
        setPesci((prev) => {
          const pesciLago = prev.filter((p) => p.zona === "lago");
          if (pesciLago.length >= cfg.maxActive) return prev;

          lastSpawnLagoRef.current = now;
          const specie = pickSpecie(poolRef.current, targetLagoRef.current, cfg.targetRate);
          const direzione: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          const topPx = pickTopPx(pesciLago);

          if (specie === targetLagoRef.current) targetSpawnLago.current++;
          else                                   nontargSpawnLago.current++;

          return [...prev, {
            id:      nextIdRef.current++,
            zona:    "lago",
            specie,
            topPx,
            direzione,
            spawnAt: now,
            crossMs: cfg.crossMs,
            xPct:    direzione === 1 ? -14 : 114,
          }];
        });
      }

      // Spawn mare.
      if (now - lastSpawnMareRef.current >= cfg.spawnMs) {
        setPesci((prev) => {
          const pesciMare = prev.filter((p) => p.zona === "mare");
          if (pesciMare.length >= cfg.maxActive) return prev;

          lastSpawnMareRef.current = now;
          const specie = pickSpecie(poolRef.current, targetMareRef.current, cfg.targetRate);
          const direzione: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          const topPx = pickTopPx(pesciMare);

          if (specie === targetMareRef.current) targetSpawnMare.current++;
          else                                   nontargSpawnMare.current++;

          return [...prev, {
            id:      nextIdRef.current++,
            zona:    "mare",
            specie,
            topPx,
            direzione,
            spawnAt: now,
            crossMs: cfg.crossMs,
            xPct:    direzione === 1 ? -14 : 114,
          }];
        });
      }
    }, 50);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Completamento ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;

    const targetTotL = targetSpawnLago.current;
    const targetTotM = targetSpawnMare.current;
    const nontargTotL = nontargSpawnLago.current;
    const nontargTotM = nontargSpawnMare.current;

    const targetHitTot   = targetHitLago.current + targetHitMare.current;
    const nontargIgnTot  =
      Math.max(0, nontargTotL - nontargTapLago.current) +
      Math.max(0, nontargTotM - nontargTapMare.current);

    const eventiTot   = targetTotL + targetTotM + nontargTotL + nontargTotM;
    const correttiTot = targetHitTot + nontargIgnTot;
    const acc = eventiTot > 0 ? correttiTot / eventiTot : 0;

    const targetSpawnTot = targetTotL + targetTotM;
    const score = targetSpawnTot > 0
      ? Math.round((targetHitTot / targetSpawnTot) * 100)
      : 0;

    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           score,
      metriche: {
        target_spawn_lago:  targetTotL,
        target_hit_lago:    targetHitLago.current,
        target_miss_lago:   targetMissLago.current,
        nontarg_spawn_lago: nontargTotL,
        nontarg_tap_lago:   nontargTapLago.current,

        target_spawn_mare:  targetTotM,
        target_hit_mare:    targetHitMare.current,
        target_miss_mare:   targetMissMare.current,
        nontarg_spawn_mare: nontargTotM,
        nontarg_tap_mare:   nontargTapMare.current,
      },
    });
  }, [tempoScaduto]);

  // ── Handler tap ───────────────────────────────────────────────────────────

  const handleTap = useCallback((p: PesceAttivo) => {
    if (completedRef.current) return;
    const now = Date.now();
    setPesci((prev) => prev.filter((x) => x.id !== p.id));

    const isTarget = p.zona === "lago"
      ? p.specie === targetLagoRef.current
      : p.specie === targetMareRef.current;

    if (isTarget) {
      if (p.zona === "lago") targetHitLago.current++;
      else                   targetHitMare.current++;
      setFeedback((f) => [...f, {
        id: p.id, zona: p.zona, specie: p.specie, direzione: p.direzione,
        esito: "ok", topPx: p.topPx, xPct: p.xPct, tapAt: now,
      }]);
    } else {
      if (p.zona === "lago") nontargTapLago.current++;
      else                   nontargTapMare.current++;
      setFeedback((f) => [...f, {
        id: p.id, zona: p.zona, specie: p.specie, direzione: p.direzione,
        esito: "err", topPx: p.topPx, xPct: p.xPct, tapAt: now,
      }]);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      <style>{ANIM_CSS}</style>

      <div style={{
        position: "relative",
        width: "100%",
        height: PESC_GAME_H_PX,
        overflow: "hidden",
        borderRadius: "0.5rem",
        display: "flex",
      }}>

        {/* ── Zona LAGO (sinistra) ─────────────────────────────────────── */}
        <ZonaAcqua
          zona="lago"
          targetSpecie={targetLagoRef.current}
          ruleFlashKey={0}
          bubbles={bubblesLagoRef.current}
          particles={particlesLagoRef.current}
          pesci={pesci.filter((p) => p.zona === "lago")}
          feedback={feedback.filter((f) => f.zona === "lago")}
          onTap={handleTap}
        />

        {/* Riva centrale */}
        <div style={{
          width: 6,
          flexShrink: 0,
          background: "linear-gradient(to bottom, #C2B280 0%, #B8A077 50%, #A18563 100%)",
          boxShadow: "0 0 10px rgba(0,0,0,0.18)",
          zIndex: 5,
        }} />

        {/* ── Zona MARE (destra) ──────────────────────────────────────── */}
        <ZonaAcqua
          zona="mare"
          targetSpecie={targetMare}
          ruleFlashKey={ruleMareFlash}
          bubbles={bubblesMareRef.current}
          particles={particlesMareRef.current}
          pesci={pesci.filter((p) => p.zona === "mare")}
          feedback={feedback.filter((f) => f.zona === "mare")}
          onTap={handleTap}
        />
      </div>
    </div>
  );
}

// ── Sub-componente: singola zona d'acqua ─────────────────────────────────────

interface ZonaProps {
  zona:         Zona;
  targetSpecie: PescSpecieId;
  ruleFlashKey: number;
  bubbles:      Bubble[];
  particles:    Particle[];
  pesci:        PesceAttivo[];
  feedback:     FeedbackTap[];
  onTap:        (p: PesceAttivo) => void;
}

function ZonaAcqua({ zona, targetSpecie, ruleFlashKey, bubbles, particles, pesci, feedback, onTap }: ZonaProps) {

  // Palette acqua: lago (azzurro/verde tranquillo) vs mare (blu profondo).
  const bg = zona === "lago"
    ? "linear-gradient(to bottom, #B3D4D8 0%, #7FAEB8 35%, #5C8E9B 70%, #406878 100%)"
    : "linear-gradient(to bottom, #7BA7BD 0%, #3F6A87 35%, #1E456A 70%, #0E2C4A 100%)";

  const etichetta = zona === "lago" ? "LAGO" : "MARE";

  // Colori per onde/raggi specifici per zona
  const waveStroke   = zona === "lago" ? "rgba(255,255,255,0.55)" : "rgba(200,220,240,0.5)";
  const waveFill1    = zona === "lago" ? "rgba(255,255,255,0.18)" : "rgba(180,210,235,0.18)";
  const waveFill2    = zona === "lago" ? "rgba(255,255,255,0.12)" : "rgba(160,200,230,0.13)";
  const causticColor = zona === "lago" ? "rgba(255,255,210,0.7)"  : "rgba(180,230,255,0.55)";
  const particleColor = zona === "lago" ? "rgba(255,255,240,0.7)" : "rgba(210,235,255,0.65)";

  return (
    <div style={{
      position: "relative",
      flex: 1,
      height: "100%",
      background: bg,
      overflow: "hidden",
    }}>

      {/* ── Strato 1: gloss superficiale statico ───────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 46,
        background: "linear-gradient(to bottom, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 100%)",
        pointerEvents: "none", zIndex: 1,
      }} />

      {/* ── Strato 2: onde di superficie animate (3 layer, parallasse) ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 56,
        overflow: "hidden", pointerEvents: "none", zIndex: 2,
      }}>
        <svg
          viewBox="0 0 240 56" preserveAspectRatio="none"
          style={{
            position: "absolute", top: 0, left: 0,
            width: "calc(100% + 240px)", height: "100%",
            animation: "pesc-wave-shift-1 9s linear infinite",
          }}
        >
          <path
            d="M 0,28 Q 30,22 60,28 T 120,28 T 180,28 T 240,28 V 56 H 0 Z"
            fill={waveFill1}
          />
          <path
            d="M 0,28 Q 30,22 60,28 T 120,28 T 180,28 T 240,28"
            fill="none" stroke={waveStroke} strokeWidth="0.8" opacity="0.85"
          />
        </svg>
        <svg
          viewBox="0 0 240 56" preserveAspectRatio="none"
          style={{
            position: "absolute", top: 6, left: 0,
            width: "calc(100% + 240px)", height: "100%",
            animation: "pesc-wave-shift-2 13s linear infinite reverse",
          }}
        >
          <path
            d="M 0,34 Q 40,28 80,34 T 160,34 T 240,34 V 56 H 0 Z"
            fill={waveFill2}
          />
        </svg>
        <svg
          viewBox="0 0 240 56" preserveAspectRatio="none"
          style={{
            position: "absolute", top: 14, left: 0,
            width: "calc(100% + 240px)", height: "100%",
            animation: "pesc-wave-shift-3 17s linear infinite",
          }}
        >
          <path
            d="M 0,40 Q 50,36 100,40 T 200,40 T 240,40 V 56 H 0 Z"
            fill={waveFill2}
            opacity="0.7"
          />
        </svg>
      </div>

      {/* ── Strato 3: raggi di luce caustici (dall'alto, diagonali) ──── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        overflow: "hidden", pointerEvents: "none", zIndex: 3,
      }}>
        <div style={{
          position: "absolute",
          top: -20, left: "18%",
          width: 38, height: "120%",
          background: `linear-gradient(to bottom, ${causticColor} 0%, rgba(255,255,255,0) 75%)`,
          filter: "blur(6px)",
          animation: "pesc-caustic-shimmer 4.5s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          top: -20, left: "48%",
          width: 28, height: "115%",
          background: `linear-gradient(to bottom, ${causticColor} 0%, rgba(255,255,255,0) 70%)`,
          filter: "blur(5px)",
          animation: "pesc-caustic-shimmer-2 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          top: -20, left: "76%",
          width: 32, height: "120%",
          background: `linear-gradient(to bottom, ${causticColor} 0%, rgba(255,255,255,0) 75%)`,
          filter: "blur(7px)",
          animation: "pesc-caustic-shimmer 5.5s ease-in-out infinite 1.2s",
        }} />
      </div>

      {/* ── Strato 4: increspatura mid-water (linee orizzontali sottili) ── */}
      <svg
        viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          width: "100%", height: "100%", pointerEvents: "none",
          zIndex: 3,
          animation: "pesc-ripple-pulse 5s ease-in-out infinite",
        }}
      >
        <path d="M 0,38 Q 25,36 50,38 T 100,38" fill="none" stroke={waveStroke} strokeWidth="0.18" opacity="0.5" />
        <path d="M 0,55 Q 25,57 50,55 T 100,55" fill="none" stroke={waveStroke} strokeWidth="0.18" opacity="0.4" />
        <path d="M 0,72 Q 25,70 50,72 T 100,72" fill="none" stroke={waveStroke} strokeWidth="0.16" opacity="0.35" />
      </svg>

      {/* ── Strato 5: particelle di plancton in deriva ──────────────── */}
      {particles.map((p) => (
        <div key={`pt-${zona}-${p.id}`} style={{
          position: "absolute",
          left: `${p.leftPct}%`,
          top:  `${p.topPct}%`,
          width:  p.sizePx,
          height: p.sizePx,
          borderRadius: "50%",
          background: particleColor,
          boxShadow: `0 0 ${p.sizePx * 1.5}px ${particleColor}`,
          animation: `${p.reverse ? "pesc-particle-drift-rev" : "pesc-particle-drift"} ${p.durMs}ms linear ${p.delayMs}ms infinite`,
          pointerEvents: "none",
          zIndex: 4,
        }} />
      ))}

      {/* HUD target zona */}
      <div style={{
        position: "absolute",
        top: 8, left: 0, right: 0,
        display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem",
        zIndex: 15, pointerEvents: "none",
      }}>
        <div
          key={`tgt-card-${ruleFlashKey}`}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.25rem 0.7rem 0.25rem 0.55rem",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.94)",
            border: `2px solid ${zona === "lago" ? "#3F5E55" : "#1D3A5A"}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
            animation: ruleFlashKey > 0 ? "pesc-rule-flash 900ms ease-out" : undefined,
          }}
        >
          <span style={{
            fontSize: "0.62rem", fontWeight: 800,
            color: zona === "lago" ? "#3F5E55" : "#1D3A5A",
            letterSpacing: "0.08em",
          }}>
            {etichetta}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#374151", fontWeight: 700 }}>
            pesca:
          </span>
          <div style={{
            width: 38, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PesceSprite specie={targetSpecie} dir={1} size={38} />
          </div>
        </div>
      </div>

      {/* Bolle decorative che risalgono dal fondo */}
      {bubbles.map((b) => (
        <div key={`b-${zona}-${b.id}`} style={{
          position: "absolute",
          left: `${b.leftPct}%`,
          bottom: 0,
          width:  b.sizePx,
          height: b.sizePx,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.25) 70%, rgba(255,255,255,0) 100%)",
          animation: `pesc-bubble-up ${b.durMs}ms ease-in ${b.delayMs}ms infinite`,
          pointerEvents: "none",
          zIndex: 4,
        }} />
      ))}

      {/* Pesci attivi */}
      {pesci.map((p) => (
        <button
          key={p.id}
          onClick={() => onTap(p)}
          aria-label={p.specie}
          style={{
            position: "absolute",
            top:  p.topPx,
            left: `calc(${p.xPct}% - ${PESC_SPRITE_SIZE_PX / 2}px)`,
            width:  PESC_SPRITE_SIZE_PX,
            height: PESC_SPRITE_SIZE_PX,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "pesc-bob 1400ms ease-in-out infinite",
            WebkitTapHighlightColor: "transparent",
            zIndex: 10,
            filter: "drop-shadow(0 3px 2px rgba(0,20,40,0.35))",
          }}
        >
          <PesceSprite specie={p.specie} dir={p.direzione} size={PESC_SPRITE_SIZE_PX} />
        </button>
      ))}

      {/* Feedback al tap */}
      {feedback.map((f) => (
        <div
          key={`fb-${f.id}`}
          style={{
            position: "absolute",
            top:  f.topPx,
            left: `calc(${f.xPct}% - ${PESC_SPRITE_SIZE_PX / 2}px)`,
            width:  PESC_SPRITE_SIZE_PX,
            height: PESC_SPRITE_SIZE_PX,
            pointerEvents: "none",
            animation: f.esito === "ok"
              ? "pesc-catch-glow 480ms ease-out forwards"
              : "pesc-shake 360ms ease-in-out forwards",
            zIndex: 11,
          }}
        >
          {f.esito === "ok" && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)",
            }} />
          )}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: f.esito === "ok" ? 0.55 : 0.85,
          }}>
            <PesceSprite specie={f.specie} dir={f.direzione} size={PESC_SPRITE_SIZE_PX} />
          </div>
          {f.esito === "err" && (
            <div style={{
              position: "absolute", inset: -4,
              borderRadius: "50%",
              border: "3px solid #DC2626",
              opacity: 0.85,
            }} />
          )}
        </div>
      ))}

      {/* Fondale (sabbia) */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 22,
        background: "linear-gradient(to top, #D7B98A 0%, rgba(215,185,138,0) 100%)",
        pointerEvents: "none",
        zIndex: 4,
      }} />
    </div>
  );
}
