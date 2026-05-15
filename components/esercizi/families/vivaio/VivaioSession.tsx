"use client";

/**
 * VivaioSession — sessione "Il Vivaio".
 *
 * Modello B: 10 trial valutativi. Niente timer di sessione.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────┐
 *   │  ● ● ● ○ ○ ○ ○ ○ ○ ○                  │ ← 10 step (riempie da sx)
 *   ├──────────────────────────────────────┤
 *   │  ┌──────────────────────────────┐    │
 *   │  │   carta stimolo (con sfondo) │    │ ← carta-fiore
 *   │  └──────────────────────────────┘    │
 *   ├──────────────────────────────────────┤
 *   │   ┌────┐  ┌────┐  ┌────┐             │
 *   │   │vaso│  │vaso│  │vaso│             │ ← 3 vasi
 *   │   └────┘  └────┘  └────┘             │
 *   └──────────────────────────────────────┘
 *
 * 6 dimensioni: colore, forma, numero, taglia, gambo, sfondo (sbloccate
 * progressivamente coi livelli). Quadrato latino sui 3 vasi per ogni dim.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import {
  COLORI, FORME, NUMERI, TAGLIE, GAMBI, SFONDI,
  SFONDO_PALETTE,
  type VivaioLevelConfig,
  type Dimensione,
} from "./levels";
import { CartaFioreSvg, VasoSvg, type FioreStimolo } from "./flowers";

// ── Palette UI ───────────────────────────────────────────────────────────────

const BG       = "#F7F4EE";
const RULE     = "rgba(31,41,55,0.12)";
const OK       = "#16A34A";
const ERR      = "#DC2626";

// ── CSS ─────────────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes vv-card-in {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0);   opacity: 1; }
}
@keyframes vv-fb-ok {
  0%   { box-shadow: 0 0 0 0  rgba(22,163,74,0.55); }
  100% { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
}
@keyframes vv-fb-err {
  0%   { box-shadow: 0 0 0 0  rgba(220,38,38,0.55); }
  100% { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
}
@keyframes vv-dot-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
`;

// ── Helper ───────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Vasi: quadrato latino indipendente sulle 6 dimensioni ───────────────────

interface Vaso { mazzo: FioreStimolo; }

function buildVasi(): [Vaso, Vaso, Vaso] {
  const cs = [...COLORI];
  const fs = [...FORME];
  const ns = [...NUMERI];
  const ts = [...TAGLIE];
  const gs = [...GAMBI];
  const ss = [...SFONDI];
  shuffleInPlace(cs);
  shuffleInPlace(fs);
  shuffleInPlace(ns);
  shuffleInPlace(ts);
  shuffleInPlace(gs);
  shuffleInPlace(ss);
  return [
    { mazzo: { colore: cs[0], forma: fs[0], numero: ns[0], taglia: ts[0], gambo: gs[0], sfondo: ss[0] } },
    { mazzo: { colore: cs[1], forma: fs[1], numero: ns[1], taglia: ts[1], gambo: gs[1], sfondo: ss[1] } },
    { mazzo: { colore: cs[2], forma: fs[2], numero: ns[2], taglia: ts[2], gambo: gs[2], sfondo: ss[2] } },
  ];
}

function matchaSuDim(v: FioreStimolo, s: FioreStimolo, d: Dimensione): boolean {
  if (d === "colore") return v.colore === s.colore;
  if (d === "forma")  return v.forma  === s.forma;
  if (d === "numero") return v.numero === s.numero;
  if (d === "taglia") return v.taglia === s.taglia;
  if (d === "gambo")  return v.gambo  === s.gambo;
  return v.sfondo === s.sfondo;
}

function generaStimolo(vasi: readonly Vaso[], regola: Dimensione): { stimolo: FioreStimolo; vasoCorrettoIdx: 0 | 1 | 2 } {
  for (let tent = 0; tent < 80; tent++) {
    const s: FioreStimolo = {
      colore: pick(COLORI),
      forma:  pick(FORME),
      numero: pick(NUMERI),
      taglia: pick(TAGLIE),
      gambo:  pick(GAMBI),
      sfondo: pick(SFONDI),
    };

    const idxRegola = vasi.findIndex((v) => matchaSuDim(v.mazzo, s, regola));
    if (idxRegola === -1) continue;

    // Evita match perfetto su tutte le dimensioni.
    const matchPerfetto = vasi.some((v) =>
      v.mazzo.colore === s.colore &&
      v.mazzo.forma  === s.forma  &&
      v.mazzo.numero === s.numero &&
      v.mazzo.taglia === s.taglia &&
      v.mazzo.gambo  === s.gambo  &&
      v.mazzo.sfondo === s.sfondo,
    );
    if (matchPerfetto) continue;

    return { stimolo: s, vasoCorrettoIdx: idxRegola as 0 | 1 | 2 };
  }
  // Fallback
  const s: FioreStimolo = {
    colore: pick(COLORI), forma: pick(FORME), numero: pick(NUMERI),
    taglia: pick(TAGLIE), gambo: pick(GAMBI), sfondo: pick(SFONDI),
  };
  const idx = vasi.findIndex((v) => matchaSuDim(v.mazzo, s, regola));
  return { stimolo: s, vasoCorrettoIdx: (idx === -1 ? 0 : idx) as 0 | 1 | 2 };
}

// ── Tipi runtime ─────────────────────────────────────────────────────────────

type Fase = "stimolo" | "feedback" | "isi";

interface TrialState {
  id:              number;
  stimolo:         FioreStimolo;
  vasoCorrettoIdx: 0 | 1 | 2;
  startedAt:       number;
}

interface Props {
  config:       VivaioLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
  onProgress?:  (current: number, total: number | null) => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function VivaioSession({ config, tempoScaduto, onReady, onComplete }: Props) {

  const configRef = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  const vasiRef = useRef<readonly Vaso[]>(buildVasi());
  const vasi = vasiRef.current;

  const [regola, setRegola] = useState<Dimensione>(() => pick(config.regoleAttive));
  const regolaRef = useRef(regola);
  useLayoutEffect(() => { regolaRef.current = regola; }, [regola]);

  // Cambio regola: ogni N trial in [switchMin, switchMax].
  const trialsSinceSwitchRef = useRef(0);
  const switchAtRef = useRef<number>(pickInRange(config.switchMin, config.switchMax));

  const trialIdRef = useRef(0);
  const newTrial = useCallback((): TrialState => {
    trialIdRef.current++;
    const t = generaStimolo(vasiRef.current, regolaRef.current);
    return { id: trialIdRef.current, ...t, startedAt: Date.now() };
  }, []);

  const [trial, setTrial] = useState<TrialState | null>(null);
  const trialRef = useRef<TrialState | null>(null);
  useLayoutEffect(() => { trialRef.current = trial; }, [trial]);

  const [fase, setFase] = useState<Fase>("stimolo");
  const faseRef = useRef<Fase>(fase);
  useLayoutEffect(() => { faseRef.current = fase; }, [fase]);

  const [fbEsito, setFbEsito] = useState<"ok" | "err" | null>(null);
  const [fbVasoIdx, setFbVasoIdx] = useState<0 | 1 | 2 | null>(null);

  // Storico pallini (cresce dinamicamente: una entry per ogni risposta).
  const [history, setHistory] = useState<("ok" | "err")[]>([]);

  // Contatori "totali" (tutti i trial completati).
  const hitsRef      = useRef(0);
  const errsRef      = useRef(0);
  const omissionsRef = useRef(0);

  // Contatori "validi" (escludono i primi min(N-1, 2) trial dopo ogni switch
  // — sono fasi di "warm-up" in cui l'utente non può ancora conoscere la nuova
  // regola). Sono questi a determinare l'accuratezza finale.
  const validHitsRef      = useRef(0);
  const validErrsRef      = useRef(0);
  const validOmissionsRef = useRef(0);

  const switchesRef  = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    onReady();
    setTrial(newTrial());
    setFase("stimolo");
  }, []); // eslint-disable-line

  const cambiaRegolaSilente = useCallback(() => {
    const cfg = configRef.current;
    const altre = cfg.regoleAttive.filter((d) => d !== regolaRef.current);
    if (altre.length === 0) return;
    const nuova = altre[Math.floor(Math.random() * altre.length)];
    setRegola(nuova);
    trialsSinceSwitchRef.current = 0;
    switchAtRef.current = pickInRange(cfg.switchMin, cfg.switchMax);
    switchesRef.current++;
  }, []);

  const fineSessione = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const validHits = validHitsRef.current;
    const validErrs = validErrsRef.current + validOmissionsRef.current;
    const validTot  = validHits + validErrs;
    const acc       = validTot > 0 ? validHits / validTot : 0;
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           validHits,
      metriche: {
        hits:             hitsRef.current,
        errori:           errsRef.current,
        omissioni:        omissionsRef.current,
        valid_hits:       validHits,
        valid_errori:     validErrsRef.current,
        valid_omissioni:  validOmissionsRef.current,
        switches:         switchesRef.current,
      },
    });
  }, []);

  /** Registra l'esito di un trial: aggiorna contatori, pallini e switch. */
  const registraEsito = useCallback((tipo: "hit" | "miss" | "omissione") => {
    const trialNum = trialsSinceSwitchRef.current + 1; // 1-based in questo blocco
    const cfg = configRef.current;
    // Warm-up: i primi min(N-1, 2) trial dopo un cambio regola non contano
    // per l'accuratezza (l'utente non può ancora conoscere la nuova regola).
    const skipCount = Math.min(cfg.regoleAttive.length - 1, 2);
    const conta = trialNum > skipCount;

    if (tipo === "hit") {
      hitsRef.current++;
      if (conta) validHitsRef.current++;
    } else if (tipo === "miss") {
      errsRef.current++;
      if (conta) validErrsRef.current++;
    } else {
      omissionsRef.current++;
      if (conta) validOmissionsRef.current++;
    }

    // Pallino UI: verde per hit, rosso per miss/omissione.
    setHistory((h) => [...h, tipo === "hit" ? "ok" : "err"]);

    trialsSinceSwitchRef.current++;
    if (trialsSinceSwitchRef.current >= switchAtRef.current) {
      setTimeout(() => { cambiaRegolaSilente(); }, 320);
    }
  }, [cambiaRegolaSilente]);

  // ── Fine sessione su tempo scaduto ──────────────────────────────────────
  useEffect(() => {
    if (tempoScaduto) fineSessione();
  }, [tempoScaduto, fineSessione]);

  // ── Timer trial (omissione) ─────────────────────────────────────────────

  useEffect(() => {
    if (completedRef.current) return;
    const id = setInterval(() => {
      if (completedRef.current) return;
      const now = Date.now();
      const cfg = configRef.current;
      if (faseRef.current === "stimolo" && trialRef.current) {
        if (now - trialRef.current.startedAt >= cfg.tLimMs) {
          setFbEsito("err");
          setFbVasoIdx(null);
          registraEsito("omissione");
          setFase("feedback");
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [registraEsito]);

  useEffect(() => {
    if (fase !== "feedback") return;
    const tid = setTimeout(() => {
      setFbEsito(null);
      setFbVasoIdx(null);
      setFase("isi");
    }, 340);
    return () => clearTimeout(tid);
  }, [fase, trial?.id]);

  useEffect(() => {
    if (fase !== "isi") return;
    if (completedRef.current) return;
    const tid = setTimeout(() => {
      setTrial(newTrial());
      setFase("stimolo");
    }, configRef.current.isiMs);
    return () => clearTimeout(tid);
  }, [fase, newTrial]);

  const handleTap = useCallback((idx: 0 | 1 | 2) => {
    if (completedRef.current) return;
    if (faseRef.current !== "stimolo" || !trialRef.current) return;
    const isCorrect = idx === trialRef.current.vasoCorrettoIdx;
    setFbEsito(isCorrect ? "ok" : "err");
    setFbVasoIdx(idx);
    registraEsito(isCorrect ? "hit" : "miss");
    setFase("feedback");
  }, [registraEsito]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%",
      userSelect: "none",
      padding: "0.85rem 0.85rem 1rem 0.85rem",
      backgroundColor: BG,
      borderRadius: "0.6rem",
    }}>
      <style>{ANIM_CSS}</style>

      {/* ── Storico pallini (cresce dinamicamente, una entry per risposta) ─ */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.32rem",
        minHeight: 16,
        paddingBottom: "0.55rem",
        marginBottom: "0.8rem",
        borderBottom: `1px solid ${RULE}`,
      }}>
        {history.map((esito, i) => {
          const color = esito === "ok" ? OK : ERR;
          const isLast = i === history.length - 1;
          return (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `1px solid ${color}`,
                backgroundColor: color,
                animation: isLast ? "vv-dot-pop 280ms ease-out" : undefined,
              }}
            />
          );
        })}
      </div>

      {/* ── Stimolo ──────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: 180,
        padding: "0 0 1.1rem 0",
      }}>
        {fase !== "isi" && trial && (
          <div
            key={`stim-${trial.id}`}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.4rem",
              background: SFONDO_PALETTE[trial.stimolo.sfondo],
              border: `1px solid ${RULE}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              animation: "vv-card-in 240ms ease-out",
            }}
          >
            <CartaFioreSvg stimolo={trial.stimolo} baseSize={70} />
          </div>
        )}
      </div>

      {/* ── 3 vasi (con sfondo proprio del mazzo) ──────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "0.55rem",
        width: "100%",
      }}>
        {([0, 1, 2] as const).map((idx) => {
          const v = vasi[idx];
          const fb = fbVasoIdx === idx ? fbEsito : null;
          const borderColor =
            fb === "ok"  ? OK  :
            fb === "err" ? ERR :
                            RULE;
          return (
            <button
              key={idx}
              onClick={() => handleTap(idx)}
              disabled={fase !== "stimolo" || !trial}
              aria-label={`Vaso ${idx + 1}`}
              style={{
                padding: "0.5rem 0.3rem",
                borderRadius: "0.4rem",
                border: `2px solid ${borderColor}`,
                background: SFONDO_PALETTE[v.mazzo.sfondo],
                cursor: fase === "stimolo" ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                boxSizing: "border-box",
                minWidth: 0,
                width: "100%",
                animation:
                  fb === "ok"  ? "vv-fb-ok 480ms ease-out"  :
                  fb === "err" ? "vv-fb-err 480ms ease-out" :
                                  undefined,
                opacity: fase === "isi" ? 0.55 : 1,
                transition: "opacity 160ms, border-color 180ms",
              }}
            >
              <VasoSvg mazzo={v.mazzo} size={120} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
