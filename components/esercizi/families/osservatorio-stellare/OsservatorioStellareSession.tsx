"use client";

/**
 * OsservatorioStellareSession — sessione di gioco "L'Osservatorio Stellare".
 *
 *   Vigilanza prolungata, rilevamento di stimolo raro.
 *   Cielo notturno con ~40 stelle ambient che brillano (twinkle) con
 *   pattern asincroni. Periodicamente, UNA stella diventa "target":
 *   pulsa più velocemente, è leggermente più grande e dorata.
 *   Il giocatore deve toccarla prima che la finestra si chiuda.
 *
 *   Estetica: cielo profondo, costellazioni discrete, nessun rumore,
 *   nessun timer aggressivo a video. Pensata per over 60.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  OS_AMBIENT_STARS,
  OS_GAME_H_PX,
  OS_SESSION_TIMER_MS,
  type OsservatorioLevelConfig,
} from "./levels";

// ── Costanti visive ───────────────────────────────────────────────────────────

const STAR_BASE_PX        = 14;   // dimensione visuale base (hit area è maggiore)
const STAR_HITBOX_PX      = 44;   // touch area minima accessibile
const AMBIENT_PULSE_HZ    = 0.75; // ~ 1.3s per ciclo, cielo che respira più vivo
const AMBIENT_OPACITY_MIN = 0.35;
const AMBIENT_OPACITY_MAX = 0.95;

// Margini interni dell'area: niente stelle troppo vicine ai bordi.
const STAR_PAD_PCT = 6;

const ANIM = `
@keyframes os-hit-burst {
  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
  50%  { transform: translate(-50%,-50%) scale(2.6); opacity: 0.85; }
  100% { transform: translate(-50%,-50%) scale(4.2); opacity: 0; }
}
@keyframes os-miss-flash {
  0%   { opacity: 0; }
  20%  { opacity: 0.22; }
  100% { opacity: 0; }
}
@keyframes os-shoot {
  0%   { transform: translate(0,0) rotate(-12deg); opacity: 0; }
  10%  { opacity: 0.9; }
  100% { transform: translate(160px,80px) rotate(-12deg); opacity: 0; }
}
`;

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface AmbientStar {
  id:        number;
  xPct:      number;
  yPct:      number;
  /** Fase iniziale per il twinkle (0..2π). */
  phase:     number;
  /** Variazione individuale di frequenza del twinkle (0.7..1.3). */
  freqJit:   number;
  /** Variazione individuale di dimensione (0.7..1.4). */
  sizeJit:   number;
}

interface TargetEvent {
  /** id dell'ambient star promossa a target. */
  starId:    number;
  /** Timestamp di inizio finestra. */
  startAt:   number;
  /** Timestamp di fine finestra (startAt + windowMs). */
  endAt:     number;
}

interface Burst {
  id:    number;
  xPct:  number;
  yPct:  number;
  at:    number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Distribuisce le stelle con un blue-noise povero: rifiuta se troppo vicine. */
function generaCielo(n: number): AmbientStar[] {
  const stars: AmbientStar[] = [];
  const minSep = 7; // % minimo tra centri
  let id = 0;
  let safety = 0;
  while (stars.length < n && safety < n * 40) {
    safety++;
    const xPct = rand(STAR_PAD_PCT, 100 - STAR_PAD_PCT);
    const yPct = rand(STAR_PAD_PCT, 100 - STAR_PAD_PCT);
    if (stars.every((s) => Math.hypot(s.xPct - xPct, s.yPct - yPct) >= minSep)) {
      stars.push({
        id: id++,
        xPct,
        yPct,
        phase: rand(0, Math.PI * 2),
        freqJit: rand(0.75, 1.25),
        sizeJit: rand(0.75, 1.4),
      });
    }
  }
  return stars;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  config:       OsservatorioLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OsservatorioStellareSession({
  config, tempoScaduto, onReady, onComplete,
}: Props) {

  // Cielo statico per tutta la sessione (le stelle non si muovono di posizione,
  // brillano. La poesia sta nella stabilità, non nel movimento.)
  const starsRef = useRef<AmbientStar[]>(generaCielo(OS_AMBIENT_STARS));

  // Target corrente (o null = nessun target attivo, siamo in gap).
  const [target, setTarget] = useState<TargetEvent | null>(null);
  const targetRef           = useRef<TargetEvent | null>(null);
  useLayoutEffect(() => { targetRef.current = target; }, [target]);

  // Tempo attuale per il rendering del twinkle (in ms dall'inizio sessione).
  const [nowTick, setNowTick] = useState(0);

  // Effetti visivi temporanei.
  const [bursts, setBursts]       = useState<Burst[]>([]);
  const [missFlash, setMissFlash] = useState(false);
  const nextBurstIdRef            = useRef(0);

  // Metriche.
  const totaleTargetRef = useRef(0);
  const hitRef          = useRef(0);
  const missRef         = useRef(0); // target scaduti senza risposta
  const falseAlarmRef   = useRef(0);
  const tempiRisposta   = useRef<number[]>([]);

  const configRef       = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const onCompleteRef   = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  const completedRef    = useRef(false);
  const startedAtRef    = useRef(Date.now());

  // Programmazione prossimo target.
  const nextSpawnAtRef  = useRef<number>(0);

  /**
   * Micro-progressione intra-livello: durante la sessione la finestra-target
   * si accorcia e il gap si allunga linearmente, in modo che la vigilanza
   * diventi via via più impegnativa anche al lv1.
   * progress 0 → 1 sull'intera durata sessione.
   */
  const dynParams = (now: number) => {
    const progress = Math.min(1, Math.max(0, (now - startedAtRef.current) / OS_SESSION_TIMER_MS));
    const cfg = configRef.current;
    return {
      windowMs: cfg.targetWindowMs * (1.35 - 0.35 * progress), // 1.35x → 1x
      gapMs:    cfg.targetGapMs    * (0.75 + 0.30 * progress), // 0.75x → 1.05x
    };
  };

  // ── Avvio ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    onReady();
    const cfg = configRef.current;
    // primo target: gap iniziale leggermente più corto del normale (entrata morbida)
    nextSpawnAtRef.current = Date.now() + cfg.targetGapMs * 0.55;
  }, []); // eslint-disable-line

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current) return;

    const id = setInterval(() => {
      if (completedRef.current) return;

      const now = Date.now();
      setNowTick(now - startedAtRef.current);

      const cfg = configRef.current;
      const cur = targetRef.current;

      const { windowMs, gapMs } = dynParams(now);

      if (cur) {
        // Target attivo: controlla se è scaduto.
        if (now >= cur.endAt) {
          missRef.current++;
          setTarget(null);
          // gap variabile ±20% per evitare pattern prevedibili
          const jitter = rand(0.8, 1.2);
          nextSpawnAtRef.current = now + gapMs * jitter;
        }
      } else {
        // Nessun target: vedi se è ora di farne apparire uno.
        if (now >= nextSpawnAtRef.current) {
          // Evita di spawnare se manca così poco tempo che il target non
          // farebbe in tempo ad essere mostrato per intero (evita "miss
          // fantasma" che falsificano l'accuratezza).
          const remaining = OS_SESSION_TIMER_MS - (now - startedAtRef.current);
          if (remaining < windowMs * 0.6) {
            // niente spawn nel finale: aspetta il time-up.
            return;
          }
          const stars = starsRef.current;
          if (stars.length > 0) {
            const pick = stars[Math.floor(Math.random() * stars.length)];
            totaleTargetRef.current++;
            setTarget({
              starId:  pick.id,
              startAt: now,
              endAt:   now + windowMs,
            });
          }
        }
      }
      // suppress unused warning
      void cfg;

      // Pulisci burst vecchi
      setBursts((prev) => prev.filter((b) => now - b.at < 700));
    }, 60);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Tempo scaduto ───────────────────────────────────────────────────────────
  const finalizza = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Se al momento del time-up c'è ancora un target "in volo" non scaduto
    // e non cliccato, non includerlo nel totale: l'utente non ha avuto la
    // finestra completa per rispondere. Questo elimina il bug per cui
    // cliccando ogni target l'accuratezza non arrivava al 100%.
    const targetPending = targetRef.current !== null
      && Date.now() < targetRef.current.endAt;
    const tot   = Math.max(0, totaleTargetRef.current - (targetPending ? 1 : 0));
    const hit   = hitRef.current;
    const fa    = falseAlarmRef.current;
    const hitRate = tot > 0 ? hit / tot : 0;

    // Score con penalty leggera per false alarms: per ogni FA togli 5 punti,
    // clamp 0..100. Mantiene il senso di "vigilanza onesta" senza punire troppo.
    const score = Math.max(0, Math.min(100, Math.round(hitRate * 100) - fa * 5));

    // Accuratezza valutativa per la progressione: hit_rate puro, su cui il
    // sistema adattivo decide se salire/scendere.
    const acc = hitRate;

    const rtMedia = tempiRisposta.current.length > 0
      ? Math.round(tempiRisposta.current.reduce((a, b) => a + b, 0) / tempiRisposta.current.length)
      : 0;

    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo: score,
      metriche: {
        target_totali:    tot,
        target_hit:       hit,
        target_miss:      missRef.current,
        false_alarms:     fa,
        rt_medio_ms:      rtMedia,
      },
    } as unknown as SessionResult);
  }, []);

  useEffect(() => {
    if (tempoScaduto) finalizza();
  }, [tempoScaduto, finalizza]);

  // ── Tap handler ─────────────────────────────────────────────────────────────
  const handleTapStar = useCallback((star: AmbientStar) => {
    if (completedRef.current) return;
    const now = Date.now();
    const cur = targetRef.current;

    if (cur && cur.starId === star.id) {
      // HIT
      hitRef.current++;
      tempiRisposta.current.push(now - cur.startAt);
      setBursts((prev) => [
        ...prev,
        { id: nextBurstIdRef.current++, xPct: star.xPct, yPct: star.yPct, at: now },
      ]);
      setTarget(null);
      const { gapMs } = dynParams(now);
      nextSpawnAtRef.current = now + gapMs * rand(0.85, 1.15);
    } else {
      // FALSE ALARM
      falseAlarmRef.current++;
      setMissFlash(true);
      setTimeout(() => setMissFlash(false), 350);
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const cfg = configRef.current;
  const tNow = nowTick / 1000; // secondi dall'inizio

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", userSelect: "none" }}>
      <style>{ANIM}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: OS_GAME_H_PX,
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at 50% 35%, #1B2755 0%, #0E1535 45%, #050818 100%)",
          borderRadius: "0.5rem",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Nebulose / polvere stellare di sfondo (decorative, statiche) */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(circle at 22% 18%, rgba(120,140,220,0.10) 0%, transparent 35%)," +
            "radial-gradient(circle at 78% 70%, rgba(180,130,200,0.08) 0%, transparent 40%)," +
            "radial-gradient(circle at 50% 90%, rgba(120,180,220,0.06) 0%, transparent 50%)",
        }} />

        {/* Stella cadente decorativa periodica (3.5s loop → più frequente) */}
        <div style={{
          position: "absolute",
          top: "12%", left: "8%",
          width: 2, height: 2,
          background: "linear-gradient(90deg, transparent, #FFFFFF 70%, transparent)",
          boxShadow: "0 0 6px #FFFFFF",
          opacity: 0,
          animation: "os-shoot 3.5s ease-in infinite",
          animationDelay: "1s",
          pointerEvents: "none",
        }} />

        {/* Flash false alarm */}
        {missFlash && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
            backgroundColor: "#7C2D12",
            animation: "os-miss-flash 350ms ease-out forwards",
          }} />
        )}

        {/* Stelle */}
        {starsRef.current.map((s) => {
          const isTarget = target !== null && target.starId === s.id;

          // Twinkle ambient: opacità oscillante sin con fase individuale.
          const baseFreq = AMBIENT_PULSE_HZ * s.freqJit;
          const baseOpacityT = 0.5 + 0.5 * Math.sin(2 * Math.PI * baseFreq * tNow + s.phase);
          let opacity = AMBIENT_OPACITY_MIN + baseOpacityT * (AMBIENT_OPACITY_MAX - AMBIENT_OPACITY_MIN);

          // Size base
          let sizePx = STAR_BASE_PX * s.sizeJit;

          // Color base: bianco lievemente azzurrato.
          let color = "#E8EEFF";
          let glow  = `0 0 ${Math.round(4 + 6 * baseOpacityT)}px rgba(220,230,255,0.55)`;

          if (isTarget) {
            // Stella target: pulsa più velocemente, leggermente più grande,
            // tinta calda e satura, glow acceso. Parametri scalano col livello.
            const targetFreq = baseFreq * cfg.targetPulseMul;
            const tT = 0.5 + 0.5 * Math.sin(2 * Math.PI * targetFreq * tNow + s.phase);

            // Opacity più alta e con range più stretto in alto → glow sempre acceso
            opacity = 0.85 + 0.15 * tT;

            sizePx = sizePx * cfg.targetSizeMul;

            // Colore vivido oro/ambra. cfg.targetHueDeg=8 → bianco-caldo,
            // cfg.targetHueDeg=55 → oro intenso saturo.
            // Formula più aggressiva: drop netto su verde e blu per saturazione.
            const h = cfg.targetHueDeg;
            const g = Math.max(120, Math.round(225 - h * 1.6));  // 225 → 137 a h=55
            const b = Math.max(35,  Math.round(200 - h * 3.4));  // 200 → 13  a h=55
            color = `rgb(255,${g},${b})`;

            // Glow acceso: usa lo stesso colore del corpo per amplificarlo,
            // raggio più ampio e alpha sempre alta.
            const glowRadius = Math.round(16 + 22 * cfg.targetGlow * (0.7 + 0.3 * tT));
            const glowAlpha  = 0.65 + 0.30 * cfg.targetGlow;
            glow = `0 0 ${glowRadius}px rgba(255,${g},${b},${glowAlpha}), ` +
                   `0 0 ${Math.round(glowRadius * 0.45)}px rgba(255,255,220,0.85)`;
          }

          return (
            <button
              key={s.id}
              onClick={() => handleTapStar(s)}
              style={{
                position: "absolute",
                left: `${s.xPct}%`,
                top:  `${s.yPct}%`,
                width:  STAR_HITBOX_PX,
                height: STAR_HITBOX_PX,
                transform: "translate(-50%,-50%)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: isTarget ? 5 : 4,
              }}
              aria-label="stella"
            >
              <span
                style={{
                  display: "block",
                  width:  sizePx,
                  height: sizePx,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${color} 0%, ${color} 35%, rgba(255,255,255,0) 75%)`,
                  opacity,
                  boxShadow: glow,
                  transition: "background 250ms ease-out",
                  pointerEvents: "none",
                }}
              />
            </button>
          );
        })}

        {/* Burst su hit */}
        {bursts.map((b) => (
          <span
            key={b.id}
            style={{
              position: "absolute",
              left: `${b.xPct}%`,
              top:  `${b.yPct}%`,
              width:  28,
              height: 28,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,225,170,0.95) 0%, rgba(255,200,120,0.5) 40%, rgba(255,200,120,0) 70%)",
              animation: "os-hit-burst 650ms ease-out forwards",
              pointerEvents: "none",
              zIndex: 6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
