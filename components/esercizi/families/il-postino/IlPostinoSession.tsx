"use client";

/**
 * IlPostinoSession — sessione "Il Postino".
 *
 * Layout (estetica cartolina vintage italiana):
 *
 *   ┌──────────────────────────────────────┐
 *   │              ● ● ○ ● ● ●             │ ← storico ultimi 8 trial
 *   ├──────────────────────────────────────┤
 *   │  ╔══════════════════════════════╗    │
 *   │  ║   ✉  CARTOLINA · ITALIA      ║    │
 *   │  ║                              ║    │
 *   │  ║      [emoji ambientale]      ║    │ ← lettera animata in arrivo
 *   │  ║                              ║    │
 *   │  ║  "Chi dorme non piglia ___"  ║    │
 *   │  ╚══════════════════════════════╝    │
 *   ├──────────────────────────────────────┤
 *   │   ┌────────┐   ┌────────┐            │
 *   │   │ pesci  │   │ libri  │            │ ← 3–4 bottoni grandi
 *   │   └────────┘   └────────┘            │
 *   │   ┌────────┐                         │
 *   │   │ fiori  │                         │
 *   │   └────────┘                         │
 *   └──────────────────────────────────────┘
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionResult } from "@/lib/exercise-types";
import { type PostinoLevelConfig } from "./levels";
import { filtraCorpus, type ItemPostino, type CategoriaPostino } from "./proverbi";

// ── Palette cartolina vintage ───────────────────────────────────────────────
const BG       = "#F2E4C9";   // crema invecchiata
const CARD     = "#FBF5E5";   // carta cartolina
const CARD_EDGE= "#E0CFA5";   // bordo cartolina
const INK      = "#3D2914";   // inchiostro seppia scuro
const INK_SOFT = "#7A5A38";   // seppia chiaro
const STAMP    = "#B23A2E";   // rosso francobollo
const ACCENT   = "#7A5A38";   // marrone dorato
const OK       = "#3F7A4B";   // verde militare
const ERR      = "#B23A2E";

const SERIF = "Georgia, 'Times New Roman', 'Cambria', serif";
const SANS  = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// ── Persistenza anti-ripetizione cross-sessione (localStorage) ──────────────
// Vincolo richiesto: un proverbio già mostrato in una sessione precedente
// non deve riapparire finché ce ne sono di "freschi" disponibili. Si usa una
// coda FIFO di id su localStorage capata a VISTI_MAX (≈ 5 sessioni × ~8 trial).
const VISTI_STORAGE_KEY = "vm_postino_visti_v1";
const VISTI_MAX = 40;

function caricaVisti(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VISTI_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function salvaVisti(visti: readonly string[]): void {
  if (typeof window === "undefined") return;
  try {
    const tail = visti.slice(-VISTI_MAX);
    window.localStorage.setItem(VISTI_STORAGE_KEY, JSON.stringify(tail));
  } catch {
    // localStorage saturo o non disponibile: ignora silenziosamente.
  }
}

// ── CSS animazioni ──────────────────────────────────────────────────────────
const ANIM_CSS = `
@keyframes pst-letter-in {
  0%   { transform: translateX(110%) rotate(-3deg); opacity: 0; }
  60%  { transform: translateX(-2%)  rotate(0.5deg); opacity: 1; }
  100% { transform: translateX(0)    rotate(0deg);  opacity: 1; }
}
@keyframes pst-letter-out {
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-12%); opacity: 0; }
}
@keyframes pst-blink {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 1; }
}
@keyframes pst-fb-ok {
  0%   { box-shadow: 0 0 0 0  rgba(63,122,75,0.55); }
  100% { box-shadow: 0 0 0 14px rgba(63,122,75,0); }
}
@keyframes pst-fb-err {
  0%   { box-shadow: 0 0 0 0  rgba(178,58,46,0.55); }
  100% { box-shadow: 0 0 0 14px rgba(178,58,46,0); }
}
`;

// ── Tipi runtime ────────────────────────────────────────────────────────────
type Fase = "stimolo" | "feedback" | "isi";

interface TrialState {
  id:           number;
  item:         ItemPostino;
  /** Opzioni mostrate in ordine già randomizzato. */
  opzioni:      readonly string[];
  startedAt:    number;
}

interface Props {
  config:       PostinoLevelConfig;
  tempoScaduto: boolean;
  onReady:      () => void;
  onComplete:   (r: SessionResult) => void;
}

// ── Utility random ──────────────────────────────────────────────────────────
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Componente ──────────────────────────────────────────────────────────────
export function IlPostinoSession({ config, tempoScaduto, onReady, onComplete }: Props) {
  const configRef = useRef(config);
  useLayoutEffect(() => { configRef.current = config; }, [config]);

  // Pool di item filtrato per livello. Si tiene un riferimento a quelli già
  // visti per evitare ripetizioni ravvicinate.
  const poolRef = useRef<readonly ItemPostino[]>(
    filtraCorpus(config.difficoltaMin, config.difficoltaMax, config.ammettiCentro, config.duplo),
  );
  // Storico cross-sessione: id già mostrati nelle sessioni precedenti
  // (caricato all'avvio, aggiornato man mano, persistito a fine sessione).
  const vistiRef = useRef<string[]>(caricaVisti());
  // ID mostrati in QUESTA sessione (mai ripetere nell'esercizio in corso).
  const sessionVistiRef = useRef<Set<string>>(new Set());

  const trialIdRef = useRef(0);
  const newTrial = useCallback((): TrialState => {
    trialIdRef.current++;
    const cfg = configRef.current;
    const pool = poolRef.current;

    // Priorità di selezione:
    //   1) item non in sessione corrente E non in visti storici  → "freschi"
    //   2) se 1) vuoto: item non in sessione corrente (la coda storica si è
    //      saturata sul pool di questo livello) → si rigenera ciclando
    //   3) se 2) vuoto: tutto il pool (caso limite: sessione lunghissima che
    //      esaurisce il pool stesso del livello)
    const sessionSet = sessionVistiRef.current;
    const vistiSet = new Set(vistiRef.current);
    const freschi = pool.filter((it) => !sessionSet.has(it.id) && !vistiSet.has(it.id));
    const fuoriSessione = pool.filter((it) => !sessionSet.has(it.id));
    let candidati: ItemPostino[];
    if (freschi.length > 0) {
      candidati = freschi;
    } else if (fuoriSessione.length > 0) {
      candidati = fuoriSessione;
    } else {
      // Pool esaurito anche per la sessione: reset di sessionVisti ed
      // escludi solo l'ultimo item appena visto, per evitare ripetizioni
      // immediate consecutive.
      const ultimo = vistiRef.current[vistiRef.current.length - 1];
      sessionVistiRef.current = new Set();
      candidati = pool.filter((it) => it.id !== ultimo);
      if (candidati.length === 0) candidati = [...pool];
    }
    const item = pick(candidati);
    sessionVistiRef.current.add(item.id);
    vistiRef.current.push(item.id);

    // Costruzione del pool di opzioni.
    //   - Item normale: 1 parola corretta + (numOpzioni - 1) distrattori.
    //   - Item duplo:  2 parole corrette + 4 distrattori (2 per buco), mescolati
    //                  in un unico pool di 6 opzioni.
    let opzioni: string[];
    if (item.duplo && item.parola2 && item.distrattori2) {
      const d1 = [...item.distrattori];
      const d2 = [...item.distrattori2];
      shuffleInPlace(d1);
      shuffleInPlace(d2);
      opzioni = shuffleInPlace([
        item.parola, item.parola2,
        d1[0], d1[1],
        d2[0], d2[1],
      ]);
    } else {
      const distrattori = [...item.distrattori];
      shuffleInPlace(distrattori);
      const sceltiDistr = distrattori.slice(0, cfg.numOpzioni - 1);
      opzioni = shuffleInPlace([item.parola, ...sceltiDistr]);
    }

    return { id: trialIdRef.current, item, opzioni, startedAt: Date.now() };
  }, []);

  const [trial, setTrial] = useState<TrialState | null>(null);
  const trialRef = useRef<TrialState | null>(null);
  useLayoutEffect(() => { trialRef.current = trial; }, [trial]);

  const [fase, setFase] = useState<Fase>("stimolo");
  const faseRef = useRef<Fase>(fase);
  useLayoutEffect(() => { faseRef.current = fase; }, [fase]);

  const [fbEsito, setFbEsito] = useState<"ok" | "err" | null>(null);
  const [fbIdx, setFbIdx] = useState<number | null>(null);

  // Per i trial duplo: prima selezione (parola del primo buco). Quando è null
  // il prossimo click riempie il primo buco; quando è valorizzata il prossimo
  // click riempie il secondo e fa scattare la valutazione.
  const [duploSel1Idx, setDuploSel1Idx] = useState<number | null>(null);
  const duploSel1IdxRef = useRef<number | null>(null);
  useLayoutEffect(() => { duploSel1IdxRef.current = duploSel1Idx; }, [duploSel1Idx]);
  // Seconda parola scelta: necessaria per riempire visivamente il secondo
  // buco durante la fase di feedback del trial duplo. Senza questo stato il
  // secondo buco resta vuoto e l'utente non vede la parola comparire.
  const [duploSel2Idx, setDuploSel2Idx] = useState<number | null>(null);

  // Metriche
  const corretteRef       = useRef(0);
  const erroriRef         = useRef(0);
  const omissioniRef      = useRef(0);
  const errProverbioRef   = useRef(0);
  const errModoRef        = useRef(0);
  const totProverbioRef   = useRef(0);
  const totModoRef        = useRef(0);
  const tempiCorretteRef  = useRef<number[]>([]);

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    onReady();
    setTrial(newTrial());
    setFase("stimolo");
  }, []); // eslint-disable-line

  const registraTotaleCategoria = useCallback((cat: CategoriaPostino) => {
    if (cat === "proverbio") totProverbioRef.current++;
    else totModoRef.current++;
  }, []);

  // ── Timer di trial (omissione su T.Lim) ────────────────────────────────
  useEffect(() => {
    if (completedRef.current) return;
    const id = setInterval(() => {
      if (completedRef.current) return;
      const cfg = configRef.current;
      if (faseRef.current === "stimolo" && trialRef.current) {
        if (Date.now() - trialRef.current.startedAt >= cfg.tLimMs) {
          const cat = trialRef.current.item.categoria;
          omissioniRef.current++;
          if (cat === "proverbio") errProverbioRef.current++;
          else errModoRef.current++;
          registraTotaleCategoria(cat);
          setFbEsito("err");
          setFbIdx(null);
          setDuploSel1Idx(null);
          setDuploSel2Idx(null);
          setFase("feedback");
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [registraTotaleCategoria]);

  // Feedback → ISI
  // I trial duplo richiedono più tempo di lettura: la cartolina deve
  // mostrare entrambe le parole inserite nei buchi prima di sparire.
  useEffect(() => {
    if (fase !== "feedback") return;
    const isDuplo = trialRef.current?.item.duplo === true;
    const fbMs = isDuplo ? 950 : 380;
    const tid = setTimeout(() => {
      setFbEsito(null);
      setFbIdx(null);
      setDuploSel1Idx(null);
      setDuploSel2Idx(null);
      setFase("isi");
    }, fbMs);
    return () => clearTimeout(tid);
  }, [fase, trial?.id]);

  // ISI → nuovo trial
  useEffect(() => {
    if (fase !== "isi") return;
    const tid = setTimeout(() => {
      setTrial(newTrial());
      setFase("stimolo");
    }, configRef.current.isiMs);
    return () => clearTimeout(tid);
  }, [fase, newTrial]);

  // Fine sessione → emette le metriche (JSON-serializzabili).
  useEffect(() => {
    if (!tempoScaduto || completedRef.current) return;
    completedRef.current = true;
    const hits = corretteRef.current;
    const errs = erroriRef.current + omissioniRef.current;
    const tot  = hits + errs;
    const acc  = tot > 0 ? hits / tot : 0;
    const tempi = tempiCorretteRef.current;
    const tempoMedio = tempi.length > 0
      ? Math.round(tempi.reduce((a, b) => a + b, 0) / tempi.length)
      : 0;
    // Persistenza anti-ripetizione: salva la coda visti (cap a VISTI_MAX).
    salvaVisti(vistiRef.current);
    onCompleteRef.current({
      accuratezzaValutativa: acc,
      scoreGrezzo:           hits,
      metriche: {
        corrette:            hits,
        errori:              erroriRef.current,
        omissioni:           omissioniRef.current,
        errori_proverbi:     errProverbioRef.current,
        errori_modi_di_dire: errModoRef.current,
        proverbi_totali:     totProverbioRef.current,
        modi_di_dire_totali: totModoRef.current,
        tempo_medio_ms:      tempoMedio,
      },
    });
  }, [tempoScaduto]);

  const handleTap = useCallback((idx: number) => {
    if (completedRef.current) return;
    if (faseRef.current !== "stimolo" || !trialRef.current) return;
    const t = trialRef.current;
    const scelta = t.opzioni[idx];

    // ── Trial DUPLO: due click sequenziali (ordine obbligato) ─────────────
    if (t.item.duplo && t.item.parola2) {
      const sel1Idx = duploSel1IdxRef.current;
      // Primo click: registra come scelta per il primo buco. Nessun feedback
      // immediato — la valutazione avviene solo dopo il secondo click.
      if (sel1Idx === null) {
        // Non si può cliccare la stessa parola due volte: se l'utente clicca
        // ora una parola che è "parola2" dell'item (cioè la corretta per il
        // SECONDO buco), accettiamo: sarà valutata come errore sul primo buco.
        setDuploSel1Idx(idx);
        return;
      }
      // Secondo click: deve essere un indice DIVERSO dal primo.
      if (idx === sel1Idx) return; // ignora click ripetuto sulla stessa opzione
      const scelta1 = t.opzioni[sel1Idx];
      const corretto1 = scelta1 === t.item.parola;
      const corretto2 = scelta === t.item.parola2;
      const isCorrect = corretto1 && corretto2;
      registraTotaleCategoria(t.item.categoria);
      if (isCorrect) {
        corretteRef.current++;
        tempiCorretteRef.current.push(Date.now() - t.startedAt);
        setFbEsito("ok");
      } else {
        erroriRef.current++;
        if (t.item.categoria === "proverbio") errProverbioRef.current++;
        else errModoRef.current++;
        setFbEsito("err");
      }
      setFbIdx(idx);
      // Memorizza l'indice della seconda parola: serve al rendering della
      // cartolina per riempire visivamente il secondo buco durante feedback.
      setDuploSel2Idx(idx);
      setFase("feedback");
      return;
    }

    // ── Trial SINGOLO: un solo click → valutazione immediata ──────────────
    const isCorrect = scelta === t.item.parola;
    registraTotaleCategoria(t.item.categoria);
    if (isCorrect) {
      corretteRef.current++;
      tempiCorretteRef.current.push(Date.now() - t.startedAt);
      setFbEsito("ok");
    } else {
      erroriRef.current++;
      if (t.item.categoria === "proverbio") errProverbioRef.current++;
      else errModoRef.current++;
      setFbEsito("err");
    }
    setFbIdx(idx);
    setFase("feedback");
  }, [registraTotaleCategoria]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: "100%",
      userSelect: "none",
      padding: "0.85rem 0.85rem 1rem 0.85rem",
      backgroundColor: BG,
      borderRadius: "0.6rem",
      fontFamily: SANS,
      // tessitura sottile da "carta antica"
      backgroundImage:
        "radial-gradient(circle at 12% 18%, rgba(122,90,56,0.06) 0, transparent 38%)," +
        "radial-gradient(circle at 88% 82%, rgba(122,90,56,0.05) 0, transparent 42%)",
    }}>
      <style>{ANIM_CSS}</style>

      {/* ── Cartolina (stimolo) ──────────────────────────────────────── */}
      <div style={{
        position: "relative",
        minHeight: 220,
        marginBottom: "1rem",
        overflow: "hidden",
        padding: "0.2rem",
      }}>
        {fase !== "isi" && trial && (
          <Cartolina
            key={`stim-${trial.id}`}
            item={trial.item}
            fbEsito={fbEsito}
            paroleRiempite={
              trial.item.duplo && duploSel1Idx !== null
                ? duploSel2Idx !== null
                  ? [trial.opzioni[duploSel1Idx], trial.opzioni[duploSel2Idx]]
                  : [trial.opzioni[duploSel1Idx]]
                : []
            }
          />
        )}
      </div>

      {/* ── Bottoni opzioni ──────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          trial && trial.opzioni.length === 6 ? "1fr 1fr 1fr" :
          trial && trial.opzioni.length === 4 ? "1fr 1fr"     :
                                                 "1fr 1fr 1fr",
        gap: "0.55rem",
      }}>
        {trial?.opzioni.map((op, idx) => {
          const showFb = fbIdx === idx && (fbEsito === "ok" || fbEsito === "err");
          const isDuploFirst = trial.item.duplo === true && duploSel1Idx === idx && fase === "stimolo";
          const borderColor =
            showFb && fbEsito === "ok"  ? OK  :
            showFb && fbEsito === "err" ? ERR :
            isDuploFirst                ? ACCENT :
                                          CARD_EDGE;
          const borderW = showFb || isDuploFirst ? "2.5px" : "1.5px";
          // Una volta selezionata, la prima parola del duplo non è più
          // ri-cliccabile (deve essere distinta dalla seconda).
          const disabled = fase !== "stimolo" || isDuploFirst;
          return (
            <button
              key={`${trial.id}-${idx}`}
              onClick={() => handleTap(idx)}
              disabled={disabled}
              style={{
                padding: "0.9rem 0.6rem",
                fontSize: "1.05rem",   // ≥18px UX requisito (ridotto per 6-col)
                fontFamily: SERIF,
                fontWeight: 500,
                color: INK,
                backgroundColor: isDuploFirst ? "#EFE5CC" : CARD,
                border: `${borderW} solid ${borderColor}`,
                borderRadius: "0.4rem",
                cursor: disabled ? "default" : "pointer",
                WebkitTapHighlightColor: "transparent",
                boxShadow: "0 1px 3px rgba(61,41,20,0.10), inset 0 0 0 1px rgba(255,255,255,0.4)",
                animation:
                  showFb && fbEsito === "ok"  ? "pst-fb-ok  480ms ease-out" :
                  showFb && fbEsito === "err" ? "pst-fb-err 480ms ease-out" :
                                                 undefined,
                opacity: fase === "isi" ? 0.55 : 1,
                transition: "opacity 160ms, border-color 180ms, border-width 180ms, background-color 180ms",
                letterSpacing: "0.005em",
                minHeight: 52,
              }}
            >
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sotto-componente: la cartolina ──────────────────────────────────────────

function Cartolina({
  item,
  fbEsito,
  paroleRiempite,
}: {
  item: ItemPostino;
  fbEsito: "ok" | "err" | null;
  /** Parole già scelte per i buchi (in ordine: [parola1] o []). Solo duplo. */
  paroleRiempite: readonly string[];
}) {
  return (
    <div
      style={{
        position: "relative",
        background: CARD,
        border: `1.5px solid ${CARD_EDGE}`,
        borderRadius: "0.4rem",
        padding: "1rem 1rem 1.05rem 1rem",
        boxShadow: "0 2px 6px rgba(61,41,20,0.12), 0 0 0 1px rgba(255,255,255,0.4) inset",
        fontFamily: SERIF,
        animation: "pst-letter-in 520ms cubic-bezier(0.22, 0.9, 0.36, 1)",
        backgroundImage:
          "linear-gradient(0deg, rgba(122,90,56,0.04), rgba(122,90,56,0.04))," +
          "repeating-linear-gradient(135deg, rgba(122,90,56,0.025) 0 6px, transparent 6px 14px)",
      }}
    >
      {/* riga intestazione cartolina */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px dashed ${CARD_EDGE}`,
        paddingBottom: "0.4rem",
        marginBottom: "0.6rem",
        fontFamily: SANS,
        fontSize: "0.62rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: INK_SOFT,
        fontWeight: 700,
      }}>
        <span>✉ Cartolina · Italia</span>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30, height: 22,
            border: `1.5px solid ${STAMP}`,
            color: STAMP,
            borderRadius: 2,
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          ITALIA
        </span>
      </div>

      {/* illustrazione */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "3.4rem",
        lineHeight: 1,
        margin: "0.2rem 0 0.7rem 0",
      }}>
        <span aria-hidden>{item.illustrazione}</span>
      </div>

      {/* frase del proverbio con blank lampeggiante */}
      <p style={{
        margin: 0,
        textAlign: "center",
        fontSize: "1.25rem",       // ≥18px requisito UX
        lineHeight: 1.5,
        color: INK,
        fontWeight: 500,
        letterSpacing: "0.005em",
      }}>
        <span>{item.pre}</span>
        {item.duplo && item.parola2 ? (
          <>
            <Blank
              evidenziaErr={fbEsito === "err"}
              attivo={paroleRiempite.length === 0}
              riempitaCon={paroleRiempite[0] ?? null}
            />
            <span>{item.mid}</span>
            <Blank
              evidenziaErr={fbEsito === "err"}
              attivo={paroleRiempite.length === 1}
              riempitaCon={paroleRiempite[1] ?? null}
            />
            <span>{item.post}</span>
          </>
        ) : (
          <>
            <Blank
              evidenziaErr={fbEsito === "err"}
              attivo={true}
              riempitaCon={null}
            />
            <span>{item.post}</span>
          </>
        )}
      </p>

      {/* etichetta categoria, piccola in basso */}
      <div style={{
        marginTop: "0.7rem",
        display: "flex",
        justifyContent: "center",
        fontFamily: SANS,
        fontSize: "0.6rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: ACCENT,
        fontWeight: 700,
      }}>
        {item.categoria === "proverbio" ? "· Proverbio ·" : "· Modo di dire ·"}
      </div>
    </div>
  );
}

function Blank({
  evidenziaErr,
  attivo,
  riempitaCon,
}: {
  evidenziaErr: boolean;
  /** true = buco corrente in attesa di selezione (lampeggia). */
  attivo: boolean;
  /** Se valorizzata, mostra la parola riempita al posto del trattino. */
  riempitaCon: string | null;
}) {
  if (riempitaCon !== null) {
    // Buco già riempito (prima parola del duplo): mostra la parola in
    // evidenza, senza animazione, come fosse appena trascritta.
    return (
      <span style={{
        display: "inline-block",
        padding: "0 0.4rem",
        margin: "0 0.2rem",
        color: ACCENT,
        fontWeight: 700,
        borderBottom: `2px solid ${evidenziaErr ? ERR : ACCENT}`,
        verticalAlign: "baseline",
      }}>
        {riempitaCon}
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-block",
      minWidth: "5.5rem",
      borderBottom: `2px solid ${evidenziaErr ? ERR : INK_SOFT}`,
      margin: "0 0.25rem",
      verticalAlign: "baseline",
      height: "1.1em",
      animation: evidenziaErr ? undefined : (attivo ? "pst-blink 1.4s ease-in-out infinite" : undefined),
      opacity: attivo ? 1 : 0.5,
    }} />
  );
}
