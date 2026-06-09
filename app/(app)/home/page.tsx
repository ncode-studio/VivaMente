"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Btn from "@/components/ui/btn";
import { useUserStore } from "@/lib/store";
import { mockCategorie } from "@/lib/mock-data";
import { CATEGORIA_COLORS, COLORS } from "@/lib/design-tokens";
import { AppIcon } from "@/lib/icons";
import { Running, Phone, Palette, Leaf, Lock, ChatLines, Check } from "iconoir-react";
import { PausaAttivaModal } from "@/components/ui/pausa-attiva-modal";

function FlameNumerata({ numero, guadagnata, size = 48 }: { numero: number; guadagnata: boolean; size?: number }) {
  const uid = `hfg-${numero}`;
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
        <path d="M26 2C26 2 6 18 6 34C6 46.7 14.9 58 26 58C37.1 58 46 46.7 46 34C46 18 26 2 26 2Z"
          fill={guadagnata ? `url(#${uid})` : "#E5E7EB"} />
        {guadagnata && (
          <path d="M26 18C22 24 16 30 16 38C16 44 20.5 50 26 50C31.5 50 36 44 36 38C36 30 30 24 26 18Z"
            fill="#FEF3C7" opacity="0.4" />
        )}
      </svg>
      <span style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: Math.round(size * 0.08), fontSize, fontWeight: 900,
        color: guadagnata ? "#7C2D12" : "#9CA3AF", lineHeight: 1,
      }}>{numero}</span>
    </div>
  );
}

const GIORNO_INDEX: Record<string, number> = { Lun: 1, Mar: 2, Mer: 3, Gio: 4, Ven: 5, Sab: 6, Dom: 7 };
const OFFSET_DA_LUNEDI: Record<string, number> = { Lun: 0, Mar: 1, Mer: 2, Gio: 3, Ven: 4, Sab: 5, Dom: 6 };
const PAUSA_DURATA_S = 24 * 60 * 60; // 24h in secondi


const ATTIVITA_PAUSA = [
  { label: "Socialità",  desc: "Chiama un amico o scrivi un messaggio", icon: <Phone width={28} height={28} strokeWidth={1.5} color="#FFFFFF" /> },
  { label: "Movimento",  desc: "Fai una passeggiata di 10 minuti",       icon: <Running width={28} height={28} strokeWidth={1.5} color="#FFFFFF" /> },
  { label: "Creatività", desc: "Ascolta musica o disegna qualcosa",       icon: <Palette width={28} height={28} strokeWidth={1.5} color="#FFFFFF" /> },
  { label: "Riposo",     desc: "Respira profondamente e rilassati",       icon: <Leaf width={28} height={28} strokeWidth={1.5} color="#FFFFFF" /> },
];

const GIORNI_SETTIMANA = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const GIORNI_ORDINATI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function buildGuestProgressiSettimana(): import("@/lib/sync").ProgressoGiorno[] {
  return GIORNI_ORDINATI.map((g) => ({ giorno: g, esercizi: 0, memoria: 0, attenzione: 0, linguaggio: 0, esecutive: 0, visuospaziali: 0 }));
}

function StreakCircles({ isGuest }: { isGuest?: boolean }) {
  const { progressiSettimanali: rawProgressi } = useUserStore();
  const now = new Date();
  const jsDay = now.getDay();
  const oggi = GIORNI_SETTIMANA[jsDay];
  const oggiIndex = jsDay === 0 ? 7 : jsDay;
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);

  const progressiSettimanali = rawProgressi.length > 0 ? rawProgressi : buildGuestProgressiSettimana();

  return (
    <div className="flex justify-between mt-4">
      {progressiSettimanali.map((g) => {
        const isOggi = g.giorno === oggi;
        const isFuturo = GIORNO_INDEX[g.giorno] > oggiIndex;
        const completato = !isFuturo && g.memoria > 0 && g.attenzione > 0 && g.linguaggio > 0 && g.esecutive > 0 && g.visuospaziali > 0;
        const d = new Date(monday);
        d.setDate(monday.getDate() + OFFSET_DA_LUNEDI[g.giorno]);
        const dayNumber = d.getDate();

        const locked = isGuest && !completato;

        let circleBg = "transparent";
        let circleBorder = "2px solid #D1D5DB";
        let letterColor = "#9CA3AF";
        let labelColor = "#9CA3AF";

        if (completato) {
          circleBg = COLORS.primary;
          circleBorder = "none";
          labelColor = isOggi ? COLORS.primary : "#6B7280";
        } else if (isFuturo && !locked) {
          circleBorder = "2px solid #E5E7EB";
          letterColor = "#D1D5DB";
          labelColor = "#D1D5DB";
        } else if (!locked) {
          // oggi e giorni passati non completati → stile "giorno corrente"
          circleBorder = `2px solid ${COLORS.primary}`;
          letterColor = COLORS.primary;
          labelColor = COLORS.primary;
        }

        return (
          <div key={g.giorno} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: circleBg, border: circleBorder }}>
              {completato ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              ) : locked ? (
                <Lock width={20} height={20} strokeWidth={1.5} color="#9CA3AF" />
              ) : (
                <span style={{ color: letterColor, fontSize: 14, fontWeight: 700 }}>{g.giorno[0]}</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: labelColor, fontWeight: isOggi ? 700 : 500 }}>{g.giorno}</span>
            <span style={{ fontSize: 11, color: labelColor, fontWeight: 400 }}>{dayNumber}</span>
          </div>
        );
      })}
    </div>
  );
}


function PausaAttivaView({ secondiRimasti }: { secondiRimasti: number }) {
  const hh = String(Math.floor(secondiRimasti / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secondiRimasti % 3600) / 60)).padStart(2, "0");
  const ss = String(secondiRimasti % 60).padStart(2, "0");
  const timerLabel = secondiRimasti > 0 ? `Riprendi tra ${hh}:${mm}:${ss}` : "Pronto a riprendere!";

  return (
    <>
      {/* Pausa attiva card */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: COLORS.primary }}>
        <span
          className="self-start text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#FFFFFF" }}
        >
          Pausa attiva
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-white">Ottimo allenamento</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
            Hai completato 5 esercizi.<br />
            La mente ha bisogno di una pausa<br />
            per consolidare ciò che ha imparato.
          </p>
        </div>
        <div className="rounded-xl py-3 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          <span className="text-base font-bold text-white">{timerLabel}</span>
        </div>
      </div>

      {/* Cosa fare adesso */}
      <div>
        <h2 className="text-lg font-bold text-ink mb-3">Cosa fare adesso?</h2>
        <div className="grid grid-cols-2 gap-3">
          {ATTIVITA_PAUSA.map(({ label, desc, icon }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex flex-col items-center text-center gap-3"
              style={{ backgroundColor: "#FFFFFF", border: `1px solid ${COLORS.primary}18` }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkSecondary }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}


export default function HomePage() {
  const router = useRouter();
  const { nome, isGuest, streak, messaggi, eserciziDelGiorno, trendCategorie, medaglieDefinizioni, pausaAttivaRichiesta, setPausaAttivaRichiesta, pausaAttivaInizio, setPausaAttivaInizio } = useUserStore();
  const [mostraPausa, setMostraPausa] = useState(false);
  const [secondiRimasti, setSecondiRimasti] = useState(0);

  const pausaAttiva = pausaAttivaInizio !== null && secondiRimasti > 0;

  // Attiva la pausa impostando il timestamp nello store
  useEffect(() => {
    if (pausaAttivaRichiesta) {
      setPausaAttivaInizio(Date.now());
      setPausaAttivaRichiesta(false);
    }
  }, [pausaAttivaRichiesta, setPausaAttivaRichiesta, setPausaAttivaInizio]);

  // Countdown calcolato dal timestamp persistente
  useEffect(() => {
    if (pausaAttivaInizio === null) { setSecondiRimasti(0); return; }
    const calcola = () => {
      const rimasti = PAUSA_DURATA_S - Math.floor((Date.now() - pausaAttivaInizio) / 1000);
      if (rimasti <= 0) { setPausaAttivaInizio(null); setSecondiRimasti(0); } else { setSecondiRimasti(rimasti); }
    };
    calcola();
    const t = setInterval(calcola, 1000);
    return () => clearInterval(t);
  }, [pausaAttivaInizio, setPausaAttivaInizio]);

  const eserciziDelGiornoEffettivi = eserciziDelGiorno.length > 0
    ? eserciziDelGiorno
    : mockCategorie.map((cat) => ({
        id: cat.id,
        nome: cat.nome,
        categoria_id: cat.id,
        completato: false,
        risultato: null,
      }));

  const completatiOggi = eserciziDelGiornoEffettivi.filter((e) => e.completato).length;
  const totaleEsercizi = eserciziDelGiornoEffettivi.length || 5;

  // Logica medaglie streak
  const medagliaAppenaGuadagnata = medaglieDefinizioni.find((m) => m.giorni === streak);
  const prossimaMedaglia = medaglieDefinizioni.find((m) => m.giorni > streak);
  const giorniMancantiProssima = prossimaMedaglia ? prossimaMedaglia.giorni - streak : null;
  const eserciziNonCompletati = eserciziDelGiornoEffettivi.filter((e) => !e.completato);
  const tuttiCompletati = eserciziDelGiornoEffettivi.length > 0 && completatiOggi === totaleEsercizi;

  function iniziaEsercizioRandom() {
    // Ospite e utente registrato giocano allo stesso modo i 5 del giorno:
    // l'ospite li prova senza salvare (gestito nel player).
    if (eserciziNonCompletati.length === 0) return;
    const random = eserciziNonCompletati[Math.floor(Math.random() * eserciziNonCompletati.length)];
    router.push(`/esercizi/${random.id}`);
  }

  return (
    <>
      <div className="flex flex-col gap-8 px-4 pt-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{isGuest ? "Ciao Ospite," : `Ciao${nome ? ` ${nome}` : ""},`}</h1>
          </div>
          {/* Campanella notifiche */}
          <div className="relative mt-1">
            <Link href="/messaggi">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
                <ChatLines width={22} height={22} strokeWidth={1.5} color={COLORS.primary} />
              </div>
            </Link>
            {!isGuest && messaggi.some((m) => !m.letto) && (
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white pointer-events-none" style={{ backgroundColor: "#DC2626" }} />
            )}
          </div>
        </div>

        {/* Streak */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold" style={{ color: COLORS.primary }}>Attività</span>
            {isGuest ? (
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#9CA3AF" }}>
                <Lock width={15} height={15} strokeWidth={1.5} color="#9CA3AF" />
                Vedi storico
              </span>
            ) : (
              <Link href="/progressi?tab=storico" className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                Vedi storico
              </Link>
            )}
          </div>
          {!isGuest && (
            <p className="text-xs font-bold mb-2" style={{ color: COLORS.primary }}>
              {streak > 0 ? `Continua così - ${streak} giorni consecutivi` : "0 giorni consecutivi"}
            </p>
          )}
          <StreakCircles isGuest={isGuest} />
        </div>

        {/* ── Vista condizionale ─────────────────────────────────────── */}
        {pausaAttiva ? (
          <PausaAttivaView secondiRimasti={secondiRimasti} />
        ) : (
          <>
            {/* Esercizi del Giorno */}
            <div>
              <h2 className="text-lg font-bold text-ink mb-3">Esercizi del giorno</h2>

              {/* Counter + progress bar */}
              <div className="rounded-2xl mb-2 overflow-hidden flex flex-col" style={{ backgroundColor: "#FFFFFF", boxShadow: "0px 0px 2px rgba(0,0,0,0.12)" }}>
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">Completati oggi</span>
                    <span className="text-sm font-bold" style={{ color: COLORS.primary }}>{completatiOggi}/{totaleEsercizi}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${COLORS.primary}33` }}>
                    <div className="h-full rounded-full transition-all" style={{ backgroundColor: COLORS.primary, width: `${(completatiOggi / totaleEsercizi) * 100}%` }} />
                  </div>
                  {!tuttiCompletati && eserciziNonCompletati.length > 0 && (
                    <Btn variant="primary" className="w-full mt-1" onClick={iniziaEsercizioRandom}>
                      Inizia ora
                    </Btn>
                  )}
                </div>
                {tuttiCompletati && !isGuest && (
                  <>
                    <div style={{ height: 1, backgroundColor: COLORS.border }} />
                    <div className="px-4 py-3 flex items-center gap-3">
                      {medagliaAppenaGuadagnata ? (
                        <FlameNumerata numero={medagliaAppenaGuadagnata.giorni} guadagnata={true} size={48} />
                      ) : prossimaMedaglia ? (
                        <FlameNumerata numero={prossimaMedaglia.giorni} guadagnata={false} size={48} />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.streakLight }}>
                          <AppIcon name="flame" size={28} color={COLORS.streak} />
                        </div>
                      )}
                      {medagliaAppenaGuadagnata ? (
                        <div>
                          <p className="text-xs font-semibold" style={{ color: COLORS.streak }}>Medaglia sbloccata!</p>
                          <p className="text-base font-bold text-ink">{medagliaAppenaGuadagnata.nome}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-bold text-ink">{streak} giorni consecutivi!</p>
                          {prossimaMedaglia && giorniMancantiProssima !== null && (
                            <p className="text-xs" style={{ color: COLORS.inkMuted }}>
                              Ancora {giorniMancantiProssima} {giorniMancantiProssima === 1 ? "giorno" : "giorni"} per guadagnare la medaglia &ldquo;{prossimaMedaglia.nome}&rdquo;!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Pausa attiva card (5/5) o lista esercizi */}
              {tuttiCompletati ? (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0px 0px 2px rgba(0,0,0,0.12)" }}>
                  <div className="p-4 flex flex-col gap-6">
                    <p className="text-base font-bold text-ink">Hai completato i 5 esercizi giornalieri. Ora è arrivato il momento di una pausa attiva</p>
                    <div className="grid grid-cols-2 gap-3">
                      {ATTIVITA_PAUSA.map(({ label, desc, icon }) => (
                        <div key={label} className="rounded-xl p-4 flex flex-col items-center text-center gap-3" style={{ backgroundColor: `${COLORS.primary}1A` }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                            {icon}
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-ink">{label}</p>
                            <p className="text-xs" style={{ color: COLORS.inkMuted }}>{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0px 0px 2px rgba(0,0,0,0.12)" }}>
                {eserciziDelGiornoEffettivi.map((esercizio, i) => {
                  const cat = mockCategorie.find((c) => c.id === esercizio.categoria_id);
                  const cc = cat ? CATEGORIA_COLORS[cat.id] : null;
                  const isFirstNonCompleted = !esercizio.completato && eserciziDelGiornoEffettivi.slice(0, i).every((e) => e.completato);
                  const isLast = i === eserciziDelGiorno.length - 1;

                  const row = (
                    <div
                      className="flex items-center justify-between px-3 py-3"
                      style={{ backgroundColor: isFirstNonCompleted ? `${COLORS.primary}08` : "transparent" }}
                    >
                      <div className="flex flex-col gap-2.5 flex-1 min-w-0 mr-3">
                        {/* Category pill */}
                        {cc && cat && (
                          <span className="self-start inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cc.bg, color: cc.text }}>
                            <AppIcon name={cat.icona} size={11} color={cc.text} />
                            {cat.nome}
                          </span>
                        )}
                        {/* Name */}
                        <span
                          className="text-sm font-semibold leading-snug"
                          style={{ color: esercizio.completato ? "#B0B0C4" : COLORS.inkPrimary }}
                        >
                          {esercizio.nome}
                        </span>
                        {esercizio.completato && isGuest && (
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <button
                              className="inline-flex items-center gap-1 text-xs font-semibold underline whitespace-nowrap"
                              style={{ color: COLORS.primary, textDecorationColor: COLORS.primary }}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/onboarding/registrati"); }}
                            >
                              <Lock width={16} height={16} strokeWidth={1.5} color={COLORS.primary} className="flex-shrink-0" />
                              Registrati per sbloccare i risultati
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Right icon */}
                      {esercizio.completato && !isGuest ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.successLight }}>
                          <Check width={14} height={14} strokeWidth={2} color={COLORS.success} />
                        </div>
                      ) : !esercizio.completato ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.primaryLight }}>
                          <span className="text-base font-bold leading-none" style={{ color: COLORS.primary }}>›</span>
                        </div>
                      ) : null}
                    </div>
                  );

                  return (
                    <div key={esercizio.id}>
                      <Link href={esercizio.completato ? "#" : `/esercizi/${esercizio.id}`}>{row}</Link>
                      {!isLast && <div style={{ height: 1, backgroundColor: COLORS.border }} />}
                    </div>
                  );
                })}
              </div>
              )}
            </div>


            {/* Categorie */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-ink">Allena la mente</h2>
                <Link href="/esercizi" className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                  Vedi tutti
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {[...mockCategorie].sort((a, b) => {
                  const TREND_ORDER: Record<string, number> = { calo: 0, stabile: 1, crescita: 2 };
                  const trendA = trendCategorie[a.id] ?? "stabile";
                  const trendB = trendCategorie[b.id] ?? "stabile";
                  return (TREND_ORDER[trendA] ?? 1) - (TREND_ORDER[trendB] ?? 1);
                }).map((cat) => {
                  const cc = CATEGORIA_COLORS[cat.id];
                  const trendKey = trendCategorie[cat.id];
                  const trendConfig = {
                    crescita: { icon: "↑",  label: "In crescita", color: "#16A34A" },
                    stabile:  { icon: "→",  label: "Stabile",     color: COLORS.primary },
                    calo:     { icon: "↓",  label: "In calo",     color: "#DC2626" },
                  };
                  const trend = trendKey ? trendConfig[trendKey] : null;
                  const row = (
                    <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ backgroundColor: cc.bg }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cc.text + "22" }}>
                        <AppIcon name={cat.icona} size={22} color={cc.text} />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold" style={{ color: cc.text }}>{cat.nome}</p>
                        {isGuest ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: "#9CA3AF" }}>
                            <Lock width={14} height={14} strokeWidth={1.5} color="#9CA3AF" />
                            Registrati
                          </span>
                        ) : trend && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: "#FFFFFF", color: trend.color }}>
                            {trend.icon}{" "}{trend.label}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold" style={{ color: cc.text }}>›</span>
                    </div>
                  );
                  return isGuest ? (
                    <Link key={cat.id} href="/onboarding/registrati">{row}</Link>
                  ) : (
                    <Link key={cat.id} href={`/esercizi?categoria=${cat.id}`}>{row}</Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal pausa */}
      {mostraPausa && (
        <PausaAttivaModal
          nome={nome ?? ""}
          isGuest={isGuest}
          onVaiPausa={() => { setMostraPausa(false); setPausaAttivaInizio(Date.now()); }}
          onContinua={() => { setMostraPausa(false); const primo = eserciziNonCompletati[0]; if (primo) window.location.href = `/esercizi/${primo.id}`; }}
          onClose={() => setMostraPausa(false)}
        />
      )}
    </>
  );
}
