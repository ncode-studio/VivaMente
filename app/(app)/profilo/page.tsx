"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/card";
import Btn from "@/components/ui/btn";
import Toggle from "@/components/ui/toggle";
import Modal from "@/components/ui/modal";
import AppSelect from "@/components/ui/app-select";
import { useUserStore, type CanalNotifica, type Familiare } from "@/lib/store";
import { giorniDa } from "@/lib/utils";
import { COLORS } from "@/lib/design-tokens";
import { AppIcon } from "@/lib/icons";
import {
  User, CheckCircle, Phone, Mail, Bell, Timer,
  Group,
  NavArrowDown, NavArrowUp,
} from "iconoir-react";
import { creaInvito } from "@/lib/sync";

const ORE = ["07:00","08:00","09:00","10:00","11:00","12:00","14:00","16:00","18:00","20:00","21:00"];
const _ANNI = Array.from({ length: 61 }, (_, i) => 1990 - i); void _ANNI;
const CANALI: { id: CanalNotifica; label: string; icona: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icona: "chat" },
  { id: "sms",      label: "SMS",      icona: "phone" },
  { id: "email",    label: "Email",    icona: "mail" },
];

// ─── Helper: input style ─────────────────────────────────────────────────────
const inputCls = `w-full min-h-[56px] rounded-md px-4 text-base text-ink bg-background border-2 border-border
  focus:outline-none focus:border-primary transition-colors`;

// ─── Helper: sezione header ───────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: COLORS.primary }}>
      {children}
    </p>
  );
}

// ─── Sezione Informazioni ─────────────────────────────────────────────────────
function SezioneInfo() {
  const { nome, cognome, telefono, email, anno_nascita, setUser } = useUserStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ nome, cognome, telefono, email, anno_nascita });
  const [saved, setSaved] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [nuovoTelefono, setNuovoTelefono] = useState("");
  const [otpStep, setOtpStep] = useState<"phone"|"code"|"done">("phone");
  const [otpCode, setOtpCode] = useState("");

  function handleSave() {
    setUser(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleOTP() {
    if (otpStep === "phone" && nuovoTelefono) { setOtpStep("code"); return; }
    if (otpStep === "code" && otpCode.length >= 4) {
      setUser({ telefono: nuovoTelefono });
      setDraft((d) => ({ ...d, telefono: nuovoTelefono }));
      setOtpStep("done");
      setTimeout(() => { setShowOTP(false); setOtpStep("phone"); setNuovoTelefono(""); setOtpCode(""); }, 1800);
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Le mie informazioni</SectionTitle>
        {!editing ? (
          <button
            onClick={() => { setDraft({ nome, cognome, telefono, email, anno_nascita }); setEditing(true); }}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: COLORS.primary, backgroundColor: COLORS.primaryLight }}
          >
            Modifica
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            Salva
          </button>
        )}
      </div>

      {saved && (
        <div className="mb-3 px-4 py-3 rounded-md text-sm font-semibold text-center flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.successLight, color: COLORS.success }}>
          <CheckCircle width={16} height={16} strokeWidth={1.5} color={COLORS.success} />
          Salvato con successo!
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Nome */}
        <InfoField
          label={<><User width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} /> Nome</>}
          editing={editing}
        >
          {editing
            ? <input className={inputCls} value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
            : <InfoValue>{nome || "—"}</InfoValue>}
        </InfoField>

        {/* Telefono */}
        <InfoField
          label={<><Phone width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} /> Telefono</>}
          editing={false}
        >
          <InfoValue>{telefono || "—"}</InfoValue>
        </InfoField>

        {/* Email */}
        <InfoField
          label={<><Mail width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} /> Email</>}
          editing={editing}
          last
        >
          {editing
            ? <input className={inputCls} type="email" value={draft.email} placeholder="tua@email.it" onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            : <InfoValue>{email || <span className="text-ink-muted">non inserita</span>}</InfoValue>}
        </InfoField>
      </div>

      {/* Modal OTP cambio numero */}
      <Modal open={showOTP} onClose={() => { setShowOTP(false); setOtpStep("phone"); }} title="Cambia numero">
        {otpStep === "phone" && (
          <div className="flex flex-col gap-4">
            <p className="text-base text-ink-secondary">Nuovo numero di telefono</p>
            <input type="tel" value={nuovoTelefono} onChange={(e) => setNuovoTelefono(e.target.value)}
              placeholder="+39 333 000 0000" className={inputCls} />
            <Btn size="lg" onClick={handleOTP} disabled={!nuovoTelefono}>Invia codice SMS →</Btn>
          </div>
        )}
        {otpStep === "code" && (
          <div className="flex flex-col gap-4">
            <p className="text-base text-ink-secondary">Codice ricevuto su <strong>{nuovoTelefono}</strong></p>
            <input type="number" value={otpCode} onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
              placeholder="000000"
              className="w-full min-h-[64px] rounded-md px-4 text-2xl text-center bg-background border-2 border-border focus:outline-none focus:border-primary font-bold tracking-widest" />
            <Btn size="lg" onClick={handleOTP} disabled={otpCode.length < 4}>Verifica ✓</Btn>
          </div>
        )}
        {otpStep === "done" && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-3">
              <CheckCircle width={56} height={56} strokeWidth={1.5} color={COLORS.success} />
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.success }}>Numero aggiornato!</p>
          </div>
        )}
      </Modal>
    </Card>
  );
}

// ─── Sezione Notifiche ────────────────────────────────────────────────────────
function SezioneNotifiche() {
  const { consenso_notifiche, orario_notifica, canale_notifica, email, setUser } = useUserStore();
  const [saved, setSaved] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showSaved() {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }

  function save(updates: Parameters<typeof setUser>[0]) {
    setUser(updates);
    showSaved();
  }

  function handleSelezionaCanale(id: CanalNotifica) {
    save({ canale_notifica: id });
    if (id === "email") setEmailDraft("");
  }

  function handleSalvaEmail() {
    if (!emailDraft.trim()) return;
    setUser({ email: emailDraft.trim() });
    showSaved();
  }

  const mostraInputEmail = canale_notifica === "email" && !email;
  const mostraEmailSalvata = canale_notifica === "email" && !!email;

  return (
    <Card padding="md">
      <SectionTitle>
        <Bell width={18} height={18} strokeWidth={1.5} color={COLORS.primary} />
        Notifiche
      </SectionTitle>
      {saved && (
        <div className="mb-3 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2"
          style={{ backgroundColor: COLORS.successLight, color: COLORS.success }}>
          <CheckCircle width={16} height={16} strokeWidth={1.5} color={COLORS.success} />
          Preferenze salvate!
        </div>
      )}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-ink">Promemoria giornaliero</p>
            <p className="text-sm text-ink-muted">Ricevi il reminder per allenarti</p>
          </div>
          <Toggle checked={consenso_notifiche} onChange={(v) => save({ consenso_notifiche: v })} />
        </div>

        {consenso_notifiche && (
          <>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-secondary mb-2">
                <Timer width={14} height={14} strokeWidth={1.5} color={COLORS.inkMuted} />
                Orario
              </p>
              <AppSelect
                value={orario_notifica}
                onChange={(v) => save({ orario_notifica: v })}
                options={ORE.map((o) => ({ value: o, label: o }))}
                direction="down"
                showSearch={false}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-secondary mb-2">Canale preferito</p>
              <div className="grid grid-cols-3 gap-2 my-4">
                {CANALI.map((c) => (
                  <button key={c.id} onClick={() => handleSelezionaCanale(c.id)}
                    className="min-h-[60px] py-4 rounded-md flex flex-col items-center justify-center gap-2 text-sm font-semibold border-2 transition-all"
                    style={{
                      borderColor: canale_notifica === c.id ? COLORS.primary : COLORS.border,
                      backgroundColor: canale_notifica === c.id ? `${COLORS.primaryLight}55` : COLORS.surface,
                      color: canale_notifica === c.id ? COLORS.primary : COLORS.inkMuted,
                    }}>
                    <AppIcon
                      name={c.icona}
                      size={28}
                      color={canale_notifica === c.id ? COLORS.primary : COLORS.inkMuted}
                    />
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Email già presente — mostra conferma */}
              {mostraEmailSalvata && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: COLORS.primaryLight }}>
                  <Mail width={14} height={14} strokeWidth={1.5} color={COLORS.primary} />
                  <p className="text-xs font-medium" style={{ color: COLORS.primary }}>
                    Il promemoria arriverà a <strong>{email}</strong>
                  </p>
                </div>
              )}

              {/* Input email se canale=email e nessuna email salvata */}
              {mostraInputEmail && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-sm font-medium" style={{ color: COLORS.inkPrimary }}>
                    Inserisci la tua email per ricevere i promemoria
                  </p>
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="tua@email.it"
                    className={inputCls}
                  />
                  <button
                    onClick={handleSalvaEmail}
                    disabled={!emailDraft.trim()}
                    className="w-full py-3 rounded-full text-sm font-bold text-white transition-opacity"
                    style={{ backgroundColor: COLORS.primary, opacity: emailDraft.trim() ? 1 : 0.45 }}
                  >
                    Salva email
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

const PARENTELE = [
  "Figlio", "Figlia",
  "Nipote", "Pronipote",
  "Fratello", "Sorella",
  "Genero", "Nuora",
  "Cognato", "Cognata",
  "Cugino", "Cugina",
  "Badante", "Amico di famiglia",
];

// ─── Sezione Famiglia ─────────────────────────────────────────────────────────
function SezioneFamiglia() {
  const { familiari, rimuoviFamiliare, isGuest } = useUserStore();
  const [showInvita, setShowInvita] = useState(false);
  const [inviatoOk, setInviatoOk] = useState(false);
  const [draft, setDraft] = useState({ contatto: "", nome: "", parentela: "" });
  const [confirmRimuovi, setConfirmRimuovi] = useState<string | null>(null);

  function resetModal() {
    setDraft({ contatto: "", nome: "", parentela: "" });
    setInviatoOk(false);
  }

  async function handleInvia() {
    if (!draft.contatto || !draft.nome || !draft.parentela) return;
    const { userId } = useUserStore.getState();
    if (!userId) return;

    const token = await creaInvito({
      userId,
      nome: draft.nome,
      contatto: draft.contatto,
      relazione: draft.parentela,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = `${appUrl}/famigliare?token=${token}`;
    const messaggio = `Ciao ${draft.nome}! Ti invito a seguire i miei progressi su VivaMente e tenermi compagnia nel mio allenamento mentale. Unisciti qui → ${link}`;

    const isEmail = draft.contatto.includes("@");
    if (isEmail) {
      window.open(
        `mailto:${encodeURIComponent(draft.contatto)}?subject=${encodeURIComponent("Ti invito su VivaMente")}&body=${encodeURIComponent(messaggio)}`,
        "_blank"
      );
    } else {
      window.open(`sms:${draft.contatto}?body=${encodeURIComponent(messaggio)}`, "_blank");
    }

    setInviatoOk(true);
    setTimeout(() => { setShowInvita(false); resetModal(); }, 1800);
  }

  const canInvia = draft.contatto.trim() && draft.nome.trim() && draft.parentela;

  return (
    <>
      <div className="flex flex-col gap-2">
        {familiari.map((f) => (
          <FamiliareCard
            key={f.id}
            familiare={f}
            onRimuovi={() => setConfirmRimuovi(f.id)}
          />
        ))}
        {familiari.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: COLORS.inkMuted }}>Nessun familiare collegato.</p>
        )}

        {/* Spacer per non coprire l'ultimo card col bottone fisso */}
        <div className="h-24" />
      </div>

      {/* Bottone fisso sopra la navbar */}
      {!isGuest && (
        <div className="fixed bottom-[124px] left-0 right-0 px-4 z-40 max-w-lg mx-auto">
          <button
            className="w-full py-3 rounded-full text-sm font-bold text-white shadow-lg"
            style={{ backgroundColor: COLORS.primary }}
            onClick={() => { resetModal(); setShowInvita(true); }}
          >
            + Invita familiare
          </button>
        </div>
      )}

      {/* Modal invita */}
      <Modal open={showInvita} onClose={() => { setShowInvita(false); resetModal(); }} title="Invita un familiare">
        {inviatoOk ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
              <CheckCircle width={32} height={32} strokeWidth={1.5} color={COLORS.success} />
            </div>
            <p className="text-base font-bold text-center" style={{ color: COLORS.success }}>Invito inviato!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed" style={{ color: COLORS.inkSecondary }}>
              Aggiungi un familiare inserendo i dati richiesti
            </p>

            {/* Contatto */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: COLORS.inkPrimary }}>
                Numero telefono o email
              </label>
              <input
                type="text"
                value={draft.contatto}
                onChange={(e) => setDraft({ ...draft, contatto: e.target.value })}
                placeholder="+39 333 000 0000 oppure email@..."
                className={inputCls}
              />
            </div>

            {/* Nome */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: COLORS.inkPrimary }}>
                Nome e cognome
              </label>
              <input
                type="text"
                value={draft.nome}
                onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                placeholder="Es. Marco Rossi"
                className={inputCls}
              />
            </div>

            {/* Parentela */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: COLORS.inkPrimary }}>
                Parentela
              </label>
              <AppSelect
                value={draft.parentela}
                onChange={(v) => setDraft({ ...draft, parentela: v })}
                options={PARENTELE.map((p) => ({ value: p, label: p }))}
                placeholder="Seleziona parentela..."
                direction="up"
              />
            </div>

            <button
              onClick={handleInvia}
              disabled={!canInvia}
              className="w-full py-3 rounded-full text-sm font-bold text-white transition-opacity"
              style={{ backgroundColor: COLORS.primary, opacity: canInvia ? 1 : 0.45 }}
            >
              Manda invito
            </button>
          </div>
        )}
      </Modal>

      {/* Modal conferma rimozione */}
      <Modal open={confirmRimuovi !== null} onClose={() => setConfirmRimuovi(null)} title="Rimuovi familiare">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: COLORS.inkSecondary }}>
            Sei sicuro di voler rimuovere{" "}
            <strong>{familiari.find((f) => f.id === confirmRimuovi)?.nome}</strong>?
            Non potrà più vedere i tuoi progressi.
          </p>
          <Btn variant="danger" size="lg" onClick={() => { if (confirmRimuovi) rimuoviFamiliare(confirmRimuovi); setConfirmRimuovi(null); }}>
            Sì, rimuovi
          </Btn>
          <Btn variant="ghost" size="default" onClick={() => setConfirmRimuovi(null)}>Annulla</Btn>
        </div>
      </Modal>
    </>
  );
}

// ─── Card familiare ───────────────────────────────────────────────────────────
function FamiliareCard({ familiare, onRimuovi }: {
  familiare: Familiare;
  onRimuovi: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const collegato = giorniDa(familiare.collegato_at);

  const INFO_ROWS = [
    { icon: <User width={15} height={15} strokeWidth={1.5} color={COLORS.inkMuted} />, label: "Nome",      value: familiare.nome },
    { icon: <Group width={15} height={15} strokeWidth={1.5} color={COLORS.inkMuted} />, label: "Parentela", value: familiare.relazione },
    { icon: <Phone width={15} height={15} strokeWidth={1.5} color={COLORS.inkMuted} />, label: "Telefono",  value: familiare.telefono },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ boxShadow: "0 0 2px 0 rgba(0,0,0,0.15)" }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold" style={{ color: COLORS.inkPrimary }}>{familiare.nome}</p>
          <p className="text-xs font-semibold" style={{ color: "#22C55E" }}>Collegato da {collegato}</p>
        </div>
        {expanded
          ? <NavArrowUp width={18} height={18} strokeWidth={1.5} color={COLORS.inkMuted} />
          : <NavArrowDown width={18} height={18} strokeWidth={1.5} color={COLORS.inkMuted} />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <>
          <div className="border-t" style={{ borderColor: COLORS.border }} />
          <div className="flex flex-col">
            {INFO_ROWS.map((row, i) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-2"
                style={{ borderBottom: i < INFO_ROWS.length - 1 ? `1px solid ${COLORS.border}` : undefined }}
              >
                <div className="flex items-center gap-1.5">
                  {row.icon}
                  <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>{row.label}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: COLORS.inkMuted }}>{row.value || "—"}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3">
            <button
              onClick={onRimuovi}
              className="w-full py-2.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: "rgba(243,71,79,0.2)", color: "#F3474F" }}
            >
              Rimuovi familiare
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helper fields ────────────────────────────────────────────────────────────
function InfoField({ label, editing, last, children }: { label: React.ReactNode; editing: boolean; last?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLORS.inkMuted }}>
        {label}
      </p>
      {children}
      {!editing && !last && <div className="mt-3 border-b border-border" />}
    </div>
  );
}

function InfoValue({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-medium text-ink">{children}</p>;
}

// ─── Pagina principale ────────────────────────────────────────────────────────
type TabProfilo = "dati" | "impostazioni" | "famiglia";

export default function ProfiloPage() {
  const { nome, isGuest } = useUserStore();
  const router = useRouter();
  const membroDal = "20 marzo 2025";
  const [tab, setTab] = useState<TabProfilo>("dati");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/onboarding/accedi");
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

  const TABS: { id: TabProfilo; label: string }[] = [
    { id: "dati",         label: "Dati" },
    { id: "impostazioni", label: "Impostazioni" },
    { id: "famiglia",     label: "Famiglia" },
  ];

  return (
    <div className="flex flex-col" style={isGuest ? { overflow: "hidden", height: "100dvh" } : undefined}>
      {/* ── Header + Tab bar ───────────────────────────────────────────── */}
      <div className="bg-surface px-5 pt-8 pb-0 border-b border-border">
        <h1 className="text-2xl font-extrabold text-ink mb-4">Profilo</h1>

        {/* Tab bar */}
        <div className="flex gap-10 justify-center">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="pb-3 text-base font-semibold transition-colors relative whitespace-nowrap"
              style={{ color: tab === id ? COLORS.primary : COLORS.inkMuted }}
            >
              {label}
              {tab === id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: COLORS.primary }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenuto tab ─────────────────────────────────────────────── */}
      <div className="relative px-4 pt-4 flex flex-col gap-4 flex-1">
        {tab === "dati" && (
          <>
            {/* Avatar + info utente */}
            <div className="flex items-center gap-5 py-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-card-md flex-shrink-0"
                style={{ backgroundColor: COLORS.primary }}
              >
                {nome[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-ink">{nome}</h2>
                <p className="text-sm text-ink-muted mt-0.5">Membro dal {membroDal}</p>
              </div>
            </div>
            <SezioneInfo />
            {!isGuest && (
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={handleLogout}
                  className="text-base font-semibold underline underline-offset-4"
                  style={{ color: COLORS.primary }}
                >
                  Esci dall&apos;account
                </button>
              </div>
            )}
          </>
        )}
        {tab === "impostazioni" && <SezioneNotifiche />}
        {tab === "famiglia" && <SezioneFamiglia />}

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
