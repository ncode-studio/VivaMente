"use client";

/**
 * IlNaturalistaSession — loop di gioco del Naturalista (#15: ricerca del bersaglio).
 *
 * Per ogni scena:
 *  1. campiona tipologia scena dal pool del livello (no ripetizione consecutiva)
 *  2. sceglie un BERSAGLIO (una specie) e lo mostra come riferimento in alto
 *  3. riempie la scena di tanti DISTRATTORI (altre specie) + N istanze del target
 *  4. l'utente tocca le istanze del target; toccare un distrattore = errore
 *  5. quando tutti i target sono trovati o scade il tLimSceneMs → scena successiva
 *
 * Scoring per scena:
 *   base 30 se tutti i target trovati
 *   bonus velocità = round(40 * max(0, 1 - tempo / tLim)) se tutti trovati
 *   bonus completezza = round(30 * (targetTrovati / numTarget))
 *   penalità = -8 per ogni tocco errato nella scena (floor 0)
 * Accuratezza valutativa = targetTrovati / (targetMostrati + tocchiErrati) (0..1):
 *   penalizza sia i bersagli mancati sia i tocchi sui distrattori.
 */

import {
  useCallback, useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  type NaturalistaLevelConfig, type SceneKind,
  SCENE_VIEWBOX_W, SCENE_VIEWBOX_H, HABITAT_POOL,
} from "./levels";
import {
  PaperBackground, NAT_COLORS, SceneDefs, LenteIcon,
  PratoScene, PratoFiorito, BoscoScene, FondaleScene,
  StagnoNinfeeScene, SottoboscoAutunnaleScene, ScoglieraMarinaScene, PratoAlpinoScene,
  Creature, type CreatureKind,
} from "./sprites";

// ── Tipi interni ─────────────────────────────────────────────────────────────

interface PlacedCreature {
  id: number;
  kind: CreatureKind;
  isTarget: boolean;
  x: number;
  y: number;
  rotation: number;
  motion: { rx: number; ry: number; periodMs: number; phase: number } | null;
  occlusa: boolean;
  occlusioneSeed: number;
  found: boolean;
}

interface SceneInstance {
  kind: SceneKind;
  targetKind: CreatureKind;
  creatures: PlacedCreature[];
}

// ── Costanti layout ──────────────────────────────────────────────────────────

const SCENE_INTRO_MS = 900;
const SCENE_OUTRO_MS = 700;
const DRAG_TAP_THRESHOLD_PX = 8;
const WRONG_FLASH_MS = 420;

// ── Component ────────────────────────────────────────────────────────────────

interface SessionProps {
  config: NaturalistaLevelConfig;
  tempoScaduto: boolean;
  onReady(): void;
  onComplete(r: SessionResult): void;
}

export function IlNaturalistaSession({ config, tempoScaduto, onReady, onComplete }: SessionProps) {

  // ── accumulatori (ref) ──────────────────────────────────────────────────
  const completedRef = useRef(false);
  const targetTrovatiRef = useRef(0);
  const targetMostratiRef = useRef(0);
  const tapErratiRef = useRef(0);
  const scoreTotaleRef = useRef(0);
  const sceneCompleteRef = useRef(0);

  // ── stato ───────────────────────────────────────────────────────────────
  const [sceneIndex, setSceneIndex] = useState(0);
  const [scena, setScena] = useState<SceneInstance | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<{ x: number; y: number; key: number } | null>(null);
  const wrongFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneStartTsRef = useRef(0);
  const falseAlarmsSceneRef = useRef(0);
  const lastSceneKindRef = useRef<SceneKind | null>(null);

  // ── moto creature: tick di rerender per le mobili ───────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (config.numMobili === 0) return;
    let raf: number;
    const loop = () => {
      setTick(t => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [config.numMobili]);

  // ── area "vivibile" della scena (intervallo y per posizione coerente) ──
  const areaForScene = useCallback((k: SceneKind): { yMin: number; yMax: number; xMin: number; xMax: number } => {
    switch (k) {
      case "prato":
      case "prato-fiorito":         return { yMin: 240, yMax: 650, xMin: 70, xMax: 930 };
      case "prato-alpino":          return { yMin: 320, yMax: 650, xMin: 60, xMax: 940 };
      case "bosco-rado":
      case "bosco":
      case "bosco-fitto":           return { yMin: 150, yMax: 650, xMin: 60, xMax: 940 };
      case "sottobosco-autunnale":  return { yMin: 200, yMax: 650, xMin: 60, xMax: 940 };
      case "stagno-ninfee":         return { yMin: 220, yMax: 650, xMin: 70, xMax: 930 };
      case "fondale-chiaro":
      case "fondale-fitto":         return { yMin: 110, yMax: 560, xMin: 70, xMax: 930 };
      case "scogliera-marina":      return { yMin: 380, yMax: 670, xMin: 60, xMax: 940 };
    }
  }, []);

  // ── setup nuova scena ───────────────────────────────────────────────────
  const setupScene = useCallback(() => {
    const pool = config.scenePool;
    let kind = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && kind === lastSceneKindRef.current) {
      const alt = pool.find(k => k !== lastSceneKindRef.current);
      if (alt) kind = alt;
    }
    lastSceneKindRef.current = kind;

    const habitatPool = HABITAT_POOL[kind] as readonly CreatureKind[];
    const targetKind = habitatPool[Math.floor(Math.random() * habitatPool.length)];
    const distractorKinds = habitatPool.filter(k => k !== targetKind);
    const area = areaForScene(kind);

    // distanza minima tra centri: abbastanza da isolare il tap su un oggetto,
    // ma compatta per ottenere una scena affollata.
    const minDist = Math.max(config.clickRadiusUnits + 6, config.creaturaSizeUnits * 0.7);

    const placed: PlacedCreature[] = [];
    // Lista di "specie da piazzare": prima i target (garantiti), poi i distrattori.
    const queue: { kind: CreatureKind; isTarget: boolean }[] = [];
    for (let i = 0; i < config.numTarget; i++) queue.push({ kind: targetKind, isTarget: true });
    for (let i = 0; i < config.numDistrattori; i++) {
      const dk = distractorKinds.length > 0
        ? distractorKinds[Math.floor(Math.random() * distractorKinds.length)]
        : targetKind;
      queue.push({ kind: dk, isTarget: false });
    }

    let mobiliRestanti = config.numMobili;
    for (const item of queue) {
      let safety = 0;
      let pos: { x: number; y: number } | null = null;
      while (safety < 400) {
        safety++;
        const x = area.xMin + Math.random() * (area.xMax - area.xMin);
        const y = area.yMin + Math.random() * (area.yMax - area.yMin);
        const tooClose = placed.some(p => Math.hypot(p.x - x, p.y - y) < minDist);
        if (!tooClose) { pos = { x, y }; break; }
      }
      // se non trova spazio dopo molti tentativi, piazza comunque (scena densa)
      const x = pos?.x ?? (area.xMin + Math.random() * (area.xMax - area.xMin));
      const y = pos?.y ?? (area.yMin + Math.random() * (area.yMax - area.yMin));
      const willMove = mobiliRestanti > 0;
      if (willMove) mobiliRestanti--;
      placed.push({
        id: placed.length,
        kind: item.kind,
        isTarget: item.isTarget,
        x, y,
        rotation: (Math.random() * 30 - 15),
        motion: willMove
          ? {
            rx: 24 + Math.random() * 26,
            ry: 12 + Math.random() * 14,
            periodMs: 6500 + Math.random() * 3500,
            phase: Math.random() * Math.PI * 2,
          }
          : null,
        occlusa: Math.random() < config.probOcclusione,
        occlusioneSeed: Math.floor(Math.random() * 1000),
        found: false,
      });
    }

    // Mescola l'ordine di disegno così i target non sono sempre "sopra".
    for (let i = placed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [placed[i], placed[j]] = [placed[j], placed[i]];
    }

    targetMostratiRef.current += config.numTarget;
    falseAlarmsSceneRef.current = 0;
    setScena({ kind, targetKind, creatures: placed });
    sceneStartTsRef.current = performance.now();
    setShowIntro(true);
    setTimeout(() => setShowIntro(false), SCENE_INTRO_MS);
  }, [config, areaForScene]);

  // ── onReady & primo setup ───────────────────────────────────────────────
  useEffect(() => {
    setupScene();
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
  }, []);

  // ── finalizzazione su tempoScaduto ──────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;

    const trovati = targetTrovatiRef.current;
    const mostrati = Math.max(1, targetMostratiRef.current);
    const accuratezzaValutativa = Math.max(0, Math.min(1,
      trovati / (mostrati + tapErratiRef.current)
    ));
    const scoreGrezzo = Math.max(0, Math.min(100, Math.round(
      scoreTotaleRef.current / Math.max(1, sceneCompleteRef.current) || 0
    )));

    onComplete({
      accuratezzaValutativa,
      scoreGrezzo,
      metriche: {
        scene_completate: sceneCompleteRef.current,
        target_trovati: trovati,
        target_mostrati: targetMostratiRef.current,
        tap_errati: tapErratiRef.current,
      },
    });
  }, [tempoScaduto, onComplete]);

  // ── finalizza scena corrente ────────────────────────────────────────────
  const finalizeScene = useCallback(() => {
    if (!scena) return;
    const tempoSpeso = performance.now() - sceneStartTsRef.current;
    const trovatiNellaScena = scena.creatures.filter(c => c.isTarget && c.found).length;
    const N = scena.creatures.filter(c => c.isTarget).length;

    let punti = 0;
    if (trovatiNellaScena === N) {
      const speedFactor = Math.max(0, 1 - tempoSpeso / config.tLimSceneMs);
      punti = 30 + Math.round(40 * speedFactor) + 30;
    } else {
      punti = Math.round(60 * (trovatiNellaScena / Math.max(1, N)));
    }
    punti -= 8 * falseAlarmsSceneRef.current;
    scoreTotaleRef.current += Math.max(0, punti);
    sceneCompleteRef.current += 1;

    setShowOutro(true);
    setTimeout(() => {
      setShowOutro(false);
      if (!completedRef.current && !tempoScaduto) {
        setSceneIndex(i => i + 1);
        setupScene();
      }
    }, SCENE_OUTRO_MS);
  }, [scena, config.tLimSceneMs, tempoScaduto, setupScene]);

  // ── timeout scena ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scena || showIntro || showOutro || tempoScaduto || completedRef.current) return;
    const restanti = scena.creatures.filter(c => c.isTarget && !c.found).length;
    if (restanti === 0) return;

    const dueAt = sceneStartTsRef.current + config.tLimSceneMs;
    const remaining = Math.max(50, dueAt - performance.now());
    const t = setTimeout(() => {
      if (completedRef.current || tempoScaduto) return;
      finalizeScene();
    }, remaining);
    return () => clearTimeout(t);
  }, [scena, showIntro, showOutro, tempoScaduto, config.tLimSceneMs, finalizeScene]);

  // ── click handling (tap-only, niente zoom/pan) ──────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const flashWrong = useCallback((xVb: number, yVb: number) => {
    tapErratiRef.current += 1;
    falseAlarmsSceneRef.current += 1;
    setWrongFlash({ x: xVb, y: yVb, key: performance.now() });
    if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
    wrongFlashTimerRef.current = setTimeout(() => setWrongFlash(null), WRONG_FLASH_MS);
  }, []);

  const tryHit = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current || !scena) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const xVb = (px / rect.width) * SCENE_VIEWBOX_W;
    const yVb = (py / rect.height) * SCENE_VIEWBOX_H;

    const now = performance.now();
    let hit: PlacedCreature | null = null;
    let bestDist = Infinity;
    for (const c of scena.creatures) {
      if (c.isTarget && c.found) continue;
      const pos = currentCreaturePos(c, now);
      const d = Math.hypot(pos.x - xVb, pos.y - yVb);
      if (d < config.clickRadiusUnits && d < bestDist) {
        bestDist = d;
        hit = c;
      }
    }

    if (hit && hit.isTarget) {
      const hitId = hit.id;
      setScena(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          creatures: prev.creatures.map(c => c.id === hitId ? { ...c, found: true } : c),
        };
      });
      targetTrovatiRef.current += 1;
      const restanti = scena.creatures.filter(c => c.isTarget && !c.found && c.id !== hitId).length;
      if (restanti === 0) {
        setTimeout(() => finalizeScene(), 250);
      }
    } else {
      // tocco su un distrattore o sul vuoto → errore
      flashWrong(xVb, yVb);
    }
  }, [scena, config.clickRadiusUnits, finalizeScene, flashWrong]);

  const handlePointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > DRAG_TAP_THRESHOLD_PX) return;
    if (!showIntro && !showOutro) {
      tryHit(e.clientX, e.clientY);
    }
  }, [showIntro, showOutro, tryHit]);

  // ── render scena ─────────────────────────────────────────────────────────
  const renderScene = (k: SceneKind) => {
    switch (k) {
      case "prato":                 return <PratoScene densita={config.densitaSfondo} />;
      case "prato-fiorito":         return <PratoFiorito densita={config.densitaSfondo} />;
      case "prato-alpino":          return <PratoAlpinoScene densita={config.densitaSfondo} />;
      case "bosco-rado":            return <BoscoScene densita={config.densitaSfondo} fitto={false} />;
      case "bosco":                 return <BoscoScene densita={config.densitaSfondo} fitto={false} />;
      case "bosco-fitto":           return <BoscoScene densita={config.densitaSfondo} fitto={true} />;
      case "sottobosco-autunnale":  return <SottoboscoAutunnaleScene densita={config.densitaSfondo} />;
      case "stagno-ninfee":         return <StagnoNinfeeScene densita={config.densitaSfondo} />;
      case "fondale-chiaro":        return <FondaleScene densita={config.densitaSfondo} fitto={false} />;
      case "fondale-fitto":         return <FondaleScene densita={config.densitaSfondo} fitto={true} />;
      case "scogliera-marina":      return <ScoglieraMarinaScene densita={config.densitaSfondo} />;
    }
  };

  const tintForScene = (k: SceneKind | undefined): string => {
    if (!k) return NAT_COLORS.verdeOliva;
    if (k === "fondale-chiaro" || k === "fondale-fitto") return NAT_COLORS.blu;
    if (k === "scogliera-marina") return NAT_COLORS.seppia;
    if (k === "stagno-ninfee") return NAT_COLORS.verdeOliva;
    if (k === "sottobosco-autunnale") return NAT_COLORS.ocra;
    if (k === "prato-alpino") return "#5F7B4A";
    if (k.startsWith("bosco")) return NAT_COLORS.verdeBosco;
    return NAT_COLORS.verdeOliva;
  };

  const labelForScene = (k: SceneKind): string => {
    switch (k) {
      case "prato":                 return "Prato";
      case "prato-fiorito":         return "Prato fiorito";
      case "prato-alpino":          return "Prato alpino";
      case "bosco-rado":            return "Bosco rado";
      case "bosco":                 return "Bosco";
      case "bosco-fitto":           return "Bosco fitto";
      case "sottobosco-autunnale":  return "Sottobosco autunnale";
      case "stagno-ninfee":         return "Stagno";
      case "fondale-chiaro":        return "Fondale marino";
      case "fondale-fitto":         return "Fondale tropicale";
      case "scogliera-marina":      return "Scogliera";
    }
  };

  const targetTrovati = scena ? scena.creatures.filter(c => c.isTarget && c.found).length : 0;
  const targetTotali = scena ? scena.creatures.filter(c => c.isTarget).length : 0;

  return (
    <PaperBackground style={{ minHeight: 540, borderRadius: 12, padding: "0.8rem 0.6rem 1.1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem" }}>

        {/* Header: riferimento del bersaglio + contatore */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", maxWidth: 460, padding: "0.25rem 0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LenteIcon size={20} />
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: NAT_COLORS.inchiostro }}>
              Trova
            </span>
            {/* riferimento del bersaglio (sprite pulito, senza mimetismo) */}
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, borderRadius: 8,
              background: NAT_COLORS.cartaChiara,
              border: `1.8px solid ${NAT_COLORS.seppia}`,
              boxShadow: "0 1px 3px rgba(60,40,20,0.2)",
            }}>
              {scena && (
                <svg viewBox="0 0 100 100" width={38} height={38} style={{ display: "block" }}>
                  <SceneDefs />
                  <g transform="translate(50 50)">
                    <Creature kind={scena.targetKind} />
                  </g>
                </svg>
              )}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0.32rem 0.7rem", borderRadius: 999,
            background: NAT_COLORS.cartaChiara,
            border: `1.6px solid ${NAT_COLORS.seppia}`,
          }}>
            <span style={{ fontSize: "0.82rem", color: NAT_COLORS.seppia, fontWeight: 700 }}>
              Catturati
            </span>
            <span style={{ fontSize: "0.92rem", fontWeight: 900, color: NAT_COLORS.inchiostro }}>
              {targetTrovati}/{targetTotali}
            </span>
          </div>
        </div>

        {/* Scena SVG (cornice taccuino) */}
        <div style={{
          position: "relative",
          width: "100%", maxWidth: 460,
          border: `3px solid ${NAT_COLORS.seppia}`,
          borderRadius: 8,
          overflow: "hidden",
          background: NAT_COLORS.cartaChiara,
          boxShadow: "inset 0 0 24px rgba(60,40,20,0.18), 0 4px 14px rgba(60,40,20,0.25)",
        }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SCENE_VIEWBOX_W} ${SCENE_VIEWBOX_H}`}
            preserveAspectRatio="xMidYMid slice"
            style={{
              display: "block",
              width: "100%",
              aspectRatio: `${SCENE_VIEWBOX_W} / ${SCENE_VIEWBOX_H}`,
              touchAction: "manipulation",
              userSelect: "none",
              cursor: "crosshair",
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { pointerStartRef.current = null; }}
          >
            <SceneDefs />
            {scena && renderScene(scena.kind)}
            {scena && scena.creatures.map(c => (
              <CreatureSlot
                key={c.id}
                creature={c}
                size={config.creaturaSizeUnits}
                mimetismo={config.mimetismo}
                tintColor={tintForScene(scena.kind)}
              />
            ))}

            {/* flash su tocco errato */}
            {wrongFlash && (
              <g key={wrongFlash.key} transform={`translate(${wrongFlash.x} ${wrongFlash.y})`} pointerEvents="none">
                <circle r={config.clickRadiusUnits * 0.8} fill="none" stroke="#C0392B" strokeWidth={5} opacity={0.85} />
                <line x1={-16} y1={-16} x2={16} y2={16} stroke="#C0392B" strokeWidth={6} strokeLinecap="round" />
                <line x1={16} y1={-16} x2={-16} y2={16} stroke="#C0392B" strokeWidth={6} strokeLinecap="round" />
              </g>
            )}

            {/* doppia cornice interna stile tavola */}
            <rect x="6" y="6" width={SCENE_VIEWBOX_W - 12} height={SCENE_VIEWBOX_H - 12}
              fill="none" stroke={NAT_COLORS.seppia} strokeWidth="2" opacity="0.5" rx="3"
              pointerEvents="none" />
            <rect x="14" y="14" width={SCENE_VIEWBOX_W - 28} height={SCENE_VIEWBOX_H - 28}
              fill="none" stroke={NAT_COLORS.seppia} strokeWidth="0.8" opacity="0.35" rx="2"
              pointerEvents="none" />
          </svg>

          {/* overlay intro/outro */}
          {showIntro && (
            <div style={overlayStyle()}>
              <span style={overlayBadgeStyle()}>Tavola #{sceneIndex + 1}</span>
              {scena && (
                <p style={{
                  fontSize: "0.95rem", color: NAT_COLORS.inchiostro, margin: "8px 0 0",
                  fontWeight: 700, fontFamily: "Georgia, 'Times New Roman', serif",
                }}>
                  {labelForScene(scena.kind)} · scova {targetTotali === 1 ? "il bersaglio" : `i ${targetTotali} bersagli`}
                </p>
              )}
            </div>
          )}
          {showOutro && (
            <div style={overlayStyle()}>
              <span style={overlayBadgeStyle()}>
                {targetTrovati === targetTotali ? "Tavola completata!" : "Continua alla prossima..."}
              </span>
            </div>
          )}
        </div>

        <p style={{
          fontSize: "0.78rem", color: NAT_COLORS.seppia, margin: 0, textAlign: "center",
          maxWidth: 380, lineHeight: 1.35, fontStyle: "italic",
        }}>
          Tocca solo le creature uguali a quella mostrata in alto. Lavora con calma.
        </p>
      </div>
    </PaperBackground>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function currentCreaturePos(c: PlacedCreature, now: number): { x: number; y: number } {
  if (!c.motion) return { x: c.x, y: c.y };
  const t = (now / c.motion.periodMs) * 2 * Math.PI + c.motion.phase;
  return {
    x: c.x + c.motion.rx * Math.cos(t),
    y: c.y + c.motion.ry * Math.sin(t),
  };
}

function overlayStyle(): CSSProperties {
  return {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "rgba(242, 230, 204, 0.78)",
    pointerEvents: "none",
  };
}

function overlayBadgeStyle(): CSSProperties {
  return {
    padding: "10px 18px",
    background: NAT_COLORS.cartaChiara,
    border: `2px solid ${NAT_COLORS.seppia}`,
    borderRadius: 10,
    fontSize: "1.05rem", fontWeight: 900,
    color: NAT_COLORS.inchiostro,
    boxShadow: "0 3px 10px rgba(60,40,20,0.25)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  };
}

// ── singolo slot creatura (gestisce moto + tinta mimetica + occlusione) ───────

function CreatureSlot({
  creature, size, mimetismo, tintColor,
}: {
  creature: PlacedCreature;
  size: number;
  mimetismo: number;
  tintColor: string;
}) {
  const now = performance.now();
  const pos = currentCreaturePos(creature, now);
  const scale = size / 100;

  return (
    <g transform={`translate(${pos.x} ${pos.y})`}>
      {creature.isTarget && creature.found && (
        <>
          <circle r={size * 0.55} fill="none" stroke="#3A8E45" strokeWidth={3.5} opacity="0.9"
            strokeDasharray="6 5" />
          <circle r={size * 0.42} fill="rgba(58,142,69,0.10)" />
        </>
      )}
      <g transform={`rotate(${creature.rotation}) scale(${scale})`}>
        <Creature
          kind={creature.kind}
          opacity={creature.found ? 1 : (0.95 - mimetismo * 0.12)}
          tintColor={tintColor}
          tintMix={creature.found ? 0 : mimetismo * 0.78}
        />
      </g>
      {/* foglia di primo piano (occlusione parziale) — disegnata SOPRA lo sprite */}
      {creature.occlusa && !creature.found && (
        <OccludingLeaf seed={creature.occlusioneSeed} size={size} tintColor={tintColor} />
      )}
    </g>
  );
}

function OccludingLeaf({ seed, size, tintColor }: { seed: number; size: number; tintColor: string }) {
  const rot = (seed * 53) % 360;
  const dx = ((seed * 7) % 30) - 15;
  const dy = ((seed * 11) % 30) - 15;
  const w = size * 0.6;
  const h = size * 0.32;
  return (
    <g transform={`translate(${dx} ${dy}) rotate(${rot})`} opacity="0.88">
      <ellipse cx="0" cy="0" rx={w / 2} ry={h / 2}
        fill={tintColor} stroke={NAT_COLORS.inchiostro} strokeWidth="0.6" />
      <line x1={-w / 2 + 2} y1="0" x2={w / 2 - 2} y2="0"
        stroke={NAT_COLORS.inchiostro} strokeWidth="0.5" opacity="0.6" />
    </g>
  );
}
