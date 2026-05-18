"use client";

import Link from "next/link";
import Image from "next/image";
import Btn from "@/components/ui/btn";
import { COLORS } from "@/lib/design-tokens";
import { Timer, StatsReport, Medal, Brain } from "iconoir-react";
import StepLines from "@/components/ui/step-lines";

const PUNTI = [
  {
    icona: <Brain width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />,
    titolo: "Progettato con esperti di neuropsicologia",
  },
  {
    icona: <Timer width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />,
    titolo: "Solo 10 minuti al giorno, ogni giorno",
  },
  {
    icona: <StatsReport width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />,
    titolo: "Tieni traccia dei tuoi progressi nel tempo",
  },
  {
    icona: <Medal width={20} height={20} strokeWidth={1.5} color={COLORS.primary} />,
    titolo: "Sblocca medaglie e premi ogni giorno",
  },
];

export default function OnboardingPage() {
  return (
    <div
      className="h-screen flex flex-col px-6 pt-4 max-w-lg mx-auto"
      style={{ background: `linear-gradient(160deg, ${COLORS.primaryLight}88 0%, ${COLORS.surface} 55%)` }}
    >
      <StepLines current={0} />

      {/* Contenuto scrollabile */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center w-full gap-6 min-h-0">
        <Image src="/logo.svg" alt="VivaMente" width={67} height={80} />

        <div className="text-center">
          <h1 className="text-2xl font-extrabold" style={{ color: COLORS.primary }}>VivaMente</h1>
          <p className="text-base text-ink-secondary mt-2 leading-relaxed">
            Allena la mente ogni giorno con esercizi semplici e divertenti
          </p>
        </div>

        {/* Lista verticale punti */}
        <div
          className="rounded-lg w-full flex flex-col border"
          style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 18, paddingRight: 18, backgroundColor: COLORS.surface, borderColor: `${COLORS.primary}22` }}
        >
          {PUNTI.map((p, i) => (
            <div key={p.titolo}>
              <div className="flex items-start gap-3" style={{ paddingTop: 18, paddingBottom: 18 }}>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${COLORS.primaryLight}88` }}
                >
                  {p.icona}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{p.titolo}</p>
                </div>
              </div>
              {i < PUNTI.length - 1 && (
                <div style={{ height: 1, backgroundColor: "#E5E7EB" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA ancorato al fondo */}
      <div className="flex flex-col gap-3 py-6">
        <Link href="/onboarding/istruzioni" className="w-full">
          <Btn size="lg">Prova subito</Btn>
        </Link>
        <Link href="/onboarding/accedi" className="w-full">
          <Btn size="lg" variant="outline">Accedi al tuo account</Btn>
        </Link>
      </div>
    </div>
  );
}
