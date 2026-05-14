"use client";

/**
 * CambiaRegolaSession — sessione "Cambia Regola".
 *
 * Layout:
 *
 *   ┌─────────────────────────────────┐
 *   │   📜 REGOLA: per COLORE          │  ← banner regola, pulsa al cambio
 *   ├─────────────────────────────────┤
 *   │                                 │
 *   │      ┌─────────────┐            │
 *   │      │  CARTA      │            │  ← carta centrale (lo stimolo)
 *   │      │  centrale   │            │
 *   │      └─────────────┘            │
 *   │                                 │
 *   │  ┌────────┐    ┌────────┐       │
 *   │  │ ◀ tgt1 │    │ tgt2 ▶ │       │  ← due caselle smistamento
 *   │  └────────┘    └────────┘       │
 *   └─────────────────────────────────┘
 *
 * Trial flow:
 *   1. Mostra stimolo + due target.
 *   2. Utente tappa sinistra o destra.
 *   3. Feedback 250ms (verde/rosso bordo).
 *   4. ISI isiMs schermo vuoto (le carte spariscono).
 *   5. Nuovo trial.
 *
 * Se nessun tap entro tLimMs → omissione, conta come errore.
 *
 * Regola cambia ogni regolaChangeMs (independent dal trial in corso).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  COLORI, FORME, NUMERI,
  ETICHETTA_DIM,
  type CambiaRegolaLevelConfig,
  type Colore, type Forma, type Numero, type Dimensione,
} from "./levels";
import { CartaSvg } from "./cards";

// ── CSS ─────────────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes cr-rule-flash {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0    rgba(180,83,9,0.7); }
  35%  { transform: scale(1.05); box-shadow: 0 0 0 16px rgba(180,83,9,0);    }
  100% { transform: scale(1);    box-shadow: 0 0 0 0    rgba(180,83,9,0);    }
}
@keyframes cr-card-in {
  0%   { transform: translateY(8px) scale(0.95); opacity: 0; }
  100% { transform: translateY(0)   scale(1);   opacity: 1; }
}
@keyframes cr-fb-ok {
  0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.85); }
  100% { box-shadow: 0 0 0 14px rgba(22,163,74,0); }
}
@keyframes cr-fb-err {
  0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.85); }
  100% { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
}
`;

// ── Helper random ───────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickExcept<T>(arr: readonly T[], v: T): T {
  const out = arr.filter((x) => x !== v);
  return out[Math.floor(Math.random() * out.length)] ?? arr[0];
}

interface Carta { colore: Colore; forma: Forma; numero: Numero; }

function cartaRandom(): Carta {
  return { colore: pick(COLORI), forma: pick(FORME), numero: pick(NUMERI) };
}

function valoreDim(c: Carta, d: Dimensione): Colore | Forma | Numero {
  if (d === "colore") return c.colore;
  if (d === "forma")  return c.forma;
  return c.numero;
}

/**
 * Costruisce un trial:
 *   - target sinistro e destro distinti sulla DIMENSIONE attiva
 *   - carta centrale che coincide con UNO dei due target sulla dim. attiva
 *
 * Se distrattoriDim = true, gli altri attributi della carta centrale possono
 * coincidere col target SBAGLIATO (introduce conflitto inter-dimensionale).
 * Se false, gli altri attributi sono indipendenti.
 */
function generaTrial(
  dim: Dimensione,
  distrattoriDim: boolean,
): { stimolo: Carta; targetSx: Carta; targetDx: Carta; latoCorretto: "sx" | "dx" } {
  // Target sx random.
  const targetSx = cartaRandom();
  // Target dx differisce su dim, le altre dimensioni libere.
  const targetDx: Carta = (() => {
    if (dim === "colore")
      return { colore: pickExcept(COLORI, targetSx.colore), forma: pick(FORME), numero: pick(NUMERI) };
    if (dim === "forma")
      return { colore: pick(COLORI), forma: pickExcept(FORME, targetSx.forma), numero: pick(NUMERI) };
    return { colore: pick(COLORI), forma: pick(FORME), numero: pickExcept(NUMERI, targetSx.numero) };
  })();

  const latoCorretto: "sx" | "dx" = Math.random() < 0.5 ? "sx" : "dx";
  const corretto = latoCorretto === "sx" ? targetSx : targetDx;
  const sbagliato = latoCorretto === "sx" ? targetDx : targetSx;

  // Stimolo: dim attiva = valore del lato corretto.
  // Altre dim: se distrattoriDim, copiamo dal lato SBAGLIATO; altrimenti random.
  const altreDim: Dimensione[] = (["colore", "forma", "numero"] as Dimensione[]).filter((d) => d !== dim);

  const stimolo: Carta = { colore: corretto.colore, forma: corretto.forma, numero: corretto.numero };
  // Imponiamo valore dim attiva (già == corretto).
  for (const d of altreDim) {
    if (distrattoriDim && Math.random() < 0.55) {
      // copia dal lato sbagliato
      if (d === "colore") stimolo.colore = sbagliato.colore;
      if (d === "forma")  stimolo.forma  = sbagliato.forma;
      if (d === "numero") stimolo.numero = sbagliato.numero;
    } else {
      if (d === "colore") stimolo.colore = pick(COLORI);
      if (d === "forma")  stimolo.forma  = pick(FORME);
      if (d === "numero") stimolo.numero = pick(NUMERI);
    }
  }

  return { stimolo, targetSx, targetDx, latoCorretto };
}

// ── Tipi runtime ─────────────────────────────────────────────────────────────

type Fase = "stimolo" | "feedback" | "isi";

interface TrialState {
  id:            number;
  stimolo:       Carta;
  targetSx:      Carta;
  targetDx:      Carta;
  latoCorretto:  "sx" | "dx";
  startedAt:     number;
}

interface Props {
  config:       CambiaRegolaLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function CambiaRegolaSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  const configRef = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const [regola, setRegola] = useState<Dimensione>(() => pick(config.regoleAttive));
  const regolaRef = useRef(regola);
  useLayoutEffect(() => { regolaRef.current = regola; }, [regola]);

  const [regolaFlash, setRegolaFlash] = useState(0);

  const trialIdRef = useRef(0);
  const newTrial = useCallback((): TrialState => {
    trialIdRef.current++;
    const t = generaTrial(regolaRef.current, configRef.current.distrattoriDim);
    return { id: trialIdRef.current, ...t, startedAt: Date.now() };
  }, []);

  const [trial, setTrial] = useState<TrialState | null>(() => null);
  const trialRef = useRef<TrialState | null>(null);
  useLayoutEffect(() => { trialRef.current = trial; }, [trial]);

  const [fase, setFase] = useState<Fase>("stimolo");
  const faseRef = useRef<Fase>(fase);
  useLayoutEffect(() => { faseRef.current = fase; }, [fase]);

  const [fbEsito, setFbEsito] = useState<"ok" | "err" | null>(null);
  const [fbLato, setFbLato]   = useState<"sx" | "dx" | null>(null);

  // Tracking.
  const hitsRef       = useRef(0);
  const errsRef       = useRef(0);
  const omissionsRef  = useRef(0);
  const switchErrsRef = useRef(0); // errori nei primi 2 trial dopo cambio regola
  const trialsSinceSwitchRef = useRef(0);
  const switchesRef = useRef(0);

  const lastRegolaChangeRef = useRef(Date.now());
  const completedRef        = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    onReady();
    setTrial(newTrial());
    setFase("stimolo");
  }, []); // eslint-disable-line

  // ── Game loop: timeout trial + cambio regola ────────────────────────────

  useEffect(() => {
    if (completedRef.current) return;
    const id = setInterval(() => {
      if (completedRef.current) return;
      const now = Date.now();
      const cfg = configRef.current;

      // Timeout trial in corso.
      if (faseRef.current === "stimolo" && trialRef.current) {
        if (now - trialRef.current.startedAt >= cfg.tLimMs) {
          omissionsRef.current++;
          trialsSinceSwitchRef.current++;
          setFbEsito("err");
          setFbLato(null);
          setFase("feedback");
        }
      }

      // Cambio regola.
      if (now - lastRegolaChangeRef.current >= cfg.regolaChangeMs) {
        lastRegolaChangeRef.current = now;
        switchesRef.current++;
        trialsSinceSwitchRef.current = 0;
        const altre = cfg.regoleAttive.filter((d) => d !== regolaRef.current);
        if (altre.length > 0) {
          const nuova = altre[Math.floor(Math.random() * altre.length)];
          setRegola(nuova);
          setRegolaFlash((k) => k + 1);
          // Riconfigura il trial CORRENTE in base alla nuova regola, così la
          // risposta giusta si aggiorna immediatamente (non aspetta il prossimo).
          setTrial(() => {
            trialIdRef.current++;
            const t = generaTrial(nuova, cfg.distrattoriDim);
            return { id: trialIdRef.current, ...t, startedAt: Date.now() };
          });
          setFase("stimolo");
        }
      }
    }, 80);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Avanzamento fase: feedback → isi → stimolo ─────────────────────────

  useEffect(() => {
    if (fase !== "feedback") return;
    const tid = setTimeout(() => {
      setFbEsito(null);
      setFbLato(null);
      setFase("isi");
    }, 280);
    return () => clearTimeout(tid);
  }, [fase, trial?.id]);

  useEffect(() => {
    if (fase !== "isi") return;
    const tid = setTimeout(() => {
      setTrial(newTrial());
      setFase("stimolo");
    }, configRef.current.isiMs);
    return () => clearTimeout(tid);
  }, [fase, newTrial]);

  // ── Completamento sessione ─────────────────────────────────────────────

  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;
    const hits = hitsRef.current;
    const errs = errsRef.current + omissionsRef.current;
    const tot  = hits + errs;
    const acc  = tot > 0 ? hits / tot : 0;
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           hits,
      metriche: {
        hits,
        errori:           errsRef.current,
        omissioni:        omissionsRef.current,
        switches:         switchesRef.current,
        switch_errs:      switchErrsRef.current,
      },
    });
  }, [tempoScaduto]);

  // ── Handler tap categoria ──────────────────────────────────────────────

  const handleTap = useCallback((lato: "sx" | "dx") => {
    if (completedRef.current) return;
    if (faseRef.current !== "stimolo" || !trialRef.current) return;
    const isCorrect = lato === trialRef.current.latoCorretto;
    trialsSinceSwitchRef.current++;
    if (isCorrect) hitsRef.current++;
    else {
      errsRef.current++;
      if (trialsSinceSwitchRef.current <= 2) switchErrsRef.current++;
    }
    setFbEsito(isCorrect ? "ok" : "err");
    setFbLato(lato);
    setFase("feedback");
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", userSelect: "none", paddingTop: "0.25rem" }}>
      <style>{ANIM_CSS}</style>

      {/* ── Banner regola ───────────────────────────────────────────── */}
      <div
        key={`r-${regolaFlash}`}
        style={{
          margin: "0 0 1.1rem 0",
          padding: "0.7rem 0.9rem",
          borderRadius: "0.85rem",
          background: "linear-gradient(180deg,#FEF3C7 0%,#FDE68A 100%)",
          border: "2px solid #B45309",
          textAlign: "center",
          boxShadow: "0 2px 5px rgba(120,53,15,0.18)",
          animation: regolaFlash > 0 ? "cr-rule-flash 800ms ease-out" : undefined,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.14em",
          color: "#92400E",
        }}>
          ORDINA LE CARTE
        </p>
        <p style={{
          margin: "0.15rem 0 0 0",
          fontSize: "1.3rem",
          fontWeight: 900,
          color: "#78350F",
          letterSpacing: "0.04em",
        }}>
          {ETICHETTA_DIM[regola].toUpperCase()}
        </p>
      </div>

      {/* ── Stimolo (carta centrale) ─────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "center",
        minHeight: 150, alignItems: "center",
        padding: "0.5rem 0 1.1rem 0",
      }}>
        {fase !== "isi" && trial && (
          <CartaContainer
            key={`stim-${trial.id}`}
            highlight={null}
          >
            <CartaSvg
              forma={trial.stimolo.forma}
              colore={trial.stimolo.colore}
              numero={trial.stimolo.numero}
              size={200}
            />
          </CartaContainer>
        )}
      </div>

      {/* ── Due target ──────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.7rem",
        padding: "0 0.1rem",
      }}>
        {(["sx", "dx"] as const).map((lato) => {
          const c = trial ? (lato === "sx" ? trial.targetSx : trial.targetDx) : null;
          const fb = fbLato === lato ? fbEsito : null;
          return (
            <button
              key={lato}
              onClick={() => handleTap(lato)}
              disabled={fase !== "stimolo" || !trial}
              aria-label={`Categoria ${lato === "sx" ? "sinistra" : "destra"}`}
              style={{
                padding: "0.9rem 0.5rem",
                borderRadius: "1rem",
                border: "2px solid #94A3B8",
                background: "#FFFFFF",
                cursor: fase === "stimolo" ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 130,
                animation:
                  fb === "ok"  ? "cr-fb-ok 480ms ease-out"  :
                  fb === "err" ? "cr-fb-err 480ms ease-out" :
                                  undefined,
                opacity: fase === "isi" ? 0.5 : 1,
                transition: "opacity 150ms",
              }}
            >
              {c && fase !== "isi" && (
                <CartaSvg
                  forma={c.forma}
                  colore={c.colore}
                  numero={c.numero}
                  size={150}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Card container (con animazione di entrata) ──────────────────────────────

function CartaContainer({ children, highlight }: { children: React.ReactNode; highlight: "ok" | "err" | null }) {
  return (
    <div style={{
      padding: "0.85rem 0.95rem",
      borderRadius: "1rem",
      background: "#FFFFFF",
      border:
        highlight === "ok"  ? "2.5px solid #16A34A" :
        highlight === "err" ? "2.5px solid #DC2626" :
                               "2.5px solid #1F2937",
      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
      animation: "cr-card-in 220ms ease-out",
    }}>
      {children}
    </div>
  );
}
