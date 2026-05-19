"use client";

import { useMemo, useState, useCallback } from "react";
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

type Fase = "intro" | "presentazione" | "domanda" | "feedback" | "risultato";

interface Trial {
  route: Route;
  options: PositionOption[];
  /** Indice nell'array options del target corretto */
  correctOptionIdx: number;
}

interface CartografoSessionProps {
  livello: number;
  onComplete?: (esito: { corretto: boolean; livello: number }) => void;
}

export function CartografoSession({
  livello,
  onComplete,
}: CartografoSessionProps) {
  const livelloIdx = Math.max(0, Math.min(livello - 1, MAX_LIVELLO - 1));
  const cfg = LEVELS[livelloIdx];
  const map = getMap(cfg.mapId);

  // Genera trial una sola volta per montaggio
  const trial = useMemo<Trial>(() => {
    const route = generateRoute(map, {
      steps: cfg.steps,
      allowIndietro: cfg.allowIndietro,
      useLandmarkRefs: cfg.useLandmarkRefs,
    });
    const options = generatePositionOptions(
      route.end,
      map,
      cfg.positionOptions
    );
    const correctOptionIdx = options.findIndex((o) => o.isCorrect);
    return { route, options, correctOptionIdx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livelloIdx]);

  const [fase, setFase] = useState<Fase>("intro");
  const [scelta, setScelta] = useState<number | null>(null);
  const [sceltaDir, setSceltaDir] = useState<Dir | null>(null);
  const [esito, setEsito] = useState<"ok" | "ko" | null>(null);

  const richiedeDirezione =
    cfg.questionType === "direction" || cfg.questionType === "both";
  const richiedePosizione =
    cfg.questionType === "position" || cfg.questionType === "both";

  const conferma = useCallback(() => {
    const posOk = !richiedePosizione || scelta === trial.correctOptionIdx;
    const dirOk = !richiedeDirezione || sceltaDir === trial.route.end.dir;
    const ok = posOk && dirOk;
    setEsito(ok ? "ok" : "ko");
    setFase("feedback");
  }, [
    richiedePosizione,
    richiedeDirezione,
    scelta,
    sceltaDir,
    trial.correctOptionIdx,
    trial.route.end.dir,
  ]);

  const vaiRisultato = useCallback(() => {
    onComplete?.({ corretto: esito === "ok", livello });
    setFase("risultato");
  }, [esito, livello, onComplete]);

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (fase === "intro") {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl p-6 shadow-lg">
          <div className="text-center mb-4">
            <div className="text-amber-700 font-semibold text-lg">
              Livello {livello} di {MAX_LIVELLO}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mt-1">
              Il Cartografo
            </h1>
          </div>
          <div className="text-stone-700 text-lg leading-relaxed space-y-3">
            <p>
              Osserva la mappa del paese. Vedrai dove ti trovi all'inizio e
              verso dove guardi.
            </p>
            <p>
              Leggi con calma le indicazioni del percorso. Segui mentalmente la
              strada, immaginando di camminare passo dopo passo.
            </p>
            <p>
              Alla fine ti chiederemo
              {richiedePosizione && richiedeDirezione
                ? " dove sei arrivato e verso dove stai guardando."
                : richiedePosizione
                  ? " in quale punto della mappa sei arrivato."
                  : " verso quale direzione stai guardando."}
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setFase("presentazione")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-md transition"
            >
              Comincia
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PRESENTAZIONE percorso ─────────────────────────────────────────────────
  if (fase === "presentazione") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col gap-6">
        <div className="bg-amber-50/70 rounded-3xl p-3 border-2 border-amber-200 shadow">
          <MapView map={map} start={trial.route.start} />
          <div className="text-center mt-2 text-stone-700 text-base">
            <span className="inline-block w-3 h-3 rounded-full bg-red-600 align-middle mr-2" />
            Sei qui — guardi verso{" "}
            <strong>{DIR_NAMES[trial.route.start.dir]}</strong>{" "}
            <span className="text-2xl">{DIR_ARROWS[trial.route.start.dir]}</span>
          </div>
        </div>

        <div className="bg-stone-50 rounded-3xl p-5 border-2 border-stone-200 shadow flex flex-col">
          <h2 className="text-xl font-bold text-stone-800 mb-3">
            Segui questo percorso:
          </h2>
          <ol className="space-y-3 flex-1">
            {trial.route.steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 items-start text-lg text-stone-800"
              >
                <span className="bg-amber-200 text-amber-900 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{stepToText(s, i)}</span>
              </li>
            ))}
          </ol>
          <button
            onClick={() => setFase("domanda")}
            className="mt-5 bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold px-6 py-4 rounded-2xl shadow-md transition self-stretch"
          >
            Ho seguito il percorso
          </button>
        </div>
      </div>
    );
  }

  // ── DOMANDA ────────────────────────────────────────────────────────────────
  if (fase === "domanda") {
    const puoConfermare =
      (!richiedePosizione || scelta !== null) &&
      (!richiedeDirezione || sceltaDir !== null);
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        <div className="text-center mb-3">
          <h2 className="text-2xl font-bold text-stone-800">
            {richiedePosizione && richiedeDirezione
              ? "Dove sei arrivato e verso dove guardi?"
              : richiedePosizione
                ? "In quale punto sei arrivato?"
                : "Verso quale direzione stai guardando?"}
          </h2>
          <p className="text-stone-600 mt-1">
            {richiedePosizione && "Tocca uno dei punti sulla mappa"}
            {richiedePosizione && richiedeDirezione && " e "}
            {richiedeDirezione && "scegli una direzione"}.
          </p>
        </div>

        <div className="bg-amber-50/70 rounded-3xl p-3 border-2 border-amber-200 shadow">
          <MapView
            map={map}
            start={trial.route.start}
            positionOptions={richiedePosizione ? trial.options : undefined}
            selectedOptionIndex={scelta ?? undefined}
            onOptionClick={richiedePosizione ? setScelta : undefined}
          />
        </div>

        {richiedeDirezione && (
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            {([0, 1, 2, 3] as Dir[]).map((d) => (
              <button
                key={d}
                onClick={() => setSceltaDir(d)}
                className={`px-5 py-3 rounded-2xl border-2 text-lg font-semibold transition ${
                  sceltaDir === d
                    ? "bg-amber-500 border-amber-700 text-white"
                    : "bg-white border-stone-300 text-stone-800 hover:bg-amber-100"
                }`}
              >
                <span className="text-2xl mr-2">{DIR_ARROWS[d]}</span>
                {DIR_NAMES[d]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-center">
          <button
            disabled={!puoConfermare}
            onClick={conferma}
            className={`text-xl font-semibold px-8 py-4 rounded-2xl shadow-md transition ${
              puoConfermare
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-stone-300 text-stone-500 cursor-not-allowed"
            }`}
          >
            Conferma risposta
          </button>
        </div>
      </div>
    );
  }

  // ── FEEDBACK ───────────────────────────────────────────────────────────────
  if (fase === "feedback") {
    const ok = esito === "ok";
    // Costruisci percorso storico per disegnarlo sulla mappa
    const path: State[] = [trial.route.start, ...trial.route.steps.map((s) => s.after)];
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        <div
          className={`rounded-3xl p-5 mb-4 text-center text-2xl font-bold ${
            ok
              ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300"
              : "bg-rose-100 text-rose-800 border-2 border-rose-300"
          }`}
        >
          {ok ? "Bravissimo! Risposta corretta." : "Non era la risposta giusta."}
        </div>

        <div className="bg-amber-50/70 rounded-3xl p-3 border-2 border-amber-200 shadow">
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
          />
          <div className="text-center mt-3 text-stone-700 text-base">
            Direzione finale corretta:{" "}
            <strong>{DIR_NAMES[trial.route.end.dir]}</strong>{" "}
            <span className="text-2xl">{DIR_ARROWS[trial.route.end.dir]}</span>
            {richiedeDirezione && sceltaDir !== null && sceltaDir !== trial.route.end.dir && (
              <span className="text-rose-700 ml-3">
                (avevi scelto {DIR_NAMES[sceltaDir]})
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <button
            onClick={vaiRisultato}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold px-8 py-4 rounded-2xl shadow-md transition"
          >
            Continua
          </button>
        </div>
      </div>
    );
  }

  // ── RISULTATO ──────────────────────────────────────────────────────────────
  const ok = esito === "ok";
  const prossimoLivello = Math.min(livello + 1, MAX_LIVELLO);
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl p-8 shadow-lg text-center">
        <div className="text-6xl mb-3">{ok ? "🌟" : "🗺️"}</div>
        <h2 className="text-3xl font-bold text-stone-800">
          {ok ? "Livello superato!" : "Buon tentativo"}
        </h2>
        <p className="text-stone-700 text-lg mt-3">
          {ok
            ? "Hai seguito il percorso correttamente. Vuoi provare il livello successivo?"
            : "Riprova questo livello, oppure passa al prossimo."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a
            href={`?livello=${livello}`}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-lg font-semibold px-6 py-3 rounded-2xl shadow transition"
          >
            Riprova livello {livello}
          </a>
          {prossimoLivello !== livello && (
            <a
              href={`?livello=${prossimoLivello}`}
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg font-semibold px-6 py-3 rounded-2xl shadow transition"
            >
              Livello {prossimoLivello} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
