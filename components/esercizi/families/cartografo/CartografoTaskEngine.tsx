"use client";

/**
 * Il Cartografo — Visuospaziale · navigazione mentale su mappa.
 *
 * Modello B (completamento): 3 trial valutativi per sessione, niente timer di sessione.
 *
 * Ogni trial:
 *   1. PRESENTAZIONE — mappa con punto di partenza + direzione, lista istruzioni.
 *   2. DOMANDA       — mappa con opzioni A/B/C…, eventuale scelta direzione finale.
 *   3. FEEDBACK      — reveal corretto/sbagliato + percorso effettivo.
 *
 * Scoring: ogni trial vale 1 se posizione+direzione (quando richieste) sono entrambe
 * corrette, 0 altrimenti. accuratezzaValutativa = corretti / 3.
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { GameEngineProps } from "@/lib/exercise-types";
import { MapView } from "./MapView";
import { getMap } from "./maps";
import { LEVELS, MAX_LIVELLO } from "./levels";
import {
  generateRoute,
  generatePositionOptions,
  stepToText,
  DIR_NAMES,
  DIR_ARROWS,
  type Dir,
  type State,
  type Route,
  type PositionOption,
} from "./route";

const TRIAL_VALUTATIVI = 3;
const FEEDBACK_MS = 1400;
const ISI_MS = 500;

type Fase = "tutorial" | "presentazione" | "domanda" | "feedback" | "isi";

interface Trial {
  route: Route;
  options: PositionOption[];
  correctOptionIdx: number;
}

function generaTrial(mapId: string, steps: number, allowIndietro: boolean, useLandmarkRefs: boolean, positionOptions: number): Trial {
  const map = getMap(mapId);
  const route = generateRoute(map, { steps, allowIndietro, useLandmarkRefs });
  const options = generatePositionOptions(route.end, map, positionOptions);
  const correctOptionIdx = options.findIndex((o) => o.isCorrect);
  return { route, options, correctOptionIdx };
}

export function CartografoTaskEngine({
  livello,
  tempoScaduto,
  mostraTutorial,
  onReady,
  onComplete,
  onProgress,
}: GameEngineProps) {
  const cfg = LEVELS[Math.max(0, Math.min(livello - 1, MAX_LIVELLO - 1))];
  const map = useMemo(() => getMap(cfg.mapId), [cfg.mapId]);

  const richiedePosizione = cfg.questionType === "position" || cfg.questionType === "both";
  const richiedeDirezione = cfg.questionType === "direction" || cfg.questionType === "both";

  const [fase, setFase] = useState<Fase>(mostraTutorial ? "tutorial" : "presentazione");
  const [trialIdx, setTrialIdx] = useState(0);
  const [trial, setTrial] = useState<Trial>(() =>
    generaTrial(cfg.mapId, cfg.steps, cfg.allowIndietro, cfg.useLandmarkRefs, cfg.positionOptions)
  );
  const [scelta, setScelta] = useState<number | null>(null);
  const [sceltaDir, setSceltaDir] = useState<Dir | null>(null);
  const [esitoTrial, setEsitoTrial] = useState<"ok" | "ko" | null>(null);

  const corretti = useRef(0);
  const isiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Segnala ready alla pagina padre una sola volta
  const readyChiamato = useRef(false);
  useEffect(() => {
    if (!readyChiamato.current && fase !== "tutorial") {
      readyChiamato.current = true;
      onReady();
    }
  }, [fase, onReady]);

  // Gestione tempoScaduto: in Modello B non c'è timer di pagina, ma se la pagina
  // imposta tempoScaduto noi terminiamo subito.
  useEffect(() => {
    if (tempoScaduto) {
      const accuratezza = corretti.current / TRIAL_VALUTATIVI;
      onComplete({
        accuratezzaValutativa: accuratezza,
        scoreGrezzo: Math.round(accuratezza * 100),
        metriche: {
          trial_completati: trialIdx,
          trial_corretti: corretti.current,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoScaduto]);

  const conferma = useCallback(() => {
    const posOk = !richiedePosizione || scelta === trial.correctOptionIdx;
    const dirOk = !richiedeDirezione || sceltaDir === trial.route.end.dir;
    const ok = posOk && dirOk;
    if (ok) corretti.current += 1;
    setEsitoTrial(ok ? "ok" : "ko");
    setFase("feedback");
    onProgress?.(trialIdx + 1, TRIAL_VALUTATIVI);
  }, [
    richiedePosizione,
    richiedeDirezione,
    scelta,
    sceltaDir,
    trial.correctOptionIdx,
    trial.route.end.dir,
    trialIdx,
    onProgress,
  ]);

  const avanzaProssimoTrial = useCallback(() => {
    const next = trialIdx + 1;
    if (next >= TRIAL_VALUTATIVI) {
      const accuratezza = corretti.current / TRIAL_VALUTATIVI;
      onComplete({
        accuratezzaValutativa: accuratezza,
        scoreGrezzo: Math.round(accuratezza * 100),
        metriche: {
          trial_completati: TRIAL_VALUTATIVI,
          trial_corretti: corretti.current,
        },
      });
      return;
    }
    setTrialIdx(next);
    setTrial(generaTrial(cfg.mapId, cfg.steps, cfg.allowIndietro, cfg.useLandmarkRefs, cfg.positionOptions));
    setScelta(null);
    setSceltaDir(null);
    setEsitoTrial(null);
    setFase("isi");
    isiTimer.current = setTimeout(() => setFase("presentazione"), ISI_MS);
  }, [trialIdx, cfg, onComplete]);

  // Auto-avanzamento da feedback
  useEffect(() => {
    if (fase === "feedback") {
      const t = setTimeout(avanzaProssimoTrial, FEEDBACK_MS);
      return () => clearTimeout(t);
    }
  }, [fase, avanzaProssimoTrial]);

  useEffect(() => {
    return () => {
      if (isiTimer.current) clearTimeout(isiTimer.current);
    };
  }, []);

  // ── TUTORIAL ───────────────────────────────────────────────────────────────
  if (fase === "tutorial") {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl p-6 shadow-lg">
          <div className="text-center mb-3">
            <p className="text-xs font-semibold text-amber-700 tracking-widest uppercase">
              Come si gioca
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mt-1">
              Il Cartografo
            </h2>
          </div>
          <div className="text-stone-700 text-base md:text-lg leading-relaxed space-y-3">
            <p>
              Osserverai una mappa del paese con il punto di partenza segnato in rosso
              e la direzione verso cui stai guardando.
            </p>
            <p>
              Leggi le indicazioni del percorso (es. <em>vai dritto, gira a destra</em>),
              segui mentalmente la strada, poi indica
              {richiedePosizione && richiedeDirezione
                ? " dove sei arrivato e verso dove guardi."
                : richiedePosizione
                  ? " in quale punto della mappa sei arrivato."
                  : " in quale direzione stai guardando."}
            </p>
            <p className="text-sm text-stone-600">
              La sessione dura {TRIAL_VALUTATIVI} percorsi. Prenditi tutto il tempo che ti serve.
            </p>
          </div>
          <button
            onClick={() => setFase("presentazione")}
            className="mt-5 w-full bg-amber-600 hover:bg-amber-700 text-white text-lg font-bold py-3 rounded-2xl shadow-md transition"
          >
            Ho capito — Inizia
          </button>
        </div>
      </div>
    );
  }

  // ── ISI (schermo neutro 500ms) ─────────────────────────────────────────────
  if (fase === "isi") {
    return <div className="w-full min-h-[40vh]" />;
  }

  // ── PRESENTAZIONE ──────────────────────────────────────────────────────────
  if (fase === "presentazione") {
    const nSteps = trial.route.steps.length;
    const useSplit = nSteps >= 5;
    const half = Math.ceil(nSteps / 2);
    const stepsLeft = useSplit ? trial.route.steps.slice(0, half) : trial.route.steps;
    const stepsRight = useSplit ? trial.route.steps.slice(half) : [];
    const isDense = nSteps >= 6;
    const liClass = `flex gap-1.5 items-start text-stone-800 ${
      isDense ? "text-xs md:text-sm" : "text-sm md:text-base"
    }`;
    const badgeClass = `bg-amber-200 text-amber-900 font-bold rounded-full flex items-center justify-center flex-shrink-0 ${
      isDense ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs"
    }`;
    return (
      <div
        className="w-full overflow-y-auto"
        style={{ maxHeight: "calc(100dvh - 72px)" }}
      >
        <div className="w-full max-w-5xl mx-auto px-3 py-2">
          <div className="text-xs font-semibold text-amber-700 text-center tracking-widest uppercase mb-1">
            Percorso {trialIdx + 1} di {TRIAL_VALUTATIVI}
          </div>
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-amber-50/70 rounded-2xl p-2 md:p-3 border-2 border-amber-200 shadow">
              <MapView
                map={map}
                start={trial.route.start}
                maxHeight={isDense ? "36vh" : "42vh"}
              />
              <div className="text-center mt-1 text-stone-700 text-sm md:text-base">
                <span className="inline-block w-3 h-3 rounded-full bg-red-600 align-middle mr-2" />
                Sei qui — guardi verso <strong>{DIR_NAMES[trial.route.start.dir]}</strong>{" "}
                <span className="text-xl">{DIR_ARROWS[trial.route.start.dir]}</span>
              </div>
            </div>
            <div className="bg-stone-50 rounded-2xl p-2.5 md:p-3 border-2 border-stone-200 shadow flex flex-col">
              <h2 className={`font-bold text-stone-800 mb-1.5 ${isDense ? "text-sm" : "text-base"}`}>
                Segui questo percorso:
              </h2>
              {useSplit ? (
                <div className="grid grid-cols-2 gap-x-2">
                  <ol className="space-y-1.5">
                    {stepsLeft.map((s, i) => (
                      <li key={i} className={liClass}>
                        <span className={badgeClass}>{i + 1}</span>
                        <span className="leading-snug">{stepToText(s, i)}</span>
                      </li>
                    ))}
                  </ol>
                  <ol className="space-y-1.5">
                    {stepsRight.map((s, i) => (
                      <li key={i + half} className={liClass}>
                        <span className={badgeClass}>{i + 1 + half}</span>
                        <span className="leading-snug">{stepToText(s, i + half)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <ol className="space-y-1.5">
                  {stepsLeft.map((s, i) => (
                    <li key={i} className={liClass}>
                      <span className={badgeClass}>{i + 1}</span>
                      <span className="leading-snug">{stepToText(s, i)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <button
                onClick={() => setFase("domanda")}
                className="mt-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm md:text-base font-bold py-2.5 rounded-xl shadow-md transition"
              >
                Ho seguito il percorso
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DOMANDA ────────────────────────────────────────────────────────────────
  if (fase === "domanda") {
    const puoConfermare =
      (!richiedePosizione || scelta !== null) && (!richiedeDirezione || sceltaDir !== null);
    const mapMaxH = richiedeDirezione ? "40vh" : "52vh";
    return (
      <div className="w-full overflow-y-auto" style={{ maxHeight: "calc(100dvh - 72px)" }}>
       <div className="w-full max-w-3xl mx-auto px-3 py-2">
        <div className="text-center mb-2">
          <h2 className="text-lg md:text-xl font-bold text-stone-800">
            {richiedePosizione && richiedeDirezione
              ? "Dove sei arrivato e verso dove guardi?"
              : richiedePosizione
                ? "In quale punto sei arrivato?"
                : "Verso quale direzione stai guardando?"}
          </h2>
        </div>
        <div className="bg-amber-50/70 rounded-2xl p-2 border-2 border-amber-200 shadow">
          <MapView
            map={map}
            start={trial.route.start}
            positionOptions={richiedePosizione ? trial.options : undefined}
            selectedOptionIndex={scelta ?? undefined}
            onOptionClick={richiedePosizione ? setScelta : undefined}
            maxHeight={mapMaxH}
          />
        </div>
        {richiedeDirezione && (
          <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
            {([0, 1, 2, 3] as Dir[]).map((d) => (
              <button
                key={d}
                onClick={() => setSceltaDir(d)}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 rounded-xl border-2 font-semibold transition ${
                  sceltaDir === d
                    ? "bg-amber-500 border-amber-700 text-white"
                    : "bg-white border-stone-300 text-stone-800 hover:bg-amber-100"
                }`}
              >
                <span className="text-xl leading-none">{DIR_ARROWS[d]}</span>
                <span className="text-xs sm:text-sm leading-tight">{DIR_NAMES[d]}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex justify-center pb-2">
          <button
            disabled={!puoConfermare}
            onClick={conferma}
            className={`text-base md:text-lg font-bold px-6 py-3 rounded-2xl shadow-md transition ${
              puoConfermare
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-stone-300 text-stone-500 cursor-not-allowed"
            }`}
          >
            Conferma
          </button>
        </div>
       </div>
      </div>
    );
  }

  // ── FEEDBACK ───────────────────────────────────────────────────────────────
  const ok = esitoTrial === "ok";
  const path: State[] = [trial.route.start, ...trial.route.steps.map((s) => s.after)];
  return (
   <div className="w-full overflow-y-auto" style={{ maxHeight: "calc(100dvh - 72px)" }}>
    <div className="w-full max-w-3xl mx-auto px-3 py-2">
      <div
        className={`rounded-2xl p-2 mb-2 text-center text-lg md:text-xl font-bold ${
          ok
            ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300"
            : "bg-rose-100 text-rose-800 border-2 border-rose-300"
        }`}
      >
        {ok ? "Corretto!" : "Non era la risposta giusta"}
      </div>
      <div className="bg-amber-50/70 rounded-2xl p-2 border-2 border-amber-200 shadow">
        <MapView
          map={map}
          start={trial.route.start}
          positionOptions={richiedePosizione ? trial.options : undefined}
          revealCorrectIndex={richiedePosizione ? trial.correctOptionIdx : undefined}
          revealWrongIndex={
            richiedePosizione && scelta !== null && scelta !== trial.correctOptionIdx
              ? scelta
              : undefined
          }
          showPath={path}
          maxHeight="52vh"
        />
      </div>
    </div>
   </div>
  );
}
