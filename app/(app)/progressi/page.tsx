"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/card";
import { mockCategorie } from "@/lib/mock-data";
import { fetchDatiProgressi, type ScoreCategoria, type StoricoGiorno } from "@/lib/sync";
import { useUserStore } from "@/lib/store";
import { COLORS, CATEGORIA_COLORS } from "@/lib/design-tokens";
import { AppIcon } from "@/lib/icons";
import { Calendar } from "iconoir-react";
import AppSelect from "@/components/ui/app-select";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// ── Calendario ────────────────────────────────────────────────────────────────

const MESI_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDayItalian = (new Date(year, month, 1).getDay() + 6) % 7; // Lun=0…Dom=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDayItalian).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function getAllCompletatiDates(storico: StoricoGiorno[]): Set<string> {
  const set = new Set<string>();
  for (const g of storico) {
    const categorie = new Set(g.sessioni.map((s) => s.categoria.toLowerCase()));
    if (categorie.size >= 5) set.add(g.data);
  }
  return set;
}

function getAllAttivitaDates(storico: StoricoGiorno[]): Set<string> {
  const set = new Set<string>();
  for (const g of storico) {
    if (g.sessioni.length > 0) set.add(g.data);
  }
  return set;
}

function buildStreakFromStorico(storico: StoricoGiorno[]): number {
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (storico.some((g) => g.data === dateStr && g.sessioni.length > 0)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function CalendarioMensile({
  streak,
  selectedDate,
  onDaySelect,
  storicoSessioni,
  children,
}: {
  streak: number;
  selectedDate: string | null;
  onDaySelect: (date: string) => void;
  storicoSessioni: StoricoGiorno[];
  children?: React.ReactNode;
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

  const completatiSet = getAllCompletatiDates(storicoSessioni);
  const attivitaSet = getAllAttivitaDates(storicoSessioni);
  const cells = buildCalendarCells(year, month);
  const HEADER = ["L", "M", "M", "G", "V", "S", "D"];

  return (
    <Card padding="md">
      {/* Titolo + streak */}
      <div className="mb-4">
        <p className="text-base font-bold text-ink">Storico allenamenti</p>
        <p className="text-sm font-bold" style={{ color: COLORS.primary }}>{streak} giorni consecutivi</p>
      </div>

      {/* Header mese */}
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

      {/* Intestazione giorni settimana */}
      <div className="grid grid-cols-7 mb-2">
        {HEADER.map((g, i) => (
          <div key={i} className="text-center text-xs font-semibold" style={{ color: COLORS.inkMuted }}>
            {g}
          </div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = isCurrentMonth && day === todayDate;
          const isFuture = isCurrentMonth && day > todayDate;
          const completato = completatiSet.has(dateStr);
          const isSelected = selectedDate === dateStr;

          let bg: string = "transparent";
          let border: string = "1.5px solid #D1D5DB";
          let color: string = "#6B7280";
          let boxShadow: string = "none";

          const haAttivita = attivitaSet.has(dateStr);

          if (completato) {
            bg = COLORS.primary;
            border = "none";
            color = "#FFFFFF";
          } else if (isFuture) {
            border = "none";
            color = "#D1D5DB";
          } else if (isToday || haAttivita) {
            // oggi oppure giorno con attività parziale (>0 <5) → outline blu
            border = `1.5px solid ${COLORS.primary}`;
            color = COLORS.primary;
          } else {
            // giorni passati senza nessuna attività → grigio
            border = "1.5px solid #D1D5DB";
            color = "#9CA3AF";
          }

          if (isSelected) {
            boxShadow = `0 0 0 3px white, 0 0 0 5px ${COLORS.primary}`;
          }

          return (
            <div key={i} className="flex justify-center py-0.5">
              <button
                disabled={isFuture}
                onClick={() => onDaySelect(isSelected ? "" : dateStr)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: bg, border, color, boxShadow, cursor: isFuture ? "default" : "pointer" }}
              >
                {day}
              </button>
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

      {children && <div className="mt-6">{children}</div>}
    </Card>
  );
}

// ── Card area cerebrale ──────────────────────────────────────────────────────

type Periodo = "settimana" | "mese" | "anno";
const SLICE: Record<Periodo, number> = { settimana: 7, mese: 30, anno: 365 };
const PERIODO_LABEL: Record<Periodo, string> = { settimana: "Settimana", mese: "Mese", anno: "Anno" };

const MOCK_TODAY = new Date();
const MESI_IT_MAP: Record<string, number> = {
  "Gen":0,"Feb":1,"Mar":2,"Apr":3,"Mag":4,"Giu":5,
  "Lug":6,"Ago":7,"Set":8,"Ott":9,"Nov":10,"Dic":11,
};
const MESI_IT_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const DAY_LABELS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

function parseStoricoLabel(label: string): Date {
  const [d, m] = label.split(" ");
  return new Date(2026, MESI_IT_MAP[m], parseInt(d));
}

type StoricoEntry = { label: string; livello: number };

function buildPeriodData(storico: StoricoEntry[], periodo: Periodo): { label: string; livello: number | null }[] {
  const today = MOCK_TODAY;

  if (periodo === "settimana") {
    const day = today.getDay(); // Ven = 5
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    return DAY_LABELS.map((dayLabel, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d > today) return { label: dayLabel, livello: null };
      const dateLabel = `${d.getDate()} ${MESI_IT_SHORT[d.getMonth()]}`;
      const match = storico.find((s) => s.label === dateLabel);
      return { label: dayLabel, livello: match?.livello ?? null };
    });
  }

  if (periodo === "mese") {
    const currentMonth = today.getMonth();
    return storico
      .filter((s) => parseStoricoLabel(s.label).getMonth() === currentMonth)
      .map((s) => ({ label: s.label, livello: s.livello }));
  }

  // anno: raggruppa per mese, media livello
  const byMonth = new Map<string, number[]>();
  for (const s of storico) {
    const key = MESI_IT_SHORT[parseStoricoLabel(s.label).getMonth()];
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(s.livello);
  }
  return Array.from(byMonth.entries()).map(([label, levels]) => ({
    label,
    livello: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length),
  }));
}

const TREND_TEXTS: Record<string, Record<string, string>> = {
  Memoria: {
    crescita: "Stai ricordando sempre più cose correttamente. Continua ad allenarti e vedrai ancora più miglioramenti!",
    stabile:  "La tua capacità di ricordare è stabile. Prova a fare qualche esercizio in più per portarla al livello successivo!",
    calo:     "Stai ricordando meno cose rispetto a prima. Non preoccuparti, riprendi gli esercizi e tornerà a salire!",
  },
  Attenzione: {
    crescita: "La tua concentrazione sta migliorando. La tua capacità di focalizzarti sui dettagli sta crescendo!",
    stabile:  "La tua concentrazione è stabile. Prova a fare qualche esercizio in più per migliorare ancora!",
    calo:     "La tua concentrazione ha bisogno di un po' di allenamento. Riprendi gli esercizi e tornerà a salire!",
  },
  Linguaggio: {
    crescita: "Il tuo linguaggio sta migliorando. Stai migliorando sempre più con le parole!",
    stabile:  "Il tuo linguaggio è stabile. Prova a fare qualche esercizio in più per portarlo al livello successivo!",
    calo:     "Il tuo linguaggio ha bisogno di un po' di allenamento. Riprendi gli esercizi e tornerà a salire!",
  },
  Esecutive: {
    crescita: "Le tue funzioni esecutive stanno migliorando. Stai pianificando e organizzando sempre meglio!",
    stabile:  "Le tue funzioni esecutive sono stabili. Qualche esercizio in più le porterà al livello successivo!",
    calo:     "Le tue funzioni esecutive hanno bisogno di allenamento. Riprendi gli esercizi e torneranno a salire!",
  },
  Visuospaziali: {
    crescita: "Le tue abilità visuospaziali stanno migliorando. Stai percependo e orientandoti sempre meglio!",
    stabile:  "Le tue abilità visuospaziali sono stabili. Continua ad allenarti per migliorare ancora!",
    calo:     "Le tue abilità visuospaziali hanno bisogno di allenamento. Riprendi gli esercizi!",
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AreaCerebraleCard({ cat }: { cat: ScoreCategoria }) {
  const [periodo, setPeriodo] = useState<Periodo>("settimana");
  const cc = CATEGORIA_COLORS[cat.categoria.toLowerCase()];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const trendLabel = { crescita: "↑ In crescita", stabile: "→ Stabile", calo: "↓ In calo" }[cat.trend];
  const testoTrend = TREND_TEXTS[cat.categoria]?.[cat.trend] ?? "";
  const dati = cat.storico.slice(-SLICE[periodo]);
  const PERIODI: Periodo[] = ["settimana", "mese", "anno"];

  return (
    <div className="rounded-2xl" style={{ backgroundColor: cc?.bg, padding: 16 }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AppIcon name={cat.icona} size={24} color={cc?.text ?? COLORS.primary} />
        <span className="text-base font-semibold text-ink">{cat.categoria}</span>
      </div>

      {/* Griglia 2x2 statistiche */}
      <div className="flex gap-2 mb-3">
        <StatCell value={`${cat.score}%`} label="Precisione media" color={cc?.text ?? COLORS.primary} />
        <StatCell value={TREND_ARROW[cat.trend]} label={TREND_TEXT[cat.trend]} color={cc?.text ?? COLORS.primary} />
      </div>
      <div className="flex gap-2 mb-3">
        <StatCell value={String(cat.sessioni)} label="Sessioni" color={cc?.text ?? COLORS.primary} />
        <StatCell value={`${cat.livello}/20`} label="Livello" color={cc?.text ?? COLORS.primary} />
      </div>

      {/* Box bianco con grafico (sempre visibile) */}
      <div className="rounded-xl mb-3" style={{ backgroundColor: "#FFFFFF", padding: 16 }}>
        {/* Filtri periodo — pill */}
        <div className="flex items-center gap-2 mb-3">
          {PERIODI.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
              style={{
                backgroundColor: periodo === p ? (cc?.text ?? COLORS.primary) : "#F0F0F0",
                color: periodo === p ? "#FFFFFF" : "#6B7280",
              }}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Grafico */}
        <ChartBox height={140}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={dati} margin={{ top: 5, right: 5, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.inkMuted }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 9, fill: COLORS.inkMuted }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "none", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v != null ? `${v}%` : "", cat.categoria]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={cc?.text ?? COLORS.primary}
                strokeWidth={2}
                dot={{ fill: cc?.text ?? COLORS.primary, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* Testo discorsivo */}
      <p className="text-sm leading-relaxed" style={{ color: COLORS.ink }}>
        {testoTrend}
      </p>
    </div>
  );
}

const NOMI_GIORNO_IT = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const MESI_SHORT_IT  = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

// storicoSessioni è ordinato dal più recente al più vecchio
function getPreviousScore(storico: StoricoGiorno[], data: string, categoria: string): number | null {
  const idx = storico.findIndex((g) => g.data === data);
  const start = idx === -1 ? storico.length : idx + 1;
  for (let i = start; i < storico.length; i++) {
    const found = storico[i].sessioni.find((s) => s.categoria === categoria);
    if (found) return found.score;
  }
  return null;
}

function TrendArrow({ storico, data, categoria, score }: { storico: StoricoGiorno[]; data: string; categoria: string; score: number }) {
  const prev = getPreviousScore(storico, data, categoria);
  if (prev === null) return null;
  const symbol = score > prev ? "↑" : score < prev ? "↓" : "→";
  const color  = score > prev ? COLORS.success : score < prev ? "#DC2626" : COLORS.inkMuted;
  return <span className="text-xs font-semibold" style={{ color }}>{symbol}</span>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StoricoGiornaliero({ storicoSessioni }: { storicoSessioni: StoricoGiorno[] }) {
  const now = new Date();
  const jsDay = now.getDay();
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isFuture = dateStr > todayStr;
    const sessioni = isFuture ? [] : (storicoSessioni.find((g) => g.data === dateStr)?.sessioni ?? []);
    const label = `${NOMI_GIORNO_IT[d.getDay()]} ${d.getDate()} ${MESI_SHORT_IT[d.getMonth()]}`;
    return { dateStr, label, isFuture, sessioni };
  });

  return (
    <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
        {days.map(({ dateStr, label, isFuture, sessioni }, idx) => (
          <div key={dateStr} className={idx === 0 ? "pb-3" : idx === 6 ? "pt-3" : "py-3"}>
            {isFuture ? (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: COLORS.inkMuted }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.inkMuted }}>—</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-ink mb-2">{label}</p>
                {sessioni.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.inkMuted }}>Nessuna sessione completata</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sessioni.map((s, i) => {
                      const cc = CATEGORIA_COLORS[s.categoria.toLowerCase()];
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cc?.text ?? COLORS.primary }} />
                          <span className="text-sm font-medium text-ink flex-1">{s.categoria}</span>
                          <span className="text-xs font-semibold" style={{ color: cc?.text ?? COLORS.primary }}>{s.score}%</span>
                          <TrendArrow storico={storicoSessioni} data={dateStr} categoria={s.categoria} score={s.score} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
  );
}

const TUTTE_CATEGORIE = ["memoria", "attenzione", "linguaggio", "esecutive", "visuospaziali"] as const;
const CAT_NOMI_DET: Record<string, string> = { memoria: "Memoria", attenzione: "Attenzione", linguaggio: "Linguaggio", esecutive: "Esecutive", visuospaziali: "Visuospaziali" };
const CAT_ICONE_DET: Record<string, string> = { memoria: "brain", attenzione: "target", linguaggio: "chat", esecutive: "puzzle", visuospaziali: "eye" };

function DettaglioGiorno({ dateStr, storicoSessioni, esercizioDelGiornoId }: { dateStr: string; storicoSessioni: StoricoGiorno[]; esercizioDelGiornoId: string }) {
  const sessioni = storicoSessioni.find((g) => g.data === dateStr)?.sessioni ?? [];
  const d = new Date(dateStr);
  const label = `${NOMI_GIORNO_IT[d.getDay()]} ${d.getDate()} ${MESI_SHORT_IT[d.getMonth()]}`;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = dateStr === todayStr;

  const sessioniPerCat = Object.fromEntries(sessioni.map((s) => [s.categoria.toLowerCase(), s]));
  const numCompletate = Object.keys(sessioniPerCat).length;
  const isCompleta = numCompletate >= 5;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-bold text-ink">{isToday ? "Oggi" : label}</p>
      {sessioni.length === 0 ? (
        isToday ? (
          <div className="flex flex-col">
            <p className="text-base" style={{ color: COLORS.inkSecondary }}>
              Ancora nessuna attività oggi
            </p>
            <Link
              href={`/esercizi/${esercizioDelGiornoId}`}
              className="text-base font-semibold underline"
              style={{ color: COLORS.primary }}
            >
              Vai all'esercizio del giorno
            </Link>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
            <p className="text-sm font-semibold" style={{ color: COLORS.inkSecondary }}>
              Nessuna attività in questo giorno
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {/* Badge sessione */}
          <div
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: isCompleta ? COLORS.successLight : "#FEF3C7" }}
          >
            <span className="text-sm font-bold" style={{ color: isCompleta ? COLORS.success : "#D97706" }}>
              {isCompleta ? "✓ Sessione completata" : `${numCompletate}/5 esercizi completati`}
            </span>
          </div>

          {/* Riga per ogni categoria */}
          <div className="flex flex-col">
            {TUTTE_CATEGORIE.map((catId, i) => {
              const s = sessioniPerCat[catId];
              const cc = CATEGORIA_COLORS[catId];
              return (
                <div
                  key={catId}
                  className="flex items-center gap-3 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${COLORS.border}` : undefined }}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: s ? (cc?.bg ?? COLORS.background) : "#F3F4F6" }}
                  >
                    <AppIcon name={CAT_ICONE_DET[catId]} size={22} color={s ? (cc?.text ?? COLORS.primary) : "#D1D5DB"} />
                  </div>
                  <p className="flex-1 text-sm font-medium" style={{ color: s ? COLORS.ink : COLORS.inkMuted }}>
                    {CAT_NOMI_DET[catId]}
                  </p>
                  {!s && (
                    <span className="text-xs font-medium" style={{ color: COLORS.inkMuted }}>Non svolto</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const TREND_ARROW: Record<string, string> = { crescita: "↑", stabile: "→", calo: "↓" };
const TREND_TEXT:  Record<string, string> = { crescita: "In crescita", stabile: "Stabile", calo: "In calo" };

function ChartBox({ height, children }: { height: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return <div style={{ height }}>{ready ? children : null}</div>;
}

function StatCell({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: "#FFFFFF" }}>
      <p className="text-base font-bold leading-tight" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5 leading-tight" style={{ color: COLORS.inkMuted }}>{label}</p>
    </div>
  );
}

const CERVELLO_COLOR = "#1891B1";
const CERVELLO_BG = "#E8F6FA";
const CERVELLO_TEXTS: Record<string, string> = {
  crescita: "Stai andando molto bene! Hai risposto correttamente alla maggior parte delle domande. Continua così, ogni giorno fa la differenza.",
  stabile:  "Stai andando bene! Continua ad allenarti ogni giorno per migliorare ancora di più!",
  calo:     "Hai bisogno di un po' di allenamento. Non preoccuparti, riprendi gli esercizi e i risultati arriveranno!",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CervelloGlobaleCard({ scoreCategorie }: { scoreCategorie: ScoreCategoria[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("settimana");

  const globalScore = scoreCategorie.length > 0
    ? Math.round(scoreCategorie.reduce((sum, c) => sum + c.score, 0) / scoreCategorie.length)
    : 0;
  const globalSessioni = scoreCategorie[0]?.sessioni ?? 0;
  const globalStorico = scoreCategorie.length > 0
    ? scoreCategorie[0].storico.map((entry, i) => ({
        label: entry.label,
        score: Math.round(
          scoreCategorie.reduce((sum, c) => sum + (c.storico[i]?.score ?? 0), 0) / scoreCategorie.length
        ),
      }))
    : [];
  const globalTrend: "crescita" | "stabile" | "calo" = (() => {
    const first = globalStorico[0]?.score ?? 0;
    const last = globalStorico[globalStorico.length - 1]?.score ?? 0;
    if (last > first + 2) return "crescita";
    if (last < first - 2) return "calo";
    return "stabile";
  })();
  const sfereCrescita = scoreCategorie.filter((c) => c.trend === "crescita").length;

  const dati = globalStorico.slice(-SLICE[periodo]);
  const PERIODI: Periodo[] = ["settimana", "mese", "anno"];

  return (
    <div className="rounded-2xl" style={{ backgroundColor: CERVELLO_BG, padding: 16 }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AppIcon name="brain" size={24} color={CERVELLO_COLOR} />
        <span className="text-base font-semibold text-ink">Riassunto</span>
      </div>

      {/* Griglia 2x2 statistiche */}
      <div className="flex gap-2 mb-3">
        <StatCell value={`${globalScore}%`} label="Precisione media" color={CERVELLO_COLOR} />
        <StatCell value={TREND_ARROW[globalTrend]} label={TREND_TEXT[globalTrend]} color={CERVELLO_COLOR} />
      </div>
      <div className="flex gap-2 mb-3">
        <StatCell value={String(globalSessioni)} label="Sessioni totali" color={CERVELLO_COLOR} />
        <StatCell value={`${sfereCrescita}/3`} label="Sfere in crescita" color={CERVELLO_COLOR} />
      </div>

      {/* Box bianco con grafico */}
      <div className="rounded-xl mb-3" style={{ backgroundColor: "#FFFFFF", padding: 16 }}>
        {/* Filtri periodo — pill */}
        <div className="flex items-center gap-2 mb-3">
          {PERIODI.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
              style={{
                backgroundColor: periodo === p ? CERVELLO_COLOR : "#F0F0F0",
                color: periodo === p ? "#FFFFFF" : "#6B7280",
              }}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Grafico */}
        <ChartBox height={140}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={dati} margin={{ top: 5, right: 5, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.inkMuted }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 9, fill: COLORS.inkMuted }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "none", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v != null ? `${v}%` : "", "Cervello"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={CERVELLO_COLOR}
                strokeWidth={2}
                dot={{ fill: CERVELLO_COLOR, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* Testo discorsivo */}
      <p className="text-sm leading-relaxed" style={{ color: COLORS.ink }}>
        {CERVELLO_TEXTS[globalTrend]}
      </p>
    </div>
  );
}

// ── Tab Attività ─────────────────────────────────────────────────────────────

type FiltroAttivita = "tutti" | "memoria" | "attenzione" | "linguaggio" | "esecutive" | "visuospaziali";
const FILTRO_LABEL: Record<FiltroAttivita, string> = {
  tutti: "Tutti", memoria: "Memoria", attenzione: "Attenzione", linguaggio: "Linguaggio",
  esecutive: "Esecutive", visuospaziali: "Visuospaziali",
};

const FILTRO_ICONA: Record<string, string> = Object.fromEntries(
  mockCategorie.map((c) => [c.id, c.icona])
);

function FiltroPills({ filtro, setFiltro }: { filtro: FiltroAttivita; setFiltro: (f: FiltroAttivita) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {(["tutti", "memoria", "attenzione", "linguaggio", "esecutive", "visuospaziali"] as FiltroAttivita[]).map((f) => {
        const isActive = filtro === f;
        const cc = f !== "tutti" ? CATEGORIA_COLORS[f] : null;
        const icona = FILTRO_ICONA[f];
        const iconColor = isActive ? "#FFFFFF" : (cc?.text ?? COLORS.inkMuted);
        return (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
            style={{
              backgroundColor: isActive ? (cc?.text ?? COLORS.primary) : "#E6E7EB",
              color: isActive ? "#FFFFFF" : COLORS.inkMuted,
            }}
          >
            {icona && <AppIcon name={icona} size={17} color={iconColor} />}
            {FILTRO_LABEL[f]}
          </button>
        );
      })}
    </div>
  );
}

function AttivitaTab({ filtro: filtroExt, setFiltro: setFiltroExt, hidePills, scoreCategorie }: {
  filtro?: FiltroAttivita;
  setFiltro?: (f: FiltroAttivita) => void;
  hidePills?: boolean;
  scoreCategorie: ScoreCategoria[];
}) {
  const [filtroInt, setFiltroInt] = useState<FiltroAttivita>("tutti");
  const filtro    = filtroExt    ?? filtroInt;
  const setFiltro = setFiltroExt ?? setFiltroInt;
  const [periodo, setPeriodo] = useState<Periodo>("settimana");

  const filteredCats = filtro === "tutti"
    ? scoreCategorie
    : scoreCategorie.filter((c) => c.categoria.toLowerCase() === filtro);

  const activeColor = filtro === "tutti"
    ? COLORS.primary
    : (CATEGORIA_COLORS[filtro]?.text ?? COLORS.primary);

  // Build chart data
  const chartData = filtro === "tutti"
    ? (() => {
        if (scoreCategorie.length === 0) return [];
        const refData = buildPeriodData(scoreCategorie[0].storicoLivello, periodo);
        return refData.map((point, i) => {
          const obj: Record<string, unknown> = { label: point.label };
          scoreCategorie.forEach((cat) => {
            const catData = buildPeriodData(cat.storicoLivello, periodo);
            obj[cat.categoria] = catData[i]?.livello ?? undefined;
          });
          return obj;
        });
      })()
    : buildPeriodData(
        scoreCategorie.find((c) => c.categoria.toLowerCase() === filtro)?.storicoLivello ?? [],
        periodo
      ).map((d) => ({ label: d.label, livello: d.livello ?? undefined }));

  // Stats
  const livelloMedio       = filteredCats.length > 0 ? Math.round(filteredCats.reduce((s, c) => s + c.livello, 0) / filteredCats.length) : 0;
  const dominiInCrescita   = filteredCats.filter((c) => c.trend === "crescita").length;
  const sessioniTotali     = filteredCats[0]?.sessioni ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills — nascoste se gestite esternamente */}
      {!hidePills && <FiltroPills filtro={filtro} setFiltro={setFiltro} />}

      {/* Chart card */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-ink">Andamento generale</span>
          {/* Dropdown periodo */}
          <AppSelect
            size="sm"
            direction="down"
            value={periodo}
            onChange={(v) => setPeriodo(v as Periodo)}
            options={(["settimana", "mese", "anno"] as Periodo[]).map((p) => ({ value: p, label: PERIODO_LABEL[p] }))}
          />
        </div>

        <ChartBox height={160}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.inkMuted }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                tickFormatter={(v) => `L.${v}`}
                tick={{ fontSize: 9, fill: COLORS.inkMuted }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "none", borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [v != null ? `L.${v}` : "", name]}
              />
              {filtro === "tutti"
                ? scoreCategorie.map((cat) => {
                    const cc = CATEGORIA_COLORS[cat.categoria.toLowerCase()];
                    return (
                      <Line
                        key={cat.categoria}
                        type="monotone"
                        dataKey={cat.categoria}
                        stroke={cc?.text ?? COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: cc?.text ?? COLORS.primary, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })
                : (
                  <Line
                    type="monotone"
                    dataKey="livello"
                    stroke={activeColor}
                    strokeWidth={2}
                    dot={{ fill: activeColor, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )
              }
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* Stats */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
        {filtro === "tutti" ? (
          <>
            <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="p-4" style={{ borderRight: `1px solid ${COLORS.border}` }}>
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{livelloMedio}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Livello medio</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{dominiInCrescita}/{filteredCats.length}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Domini in crescita</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{sessioniTotali}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Sessioni totali</p>
            </div>
          </>
        ) : filteredCats.length === 0 ? null : (() => {
          const cat = filteredCats[0];
          const trendArrow = { crescita: "↑", stabile: "→", calo: "↓" }[cat.trend];
          return (
            <div className="grid grid-cols-2">
              <div className="p-4" style={{ borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{cat.score}%</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Accuratezza</p>
              </div>
              <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{cat.livello}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Livello attuale</p>
              </div>
              <div className="p-4" style={{ borderRight: `1px solid ${COLORS.border}` }}>
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{cat.sessioni}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Sessioni totali</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-extrabold" style={{ color: activeColor }}>{trendArrow}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkMuted }}>Andamento</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Testo discorsivo */}
      {filtro === "tutti" ? (
        <p className="text-sm leading-relaxed" style={{ color: COLORS.inkSecondary }}>
          Stai andando molto bene! Hai risposto correttamente alla maggior parte delle domande. Continua così, ogni giorno fa la differenza.
        </p>
      ) : filteredCats.length === 1 && (
        <p className="text-sm leading-relaxed" style={{ color: COLORS.inkSecondary }}>
          {TREND_TEXTS[filteredCats[0].categoria]?.[filteredCats[0].trend] ?? ""}
        </p>
      )}
    </div>
  );
}

// ── Fiamma numerata (medaglie streak) ────────────────────────────────────────

function FlameNumerata({ numero, guadagnata, size = 52 }: { numero: number; guadagnata: boolean; size?: number }) {
  const uid = `fg-${numero}`;
  const height = Math.round(size * 1.15);
  const fontSize = numero >= 100 ? Math.round(size * 0.21) : numero >= 10 ? Math.round(size * 0.26) : Math.round(size * 0.33);

  return (
    <div style={{ position: "relative", width: size, height }}>
      <svg width={size} height={height} viewBox="0 0 52 60" fill="none">
        <defs>
          {guadagnata && (
            <linearGradient id={uid} x1="26" y1="0" x2="26" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="55%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          )}
        </defs>
        <path
          d="M26 2C26 2 6 18 6 34C6 46.7 14.9 58 26 58C37.1 58 46 46.7 46 34C46 18 26 2 26 2Z"
          fill={guadagnata ? `url(#${uid})` : "#E5E7EB"}
        />
        {guadagnata && (
          <path
            d="M26 18C22 24 16 30 16 38C16 44 20.5 50 26 50C31.5 50 36 44 36 38C36 30 30 24 26 18Z"
            fill="#FEF3C7"
            opacity="0.4"
          />
        )}
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: Math.round(size * 0.08),
          fontSize,
          fontWeight: 900,
          color: guadagnata ? "#7C2D12" : "#9CA3AF",
          lineHeight: 1,
        }}
      >
        {numero}
      </span>
    </div>
  );
}

type Tab = "attivita" | "storico" | "medaglie";

function Caricamento() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 rounded-full border-4 animate-spin"
        style={{ borderColor: `${COLORS.primary}40`, borderTopColor: COLORS.primary }}
      />
    </div>
  );
}

function ProgressiPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "attivita");
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [filtroGuest, setFiltroGuest] = useState<FiltroAttivita>("tutti");
  const { streak, isGuest, userId, eserciziDelGiorno, progressiSettimanali, medaglieDefinizioni } = useUserStore();

  // Dati reali da Supabase
  const [scoreCategorie, setScoreCategorie] = useState<ScoreCategoria[]>([]);
  const [storicoSessioni, setStoricoSessioni] = useState<StoricoGiorno[]>([]);
  const [totaleSettimanaScorsa, setTotaleSettimanaScorsa] = useState(0);
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    if (isGuest) { setCaricato(true); return; }
    if (!userId) return; // attende l'inizializzazione dello store
    let annullato = false;
    fetchDatiProgressi(userId).then((d) => {
      if (annullato) return;
      setScoreCategorie(d.scoreCategorie);
      setStoricoSessioni(d.storicoSessioni);
      setTotaleSettimanaScorsa(d.totaleSettimanaScorsa);
      setCaricato(true);
    });
    return () => { annullato = true; };
  }, [userId, isGuest]);

  const totaleSettimana = progressiSettimanali.filter((g) => g.esercizi >= 5).length;
  const esercizioDelGiornoId = eserciziDelGiorno.find((e) => !e.completato)?.id ?? eserciziDelGiorno[0]?.id ?? "";

  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null;
    if (t) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (isGuest) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isGuest]);
  const medaglieGuadagnate = medaglieDefinizioni.filter((m) => streak >= m.giorni);

  return (
    <div className="flex flex-col" style={isGuest ? { overflow: "hidden", height: "100dvh" } : undefined}>
      {/* ── Header + Tabs ────────────────────────────────────────────── */}
      <div className="bg-surface px-4 pt-6 pb-0 sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-2 mb-0">
          <h1 className="text-2xl font-extrabold text-ink">I tuoi progressi</h1>
        </div>
        <div className="flex mt-4">
          {([["attivita", "Attività"], ["storico", "Storico"], ["medaglie", "Medaglie"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-base font-semibold border-b-2 transition-all"
              style={{
                borderColor: tab === t ? COLORS.primary : "transparent",
                color: tab === t ? COLORS.primary : COLORS.inkMuted,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter pills per guest — visibili sopra il blur nel tab Attività */}
      {isGuest && tab === "attivita" && (
        <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
          <FiltroPills filtro={filtroGuest} setFiltro={setFiltroGuest} />
        </div>
      )}

      <div className="relative flex flex-col gap-4 px-4 pt-4 flex-1" style={isGuest ? { overflow: "hidden" } : undefined}>
        {/* ── Tab: Attività ────────────────────────────────────────── */}
        {tab === "attivita" && (
          isGuest
            ? <AttivitaTab filtro={filtroGuest} setFiltro={setFiltroGuest} hidePills={true} scoreCategorie={scoreCategorie} />
            : !caricato
              ? <Caricamento />
              : <AttivitaTab scoreCategorie={scoreCategorie} />
        )}

        {/* ── Tab: Storico ──────────────────────────────────────────── */}
        {tab === "storico" && !isGuest && !caricato && <Caricamento />}
        {tab === "storico" && (isGuest || caricato) && (() => {
          const diff = totaleSettimana - totaleSettimanaScorsa;
          const stato: "meglio" | "stabile" | "peggio" =
            diff > 0 ? "meglio" : diff === 0 ? "stabile" : "peggio";

          const stateConfig = {
            meglio: {
              bg: COLORS.successLight,
              color: COLORS.success,
              icon: "↑",
              label: "In crescita",
              txt: `Questa settimana hai completato +${diff} ${diff === 1 ? "sessione" : "sessioni"} rispetto alla settimana scorsa.`,
            },
            stabile: {
              bg: "#F5F5F5",
              color: "#6B7280",
              icon: "→",
              label: "Stabile",
              txt: `Questa settimana hai completato lo stesso numero di sessioni della settimana scorsa.`,
            },
            peggio: {
              bg: "#FEF2F2",
              color: "#DC2626",
              icon: "↓",
              label: "In calo",
              txt: `Questa settimana hai completato ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "sessione" : "sessioni"} in meno rispetto alla settimana scorsa.`,
            },
          }[stato];

          return (
            <>
              <CalendarioMensile
                streak={buildStreakFromStorico(storicoSessioni)}
                selectedDate={selectedDate}
                onDaySelect={(d) => setSelectedDate(d || null)}
                storicoSessioni={storicoSessioni}
              >
                <div className="rounded-xl p-4 flex flex-col gap-1" style={{ backgroundColor: stateConfig.bg }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: stateConfig.color }}>{stateConfig.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: stateConfig.color }}>{stateConfig.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: stateConfig.color }}>{stateConfig.txt}</p>
                </div>
              </CalendarioMensile>
              {(() => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                return <DettaglioGiorno dateStr={selectedDate ?? todayStr} storicoSessioni={storicoSessioni} esercizioDelGiornoId={esercizioDelGiornoId} />;
              })()}
            </>
          );
        })()}

        {/* ── Tab: Medaglie ─────────────────────────────────────────── */}
        {tab === "medaglie" && (
          <>
            {/* Contatore */}
            <div className="flex items-center justify-between py-1">
              <p className="text-base" style={{ color: COLORS.inkMuted }}>
                <strong className="text-ink">{medaglieGuadagnate.length}</strong> di {medaglieDefinizioni.length} medaglie sbloccate
              </p>
            </div>

            <p className="text-sm font-bold" style={{ color: COLORS.streak }}>
              Giorni di Attività
            </p>

            <div className="grid grid-cols-2 gap-3 pb-4">
              {medaglieDefinizioni.map((medaglia) => {
                const guadagnata = streak >= medaglia.giorni;
                const rimanenti = medaglia.giorni - streak;

                return (
                  <div
                    key={medaglia.id}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-2 h-36"
                    style={{
                      backgroundColor: guadagnata ? COLORS.streakLight : "#F9FAFB",
                      border: guadagnata ? `1.5px solid ${COLORS.streak}44` : "1.5px solid #E5E7EB",
                    }}
                  >
                    <FlameNumerata numero={medaglia.giorni} guadagnata={guadagnata} size={48} />
                    <p
                      className="text-xs font-bold text-center leading-tight"
                      style={{ color: guadagnata ? COLORS.streak : COLORS.inkMuted }}
                    >
                      {medaglia.nome}
                    </p>
                    <div className="h-5 flex items-center justify-center">
                      {guadagnata && medaglia.guadagnata_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar width={10} height={10} strokeWidth={1.5} color={COLORS.gold} />
                          <p className="text-xs font-semibold" style={{ color: COLORS.gold }}>
                            {new Date(medaglia.guadagnata_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      ) : !guadagnata ? (
                        <p className="text-xs text-center leading-tight" style={{ color: COLORS.inkMuted }}>
                          ancora {rimanenti} {rimanenti === 1 ? "giorno" : "giorni"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Overlay upsell — solo ospite ─────────────────────────── */}
        {isGuest && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-12"
            style={{ backdropFilter: "blur(10px)", background: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))", zIndex: 20 }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-ink text-center">
              Sblocca la tua esperienza completa
            </p>
            <Link href="/onboarding/registrati" className="w-full max-w-xs">
              <button
                className="w-full py-3 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                Registrati gratuitamente
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressiPage() {
  return <Suspense fallback={null}><ProgressiPageContent /></Suspense>;
}
