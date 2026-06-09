"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Btn from "@/components/ui/btn";
import { useUserStore } from "@/lib/store";
import { COLORS } from "@/lib/design-tokens";
import { Mail, ArrowLeft } from "iconoir-react";
import StepLines from "@/components/ui/step-lines";
import { createClient } from "@/lib/supabase/client";
import { createUserProfile, initUserData } from "@/lib/sync";

const ORE = ["07:00","08:00","09:00","10:00","11:00","12:00","14:00","16:00","18:00","20:00","21:00"];

const inputCls = `w-full min-h-[56px] rounded-md px-4 text-base bg-white text-ink border-2 border-[#E2E8F0]
  focus:outline-none focus:border-[#1891B1] transition-colors placeholder-[#5A5A72]`;

function ToggleGroup({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button key={o.id} type="button" onClick={() => onChange(o.id)}
            className="flex-1 min-h-[48px] rounded-full text-sm font-semibold border-2 transition-all"
            style={{ backgroundColor: active ? COLORS.primary : "transparent", borderColor: active ? COLORS.primary : "#D1D5DB", color: active ? "#FFFFFF" : COLORS.inkMuted }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function OrarioSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [aperto, setAperto] = useState(false);
  useEffect(() => {
    document.body.style.overflow = aperto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [aperto]);
  return (
    <div style={{ position: "relative" }}>
      {aperto && <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onPointerDown={() => setAperto(false)} />}
      <button type="button" onPointerDown={() => setAperto((v) => !v)}
        className="w-full min-h-[56px] rounded-md px-4 text-base bg-white text-ink border-2 transition-colors text-left flex items-center justify-between"
        style={{ borderColor: aperto ? "#1891B1" : "#E2E8F0", color: value ? "#1A1A2E" : "#5A5A72", position: "relative", zIndex: 41 }}>
        <span>{value || "Seleziona un orario"}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: "transform 0.2s", transform: aperto ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d="M4 6l4 4 4-4" stroke="#5A5A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {aperto && (
        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#fff", border: "2px solid #1891B1", borderRadius: 10, boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 240, overflowY: "auto" }}>
          {ORE.map((o) => (
            <button key={o} type="button" onPointerDown={() => { onChange(o); setAperto(false); }}
              className="w-full px-4 text-left text-base"
              style={{ minHeight: 48, backgroundColor: value === o ? `${COLORS.primary}12` : "transparent", color: value === o ? COLORS.primary : "#1A1A2E", fontWeight: value === o ? 600 : 400, borderBottom: "1px solid #F1F5F9" }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Step = "form" | "verifica";

function OnboardingRegistratiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLogin = searchParams.get("from") === "login";
  const { setUser, setGuest, isGuest } = useUserStore();

  const [nome, setNome]         = useState("");
  const [telefono] = useState("");
  const [email, setEmail]       = useState("");
  const [emailToccata, setEmailToccata] = useState(false);
  const [promemoria, setPromemoria] = useState<"si" | "no" | null>(null);
  const [orario, setOrario]     = useState("");
  const [step, setStep]         = useState<Step>("form");
  const [codice, setCodice]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [errore, setErrore]     = useState<string | null>(null);

  const vuolePromemoria = promemoria === "si";
  const canaleScelto = "email";

  function isEmailValida(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  const formValido =
    !!nome &&
    !!email && isEmailValida(email) &&
    (!vuolePromemoria || !!orario);

  async function handleContinua() {
    if (!formValido || loading) return;
    setLoading(true);
    setErrore(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { data: { nome, telefono, canale_notifica: canaleScelto, orario_notifica: orario, consenso_notifiche: vuolePromemoria } },
      });
      if (error) throw error;
      setStep("verifica");
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifica() {
    if (codice.length < 8 || loading) return;
    setLoading(true);
    setErrore(null);
    const supabase = createClient();
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email,
        token: codice,
        type: "email",
      });
      if (error) throw error;
      if (!session) throw new Error("Sessione non valida");

      await createUserProfile({
        userId: session.user.id,
        nome,
        telefono,
        email,
        canale_notifica: canaleScelto,
        orario_notifica: orario || "09:00",
        consenso_notifiche: vuolePromemoria,
      });

      const userData = await initUserData(session.user.id);
      if (userData) setUser(userData);
      router.push("/home");
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : "Codice non valido. Controlla la tua email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReinvia() {
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email });
    setCodice("");
    setErrore(null);
  }

  function handleSenzaRegistrazione() {
    document.cookie = "vm_guest=1; path=/; max-age=31536000; SameSite=Lax";
    setGuest();
    router.push("/home");
  }

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto px-5 pt-6" style={{ backgroundColor: COLORS.background }}>
      {isGuest ? (
        <button onClick={() => router.push("/home")} className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: COLORS.primary }}>
          <ArrowLeft width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />
          Torna alla home
        </button>
      ) : (
        !fromLogin && <StepLines current={4} />
      )}

      {/* ── FORM ── */}
      {step === "form" && (
        <div className="flex flex-col gap-5 flex-1 overflow-y-auto min-h-0">
          <h1 className="text-2xl font-extrabold text-ink">Crea il tuo profilo per salvare i tuoi progressi</h1>

          <div>
            <label className="text-sm font-bold text-ink-secondary block mb-2">Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Il tuo nome" className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-bold text-ink-secondary block mb-2">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailToccata(true)}
              placeholder="tua@email.it" className={inputCls}
              style={emailToccata && email && !isEmailValida(email) ? { borderColor: "#C62828" } : undefined} />
            {emailToccata && email && !isEmailValida(email) && (
              <p style={{ fontSize: 12, color: "#C62828", marginTop: 4 }}>Inserisci un indirizzo email valido</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-ink-secondary block mb-2">Vuoi un promemoria giornaliero?</label>
            <ToggleGroup options={[{ id: "si", label: "Sì" }, { id: "no", label: "No" }]} value={promemoria} onChange={(v) => setPromemoria(v as "si" | "no")} />
          </div>

          {vuolePromemoria && (
            <>
              <div>
                <label className="text-sm font-bold text-ink-secondary block mb-2">A che ora? *</label>
                <OrarioSelect value={orario} onChange={setOrario} />
                <p className="text-xs mt-2" style={{ color: COLORS.inkMuted }}>
                  Riceverai il promemoria via email all&apos;indirizzo indicato sopra.
                </p>
              </div>
            </>
          )}

          {errore && <p className="text-sm text-center" style={{ color: "#C62828" }}>{errore}</p>}
        </div>
      )}

      {/* ── VERIFICA CODICE ── */}
      {step === "verifica" && (
        <div className="flex flex-col items-center gap-6 text-center flex-1 pt-4">
          <Mail width={56} height={56} strokeWidth={1.5} color={COLORS.primary} />
          <div className="flex flex-col items-center gap-3">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E" }}>Controlla la tua email</h1>
            <p style={{ fontSize: 17, color: "#5A5A72", lineHeight: 1.6 }}>
              Abbiamo inviato un codice a 6 cifre a<br />
              <strong style={{ color: "#1A1A2E" }}>{email}</strong>
            </p>
          </div>
          <input
            type="text" inputMode="numeric" maxLength={8}
            value={codice} onChange={(e) => setCodice(e.target.value.replace(/\D/g, ""))}
            placeholder="00000000" className={inputCls}
            style={{ textAlign: "center", fontSize: 32, letterSpacing: "0.3em", fontWeight: 700, maxWidth: 280 }}
          />
          {errore && <p className="text-sm" style={{ color: "#C62828" }}>{errore}</p>}
        </div>
      )}

      {/* ── FOOTER form ── */}
      {step === "form" && (
        <div className="flex flex-col gap-3 items-center py-6">
          <Btn size="lg" onClick={handleContinua} disabled={!formValido || loading}>
            {loading ? "Attendere…" : "Registrati"}
          </Btn>
          {!fromLogin && !isGuest && (
            <button onClick={handleSenzaRegistrazione} className="text-sm text-center" style={{ color: COLORS.primary }}>
              Continua senza registrarti
            </button>
          )}
        </div>
      )}

      {/* ── FOOTER verifica ── */}
      {step === "verifica" && (
        <div className="flex flex-col gap-3 items-center py-6">
          <Btn size="lg" onClick={handleVerifica} disabled={codice.length < 8 || loading}>
            {loading ? "Verifica…" : "Conferma"}
          </Btn>
          <p style={{ fontSize: 16, color: "#1A1A2E" }}>
            Non hai ricevuto nulla?{" "}
            <button onClick={handleReinvia} style={{ color: COLORS.primary, fontWeight: 500 }}>
              Invia di nuovo
            </button>
          </p>
          <button onClick={() => { setStep("form"); setErrore(null); }} style={{ color: COLORS.primary, fontWeight: 500, fontSize: 15 }}>
            ← Cambia email
          </button>
        </div>
      )}
    </div>
  );
}

export default function OnboardingRegistratiPage() {
  return <Suspense fallback={null}><OnboardingRegistratiContent /></Suspense>;
}
