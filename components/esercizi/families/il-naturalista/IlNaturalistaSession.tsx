"use client";

/**
 * IlNaturalistaSession — loop di gioco del Naturalista.
 *
 * Per ogni scena:
 *  1. campiona tipologia scena dal pool del livello, evita ripetizione consecutiva
 *  2. genera N creature, posizionate senza sovrapposizioni in area "vivibile"
 *     coerente con l'habitat (prato → suolo, fondale → acqua, ecc.)
 *  3. assegna lento moto (deriva ellittica) a `numMobili` creature dal lv 6
 *  4. l'utente tocca ciascuna entro un raggio generoso intorno al centro sprite
 *  5. quando tutte trovate o scade il tLimSceneMs → scena successiva
 *
 * Scoring per scena:
 *   base 30 se tutte trovate
 *   bonus velocità = round(40 * max(0, 1 - tempo / tLim)) se tutte trovate
 *   bonus completezza = round(30 * (foundInScene / numCreature))
 *   scoreGrezzo = media per scena, 0–100.
 * Accuratezza valutativa = creatureTrovate / creatureMostrate (0..1).
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
  x: number;
  y: number;
  rotation: number;
  motion: { rx: number; ry: number; periodMs: number; phase: number } | null;
  /** Se true, viene disegnata una "foglia di primo piano" sopra parte dello sprite. */
  occlusa: boolean;
  occlusioneSeed: number;
  found: boolean;
}

interface SceneInstance {
  kind: SceneKind;
  creatures: PlacedCreature[];
}

// ── Costanti layout ──────────────────────────────────────────────────────────

const MIN_DIST_BETWEEN_CREATURES = 120;
const SCENE_INTRO_MS = 600;
const SCENE_OUTRO_MS = 700;
const DRAG_TAP_THRESHOLD_PX = 8;

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
  const creatureTrovateRef = useRef(0);
  const creatureMostrateRef = useRef(0);
  const tapVuotiRef = useRef(0);
  const scoreTotaleRef = useRef(0);
  const sceneCompleteRef = useRef(0);

  // ── stato ───────────────────────────────────────────────────────────────
  const [sceneIndex, setSceneIndex] = useState(0);
  const [scena, setScena] = useState<SceneInstance | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);
  const sceneStartTsRef = useRef(0);
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
      case "prato-fiorito":         return { yMin: 280, yMax: 640, xMin: 80, xMax: 920 };
      case "prato-alpino":          return { yMin: 360, yMax: 640, xMin: 60, xMax: 940 };
      case "bosco-rado":
      case "bosco":
      case "bosco-fitto":           return { yMin: 180, yMax: 640, xMin: 70, xMax: 930 };
      case "sottobosco-autunnale":  return { yMin: 250, yMax: 640, xMin: 70, xMax: 930 };
      case "stagno-ninfee":         return { yMin: 260, yMax: 640, xMin: 80, xMax: 920 };
      case "fondale-chiaro":
      case "fondale-fitto":         return { yMin: 130, yMax: 540, xMin: 80, xMax: 920 };
      case "scogliera-marina":      return { yMin: 540, yMax: 670, xMin: 60, xMax: 940 };
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
    const area = areaForScene(kind);

    const placed: PlacedCreature[] = [];
    const N = config.numCreature;
    let safety = 0;
    while (placed.length < N && safety < 600) {
      safety++;
      const x = area.xMin + Math.random() * (area.xMax - area.xMin);
      const y = area.yMin + Math.random() * (area.yMax - area.yMin);
      const tooClose = placed.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST_BETWEEN_CREATURES);
      if (tooClose) continue;

      const creatureKind = habitatPool[Math.floor(Math.random() * habitatPool.length)];
      const willMove = placed.length < config.numMobili;
      placed.push({
        id: placed.length,
        kind: creatureKind,
        x, y,
        rotation: (Math.random() * 30 - 15),
        motion: willMove
          ? {
            rx: 28 + Math.random() * 28,
            ry: 14 + Math.random() * 14,
            periodMs: 6500 + Math.random() * 3500,
            phase: Math.random() * Math.PI * 2,
          }
          : null,
        occlusa: Math.random() < config.probOcclusione,
        occlusioneSeed: Math.floor(Math.random() * 1000),
        found: false,
      });
    }

    creatureMostrateRef.current += placed.length;
    setScena({ kind, creatures: placed });
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

  // ── finalizzazione su tempoScaduto ──────────────────────────────────────
  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;

    const trovate = creatureTrovateRef.current;
    const mostrate = Math.max(1, creatureMostrateRef.current);
    const accuratezzaValutativa = trovate / mostrate;
    const scoreGrezzo = Math.max(0, Math.min(100, Math.round(
      scoreTotaleRef.current / Math.max(1, sceneCompleteRef.current) || 0
    )));

    onComplete({
      accuratezzaValutativa,
      scoreGrezzo,
      metriche: {
        scene_completate: sceneCompleteRef.current,
        creature_trovate: trovate,
        creature_mostrate: creatureMostrateRef.current,
        tap_vuoti: tapVuotiRef.current,
      },
    });
  }, [tempoScaduto, onComplete]);

  // ── finalizza scena corrente ────────────────────────────────────────────
  const finalizeScene = useCallback(() => {
    if (!scena) return;
    const tempoSpeso = performance.now() - sceneStartTsRef.current;
    const trovateNellaScena = scena.creatures.filter(c => c.found).length;
    const N = scena.creatures.length;

    let punti = 0;
    if (trovateNellaScena === N) {
      const speedFactor = Math.max(0, 1 - tempoSpeso / config.tLimSceneMs);
      punti = 30 + Math.round(40 * speedFactor) + 30;
    } else {
      punti = Math.round(30 * (trovateNellaScena / N));
    }
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
    const restanti = scena.creatures.filter(c => !c.found).length;
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

  const tryHitCreature = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current || !scena) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // viewBox fisso 0,0,W,H → pixel→viewBox lineare
    const xVb = (px / rect.width) * SCENE_VIEWBOX_W;
    const yVb = (py / rect.height) * SCENE_VIEWBOX_H;

    const now = performance.now();
    let hit: PlacedCreature | null = null;
    let bestDist = Infinity;
    for (const c of scena.creatures) {
      if (c.found) continue;
      const pos = currentCreaturePos(c, now);
      const d = Math.hypot(pos.x - xVb, pos.y - yVb);
      if (d < config.clickRadiusUnits && d < bestDist) {
        bestDist = d;
        hit = c;
      }
    }

    if (hit) {
      const hitId = hit.id;
      setScena(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          creatures: prev.creatures.map(c => c.id === hitId ? { ...c, found: true } : c),
        };
      });
      creatureTrovateRef.current += 1;
      const restanti = scena.creatures.filter(c => !c.found && c.id !== hitId).length;
      if (restanti === 0) {
        setTimeout(() => finalizeScene(), 250);
      }
    } else {
      tapVuotiRef.current += 1;
    }
  }, [scena, config.clickRadiusUnits, finalizeScene]);

  const handlePointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // ignora se è stato un drag involontario
    if (Math.hypot(dx, dy) > DRAG_TAP_THRESHOLD_PX) return;
    if (!showIntro && !showOutro) {
      tryHitCreature(e.clientX, e.clientY);
    }
  }, [showIntro, showOutro, tryHitCreature]);

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

  // tinta mimetismo coerente con habitat
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

  const restanti = scena ? scena.creatures.filter(c => !c.found).length : 0;
  const totalScena = scena ? scena.creatures.length : 0;

  return (
    <PaperBackground style={{ minHeight: 540, borderRadius: 12, padding: "0.8rem 0.6rem 1.1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", maxWidth: 460, padding: "0.25rem 0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <LenteIcon size={20} />
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: NAT_COLORS.inchiostro }}>
              Tavola #{sceneIndex + 1}
            </span>
            {scena && (
              <span style={{
                fontSize: "0.72rem", color: NAT_COLORS.seppia, fontStyle: "italic",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                · {labelForScene(scena.kind)}
              </span>
            )}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0.32rem 0.7rem", borderRadius: 999,
            background: NAT_COLORS.cartaChiara,
            border: `1.6px solid ${NAT_COLORS.seppia}`,
          }}>
            <span style={{ fontSize: "0.82rem", color: NAT_COLORS.seppia, fontWeight: 700 }}>
              Trovate
            </span>
            <span style={{ fontSize: "0.92rem", fontWeight: 900, color: NAT_COLORS.inchiostro }}>
              {totalScena - restanti}/{totalScena}
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
                  {labelForScene(scena.kind)} · cerca {totalScena} creature
                </p>
              )}
            </div>
          )}
          {showOutro && (
            <div style={overlayStyle()}>
              <span style={overlayBadgeStyle()}>
                {restanti === 0 ? "Tavola completata!" : "Continua alla prossima..."}
              </span>
            </div>
          )}
        </div>

        <p style={{
          fontSize: "0.78rem", color: NAT_COLORS.seppia, margin: 0, textAlign: "center",
          maxWidth: 380, lineHeight: 1.35, fontStyle: "italic",
        }}>
          Tocca ogni creatura che riesci a scovare. Lavora con calma.
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
      {creature.found && (
        <>
          <circle r={size * 0.55} fill="none" stroke="#3A8E45" strokeWidth={3.5 / scale * scale} opacity="0.9"
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
