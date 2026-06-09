"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/card";
import { mockCategorie } from "@/lib/mock-data";
import { CATEGORIA_COLORS, COLORS } from "@/lib/design-tokens";
import { AppIcon } from "@/lib/icons";
import { Timer, Lock, Check } from "iconoir-react";
import { useUserStore } from "@/lib/store";
import { PausaAttivaModal } from "@/components/ui/pausa-attiva-modal";
import { fetchEserciziAttiviPerCategoria } from "@/lib/sync";

type EsercizioLibreria = {
  id: string;
  nome: string;
  categoria_id: string;
  session_timer_sec: number | null;
};

const LIMITE_ESERCIZI_GIORNO = 5;

const TABS = [
  { id: "memoria",        label: "Memoria" },
  { id: "attenzione",     label: "Attenzione" },
  { id: "linguaggio",     label: "Linguaggio" },
  { id: "esecutive",      label: "Esecutive" },
  { id: "visuospaziali",  label: "Visuospaziali" },
];

function EserciziPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { nome, isGuest, eserciziFattiOggi, eserciziDelGiorno, userLevels, setPausaAttivaRichiesta, pausaAttivaInizio, setPausaAttivaInizio, setNavNascosta } = useUserStore();
  const categoriaIniziale = TABS.find((t) => t.id === searchParams.get("categoria"))?.id ?? "memoria";
  const [tab, setTab] = useState(categoriaIniziale);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tab]);
  const [mostraPausa, setMostraPausa] = useState(false);
  const [mostraConfermaInterruzione, setMostraConfermaInterruzione] = useState(false);
  const [esercizioTarget, setEsercizioTarget] = useState<string | null>(null);

  const livelloUtente = userLevels[tab] ?? 1;

  const esercizioDelGiorno = eserciziDelGiorno.find((e) => e.categoria_id === tab) ?? null;
  const giornalieriIds = new Set(eserciziDelGiorno.map((e) => e.id));
  const tuttiGiornalieriCompletati = eserciziDelGiorno.length > 0 && eserciziDelGiorno.every((e) => e.completato);

  const [eserciziLibreria, setEserciziLibreria] = useState<Record<string, EsercizioLibreria[]>>({});
  const [caricamentoLibreria, setCaricamentoLibreria] = useState(false);

  useEffect(() => {
    if (eserciziLibreria[tab]) return;
    let annullato = false;
    setCaricamentoLibreria(true);
    fetchEserciziAttiviPerCategoria(tab).then((data) => {
      if (annullato) return;
      setEserciziLibreria((prev) => ({ ...prev, [tab]: data }));
      setCaricamentoLibreria(false);
    });
    return () => { annullato = true; };
  }, [tab, eserciziLibreria]);

  const eserciziFiltrati = (eserciziLibreria[tab] ?? [])
    .filter((e) => e.id !== esercizioDelGiorno?.id);

  function formatTempo(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function isLockedGuest(): boolean {
    // Guest: tutti gli esercizi extra sono bloccati (richiede registrazione).
    return isGuest;
  }

  function handleClickEsercizio(id: string, locked: boolean) {
    if (locked) { router.push("/onboarding/registrati"); return; }
    if (pausaAttivaInizio !== null) {
      // Pausa attiva → chiedi se interrompere
      setEsercizioTarget(id);
      setMostraConfermaInterruzione(true);
      setNavNascosta(true);
    } else if (eserciziFattiOggi >= LIMITE_ESERCIZI_GIORNO) {
      setEsercizioTarget(id);
      setMostraPausa(true); setNavNascosta(true);
    } else {
      router.push(`/esercizi/${id}`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header + Tabs ────────────────────────────────────────────── */}
      <div className="bg-surface px-4 pt-6 pb-0 sticky top-0 z-10 shadow-card">
        <h1 className="text-2xl font-extrabold text-ink">Libreria esercizi</h1>

        {/* Tab bar */}
        <div ref={tabBarRef} className="flex mt-4 overflow-x-auto scrollbar-none -mx-4 px-4">
          {TABS.map((t) => {
            const active = tab === t.id;
            const cat = mockCategorie.find((c) => c.id === t.id);
            return (
              <button
                key={t.id}
                ref={active ? activeTabRef : null}
                onClick={() => setTab(t.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-base font-semibold border-b-2 transition-all mr-1"
                style={{
                  borderColor: active ? COLORS.primary : "transparent",
                  color: active ? COLORS.primary : COLORS.inkMuted,
                }}
              >
                {cat && (
                  <AppIcon
                    name={cat.icona}
                    size={18}
                    color={active ? COLORS.primary : COLORS.inkMuted}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Esercizio del giorno ─────────────────────────────────────── */}
      {esercizioDelGiorno && (() => {
        const edgCat = mockCategorie.find((c) => c.id === esercizioDelGiorno.categoria_id);
        const edgCc = edgCat ? CATEGORIA_COLORS[edgCat.id] : null;
        return (
          <div className="px-4 pt-4 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>
              Esercizio del giorno
            </p>
            <button
              className="text-left w-full"
              onClick={() => handleClickEsercizio(esercizioDelGiorno.id, false)}
            >
              <div
                className="rounded-2xl px-4 py-4 flex items-center gap-4"
                style={{
                  backgroundColor: esercizioDelGiorno.completato ? `${COLORS.primary}08` : "rgba(24,145,177,0.05)",
                  border: `0.5px solid ${COLORS.primary}`,
                  boxShadow: "0 2px 8px rgba(24,145,177,0.10)",
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: edgCc?.bg ?? COLORS.surfaceAlt }}
                >
                  {esercizioDelGiorno.completato ? (
                    <Check width={28} height={28} strokeWidth={1.5} color={edgCc?.text ?? COLORS.primary} />
                  ) : (
                    <AppIcon name={edgCat?.icona ?? "brain"} size={32} color={edgCc?.text ?? COLORS.primary} />
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base font-bold leading-snug"
                    style={{ color: esercizioDelGiorno.completato ? "#B0B0C4" : COLORS.inkPrimary }}
                  >
                    {esercizioDelGiorno.nome}
                  </h3>
                  {esercizioDelGiorno.completato && isGuest ? (
                    <Link href="/onboarding/registrati" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-semibold underline whitespace-nowrap" style={{ color: COLORS.primary, textDecorationColor: COLORS.primary }}>
                        Registrati per sbloccare i risultati
                      </span>
                    </Link>
                  ) : esercizioDelGiorno.completato && esercizioDelGiorno.risultato ? (
                    <div className="flex items-center gap-1 text-xs" style={{ color: COLORS.inkMuted }}>
                      <span>{formatTempo(esercizioDelGiorno.risultato.tempo_secondi)}</span>
                      <span>·</span>
                      <span>{esercizioDelGiorno.risultato.accuratezza}% accuratezza</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs" style={{ color: COLORS.inkMuted }}>
                      <Timer width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} />
                      <span>~2 minuti</span>
                      <span>·</span>
                      <span>Livello {livelloUtente}/10</span>
                    </div>
                  )}
                </div>
                {/* Trailing */}
                {esercizioDelGiorno.completato && !isGuest ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.successLight }}
                  >
                    <Check width={16} height={16} strokeWidth={2} color={COLORS.success} />
                  </div>
                ) : !esercizioDelGiorno.completato ? (
                  <span className="text-xl flex-shrink-0" style={{ color: COLORS.inkMuted }}>›</span>
                ) : null}
              </div>
            </button>
          </div>
        );
      })()}

      {/* ── Lista esercizi ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 pt-4">
        {esercizioDelGiorno && (
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.inkMuted }}>
            Altri esercizi
          </p>
        )}
        {caricamentoLibreria && (eserciziLibreria[tab] ?? []).length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 animate-spin"
              style={{ borderColor: `${COLORS.primary}40`, borderTopColor: COLORS.primary }} />
          </div>
        )}
        {eserciziFiltrati.map((esercizio) => {
          const cat = mockCategorie.find((c) => c.id === esercizio.categoria_id);
          const cc = cat ? CATEGORIA_COLORS[cat.id] : null;
          const lockedGuest = isLockedGuest();
          const lockedGiornaliero = !isGuest && !giornalieriIds.has(esercizio.id as never) && !tuttiGiornalieriCompletati;
          const locked = lockedGuest || lockedGiornaliero;
          const durataMin = esercizio.session_timer_sec
            ? Math.max(1, Math.round(esercizio.session_timer_sec / 60))
            : 2;

          return (
            <button
              key={esercizio.id}
              className="text-left w-full"
              onClick={() => {
                // Lock "giornaliero" (utente registrato): resta inerte.
                // Lock ospite: cliccabile → handleClickEsercizio porta alla registrazione.
                if (lockedGiornaliero) return;
                handleClickEsercizio(esercizio.id, lockedGuest);
              }}
            >
              <Card padding="md" className={lockedGiornaliero ? "" : "active:scale-[0.98] transition-transform"}>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0 ${locked ? "opacity-40" : ""}`}
                    style={{ backgroundColor: locked ? COLORS.background : (cc?.bg ?? COLORS.surfaceAlt) }}
                  >
                    {locked ? (
                      <Lock width={28} height={28} strokeWidth={1.5} color={COLORS.inkMuted} />
                    ) : (
                      <AppIcon name={cat?.icona ?? "brain"} size={32} color={cc?.text ?? COLORS.primary} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold leading-snug ${locked ? "opacity-40" : ""}`} style={{ color: locked ? COLORS.inkMuted : COLORS.inkPrimary }}>{esercizio.nome}</h3>
                    <div className={`flex items-center gap-1 text-xs ${locked ? "opacity-40" : ""}`} style={{ color: COLORS.inkMuted }}>
                      <Timer width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} />
                      <span>~{durataMin} {durataMin === 1 ? "minuto" : "minuti"}</span>
                      <span>·</span>
                      <span>Livello {livelloUtente}/10</span>
                    </div>
                    {lockedGuest && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold mt-1 underline" style={{ color: COLORS.primary, textDecorationColor: COLORS.primary }}>
                        <Lock width={16} height={16} strokeWidth={1.5} color={COLORS.primary} className="flex-shrink-0" />
                        Registrati per sbloccare
                      </span>
                    )}
                    {lockedGiornaliero && (
                      <span className="inline-flex items-center gap-1 font-semibold mt-1 whitespace-nowrap" style={{ color: COLORS.inkMuted, fontSize: 13 }}>
                        Completa gli esercizi del giorno
                      </span>
                    )}
                  </div>
                  {!locked && <span className="text-ink-muted text-xl flex-shrink-0">›</span>}
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Modal pausa attiva */}
      {mostraPausa && (
        <PausaAttivaModal
          nome={nome ?? ""}
          isGuest={isGuest}
          onVaiPausa={() => {
            setMostraPausa(false); setNavNascosta(false);
            setPausaAttivaRichiesta(true);
            router.push("/home");
          }}
          onContinua={() => {
            setMostraPausa(false); setNavNascosta(false);
            if (esercizioTarget) router.push(`/esercizi/${esercizioTarget}`);
          }}
          onClose={() => { setMostraPausa(false); setNavNascosta(false); }}
        />
      )}

      {/* Modal conferma interruzione pausa attiva */}
      {mostraConfermaInterruzione && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-6"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => { setMostraConfermaInterruzione(false); setNavNascosta(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl px-6 pt-4 pb-6 flex flex-col items-center gap-4"
            style={{ backgroundColor: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#D1D5DB" }} />
            <h2 className="text-lg font-extrabold text-ink text-center">Sei sicuro di procedere?</h2>
            <p className="text-sm text-center" style={{ color: "#5A5A72" }}>
              Hai attivato la pausa attiva che dura 24h.<br />
              Vuoi interromperla?
            </p>
            <button
              className="w-full py-3 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: COLORS.primary }}
              onClick={() => {
                setMostraConfermaInterruzione(false);
                setNavNascosta(false);
                router.push("/home");
              }}
            >
              Torna alla home
            </button>
            <button
              className="text-xs font-semibold"
              style={{ color: "#DC2626" }}
              onClick={() => {
                setPausaAttivaInizio(null);
                setMostraConfermaInterruzione(false);
                setNavNascosta(false);
                if (esercizioTarget) router.push(`/esercizi/${esercizioTarget}`);
              }}
            >
              Interrompi la pausa<br />e prosegui all'esercizio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EserciziPage() {
  return <Suspense fallback={null}><EserciziPageContent /></Suspense>;
}
