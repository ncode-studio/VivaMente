"use client";

/**
 * VigileUrbanoSession — sessione "Il Vigile Urbano".
 *
 * Incrocio a croce visto dall'alto. I veicoli arrivano dai 4 ingressi
 * cardinali e si dirigono verso il centro. Ogni ingresso ha un semaforo
 * nel proprio angolo dell'incrocio. Default tutti rossi: tap → toggle.
 *
 * Modello di moto: ogni veicolo ha un `pos` ∈ [0..2]:
 *   - 0   = spawn (fuori schermo dal proprio bordo)
 *   - 1.0 = stop line del proprio ingresso
 *   - 2.0 = uscita schermo dal lato opposto
 *
 * `pos` viene incrementato ad ogni frame in funzione del tempo
 * trascorso, ma viene CAPPATO in modo che un veicolo non possa
 * avvicinarsi al precedente in coda oltre VEHICLE_L + spacing.
 *
 * Quando un veicolo raggiunge pos=1 il primo tick:
 *   - semaforo verde → fase "passing", procede oltre
 *   - semaforo rosso → fase "stopped", aspetta waitMs (o riparte se il
 *                      semaforo torna verde nel frattempo)
 *
 * Accuratezza valutativa = (target_passati + nontarg_fermati) /
 *                          (target_spawn + nontarg_spawn)
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  VU_BOARD_PX,
  VU_VEHICLE_W,
  VU_VEHICLE_L,
  VU_LANE_W_PX,
  VU_STOPLINE_FROM_CENTER_PX,
  VU_LIGHT_PX,
  VU_TIPI,
  getVuIngressiAttivi,
  type VuLevelConfig,
  type VuTipoId,
  type VuIngresso,
} from "./levels";
import { VehicleSprite, VehicleIconHud } from "./sprites";

// ── CSS animazioni ────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes vu-fade-out {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes vu-rule-flash {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(56,189,248,0.65); }
  50%  { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(56,189,248,0);   }
  100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(56,189,248,0);    }
}
@keyframes vu-light-pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
  50%      { box-shadow: 0 0 0 10px rgba(34,197,94,0);  }
}
@keyframes vu-light-pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.55); }
  50%      { box-shadow: 0 0 0 10px rgba(239,68,68,0);  }
}
`;

// ── Tipi runtime ──────────────────────────────────────────────────────────────

type VFase = "approaching" | "stopped" | "passing" | "leaving";

interface Veicolo {
  id:        number;
  ingresso:  VuIngresso;
  tipo:      VuTipoId;
  /** Posizione lungo il percorso: 0 spawn, 1 stop-line, 2 uscita. */
  pos:       number;
  fase:      VFase;
  /** Timestamp ms dell'ingresso fase corrente (per stopped/leaving). */
  faseAt:    number;
  /** Giudizio cumulativo (per rollback se un veicolo fermo riparte). */
  giudizio:  "passato_ok" | "passato_err" | "fermato_ok" | "fermato_err" | null;
}

// ── Geometria ─────────────────────────────────────────────────────────────────

const CENTER = VU_BOARD_PX / 2;

/** Distanza percorsa dal muso del veicolo nel tratto di approach (pos 0→1) in px. */
const APPROACH_PX = CENTER - VU_STOPLINE_FROM_CENTER_PX;
/** Distanza percorsa dal muso nel tratto di exit (pos 1→2). */
const EXIT_PX = VU_BOARD_PX - (CENTER - VU_STOPLINE_FROM_CENTER_PX) + VU_VEHICLE_L;

/** Gap minimo tra veicoli (in unità di pos, mappato dalla distanza fisica). */
const MIN_GAP_PX = VU_VEHICLE_L + 12;
const MIN_GAP_POS = MIN_GAP_PX / APPROACH_PX;

/** Velocità "passing" più rapida del normale: rendere visibile l'uscita. */
const PASSING_SPEED_MUL = 1.4;

/**
 * Intervallo di pos in cui un veicolo "passing" occupa fisicamente l'incrocio
 * (dal muso che entra al retro che esce dall'altro lato). Stimato in base alla
 * geometria: stop line a 88px dal centro → opposite stop line a 88px dall'altra
 * parte → intersezione ≈ 176px; più VEHICLE_L=60 per liberare con il retro.
 * Totale path passing = EXIT_PX; frazione occupata ≈ (176 + L) / EXIT_PX.
 */
const INTERSECTION_CLEAR_POS = 1 + (2 * VU_STOPLINE_FROM_CENTER_PX + VU_VEHICLE_L) / EXIT_PX;

/**
 * Convenzione "tieni la destra":
 *   - N (scende):  semi-corsia di destra = X più alta
 *   - S (sale):    semi-corsia di destra = X più bassa
 *   - E (va W):    semi-corsia di destra = Y più bassa
 *   - W (va E):    semi-corsia di destra = Y più alta
 */
function laneCenterCoord(ingresso: VuIngresso): number {
  const offset = VU_LANE_W_PX / 4;
  if (ingresso === "N") return CENTER + offset;
  if (ingresso === "S") return CENTER - offset;
  if (ingresso === "E") return CENTER - offset;
  /* W */               return CENTER + offset;
}

/**
 * Posizione del MUSO del veicolo (front-end) lungo l'asse di moto, in
 * funzione di pos ∈ [0..2].
 *
 *   pos=0 → muso appena al bordo dello schermo (lato di ingresso)
 *   pos=1 → muso allineato alla stop line
 *   pos=2 → muso al bordo opposto (uscita)
 */
function musoCoord(ingresso: VuIngresso, pos: number): number {
  // Stop line nel proprio asse di moto.
  const stopApproach = (ingresso === "N" || ingresso === "W")
    ? CENTER - VU_STOPLINE_FROM_CENTER_PX
    : CENTER + VU_STOPLINE_FROM_CENTER_PX;
  // Bordo di ingresso (dove pos=0).
  const enterEdge = (ingresso === "N" || ingresso === "W") ? 0 : VU_BOARD_PX;
  // Bordo di uscita (dove pos=2).
  const exitEdge = (ingresso === "N" || ingresso === "W") ? VU_BOARD_PX : 0;

  if (pos <= 1) {
    return enterEdge + (stopApproach - enterEdge) * pos;
  }
  return stopApproach + (exitEdge - stopApproach) * (pos - 1);
}

/**
 * top-left dello sprite (rettangolo W×L), tenuto conto che la rotazione
 * CSS è attorno al centro: posizioniamo il CENTRO dello sprite, poi
 * sottraiamo (W/2, L/2) per ottenere il top-left.
 */
function posToXY(ingresso: VuIngresso, pos: number): { top: number; left: number } {
  const muso = musoCoord(ingresso, pos);
  const laneCoord = laneCenterCoord(ingresso);
  const halfL = VU_VEHICLE_L / 2;
  const halfW = VU_VEHICLE_W / 2;

  // Centro = muso spostato all'indietro di L/2 nella direzione di marcia.
  // Direzione "avanti": N=+y, S=-y, E=-x, W=+x.
  let cx: number, cy: number;
  if (ingresso === "N") { cx = laneCoord;       cy = muso - halfL; }
  else if (ingresso === "S") { cx = laneCoord;  cy = muso + halfL; }
  else if (ingresso === "E") { cx = muso + halfL; cy = laneCoord; }
  else /* W */                { cx = muso - halfL; cy = laneCoord; }

  return { top: cy - halfL, left: cx - halfW };
}

/** Posizione top-left del semaforo (sui 4 angoli dell'incrocio). */
function lightPos(ingresso: VuIngresso): { top: number; left: number } {
  const out = VU_LANE_W_PX / 2 + 6; // off-road, sul marciapiede
  if (ingresso === "N") {
    // angolo NE
    return { top: CENTER - out - VU_LIGHT_PX, left: CENTER + out };
  }
  if (ingresso === "S") {
    // angolo SW
    return { top: CENTER + out, left: CENTER - out - VU_LIGHT_PX };
  }
  if (ingresso === "E") {
    // angolo SE
    return { top: CENTER + out, left: CENTER + out };
  }
  /* W — angolo NW */
  return { top: CENTER - out - VU_LIGHT_PX, left: CENTER - out - VU_LIGHT_PX };
}

/**
 * Rotazione sprite. Sprite default: muso verso l'ALTO (nord).
 *   N (va giù):  ruota 180 → muso giù
 *   S (va su):   0          → muso su (default)
 *   E (va a sx): 270 (-90)  → muso a sinistra
 *   W (va a dx): 90         → muso a destra
 */
function rotationDeg(ingresso: VuIngresso): number {
  if (ingresso === "N") return 180;
  if (ingresso === "S") return 0;
  if (ingresso === "E") return 270;
  /* W */               return 90;
}

function pickTipo(pool: readonly VuTipoId[], target: VuTipoId, targetRate: number): VuTipoId {
  if (Math.random() < targetRate) return target;
  const distrattori = pool.filter((t) => t !== target);
  if (distrattori.length === 0) return target;
  return distrattori[Math.floor(Math.random() * distrattori.length)];
}

function pickNewTarget(pool: readonly VuTipoId[], current: VuTipoId): VuTipoId {
  const cand = pool.filter((t) => t !== current);
  if (cand.length === 0) return current;
  return cand[Math.floor(Math.random() * cand.length)];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  config:       VuLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

const TICK_MS = 50;

export function VigileUrbanoSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  const ingressiAttivi = useRef<readonly VuIngresso[]>(
    getVuIngressiAttivi(config.numIngressi),
  );

  const poolRef = useRef<VuTipoId[]>(
    VU_TIPI.slice(0, config.poolSize).map((t) => t.id),
  );

  const [autorizzato, setAutorizzato] = useState<VuTipoId>(() => {
    return poolRef.current[Math.floor(Math.random() * poolRef.current.length)];
  });
  const autorizzatoRef = useRef<VuTipoId>(autorizzato);
  useLayoutEffect(() => { autorizzatoRef.current = autorizzato; }, [autorizzato]);

  const [ruleFlash, setRuleFlash] = useState(0);

  const [semafori, setSemafori] = useState<Record<VuIngresso, "rosso" | "verde">>({
    N: "rosso", S: "rosso", E: "rosso", W: "rosso",
  });
  const semaforiRef = useRef(semafori);
  useLayoutEffect(() => { semaforiRef.current = semafori; }, [semafori]);

  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);

  // Tracking accuratezza
  const targetSpawn   = useRef(0);
  const nontargSpawn  = useRef(0);
  const targetPassati = useRef(0);
  const targetFermati = useRef(0);
  const nontargPassati = useRef(0);
  const nontargFermati = useRef(0);

  const nextIdRef = useRef(0);
  const lastSpawnRef = useRef<Record<VuIngresso, number>>({ N: 0, S: 0, E: 0, W: 0 });
  const lastRuleChangeRef = useRef(Date.now());
  const completedRef = useRef(false);
  const configRef = useRef(config);
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
      const attivi = ingressiAttivi.current;

      setVeicoli((prev) => {
        const dApproach = TICK_MS / cfg.crossMs;
        const dPassing  = (TICK_MS / cfg.crossMs) * PASSING_SPEED_MUL * (APPROACH_PX / EXIT_PX);

        // Occupazione corrente dell'incrocio per asse (V = N/S, H = E/W).
        // Un veicolo "passing" con pos ∈ [1, INTERSECTION_CLEAR_POS] occupa
        // l'incrocio. Veicoli sullo stesso asse non si scontrano (semi-corsie
        // opposte); veicoli sull'asse perpendicolare invece sì → devono attendere.
        const axisOccupied = { V: false, H: false };
        for (const o of prev) {
          if (o.fase === "passing" && o.pos < INTERSECTION_CLEAR_POS) {
            if (o.ingresso === "N" || o.ingresso === "S") axisOccupied.V = true;
            else                                            axisOccupied.H = true;
          }
        }
        const perpClear = (ing: VuIngresso): boolean => {
          const isV = ing === "N" || ing === "S";
          return isV ? !axisOccupied.H : !axisOccupied.V;
        };

        // Raggruppa per ingresso ordinati per pos decrescente (front-to-back).
        const byLane: Record<VuIngresso, Veicolo[]> = { N: [], S: [], E: [], W: [] };
        for (const v of prev) byLane[v.ingresso].push(v);
        for (const ing of attivi) byLane[ing].sort((a, b) => b.pos - a.pos);

        const out: Veicolo[] = [];

        for (const ing of attivi) {
          const lane = byLane[ing];
          let frontPos: number | null = null;

          for (const v of lane) {
            let next: Veicolo = v;

            if (v.fase === "approaching") {
              let target = Math.min(1, v.pos + dApproach);
              if (frontPos !== null) {
                const cap = frontPos - MIN_GAP_POS;
                if (target > cap) target = cap;
              }
              if (target < v.pos) target = v.pos;
              next = { ...v, pos: target };

              // Raggiunto / mantenuto stop line (ri-valutato ogni tick finché
              // resta a pos≈1 senza un giudizio definitivo).
              if (target >= 1) {
                next.pos = 1;
                const stato = semaforiRef.current[ing];
                const isTarget = v.tipo === autorizzatoRef.current;

                if (stato === "verde") {
                  if (perpClear(ing)) {
                    if (isTarget) targetPassati.current++;
                    else          nontargPassati.current++;
                    next = { ...next, fase: "passing", giudizio: isTarget ? "passato_ok" : "passato_err", faseAt: now };
                  }
                  // else: attende al verde finché l'incrocio non si libera.
                } else {
                  // Rosso → si ferma e viene giudicato come "fermato".
                  if (isTarget) targetFermati.current++;
                  else          nontargFermati.current++;
                  next = { ...next, fase: "stopped", giudizio: isTarget ? "fermato_err" : "fermato_ok", faseAt: now };
                }
              }
            } else if (v.fase === "stopped") {
              const stato = semaforiRef.current[ing];
              if (stato === "verde" && perpClear(ing)) {
                if (v.giudizio === "fermato_err") { targetFermati.current--; targetPassati.current++; }
                else if (v.giudizio === "fermato_ok")  { nontargFermati.current--; nontargPassati.current++; }
                const isTarget = v.tipo === autorizzatoRef.current;
                next = { ...v, fase: "passing", giudizio: isTarget ? "passato_ok" : "passato_err", faseAt: now };
              } else if (now - v.faseAt >= cfg.waitMs) {
                next = { ...v, fase: "leaving", faseAt: now };
              }
            } else if (v.fase === "passing") {
              const target = Math.min(2, v.pos + dPassing);
              if (target >= 2) continue;
              next = { ...v, pos: target };
            } else if (v.fase === "leaving") {
              if (now - v.faseAt >= 400) continue;
            }

            out.push(next);
            if (next.fase === "approaching" || next.fase === "stopped") {
              frontPos = next.pos;
            }
          }
        }

        return out;
      });

      // Cambio regola autorizzazione.
      if (Number.isFinite(cfg.ruleChangeMs) && now - lastRuleChangeRef.current >= cfg.ruleChangeMs) {
        lastRuleChangeRef.current = now;
        const next = pickNewTarget(poolRef.current, autorizzatoRef.current);
        if (next !== autorizzatoRef.current) {
          setAutorizzato(next);
          setRuleFlash((k) => k + 1);
        }
      }

      // Spawn per ogni ingresso attivo.
      for (const ing of attivi) {
        if (now - lastSpawnRef.current[ing] < cfg.spawnMs) continue;

        setVeicoli((prev) => {
          const lane = prev.filter((v) => v.ingresso === ing);
          const inApproach = lane.filter((v) => v.fase === "approaching" || v.fase === "stopped");
          if (inApproach.length >= cfg.maxActive) return prev;

          // Non spawnare se l'ultimo veicolo in coda è ancora vicino allo spawn point.
          const minPos = inApproach.reduce((m, v) => Math.min(m, v.pos), Infinity);
          if (minPos < MIN_GAP_POS) return prev;

          lastSpawnRef.current[ing] = now;
          const tipo = pickTipo(poolRef.current, autorizzatoRef.current, cfg.targetRate);
          if (tipo === autorizzatoRef.current) targetSpawn.current++;
          else                                  nontargSpawn.current++;

          return [...prev, {
            id:       nextIdRef.current++,
            ingresso: ing,
            tipo,
            pos:      0,
            fase:     "approaching",
            faseAt:   now,
            giudizio: null,
          }];
        });
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Completamento ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;

    const tgtSpawn = targetSpawn.current;
    const ntgSpawn = nontargSpawn.current;
    const tgtPass  = targetPassati.current;
    const ntgFerm  = nontargFermati.current;

    const eventi   = tgtSpawn + ntgSpawn;
    const corretti = tgtPass + ntgFerm;
    const acc      = eventi > 0 ? corretti / eventi : 0;

    const score = tgtSpawn > 0 ? Math.round((tgtPass / tgtSpawn) * 100) : 0;

    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           score,
      metriche: {
        target_spawn:    tgtSpawn,
        target_passati:  tgtPass,
        target_fermati:  targetFermati.current,
        nontarg_spawn:   ntgSpawn,
        nontarg_passati: nontargPassati.current,
        nontarg_fermati: ntgFerm,
      },
    });
  }, [tempoScaduto]);

  // ── Handler tap semaforo ──────────────────────────────────────────────────

  const toggleSemaforo = useCallback((ing: VuIngresso) => {
    if (completedRef.current) return;
    setSemafori((prev) => ({
      ...prev,
      [ing]: prev[ing] === "rosso" ? "verde" : "rosso",
    }));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", userSelect: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{ANIM_CSS}</style>

      {/* HUD: cartello "passano solo" */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.4rem 0.85rem 0.4rem 0.95rem",
        marginBottom: "0.75rem",
        borderRadius: "999px",
        backgroundColor: "#FEF3C7",
        border: "2.5px solid #D97706",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
      }}>
        <span style={{
          fontSize: "0.72rem", fontWeight: 900, color: "#92400E",
          letterSpacing: "0.08em",
        }}>
          FAR PASSARE:
        </span>
        <div
          key={`tgt-${ruleFlash}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 42, height: 42,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: "2px solid #92400E",
            animation: ruleFlash > 0 ? "vu-rule-flash 800ms ease-out" : undefined,
            overflow: "hidden",
          }}
        >
          <VehicleIconHud tipo={autorizzato} size={40} />
        </div>
      </div>

      {/* Tavolo di gioco */}
      <div style={{
        position: "relative",
        width:  VU_BOARD_PX,
        height: VU_BOARD_PX,
        maxWidth: "100%",
        background: "radial-gradient(circle at 50% 50%, #9CD279 0%, #6FA84E 100%)",
        borderRadius: "0.85rem",
        overflow: "hidden",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.10)",
      }}>

        {/* Decorazioni angoli (cespugli) — nascoste sotto i semafori dei livelli alti */}
        <Cespuglio x={20}                  y={20} />
        <Cespuglio x={VU_BOARD_PX - 60}    y={20} />
        <Cespuglio x={20}                  y={VU_BOARD_PX - 60} />
        <Cespuglio x={VU_BOARD_PX - 60}    y={VU_BOARD_PX - 60} />

        {/* Strada verticale */}
        <div style={{
          position: "absolute",
          top: 0, bottom: 0,
          left:  CENTER - VU_LANE_W_PX / 2,
          width: VU_LANE_W_PX,
          background: "linear-gradient(90deg, #3F3F44 0%, #4A4A50 50%, #3F3F44 100%)",
          boxShadow: "inset 2px 0 0 rgba(255,255,255,0.04), inset -2px 0 0 rgba(0,0,0,0.18)",
        }} />
        {/* Strada orizzontale */}
        <div style={{
          position: "absolute",
          left: 0, right: 0,
          top:    CENTER - VU_LANE_W_PX / 2,
          height: VU_LANE_W_PX,
          background: "linear-gradient(180deg, #3F3F44 0%, #4A4A50 50%, #3F3F44 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.04), inset 0 -2px 0 rgba(0,0,0,0.18)",
        }} />

        {/* Strisce mezzeria — quattro tratti, uno per braccio */}
        <DashedLineVertical xCenter={CENTER} from={0} to={CENTER - VU_LANE_W_PX / 2} />
        <DashedLineVertical xCenter={CENTER} from={CENTER + VU_LANE_W_PX / 2} to={VU_BOARD_PX} />
        <DashedLineHorizontal yCenter={CENTER} from={0} to={CENTER - VU_LANE_W_PX / 2} />
        <DashedLineHorizontal yCenter={CENTER} from={CENTER + VU_LANE_W_PX / 2} to={VU_BOARD_PX} />

        {/* Tappetino centrale per coprire mezzerie sotto l'incrocio */}
        <div style={{
          position: "absolute",
          top:  CENTER - VU_LANE_W_PX / 2,
          left: CENTER - VU_LANE_W_PX / 2,
          width:  VU_LANE_W_PX,
          height: VU_LANE_W_PX,
          backgroundColor: "#46464C",
          zIndex: 1,
        }} />

        {/* Stop lines per ogni ingresso attivo */}
        {ingressiAttivi.current.map((ing) => (
          <StopLine key={`sl-${ing}`} ingresso={ing} />
        ))}

        {/* Veicoli (sotto i semafori per non coprirli quando attraversano) */}
        {veicoli.map((v) => {
          const pos = posToXY(v.ingresso, v.pos);
          const rot = rotationDeg(v.ingresso);
          const fading = v.fase === "leaving";
          return (
            <div
              key={v.id}
              style={{
                position: "absolute",
                top:  pos.top,
                left: pos.left,
                width:  VU_VEHICLE_W,
                height: VU_VEHICLE_L,
                pointerEvents: "none",
                zIndex: 12,
                transformOrigin: "50% 50%",
                transform: `rotate(${rot}deg)`,
                animation: fading ? "vu-fade-out 400ms ease-in forwards" : undefined,
              }}
            >
              <div style={{ width: VU_VEHICLE_W, height: VU_VEHICLE_L }}>
                <VehicleSprite tipo={v.tipo} size={VU_VEHICLE_W} />
              </div>
            </div>
          );
        })}

        {/* Semafori per ogni ingresso attivo (con paletto) */}
        {ingressiAttivi.current.map((ing) => {
          const pos = lightPos(ing);
          const stato = semafori[ing];
          return (
            <button
              key={`light-${ing}`}
              onClick={() => toggleSemaforo(ing)}
              aria-label={`Semaforo ${ing} — ${stato}`}
              style={{
                position: "absolute",
                top:  pos.top,
                left: pos.left,
                width:  VU_LIGHT_PX,
                height: VU_LIGHT_PX,
                padding: 0,
                border: "2.5px solid #111827",
                borderRadius: "12px",
                background: "linear-gradient(180deg, #1F2937 0%, #111827 100%)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column",
                gap: 4,
                zIndex: 25,
                WebkitTapHighlightColor: "transparent",
                boxShadow: "0 3px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: stato === "rosso" ? "#EF4444" : "#3F1D1D",
                boxShadow: stato === "rosso"
                  ? "0 0 10px rgba(239,68,68,0.9), inset 0 0 4px rgba(255,255,255,0.5)"
                  : "inset 0 1px 2px rgba(0,0,0,0.7)",
                animation: stato === "rosso" ? "vu-light-pulse-red 1800ms ease-in-out infinite" : undefined,
              }} />
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: stato === "verde" ? "#22C55E" : "#1D3F1D",
                boxShadow: stato === "verde"
                  ? "0 0 10px rgba(34,197,94,0.9), inset 0 0 4px rgba(255,255,255,0.5)"
                  : "inset 0 1px 2px rgba(0,0,0,0.7)",
                animation: stato === "verde" ? "vu-light-pulse-green 1500ms ease-in-out infinite" : undefined,
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-componenti UI ─────────────────────────────────────────────────────────

function DashedLineVertical({ xCenter, from, to }: { xCenter: number; from: number; to: number }) {
  const dashes: number[] = [];
  const len = to - from;
  const dashH = 16, gap = 14;
  for (let y = 4; y < len; y += dashH + gap) dashes.push(from + y);
  return (
    <>
      {dashes.map((y, i) => (
        <div key={`dv-${i}`} style={{
          position: "absolute",
          top: y, left: xCenter - 2,
          width: 4, height: dashH,
          backgroundColor: "#F4D03F",
          zIndex: 2,
          borderRadius: 1,
        }} />
      ))}
    </>
  );
}

function DashedLineHorizontal({ yCenter, from, to }: { yCenter: number; from: number; to: number }) {
  const dashes: number[] = [];
  const len = to - from;
  const dashW = 16, gap = 14;
  for (let x = 4; x < len; x += dashW + gap) dashes.push(from + x);
  return (
    <>
      {dashes.map((x, i) => (
        <div key={`dh-${i}`} style={{
          position: "absolute",
          top: yCenter - 2, left: x,
          width: dashW, height: 4,
          backgroundColor: "#F4D03F",
          zIndex: 2,
          borderRadius: 1,
        }} />
      ))}
    </>
  );
}

function StopLine({ ingresso }: { ingresso: VuIngresso }) {
  const thickness = 5;
  if (ingresso === "N") {
    return <div style={{
      position: "absolute",
      top: CENTER - VU_STOPLINE_FROM_CENTER_PX,
      left: CENTER,
      width: VU_LANE_W_PX / 2,
      height: thickness,
      backgroundColor: "#FFFFFF",
      zIndex: 3,
      boxShadow: "0 0 4px rgba(255,255,255,0.4)",
    }} />;
  }
  if (ingresso === "S") {
    return <div style={{
      position: "absolute",
      top: CENTER + VU_STOPLINE_FROM_CENTER_PX - thickness,
      left: CENTER - VU_LANE_W_PX / 2,
      width: VU_LANE_W_PX / 2,
      height: thickness,
      backgroundColor: "#FFFFFF",
      zIndex: 3,
      boxShadow: "0 0 4px rgba(255,255,255,0.4)",
    }} />;
  }
  if (ingresso === "E") {
    return <div style={{
      position: "absolute",
      top: CENTER - VU_LANE_W_PX / 2,
      left: CENTER + VU_STOPLINE_FROM_CENTER_PX - thickness,
      width: thickness,
      height: VU_LANE_W_PX / 2,
      backgroundColor: "#FFFFFF",
      zIndex: 3,
      boxShadow: "0 0 4px rgba(255,255,255,0.4)",
    }} />;
  }
  /* W */
  return <div style={{
    position: "absolute",
    top: CENTER,
    left: CENTER - VU_STOPLINE_FROM_CENTER_PX,
    width: thickness,
    height: VU_LANE_W_PX / 2,
    backgroundColor: "#FFFFFF",
    zIndex: 3,
    boxShadow: "0 0 4px rgba(255,255,255,0.4)",
  }} />;
}

function Cespuglio({ x, y }: { x: number; y: number }) {
  return (
    <div style={{
      position: "absolute",
      top: y, left: x,
      width: 40, height: 40,
      pointerEvents: "none",
      zIndex: 0,
    }}>
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle cx="13" cy="22" r="11" fill="#5C8A3F" />
        <circle cx="25" cy="18" r="10" fill="#6FA84E" />
        <circle cx="20" cy="28" r="9" fill="#4A7330" />
      </svg>
    </div>
  );
}
