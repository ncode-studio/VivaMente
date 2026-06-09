"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS } from "@/lib/design-tokens";
import { useUserStore } from "@/lib/store";
import { segnaMessaggioLetto, fetchMessaggi } from "@/lib/sync";
import { ArrowLeft, Check } from "iconoir-react";

const RELAZIONE_STYLE: Record<string, { bg: string; text: string }> = {
  "Figlio":            { bg: "#E8F0FE", text: "#3B5998" },
  "Figlia":            { bg: "#FCE4EC", text: "#C2185B" },
  "Nipote":            { bg: "#E0F7FA", text: "#00838F" },
  "Pronipote":         { bg: "#E8F5E9", text: "#2E7D32" },
  "Fratello":          { bg: "#FFF3E0", text: "#E65100" },
  "Sorella":           { bg: "#F3E5F5", text: "#6A1B9A" },
  "Genero":            { bg: "#E3F2FD", text: "#1565C0" },
  "Nuora":             { bg: "#FBE9E7", text: "#BF360C" },
  "Cognato":           { bg: "#F1F8E9", text: "#558B2F" },
  "Cognata":           { bg: "#FCE4EC", text: "#AD1457" },
  "Cugino":            { bg: "#E8EAF6", text: "#283593" },
  "Cugina":            { bg: "#FFF8E1", text: "#F57F17" },
  "Badante":           { bg: "#E0F2F1", text: "#00695C" },
  "Amico di famiglia": { bg: "#F5F5F5", text: "#424242" },
};

type Filtro = "tutti" | "da_leggere" | "letti";
const FILTRO_LABEL: Record<Filtro, string> = {
  tutti: "Tutti",
  da_leggere: "Da leggere",
  letti: "Letti",
};

export default function MessaggiPage() {
  const router = useRouter();
  const { isGuest, messaggi, userId, setUser, segnaMessaggioLettoLocale } = useUserStore();
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const [lettiLocali, setLettiLocali] = useState<Set<string>>(
    () => new Set(messaggi.filter((m) => m.letto).map((m) => m.id))
  );

  // Ricarica i messaggi all'apertura: lo store è popolato solo al login, quindi
  // i messaggi inviati dai familiari dopo l'accesso non comparirebbero senza
  // un nuovo login. Qui aggiorniamo allo stato corrente del DB.
  useEffect(() => {
    if (isGuest || !userId) return;
    let annullato = false;
    fetchMessaggi(userId).then((m) => { if (!annullato) setUser({ messaggi: m }); });
    return () => { annullato = true; };
  }, [isGuest, userId, setUser]);

  function segnaLetto(id: string) {
    setLettiLocali((prev) => new Set(prev).add(id));
    segnaMessaggioLettoLocale(id);
    segnaMessaggioLetto(id);
  }

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

  const messaggiFiltrati = messaggi.filter((msg) => {
    const letto = msg.letto || lettiLocali.has(msg.id);
    if (filtro === "da_leggere") return !letto;
    if (filtro === "letti") return letto;
    return true;
  });

  return (
    <div
      className="flex flex-col px-4 pt-6 gap-5"
      style={isGuest ? { height: "100dvh", overflow: "hidden" } : undefined}
    >
      {/* Header — non blurrato */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: COLORS.primary }}
        >
          <ArrowLeft width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />
          Torna alla home
        </button>
      </div>

      <h1 className="text-2xl font-extrabold text-ink -mt-2 flex-shrink-0">I tuoi messaggi</h1>

      {/* Contenuto blurrabile — pills + lista, esteso a piena larghezza */}
      <div className="relative flex-1 flex flex-col gap-3 -mx-4" style={isGuest ? { overflow: "hidden" } : undefined}>
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto flex-shrink-0 px-4" style={{ scrollbarWidth: "none" }}>
          {(["tutti", "da_leggere", "letti"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all"
              style={{
                backgroundColor: filtro === f ? COLORS.primary : "#E6E7EB",
                color: filtro === f ? "#FFFFFF" : COLORS.inkMuted,
              }}
            >
              {FILTRO_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Lista messaggi — card separate */}
        <div className="flex-1 flex flex-col gap-3 px-4">
          {messaggiFiltrati.map((msg) => {
            const letto = msg.letto || lettiLocali.has(msg.id);
            const relStyle = RELAZIONE_STYLE[msg.relazione] ?? { bg: COLORS.primaryLight, text: COLORS.primary };
            return (
              <div
                key={msg.id}
                className="rounded-2xl px-4 py-4 flex flex-col gap-1.5"
                style={{
                  backgroundColor: !letto ? "#EAF4F8" : COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-sm">{msg.mittente}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: relStyle.bg, color: relStyle.text }}
                  >
                    {msg.relazione}
                  </span>
                  <span className="ml-auto text-xs" style={{ color: COLORS.inkMuted }}>{msg.data}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-sm flex-1" style={{ color: COLORS.inkSecondary }}>
                    {msg.testo}
                  </p>
                  {!letto && (
                    <button
                      onClick={() => segnaLetto(msg.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${COLORS.primary}33` }}
                    >
                      <Check width={14} height={14} strokeWidth={2} color={COLORS.primary} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {messaggiFiltrati.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: COLORS.inkMuted }}>
              Nessun messaggio
            </p>
          )}
        </div>

        {/* Overlay upsell — solo ospite, copre pills + lista */}
        {isGuest && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
            style={{
              backdropFilter: "blur(10px)",
              background: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))",
              zIndex: 20,
            }}
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
            <Link href="/onboarding/registrati" className="w-full">
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
