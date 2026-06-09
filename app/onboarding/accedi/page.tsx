"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Btn from "@/components/ui/btn";
import { COLORS } from "@/lib/design-tokens";
import { Mail } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
import { initUserData } from "@/lib/sync";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const inputCls = `w-full min-h-[56px] rounded-md px-4 text-base bg-white text-ink border-2 border-[#E2E8F0]
  focus:outline-none focus:border-[#1891B1] transition-colors placeholder-[#5A5A72]`;

function isEmailValida(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

type Step = "form" | "verifica";

export default function AccediPage() {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [email, setEmail]     = useState("");
  const [codice, setCodice]   = useState("");
  const [step, setStep]       = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]   = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const pronto = isEmailValida(email.trim());

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleInvia() {
    if (!pronto || loading) return;
    setLoading(true);
    setErrore(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setStep("verifica");
      setCooldown(60);
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : "Errore nell'invio");
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
        email: email.trim(),
        token: codice,
        type: "email",
      });
      if (error) throw error;
      if (!session) throw new Error("Sessione non valida");

      const userData = await initUserData(session.user.id);
      if (userData) setUser(userData);
      router.push("/home");
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : "Codice non valido. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReinvia() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setErrore(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setCodice("");
      setCooldown(60);
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : "Errore nell'invio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-36 max-w-lg mx-auto" style={{ backgroundColor: COLORS.background }}>

      {step === "form" && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Bentornato</h1>
            <p className="text-base mt-2 leading-relaxed" style={{ color: "#5A5A72" }}>
              Inserisci la tua email e ti invieremo un codice per entrare.
            </p>
          </div>
          <div>
            <label className="text-sm font-bold text-ink-secondary block mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tua@email.it" className={inputCls} inputMode="email" />
          </div>
          {errore && <p className="text-sm" style={{ color: "#C62828" }}>{errore}</p>}
        </div>
      )}

      {step === "verifica" && (
        <div className="flex flex-col items-center gap-6 text-center flex-1 pt-4">
          <Mail width={56} height={56} strokeWidth={1.5} color={COLORS.primary} />
          <div className="flex flex-col items-center gap-3">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E" }}>Inserisci il codice</h1>
            <p style={{ fontSize: 17, color: "#5A5A72", lineHeight: 1.6 }}>
              Abbiamo inviato un codice a 8 cifre a<br />
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

      <div className="fixed bottom-6 left-0 right-0 px-5 max-w-lg mx-auto flex flex-col items-center gap-3">
        {step === "form" && (
          <>
            <Btn size="lg" onClick={handleInvia} disabled={!pronto || loading}>
              {loading ? "Attendere…" : "Invia codice"}
            </Btn>
            <p className="text-sm text-ink-secondary">
              Non hai ancora un profilo?{" "}
              <Link href="/onboarding/registrati?from=login" style={{ color: COLORS.primary, fontWeight: 500 }}>
                Registrati
              </Link>
            </p>
          </>
        )}
        {step === "verifica" && (
          <>
            <Btn size="lg" onClick={handleVerifica} disabled={codice.length < 8 || loading}>
              {loading ? "Verifica…" : "Entra"}
            </Btn>
            <p style={{ fontSize: 16, color: "#1A1A2E" }}>
              Non hai ricevuto nulla?{" "}
              {cooldown > 0 ? (
                <span style={{ color: "#5A5A72", fontWeight: 500 }}>
                  Invia di nuovo tra {cooldown}s
                </span>
              ) : (
                <button onClick={handleReinvia} disabled={loading} style={{ color: COLORS.primary, fontWeight: 500 }}>
                  Invia di nuovo
                </button>
              )}
            </p>
            <button onClick={() => { setStep("form"); setErrore(null); }} style={{ color: COLORS.primary, fontWeight: 500, fontSize: 15 }}>
              ← Cambia email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
