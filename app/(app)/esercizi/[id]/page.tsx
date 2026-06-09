"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import Btn from "@/components/ui/btn";
import { Timer, Star, CheckCircle } from "iconoir-react";
import { ICON_MAP } from "@/lib/icons";
import { CATEGORIA_COLORS, COLORS } from "@/lib/design-tokens";
import { useUserStore } from "@/lib/store";
import {
  salvaSessione, aggiornaStreak, controllaNuoveMedaglie,
  marcaEsercizioCompletato, aggiornaProgressione,
  fetchEsercizioById, fetchUltimoLivelloEsercizio, contaSessioniPerEsercizio, fetchUserLevels,
} from "@/lib/sync";
import { getFamily } from "@/components/esercizi/registry";
import { TimerControlContext } from "@/components/esercizi/shared/TimerControlContext";
import type { EventoProgressione } from "@/lib/progression";
import type { SessionResult } from "@/lib/exercise-types";

/**
 * Deroga GDD shared/02-trial-flow.md §Schermata tutorial:
 * il GDD prescrive tutorial automatico SOLO alla prima sessione di ogni
 * esercizio (countSessioni === 0), poi accessibile via icona info opzionale
 * dalla 2ª sessione in poi.
 *
 * Decisione UX-driven (2026-04-30): tutorial sempre visibile a ogni sessione,
 * indipendentemente da livello e count. Motivazione: utenti senior 60+
 * possono dimenticare le istruzioni tra una sessione e l'altra (anche
 * dopo poche ore). L'icona info opzionale non è ancora implementata.
 *
 * Per tornare al GDD strict: TUTORIAL_SEMPRE_VISIBILE = false.
 * Il fallback usa countSessioni === 0 come prescritto dal GDD.
 */
const TUTORIAL_SEMPRE_VISIBILE = true;

type Stato = "loading" | "error" | "intro" | "running" | "time-up" | "saving" | "results";
type ErroreTipo = "not-found" | "not-implemented" | "fetch" | null;

const NOMI_CAT: Record<string, string> = {
  memoria: "Memoria", attenzione: "Attenzione", linguaggio: "Linguaggio",
  esecutive: "Esecutive", visuospaziali: "Visuospaziali",
};
const ICONE_CAT: Record<string, string> = {
  memoria: "brain", attenzione: "target", linguaggio: "chat",
  esecutive: "puzzle", visuospaziali: "eye",
};

function formatTempo(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function EsercizioPage() {
  const { id: esercizioId } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    userId, isGuest, streak, lastActivityDate, medaglie, eserciziFattiOggi, eserciziDelGiorno,
    setUser, aggiungiMedaglia, setNavNascosta, marcaEsercizioDelGiornoCompletato,
  } = useUserStore();

  // ── State ───────────────────────────────────────────────────────────────────
  const [stato, setStato] = useState<Stato>("loading");
  const [erroreTipo, setErroreTipo] = useState<ErroreTipo>(null);
  const [esercizio, setEsercizio] = useState<{ id: string; nome: string; categoria_id: string } | null>(null);
  const [livelloPrec, setLivelloPrec] = useState<number | null>(null);
  const [livelloDaGiocare, setLivelloDaGiocare] = useState<number | null>(null);
  const [mostraTutorial, setMostraTutorial] = useState(false);
  const [tempoScaduto, setTempoScaduto] = useState(false);
  const [tempoRimanente, setTempoRimanente] = useState(0);
  const [progressoTrial, setProgressoTrial] = useState<{ current: number; total: number } | null>(null);
  const [scoreSessione, setScoreSessione] = useState(0);
  const [accSessione, setAccSessione] = useState(0);
  const [durataSessione, setDurataSessione] = useState(0);
  const [_metricheSessione, setMetricheSessione] = useState<Record<string, number> | null>(null);
  const [eventoProgr, setEventoProgr] = useState<EventoProgressione | null>(null);
  const [livelloNuovo, setLivelloNuovo] = useState<number | null>(null);
  const [streakNuovo, setStreakNuovo] = useState<number | null>(null);
  const [nuoveMedaglie, setNuoveMedaglie] = useState<string[]>([]);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausaInizioRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const onCompleteFiredRef = useRef(false);

  // ── Derived values (stabili dopo il mount) ──────────────────────────────────
  const livelloCorrente = livelloDaGiocare ?? 1;
  const family = esercizio ? getFamily(esercizio.id) : null;
  const Engine = family?.Engine ?? null;
  const sessionDurationMs = family ? family.getSessionDurationMs(livelloCorrente) : null;
  const cc = esercizio ? (CATEGORIA_COLORS[esercizio.categoria_id] ?? null) : null;
  const nomeCat = esercizio ? (NOMI_CAT[esercizio.categoria_id] ?? esercizio.categoria_id) : "";
  const iconaCat = esercizio ? (ICONE_CAT[esercizio.categoria_id] ?? null) : null;
  const inGioco = stato === "running" || stato === "time-up";

  // ── Effect A: mount queries + unmount cleanup ───────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Né autenticato né ospite → fuori contesto: rimanda all'onboarding.
    if (!userId && !isGuest) { router.replace("/onboarding"); return; }

    (async () => {
      try {
        const esercizioData = await fetchEsercizioById(esercizioId);
        if (!mountedRef.current) return;
        if (!esercizioData) { setErroreTipo("not-found"); setStato("error"); return; }
        if (!getFamily(esercizioData.id)) { setErroreTipo("not-implemented"); setStato("error"); return; }

        // ── OSPITE: può provare solo i 5 esercizi del giorno (senza salvataggio).
        // Gli altri esercizi (libreria) richiedono la registrazione.
        if (!userId) {
          const isGiornaliero = useUserStore.getState().eserciziDelGiorno.some((e) => e.id === esercizioId);
          if (!isGiornaliero) { router.replace("/onboarding/registrati"); return; }
          setEsercizio(esercizioData);
          setLivelloPrec(null);
          setLivelloDaGiocare(1);   // ospite gioca sempre al livello base
          setMostraTutorial(true);  // tutorial sempre mostrato
          setStato("intro");
          return;
        }

        // ── UTENTE AUTENTICATO: dati adattivi + storico
        const [livelloPrecData, countSessioni, livelliDominio] = await Promise.all([
          fetchUltimoLivelloEsercizio(userId, esercizioId),
          contaSessioniPerEsercizio(userId, esercizioId),
          fetchUserLevels(userId),
        ]);
        if (!mountedRef.current) return;

        setEsercizio(esercizioData);
        setLivelloPrec(livelloPrecData);
        setLivelloDaGiocare(livelliDominio[esercizioData.categoria_id] ?? 1);
        setMostraTutorial(TUTORIAL_SEMPRE_VISIBILE || countSessioni === 0);
        setStato("intro");
      } catch {
        if (!mountedRef.current) return;
        setErroreTipo("fetch");
        setStato("error");
      }
    })();

    return () => {
      mountedRef.current = false;
      if (timerIdRef.current !== null) { clearInterval(timerIdRef.current); timerIdRef.current = null; }
    };
  }, [esercizioId, userId, isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect B: nav + overflow cleanup globale ────────────────────────────────
  useEffect(() => {
    setNavNascosta(true);
    return () => {
      setNavNascosta(false);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect B-bis: intercetta il back del browser/gesture durante l'esercizio
  // Pusha uno stato sentinella nella history; quando l'utente preme indietro
  // (gesture o tasto fisico), invece di uscire dalla pagina lo riportiamo alla
  // schermata intro/tutorial. Dipende da `inGioco` (boolean) così non viene
  // ri-eseguito sulla transizione running→time-up (niente sentinelle doppie).
  useEffect(() => {
    if (!inGioco) return;
    if (typeof window === "undefined") return;
    const guard = "vm_ex_lock_" + Date.now();
    window.history.pushState({ guard }, "");
    const onPop = () => {
      // Back durante l'esercizio → torna alla pagina del tutorial (intro).
      setStato("intro");
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [inGioco]);

  // ── Effect C: overflow per stato gioco + reset su rientro in intro ──────────
  useEffect(() => {
    if (stato === "running" || stato === "time-up") {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    if (stato !== "intro") return;
    // Reset timer e guard per "Gioca ancora". mountedRef NON viene resettato:
    // è un flag anti-setState-post-unmount, non anti-rigioca. Resettarlo
    // causerebbe un false negative se l'utente naviga via dopo "Gioca ancora".
    setTempoScaduto(false);
    setProgressoTrial(null);
    onCompleteFiredRef.current = false;
    if (timerIdRef.current !== null) { clearInterval(timerIdRef.current); timerIdRef.current = null; }
  }, [stato]);

  // ── handleReady ─────────────────────────────────────────────────────────────
  const handleReady = useCallback(() => {
    startTimeRef.current = Date.now();

    // StrictMode double-invoke guard: cancella l'eventuale timer precedente
    if (timerIdRef.current !== null) { clearInterval(timerIdRef.current); timerIdRef.current = null; }

    if (sessionDurationMs === null) return; // Modello B: nessun timer di pagina

    setTempoRimanente(Math.ceil(sessionDurationMs / 1000));

    timerIdRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const remaining = Math.max(0, sessionDurationMs - elapsed);
      setTempoRimanente(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(timerIdRef.current!);
        timerIdRef.current = null;
        setTempoScaduto(true);
        setStato("time-up");
      }
    }, 1000);
  }, [sessionDurationMs]);

  const handleProgress = useCallback((current: number, total: number | null) => {
    if (total === null) return; // Modello A: ignora
    setProgressoTrial({ current, total });
  }, []);

  const handleTimerPausa = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
      pausaInizioRef.current = Date.now();
    }
  }, []);

  const handleTimerRiprendi = useCallback(() => {
    if (pausaInizioRef.current === null || startTimeRef.current === null || sessionDurationMs === null) return;
    startTimeRef.current += Date.now() - pausaInizioRef.current;
    pausaInizioRef.current = null;
    timerIdRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const remaining = Math.max(0, sessionDurationMs - elapsed);
      setTempoRimanente(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(timerIdRef.current!);
        timerIdRef.current = null;
        setTempoScaduto(true);
        setStato("time-up");
      }
    }, 1000);
  }, [sessionDurationMs]);

  // ── handleComplete ──────────────────────────────────────────────────────────
  const handleComplete = useCallback(async (risultato: SessionResult) => {
    if (!mountedRef.current) return;
    if (onCompleteFiredRef.current) return;
    onCompleteFiredRef.current = true;

    if (!esercizio) return;
    const eId = esercizio.id;
    const categoriaId = esercizio.categoria_id;
    const livCorr = livelloDaGiocare ?? 1;
    const durata = Math.round((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
    const metrichePayload = Object.keys(risultato.metriche).length > 0 ? risultato.metriche : null;

    setScoreSessione(risultato.scoreGrezzo);
    setAccSessione(risultato.accuratezzaValutativa);
    setDurataSessione(durata);
    setMetricheSessione(metrichePayload);

    // ── OSPITE: nessun salvataggio su DB. Marca il giornaliero come completato
    // solo localmente e mostra i risultati con CTA di registrazione.
    if (!userId) {
      if (eserciziDelGiorno.some((e) => e.id === eId)) marcaEsercizioDelGiornoCompletato(eId);
      setMostraTutorial(true);
      setEventoProgr(null);
      setLivelloNuovo(null);
      setStreakNuovo(null);
      setNuoveMedaglie([]);
      setStato("results");
      return;
    }

    setStato("saving");

    const oggi = new Date().toISOString().split("T")[0];

    // ── Fase 1: salvataggi paralleli (tabelle distinte, zero contesa) ────────
    let eventoProgrCalc: EventoProgressione | null = null;
    let livelloNuovoCalc: number | null = null;
    try {
      const [, progressioneRes] = await Promise.all([
        salvaSessione({
          userId: userId!, esercizioId: eId, categoriaId,
          score: risultato.scoreGrezzo, livello: livCorr,
          accuratezzaValutativa: risultato.accuratezzaValutativa,
          durata, metriche: metrichePayload,
        }),
        aggiornaProgressione(userId!, categoriaId, risultato.accuratezzaValutativa),
        marcaEsercizioCompletato(userId!, eId),
      ]);
      eventoProgrCalc = progressioneRes.evento;
      livelloNuovoCalc = progressioneRes.livelloNuovo;
    } catch (e) {
      console.error("[handleComplete phase1]", e);
    }

    // ── Fase 2: streak + medaglie (sequenziali, 5 dipende da 4) ─────────────
    let streakCalc = streak;
    let nuoveMedaglieCalc: string[] = [];
    try {
      streakCalc = await aggiornaStreak(userId!, streak, lastActivityDate);
      nuoveMedaglieCalc = await controllaNuoveMedaglie(userId!, streakCalc, medaglie);
    } catch (e) {
      console.error("[handleComplete phase2]", e);
    }

    if (!mountedRef.current) return;

    // ── Aggiorna store Zustand ───────────────────────────────────────────────
    setUser({ streak: streakCalc, lastActivityDate: oggi, eserciziFattiOggi: eserciziFattiOggi + 1 });
    nuoveMedaglieCalc.forEach(id => aggiungiMedaglia(id));
    if (eserciziDelGiorno.some(e => e.id === eId)) marcaEsercizioDelGiornoCompletato(eId);

    // Dopo handleComplete il prossimo "Gioca ancora" deve riproporre il
    // tutorial se TUTORIAL_SEMPRE_VISIBILE è true. Altrimenti (GDD strict)
    // il tutorial non va più mostrato dopo la prima sessione.
    setMostraTutorial(TUTORIAL_SEMPRE_VISIBILE);

    setEventoProgr(eventoProgrCalc);
    setLivelloNuovo(livelloNuovoCalc);
    setStreakNuovo(streakCalc);
    setNuoveMedaglie(nuoveMedaglieCalc);
    setStato("results");
  }, [userId, esercizio, livelloDaGiocare, streak, lastActivityDate, medaglie, eserciziFattiOggi,
      eserciziDelGiorno, setUser, aggiungiMedaglia, marcaEsercizioDelGiornoCompletato]);

  // ── Early returns ────────────────────────────────────────────────────────────
  if (stato === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: COLORS.background }}>
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: `${COLORS.primary}40`, borderTopColor: COLORS.primary }} />
      </div>
    );
  }

  if (stato === "error") {
    const msg = erroreTipo === "not-found" ? "Esercizio non trovato."
      : erroreTipo === "not-implemented" ? "Questo esercizio è in arrivo!"
      : "Errore di caricamento. Riprova.";
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6"
        style={{ backgroundColor: COLORS.background }}>
        <span className="text-6xl">{erroreTipo === "not-implemented" ? "🚧" : "😕"}</span>
        <p className="text-xl font-bold text-ink text-center">{msg}</p>
        <Link href="/esercizi"><Btn variant="outline">Torna agli esercizi</Btn></Link>
      </div>
    );
  }

  // Dopo loading/error: esercizio e family sono garantiti non-null.
  const CatIcon = iconaCat ? ICON_MAP[iconaCat] : null;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: COLORS.background }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 bg-surface border-b border-border sticky top-0 z-10">
        <button
          onClick={() => {
            if (inGioco) {
              // Torna alla pagina del tutorial. history.back() consuma la
              // sentinella e fa scattare il guard (popstate → stato "intro").
              window.history.back();
            } else {
              router.back();
            }
          }}
          aria-label={inGioco ? "Torna al tutorial" : "Indietro"}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl active:scale-95"
          style={{ backgroundColor: COLORS.surfaceAlt, color: COLORS.inkSecondary }}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-ink leading-tight truncate">{esercizio!.nome}</p>
          {cc && <p className="text-sm font-medium" style={{ color: cc.text }}>{nomeCat}</p>}
        </div>
        {(stato === "running" || stato === "time-up") && sessionDurationMs !== null && (
          <div className="px-3 py-1 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
            style={{
              backgroundColor: tempoRimanente <= 10 ? "#FEE2E2" : COLORS.primaryLight,
              color: tempoRimanente <= 10 ? "#EF4444" : COLORS.primary,
            }}>
            {formatTempo(tempoRimanente)}
          </div>
        )}
        {(stato === "running" || stato === "time-up") && sessionDurationMs === null && progressoTrial !== null && progressoTrial.current < progressoTrial.total && (
          <div className="px-3 py-1 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
            style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}>
            {progressoTrial.current}/{progressoTrial.total}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto pb-6">

        {/* ── INTRO ────────────────────────────────────────────────────────── */}
        {stato === "intro" && (
          <div className="flex flex-col gap-8 pt-4 pb-6">
            <div className="flex flex-col items-center gap-4">
              {CatIcon && cc && (
                <div className="px-4 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ backgroundColor: cc.bg }}>
                  <CatIcon width={18} height={18} strokeWidth={2} color={cc.text} />
                  <span className="text-sm font-bold" style={{ color: cc.text }}>{nomeCat}</span>
                </div>
              )}
              <h1 className="text-3xl font-extrabold text-ink text-center leading-tight px-2">
                {esercizio!.nome}
              </h1>
            </div>

            {sessionDurationMs !== null && (
              <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
                <Timer width={24} height={24} strokeWidth={1.5} color={cc?.text ?? COLORS.primary} />
                <div>
                  <p className="text-xs" style={{ color: COLORS.inkMuted }}>Durata sessione</p>
                  <p className="text-base font-bold text-ink">
                    {Math.round(sessionDurationMs / 60000)}{" "}
                    {sessionDurationMs < 120000 ? "minuto" : "minuti"}
                  </p>
                </div>
              </div>
            )}

            <Btn size="lg" onClick={() => {
              if (sessionDurationMs !== null) setTempoRimanente(Math.ceil(sessionDurationMs / 1000));
              setStato("running");
            }}>
              {mostraTutorial ? "Inizia con il tutorial" : "Inizia"}
            </Btn>
          </div>
        )}

        {/* ── ESERCIZIO (running + time-up) ────────────────────────────────── */}
        {(stato === "running" || stato === "time-up") && Engine && (
          <TimerControlContext.Provider value={{ pausa: handleTimerPausa, riprendi: handleTimerRiprendi }}>
            <Engine
              esercizioId={esercizio!.id}
              livello={livelloCorrente}
              mostraTutorial={mostraTutorial}
              livelloPrec={livelloPrec}
              tempoScaduto={tempoScaduto}
              onReady={handleReady}
              onComplete={handleComplete}
              onProgress={handleProgress}
            />
          </TimerControlContext.Provider>
        )}

        {/* ── SAVING ───────────────────────────────────────────────────────── */}
        {stato === "saving" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: `${COLORS.primary}40`, borderTopColor: COLORS.primary }} />
            <p className="text-base" style={{ color: COLORS.inkMuted }}>Salvataggio...</p>
          </div>
        )}

        {/* ── RISULTATO ────────────────────────────────────────────────────── */}
        {stato === "results" && (() => {
          const scoreMsg = scoreSessione >= 80 ? "Ottimo lavoro!"
            : scoreSessione >= 60 ? "Buona prova!"
            : "Continua ad allenarti!";
          const acc100 = Math.round(accSessione * 100);
          const livLabel = livelloNuovo !== null
            ? `Livello ${livelloNuovo}${eventoProgr === "promozione" ? " ↑" : eventoProgr === "retrocessione" ? " ↓" : ""}`
            : "—";

          return (
            <div className="flex flex-col gap-8 pt-4 pb-6">
              <div className="flex flex-col items-center gap-4">
                <Star width={48} height={48} strokeWidth={1.5}
                  color={cc?.text ?? COLORS.primary} fill={cc?.text ?? COLORS.primary} />
                <h1 className="text-3xl font-extrabold text-ink text-center">{scoreMsg}</h1>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-surface rounded-2xl p-4 flex flex-col items-center gap-3">
                  <Timer width={24} height={24} strokeWidth={1.5} color={cc?.text ?? COLORS.primary} />
                  <div className="text-center">
                    <p className="text-xs" style={{ color: COLORS.inkMuted }}>Tempo</p>
                    <p className="text-base font-bold text-ink">{formatTempo(durataSessione)}</p>
                  </div>
                </div>
                <div className="flex-1 bg-surface rounded-2xl p-4 flex flex-col items-center gap-3">
                  <CheckCircle width={24} height={24} strokeWidth={1.5} color={cc?.text ?? COLORS.primary} />
                  <div className="text-center">
                    <p className="text-xs" style={{ color: COLORS.inkMuted }}>Accuratezza</p>
                    <p className="text-base font-bold text-ink">{acc100}%</p>
                  </div>
                </div>
              </div>

              {isGuest ? (
                <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ backgroundColor: cc?.bg ?? COLORS.primaryLight }}>
                  <p className="text-sm font-bold" style={{ color: cc?.text ?? COLORS.primary }}>
                    Stai provando VivaMente come ospite
                  </p>
                  <p className="text-xs" style={{ color: COLORS.inkSecondary }}>
                    Registrati per salvare i tuoi risultati, seguire i progressi e sbloccare tutti gli esercizi.
                  </p>
                </div>
              ) : (
                <div className="bg-surface rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: COLORS.inkMuted }}>Progressione</p>
                    <p className="text-base font-bold text-ink">{livLabel}</p>
                  </div>
                  {streakNuovo !== null && (
                    <div className="text-right">
                      <p className="text-xs" style={{ color: COLORS.inkMuted }}>Serie attiva</p>
                      <p className="text-base font-bold text-ink">
                        🔥 {streakNuovo} {streakNuovo === 1 ? "giorno" : "giorni"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {nuoveMedaglie.length > 0 && (
                <div className="rounded-2xl p-4"
                  style={{ backgroundColor: cc?.bg ?? COLORS.primaryLight }}>
                  <p className="text-sm font-bold" style={{ color: cc?.text ?? COLORS.primary }}>
                    🏅 {nuoveMedaglie.length === 1
                      ? "Nuova medaglia sbloccata!"
                      : `${nuoveMedaglie.length} nuove medaglie!`}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {(() => {
                  const prossimo = eserciziDelGiorno.find(
                    (e) => !e.completato && e.id !== esercizio!.id,
                  );
                  if (isGuest) {
                    return (
                      <>
                        {prossimo && (
                          <Btn size="lg" onClick={() => router.push(`/esercizi/${prossimo.id}`)}>
                            Prossimo: {prossimo.nome}
                          </Btn>
                        )}
                        <Link href="/onboarding/registrati">
                          <Btn variant={prossimo ? "outline" : "primary"} size="lg" className="w-full">
                            Registrati per salvare i progressi
                          </Btn>
                        </Link>
                        {!prossimo && (
                          <Link href="/home">
                            <Btn variant="outline" size="lg" className="w-full">Torna alla home</Btn>
                          </Link>
                        )}
                      </>
                    );
                  }
                  if (prossimo) {
                    return (
                      <>
                        <Btn size="lg" onClick={() => router.push(`/esercizi/${prossimo.id}`)}>
                          Prossimo: {prossimo.nome}
                        </Btn>
                        <Link href="/esercizi">
                          <Btn variant="outline" size="lg" className="w-full">Torna agli esercizi</Btn>
                        </Link>
                      </>
                    );
                  }
                  return (
                    <Link href="/esercizi">
                      <Btn size="lg" className="w-full">Torna agli esercizi</Btn>
                    </Link>
                  );
                })()}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
