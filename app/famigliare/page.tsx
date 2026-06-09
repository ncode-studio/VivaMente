"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { COLORS, CATEGORIA_COLORS } from "@/lib/design-tokens";
import { AppIcon } from "@/lib/icons";
import Card from "@/components/ui/card";
import {
  fetchFamiliareDashboard,
  inviaMessaggioFamiliare,
  type FamiliareDashboard,
} from "@/lib/sync";

// ── Calendario helpers ────────────────────────────────────────────────────────
const MESI_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDayItalian = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDayItalian).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function getAllCompletatiDates(sessioni: FamiliareDashboard["sessioni_recenti"]): Set<string> {
  const set = new Set<string>();
  const grouped: Record<string, number> = {};
  for (const s of sessioni) {
    const date = s.created_at.slice(0, 10);
    grouped[date] = (grouped[date] ?? 0) + 1;
  }
  for (const [date, count] of Object.entries(grouped)) {
    if (count >= 5) set.add(date);
  }
  return set;
}

function getAllAttivitaDates(sessioni: FamiliareDashboard["sessioni_recenti"]): Set<string> {
  const set = new Set<string>();
  for (const s of sessioni) {
    set.add(s.created_at.slice(0, 10));
  }
  return set;
}

function CalendarioReadOnly({
  streak,
  sessioni,
}: {
  streak: number;
  sessioni: FamiliareDashboard["sessioni_recenti"];
}) {
  const [meseOffset, setMeseOffset] = useState(0);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const displayDate = new Date(currentYear, currentMonth + meseOffset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;

  const completatiSet = getAllCompletatiDates(sessioni);
  const attivitaSet = getAllAttivitaDates(sessioni);
  const cells = buildCalendarCells(year, month);
  const HEADER = ["L", "M", "M", "G", "V", "S", "D"];

  return (
    <Card padding="md">
      <div className="mb-4">
        <p className="text-base font-bold text-ink">Storico allenamenti</p>
        <p className="text-sm font-bold" style={{ color: COLORS.primary }}>{streak} giorni consecutivi</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMeseOffset((o) => o - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
          style={{ color: COLORS.primary }}
        >
          ←
        </button>
        <span className="text-base font-bold text-ink">
          {MESI_IT[month]} {year}
        </span>
        <button
          onClick={() => { if (!isCurrentMonth) setMeseOffset((o) => o + 1); }}
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
          style={{ color: isCurrentMonth ? "#D1D5DB" : COLORS.primary, cursor: isCurrentMonth ? "default" : "pointer" }}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {HEADER.map((g, i) => (
          <div key={i} className="text-center text-xs font-semibold" style={{ color: COLORS.inkMuted }}>
            {g}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFuture = isCurrentMonth && day > todayDate;
          const completato = completatiSet.has(dateStr);
          const haAttivita = attivitaSet.has(dateStr);

          let bg: string = "transparent";
          let border: string = "1.5px solid #D1D5DB";
          let color: string = "#9CA3AF";

          if (completato) {
            bg = COLORS.primary;
            border = "none";
            color = "#FFFFFF";
          } else if (isFuture) {
            border = "none";
            color = "#D1D5DB";
          } else if (haAttivita) {
            border = `1.5px solid ${COLORS.primary}`;
            color = COLORS.primary;
          }

          return (
            <div key={i} className="flex justify-center py-0.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: bg, border, color }}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.primary }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>5 esercizi completati</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${COLORS.primary}` }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>Attività parziale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: "1.5px solid #D1D5DB" }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>Nessuna attività</span>
        </div>
      </div>
    </Card>
  );
}

// Mappa parentela (come impostata dall'anziano) + genere dell'anziano → etichetta per il familiare
const RELAZIONE_LABEL: Record<string, { M: string; F: string }> = {
  "Figlio":           { M: "Tuo padre",       F: "Tua madre"       },
  "Figlia":           { M: "Tuo padre",       F: "Tua madre"       },
  "Nipote":           { M: "Tuo nonno",       F: "Tua nonna"       },
  "Pronipote":        { M: "Tuo bisnonno",    F: "Tua bisnonna"    },
  "Fratello":         { M: "Tuo fratello",    F: "Tua sorella"     },
  "Sorella":          { M: "Tuo fratello",    F: "Tua sorella"     },
  "Genero":           { M: "Tuo suocero",     F: "Tua suocera"     },
  "Nuora":            { M: "Tuo suocero",     F: "Tua suocera"     },
  "Cognato":          { M: "Tuo cognato",     F: "Tua cognata"     },
  "Cognata":          { M: "Tuo cognato",     F: "Tua cognata"     },
  "Cugino":           { M: "Tuo cugino",      F: "Tua cugina"      },
  "Cugina":           { M: "Tuo cugino",      F: "Tua cugina"      },
  "Badante":          { M: "Il tuo assistito",F: "La tua assistita"},
  "Amico di famiglia":{ M: "Il tuo amico",    F: "La tua amica"    },
};

function getRelazione(parentela: string, genere: "M" | "F"): string {
  return RELAZIONE_LABEL[parentela]?.[genere] ?? parentela;
}


type Periodo = "settimana" | "mese" | "anno";

// ─── Sezione Progressi giornata ───────────────────────────────────────────────
function CardProgressiGiornata({
  eserciziOggi,
  streak,
}: {
  eserciziOggi: FamiliareDashboard["esercizi_oggi"];
  streak: number;
}) {
  const completati = eserciziOggi.filter((e) => e.completato).length;
  const totale = eserciziOggi.length;
  const pct = totale > 0 ? Math.round((completati / totale) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4" style={{ boxShadow: "0 0 2px rgba(0,0,0,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: COLORS.inkPrimary }}>Progressi della giornata</span>
        <span className="text-sm font-bold" style={{ color: COLORS.primary }}>{completati} di {totale}</span>
      </div>

      {/* Barra */}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${COLORS.primary}33` }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: COLORS.primary }}
        />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: COLORS.background }}>
          <span className="text-xl font-bold" style={{ color: COLORS.inkPrimary }}>{completati}/{totale}</span>
          <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>Esercizi completati</span>
        </div>
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: COLORS.background }}>
          <span className="text-xl font-bold" style={{ color: COLORS.inkPrimary }}>{streak}</span>
          <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>Giorni consecutivi</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sezione Andamento ────────────────────────────────────────────────────────
const CATEGORIE_ANDAMENTO: { id: string; label: string; icona: string }[] = [
  { id: "memoria",       label: "Memoria",       icona: "brain" },
  { id: "attenzione",    label: "Attenzione",    icona: "target" },
  { id: "linguaggio",    label: "Linguaggio",    icona: "chat" },
  { id: "esecutive",     label: "Esecutive",     icona: "puzzle" },
  { id: "visuospaziali", label: "Visuospaziali", icona: "eye" },
];

function CardAndamento({
  sessioni,
}: {
  sessioni: FamiliareDashboard["sessioni_recenti"];
}) {
  const [periodo, setPeriodo] = useState<Periodo>("settimana");

  const PERIODI: { id: Periodo; label: string }[] = [
    { id: "settimana", label: "Settimana" },
    { id: "mese",      label: "Mese" },
    { id: "anno",      label: "Anno" },
  ];

  const scorePerCategoria = CATEGORIE_ANDAMENTO.map((cat) => {
    const filtered = sessioni.filter((s) => s.categoria_id === cat.id);
    const score = filtered.length > 0
      ? Math.round(filtered.reduce((sum, s) => sum + s.score, 0) / filtered.length)
      : 0;
    return { ...cat, score };
  });

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4" style={{ boxShadow: "0 0 2px rgba(0,0,0,0.15)" }}>
      <span className="text-base font-semibold" style={{ color: COLORS.inkPrimary }}>Andamento</span>

      {/* Pills periodo */}
      <div className="flex gap-2">
        {PERIODI.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: periodo === p.id ? COLORS.primary : COLORS.background,
              color: periodo === p.id ? "#fff" : COLORS.inkMuted,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Righe categorie */}
      <div className="flex flex-col gap-2">
        {scorePerCategoria.map((cat) => {
          const cc = CATEGORIA_COLORS[cat.id];
          return (
            <div
              key={cat.id}
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ backgroundColor: cc?.bg ?? COLORS.background }}
            >
              {/* Header riga */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cc?.text ?? COLORS.primary }}
                  >
                    <AppIcon name={cat.icona} size={16} color="#fff" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: cc?.text ?? COLORS.inkPrimary }}>
                    {cat.label}
                  </span>
                </div>
              </div>

              {/* Barra + % */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${cc?.text ?? COLORS.primary}33` }}>
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${cat.score}%`, backgroundColor: cc?.text ?? COLORS.primary }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: cc?.text ?? COLORS.inkPrimary }}>
                  {cat.score}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendario storico */}
      <CalendarioReadOnly streak={0} sessioni={sessioni} />
    </div>
  );
}

// ─── Messaggi predefiniti per categoria (f = femminile, m = maschile) ────────
type Messaggio = { f: string; m: string };

const MESSAGGI_CATEGORIE: Record<string, Messaggio[]> = {
  Incoraggiamento: [
    { f: "Brava! Continua così, sono orgoglioso/a di te! 💪",          m: "Bravo! Continua così, sono orgoglioso/a di te! 💪" },
    { f: "Stai facendo un lavoro fantastico! Vai avanti! 🌟",           m: "Stai facendo un lavoro fantastico! Vai avanti! 🌟" },
    { f: "Ogni esercizio conta, sei bravissima! ✨",                    m: "Ogni esercizio conta, sei bravissimo! ✨" },
    { f: "Non mollare, stai andando alla grande! 🚀",                   m: "Non mollare, stai andando alla grande! 🚀" },
    { f: "Più ti alleni, più la tua mente diventa forte! 🧠",           m: "Più ti alleni, più la tua mente diventa forte! 🧠" },
    { f: "Sei un esempio per tutti noi, continua così! 👏",             m: "Sei un esempio per tutti noi, continua così! 👏" },
  ],
  Promemoria: [
    { f: "Ciao! Ricordati di fare gli esercizi di oggi 😊",             m: "Ciao! Ricordati di fare gli esercizi di oggi 😊" },
    { f: "Ti penso! Hai fatto gli esercizi oggi? 💙",                   m: "Ti penso! Hai fatto gli esercizi oggi? 💙" },
    { f: "Come stai? Non dimenticare il tuo allenamento quotidiano! 🧠", m: "Come stai? Non dimenticare il tuo allenamento quotidiano! 🧠" },
    { f: "Buongiorno! Inizia bene la giornata con un esercizio 🌅",     m: "Buongiorno! Inizia bene la giornata con un esercizio 🌅" },
    { f: "È ora del tuo allenamento quotidiano! Dai che ce la fai 💪",  m: "È ora del tuo allenamento quotidiano! Dai che ce la fai 💪" },
    { f: "Non dimenticare la tua mente oggi! Un esercizio al giorno fa bene 🌿", m: "Non dimenticare la tua mente oggi! Un esercizio al giorno fa bene 🌿" },
  ],
  Affetto: [
    { f: "Fai gli esercizi per me oggi! Ti voglio bene ❤️",             m: "Fai gli esercizi per me oggi! Ti voglio bene ❤️" },
    { f: "Ogni volta che ti alleni penso a quanto sei in gamba 🥰",     m: "Ogni volta che ti alleni penso a quanto sei in gamba 🥰" },
    { f: "Allenarsi ogni giorno è il regalo più bello che puoi fare a te stessa e a noi ❤️", m: "Allenarsi ogni giorno è il regalo più bello che puoi fare a te stesso e a noi ❤️" },
    { f: "Quando ti vedo così impegnata il mio cuore si riempie di gioia 🥰", m: "Quando ti vedo così impegnato il mio cuore si riempie di gioia 🥰" },
    { f: "La tua forza ci ispira ogni giorno, continua ad allenarti! 🌸", m: "La tua forza ci ispira ogni giorno, continua ad allenarti! 🌸" },
    { f: "Ogni volta che apri l'app so che stai pensando anche a noi. Ti amiamo! 💙", m: "Ogni volta che apri l'app so che stai pensando anche a noi. Ti amiamo! 💙" },
  ],
  Celebrazione: [
    { f: "Hai fatto una serie fantastica! Sei inarrestabile 🔥",        m: "Hai fatto una serie fantastica! Sei inarrestabile 🔥" },
    { f: "Guarda quanto sei migliorata! Sono così felice per te 🎊",    m: "Guarda quanto sei migliorato! Sono così felice per te 🎊" },
    { f: "Hai completato tutti gli esercizi oggi, bravissima! 🏆",      m: "Hai completato tutti gli esercizi oggi, bravissimo! 🏆" },
    { f: "Sei una campionessa! Continua così 🥇",                       m: "Sei un campione! Continua così 🥇" },
    { f: "Hai raggiunto un nuovo livello! Sono orgoglioso/a di te 🎯",  m: "Hai raggiunto un nuovo livello! Sono orgoglioso/a di te 🎯" },
    { f: "Continui a migliorare ogni giorno, sei straordinaria! 🌟",    m: "Continui a migliorare ogni giorno, sei straordinario! 🌟" },
  ],
};
const CATEGORIE = Object.keys(MESSAGGI_CATEGORIE);

function formatDataMessaggio(created_at: string): string {
  const d = new Date(created_at);
  const mesi = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  return `${d.getDate()} ${mesi[d.getMonth()]}`;
}

// ─── Sezione Messaggi ─────────────────────────────────────────────────────────
function CardMessaggi({
  messaggiInviati,
  token,
  nomeUtente,
  genere,
}: {
  messaggiInviati: FamiliareDashboard["messaggi_inviati"];
  token: string;
  nomeUtente: string;
  genere: "F" | "M";
}) {
  const g = genere === "F" ? "f" : "m" as "f" | "m";
  const [showModal, setShowModal] = useState(false);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState("Incoraggiamento");
  const [messaggioSelezionato, setMessaggioSelezionato] = useState(MESSAGGI_CATEGORIE["Incoraggiamento"][0][g]);
  const [inviato, setInviato] = useState(false);

  function handleCategoriaChange(cat: string) {
    setCategoriaSelezionata(cat);
    setMessaggioSelezionato(MESSAGGI_CATEGORIE[cat][0][g]);
  }

  async function handleInvia() {
    await inviaMessaggioFamiliare(token, messaggioSelezionato, categoriaSelezionata);
    setInviato(true);
    setTimeout(() => {
      setInviato(false);
      setShowModal(false);
    }, 1600);
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-4 flex flex-col gap-4" style={{ boxShadow: "0 0 2px rgba(0,0,0,0.15)" }}>
        <span className="text-base font-semibold" style={{ color: COLORS.inkPrimary }}>Messaggi inviati</span>

        <div className="flex flex-col gap-2">
          {messaggiInviati.slice(0, 2).map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ boxShadow: "0 0 2px rgba(0,0,0,0.12)" }}
            >
              <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>Ultimo messaggio inviato</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.inkPrimary }}>{msg.testo}</span>
              <span className="text-xs" style={{ color: COLORS.inkMuted }}>{formatDataMessaggio(msg.created_at)}</span>
            </div>
          ))}
        </div>

        <button
          className="w-full py-3 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: COLORS.primary }}
          onClick={() => setShowModal(true)}
        >
          Invia messaggio
        </button>
      </div>

      {/* ── Modal scrivi messaggio ───────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 flex flex-col gap-5"
            style={{ maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto -mt-2" style={{ backgroundColor: "#D1D5DB" }} />

            {inviato ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}20` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-base font-bold" style={{ color: COLORS.primary }}>Messaggio inviato!</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: COLORS.inkPrimary }}>Scrivi a {nomeUtente.split(" ")[0]}</h3>
                    <p className="text-sm mt-1" style={{ color: COLORS.inkSecondary }}>Scegli un messaggio da mandare</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 -mt-1"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <span className="text-lg font-semibold leading-none" style={{ color: "#9CA3AF" }}>×</span>
                  </button>
                </div>

                {/* Categoria pills */}
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: COLORS.inkPrimary }}>Cosa vuoi dire?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIE.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoriaChange(cat)}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          backgroundColor: categoriaSelezionata === cat ? `${COLORS.primary}18` : COLORS.background,
                          color: categoriaSelezionata === cat ? COLORS.primary : COLORS.inkMuted,
                          border: `1.5px solid ${categoriaSelezionata === cat ? COLORS.primary : "transparent"}`,
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" style={{ borderColor: COLORS.border }} />

                {/* Messaggi radio */}
                <div className="flex flex-col gap-2">
                  {MESSAGGI_CATEGORIE[categoriaSelezionata].map((msg) => {
                    const testo = msg[g];
                    return (
                      <button
                        key={testo}
                        onClick={() => setMessaggioSelezionato(testo)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: COLORS.background,
                          border: `1.5px solid ${messaggioSelezionato === testo ? COLORS.primary : "transparent"}`,
                        }}
                      >
                        <span className="text-sm font-semibold pr-3 flex-1" style={{ color: COLORS.inkPrimary }}>{testo}</span>
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2"
                          style={{ borderColor: messaggioSelezionato === testo ? COLORS.primary : COLORS.border }}
                        >
                          {messaggioSelezionato === testo && (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottone invia */}
                <button
                  className="w-full py-3 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: COLORS.primary }}
                  onClick={handleInvia}
                >
                  Invia
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Contenuto principale ─────────────────────────────────────────────────────
function InvitoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [dashboard, setDashboard] = useState<FamiliareDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      setLoading(false);
      return;
    }
    fetchFamiliareDashboard(token).then((data) => {
      if (!data) {
        setTokenError(true);
      } else {
        setDashboard(data);
      }
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (tokenError || !dashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: COLORS.background }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}20` }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-lg font-bold" style={{ color: COLORS.inkPrimary }}>Link non valido o scaduto</p>
        <p className="text-sm" style={{ color: COLORS.inkMuted }}>Chiedi un nuovo link all'utente che ti ha invitato.</p>
      </div>
    );
  }

  const { senior, invito } = dashboard;
  const nomeUtente = senior.nome;
  const iniziale = nomeUtente.charAt(0).toUpperCase();
  const genere = senior.genere ?? "F";
  const relazione = getRelazione(invito.relazione, genere);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto" style={{ backgroundColor: COLORS.background }}>
      {/* Header utente */}
      <div className="px-4 pt-8 pb-4 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
          style={{ backgroundColor: COLORS.primary }}
        >
          {iniziale}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold" style={{ color: COLORS.inkPrimary }}>{nomeUtente}</span>
          <span className="text-sm font-semibold" style={{ color: COLORS.inkMuted }}>
            {relazione}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-4 pb-8">
        <CardProgressiGiornata eserciziOggi={dashboard.esercizi_oggi} streak={senior.current_streak} />
        <CardAndamento sessioni={dashboard.sessioni_recenti} />
        <CardMessaggi
          messaggiInviati={dashboard.messaggi_inviati}
          token={token}
          nomeUtente={nomeUtente}
          genere={genere}
        />
      </div>
    </div>
  );
}

// ─── Export con Suspense (richiesto da useSearchParams) ───────────────────────
export default function InvitoPage() {
  return (
    <Suspense>
      <InvitoContent />
    </Suspense>
  );
}
