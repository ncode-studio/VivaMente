"use client";

/**
 * GuardianoGiardinoSession — sessione "Il Guardiano del Giardino".
 *
 * Ambiente unico (niente "corsie" verticali): ogni sprite spawna a una
 * coordinata Y casuale, con un piccolo bias naturalistico per tipo:
 *   - uccellini: zona alta (cielo)
 *   - farfalle:  zona media (cielo + sopra fiori)
 *   - api:       zona bassa (vicino a cespugli e fiori)
 *
 * Per evitare sovrapposizioni si tenta uno spawn-Y che disti almeno
 * GG_SPRITE_SIZE_PX dagli altri sprite attivi (max alcuni tentativi,
 * fallback alla prima Y proposta).
 *
 * UI volutamente minimale (target 60+, niente score / HUD / popup).
 * Tracking interno preservato per `accuratezzaValutativa` in onComplete.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  GG_GAME_H_PX,
  GG_SPRITE_SIZE_PX,
  type GGLevelConfig,
  type GGTipoSprite,
} from "./levels";
import {
  FarfallaSprite,
  ApeSprite,
  UccellinoSprite,
  LibellulaSprite,
  CoccinellaSprite,
  GardenBackground,
} from "./sprites";

// ── CSS animazioni ────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes gg-flap-l {
  0%, 100% { transform: rotate(0deg);   transform-origin: 50px 50px; }
  50%      { transform: rotate(-22deg); transform-origin: 50px 50px; }
}
@keyframes gg-flap-r {
  0%, 100% { transform: rotate(0deg);   transform-origin: 50px 50px; }
  50%      { transform: rotate(22deg);  transform-origin: 50px 50px; }
}
@keyframes gg-bee-buzz {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25%      { transform: translateY(-1.5px) rotate(-2deg); }
  75%      { transform: translateY(1.5px)  rotate(2deg); }
}
@keyframes gg-bird-flap {
  0%, 100% { transform: rotate(-4deg); transform-origin: 48px 52px; }
  50%      { transform: rotate(14deg); transform-origin: 48px 52px; }
}
@keyframes gg-dragon-wing {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50%      { transform: translateY(0) scaleY(0.65); }
}
@keyframes gg-ladybug-wing {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50%      { transform: translateY(-1px); opacity: 0.35; }
}
.gg-wing-l { animation: gg-flap-l 240ms ease-in-out infinite; }
.gg-wing-r { animation: gg-flap-r 240ms ease-in-out infinite; }
.gg-bee-wing { animation: gg-bee-buzz 140ms ease-in-out infinite; }
.gg-bird-wing { animation: gg-bird-flap 420ms ease-in-out infinite; }
.gg-dragon-wing { animation: gg-dragon-wing 90ms linear infinite; transform-origin: 50px 46px; }
.gg-ladybug-wing { animation: gg-ladybug-wing 110ms linear infinite; transform-origin: 36px 48px; }

@keyframes gg-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes gg-bob-bird {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes gg-catch-glow {
  0%   { transform: scale(1);   opacity: 0.9; }
  60%  { transform: scale(1.7); opacity: 0.55; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes gg-shake {
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  50%  { transform: translateX(5px); }
  75%  { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
`;

// ── Tipi runtime ──────────────────────────────────────────────────────────────

interface SpriteAttivo {
  id:        number;
  tipo:      GGTipoSprite;
  variant:   number;
  /** Y in px misurata dal top dell'area di gioco (posizione fissa per la durata della traiettoria). */
  topPx:     number;
  direzione: 1 | -1;
  spawnAt:   number;
  crossMs:   number;
  xPct:      number;
}

interface FeedbackTap {
  id:        number;
  tipo:      GGTipoSprite;
  variant:   number;
  direzione: 1 | -1;
  esito:     "ok" | "err";
  topPx:     number;
  xPct:      number;
  tapAt:     number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function computeXPct(spawnAt: number, crossMs: number, direzione: 1 | -1): number {
  const t = Math.min(1.05, (Date.now() - spawnAt) / crossMs);
  const from = direzione === 1 ? -12 : 112;
  const to   = direzione === 1 ? 112 : -12;
  return from + t * (to - from);
}

/**
 * Range Y di spawn per tipo (px dal top dell'area di gioco).
 * Bias naturalistico: uccelli in alto (cielo), farfalle medie, api basse.
 * I range si sovrappongono per dare varietà.
 */
function rangeY(tipo: GGTipoSprite): [number, number] {
  switch (tipo) {
    case "uccellino":  return [18, 170];
    case "libellula":  return [60, 230];   // zona media — sorvola spesso l'acqua/erba
    case "farfalla":   return [90, 250];
    case "coccinella": return [200, 310];  // volo basso, vicino ai fiori
    case "ape":        return [180, 310];
  }
}

/** Tenta uno spawn-Y casuale che disti almeno minDist da spriteEsistenti. */
function pickTopPx(
  tipo: GGTipoSprite,
  spriteEsistenti: readonly SpriteAttivo[],
): number {
  const [yMin, yMax] = rangeY(tipo);
  const minDist = GG_SPRITE_SIZE_PX * 0.85;
  for (let i = 0; i < 6; i++) {
    const candidate = yMin + Math.random() * (yMax - yMin);
    const ok = spriteEsistenti.every((s) => Math.abs(s.topPx - candidate) > minDist);
    if (ok) return candidate;
  }
  return yMin + Math.random() * (yMax - yMin);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  config:       GGLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function GuardianoGiardinoSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  const [sprites,  setSprites]  = useState<SpriteAttivo[]>([]);
  const [feedback, setFeedback] = useState<FeedbackTap[]>([]);

  // Tracking accuratezza (interno)
  const farfalleSpawned  = useRef(0);
  const farfalleTappate  = useRef(0);
  const farfalleMancate  = useRef(0);
  const distrattoriSpawn = useRef(0);
  const distrattoriTap   = useRef(0);
  const tapsTotali       = useRef(0);

  const nextIdRef    = useRef(0);
  const lastSpawnRef = useRef(0);
  const completedRef = useRef(false);
  const configRef    = useRef(config);

  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => { onReady(); }, []); // eslint-disable-line

  // ── Game loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (completedRef.current) return;

    const id = setInterval(() => {
      if (completedRef.current) return;
      const now = Date.now();
      const cfg = configRef.current;

      // Aggiorna posizioni + rimuovi usciti
      setSprites((prev) => {
        const aggiornati: SpriteAttivo[] = [];
        for (const s of prev) {
          if (now - s.spawnAt >= s.crossMs) {
            if (s.tipo === "farfalla") farfalleMancate.current++;
            continue;
          }
          aggiornati.push({ ...s, xPct: computeXPct(s.spawnAt, s.crossMs, s.direzione) });
        }
        return aggiornati;
      });

      setFeedback((prev) => prev.filter((f) => now - f.tapAt < 500));

      if (now - lastSpawnRef.current >= cfg.spawnRateMs) {
        setSprites((prev) => {
          if (prev.length >= cfg.maxActive) return prev;
          lastSpawnRef.current = now;

          // Tipo (cumulativo su ordine: uccello, ape, libellula, coccinella, farfalla)
          const r = Math.random();
          const t1 = cfg.uccelloRate;
          const t2 = t1 + cfg.apeRate;
          const t3 = t2 + cfg.libellulaRate;
          const t4 = t3 + cfg.coccinellaRate;
          let tipo: GGTipoSprite;
          if      (r < t1) tipo = "uccellino";
          else if (r < t2) tipo = "ape";
          else if (r < t3) tipo = "libellula";
          else if (r < t4) tipo = "coccinella";
          else             tipo = "farfalla";

          if (tipo === "farfalla") farfalleSpawned.current++;
          else                     distrattoriSpawn.current++;

          const direzione: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          const variant   = Math.floor(Math.random() * 4);
          const topPx     = pickTopPx(tipo, prev);

          return [...prev, {
            id:      nextIdRef.current++,
            tipo, variant, topPx, direzione,
            spawnAt: now,
            crossMs: cfg.crossMs,
            xPct:    direzione === 1 ? -12 : 112,
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

    const farfalleTot   = farfalleSpawned.current;
    const farfalleHit   = farfalleTappate.current;
    const distrTot      = distrattoriSpawn.current;
    const distrErr      = distrattoriTap.current;
    const distrIgnorati = Math.max(0, distrTot - distrErr);
    const eventi        = farfalleTot + distrTot;
    const corretti      = farfalleHit + distrIgnorati;
    const acc           = eventi > 0 ? corretti / eventi : 0;

    onCompleteRef.current({
      accuratezzaValutativa: acc,
      // Score allineato all'accuratezza globale: i tap su distruttori
      // (uccellino/ape/libellula/coccinella) abbassano lo score, prima
      // restavano "invisibili" e l'utente vedeva 100% pur sbagliando molto.
      scoreGrezzo:           Math.round(acc * 100),
      metriche: {
        farfalle_spawned:    farfalleTot,
        farfalle_hit:        farfalleHit,
        farfalle_mancate:    farfalleMancate.current,
        distrattori_spawned: distrTot,
        distrattori_tap_err: distrErr,
        taps_totali:         tapsTotali.current,
      },
    });
  }, [tempoScaduto]);

  // ── Handler tap ───────────────────────────────────────────────────────────

  const handleTap = useCallback((s: SpriteAttivo) => {
    if (completedRef.current) return;
    tapsTotali.current++;

    const now = Date.now();
    setSprites((prev) => prev.filter((x) => x.id !== s.id));

    if (s.tipo === "farfalla") {
      farfalleTappate.current++;
      setFeedback((p) => [...p, {
        id: s.id, tipo: s.tipo, variant: s.variant, direzione: s.direzione, esito: "ok",
        topPx: s.topPx, xPct: s.xPct, tapAt: now,
      }]);
    } else {
      distrattoriTap.current++;
      setFeedback((p) => [...p, {
        id: s.id, tipo: s.tipo, variant: s.variant, direzione: s.direzione, esito: "err",
        topPx: s.topPx, xPct: s.xPct, tapAt: now,
      }]);
    }
  }, []);

  // ── Render sprite per tipo ─────────────────────────────────────────────────

  const renderSprite = (s: SpriteAttivo) => {
    if (s.tipo === "farfalla")   return <FarfallaSprite   size={GG_SPRITE_SIZE_PX} dir={s.direzione} variant={s.variant} />;
    if (s.tipo === "ape")        return <ApeSprite        size={GG_SPRITE_SIZE_PX} dir={s.direzione} />;
    if (s.tipo === "uccellino")  return <UccellinoSprite  size={GG_SPRITE_SIZE_PX} dir={s.direzione} />;
    if (s.tipo === "libellula")  return <LibellulaSprite  size={GG_SPRITE_SIZE_PX} dir={s.direzione} />;
    return <CoccinellaSprite size={GG_SPRITE_SIZE_PX} dir={s.direzione} />;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      <style>{ANIM_CSS}</style>

      <div style={{
        position: "relative",
        width: "100%",
        height: GG_GAME_H_PX,
        overflow: "hidden",
      }}>
        {/* Background giardino realistico */}
        <GardenBackground />

        {/* Sprite attivi */}
        {sprites.map((s) => {
          const bobAnim =
            s.tipo === "uccellino"  ? "gg-bob-bird 1500ms ease-in-out infinite" :
            s.tipo === "farfalla"   ? "gg-bob 1000ms ease-in-out infinite" :
            s.tipo === "libellula"  ? "gg-bob 1200ms ease-in-out infinite" :
            undefined;

          return (
            <button
              key={s.id}
              onClick={() => handleTap(s)}
              aria-label={s.tipo}
              style={{
                position: "absolute",
                top:  s.topPx,
                left: `calc(${s.xPct}% - ${GG_SPRITE_SIZE_PX / 2}px)`,
                width:  GG_SPRITE_SIZE_PX,
                height: GG_SPRITE_SIZE_PX,
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                animation: bobAnim,
                WebkitTapHighlightColor: "transparent",
                zIndex: 10,
              }}
            >
              {renderSprite(s)}
            </button>
          );
        })}

        {/* Feedback al tap — solo grafica */}
        {feedback.map((f) => (
          <div
            key={`fb-${f.id}`}
            style={{
              position: "absolute",
              top:  f.topPx,
              left: `calc(${f.xPct}% - ${GG_SPRITE_SIZE_PX / 2}px)`,
              width:  GG_SPRITE_SIZE_PX,
              height: GG_SPRITE_SIZE_PX,
              pointerEvents: "none",
              animation: f.esito === "ok"
                ? "gg-catch-glow 480ms ease-out forwards"
                : "gg-shake 360ms ease-in-out forwards",
              zIndex: 11,
            }}
          >
            {f.esito === "ok" && (
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
              }} />
            )}
            <div style={{ opacity: f.esito === "ok" ? 0.55 : 0.85 }}>
              {f.tipo === "farfalla"   && <FarfallaSprite   size={GG_SPRITE_SIZE_PX} dir={f.direzione} variant={f.variant} />}
              {f.tipo === "ape"        && <ApeSprite        size={GG_SPRITE_SIZE_PX} dir={f.direzione} />}
              {f.tipo === "uccellino"  && <UccellinoSprite  size={GG_SPRITE_SIZE_PX} dir={f.direzione} />}
              {f.tipo === "libellula"  && <LibellulaSprite  size={GG_SPRITE_SIZE_PX} dir={f.direzione} />}
              {f.tipo === "coccinella" && <CoccinellaSprite size={GG_SPRITE_SIZE_PX} dir={f.direzione} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
