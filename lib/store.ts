import { create } from "zustand";
import type { EserciziDelGiornoItem, ProgressoGiorno, SessioneRecente, MessaggioReale, MedagliaDefinizione, TrendCategoria } from "@/lib/sync";

export type CanalNotifica = "whatsapp" | "sms" | "email";

export interface Familiare {
  id: string;
  nome: string;
  relazione: string;
  telefono: string;
  collegato_at: string;
  permessi: {
    attivita: boolean;
    medaglie: boolean;
    progressi: boolean;
  };
}

export interface UserState {
  initialized: boolean; // true dopo che UserInit ha caricato i dati
  isGuest: boolean;
  userId: string | null;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  anno_nascita: number;
  orario_notifica: string;
  canale_notifica: CanalNotifica;
  consenso_notifiche: boolean;
  medaglie: string[];
  medaglieDate: Record<string, string>;
  medaglieDefinizioni: MedagliaDefinizione[];
  streak: number;
  lastActivityDate: string | null;
  esercizi_completati: number;
  familiari: Familiare[];
  eserciziFattiOggi: number;
  // Dati reali da Supabase
  eserciziDelGiorno: EserciziDelGiornoItem[];
  userLevels: Record<string, number>;
  progressiSettimanali: ProgressoGiorno[];
  sessioniRecenti: SessioneRecente[];
  // trend per dominio cognitivo (keyed per slug categoria), calcolato sulle
  // due sessioni più recenti dello stesso dominio
  trendCategorie: Record<string, TrendCategoria>;
  // flag cross-page: impostato da /esercizi per far aprire PausaAttivaView in /home
  pausaAttivaRichiesta: boolean;
  // timestamp (ms) di inizio pausa attiva — null = nessuna pausa in corso
  pausaAttivaInizio: number | null;
  // nasconde la BottomNav (es. quando un modal a schermo intero è aperto)
  navNascosta: boolean;
  messaggi: MessaggioReale[];
}

interface UserStore extends UserState {
  setUser: (data: Partial<UserState>) => void;
  setGuest: () => void;
  aggiungiMedaglia: (id: string) => void;
  aggiornaFamiliare: (id: string, data: Partial<Familiare>) => void;
  rimuoviFamiliare: (id: string) => void;
  setPausaAttivaRichiesta: (v: boolean) => void;
  setPausaAttivaInizio: (v: number | null) => void;
  setNavNascosta: (v: boolean) => void;
  marcaEsercizioDelGiornoCompletato: (esercizioId: string) => void;
  segnaMessaggioLettoLocale: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  initialized: false,
  isGuest: false,
  userId: null,
  nome: "",
  cognome: "",
  telefono: "",
  email: "",
  anno_nascita: 0,
  orario_notifica: "09:00",
  canale_notifica: "email",
  consenso_notifiche: true,
  medaglie: [],
  medaglieDate: {},
  medaglieDefinizioni: [],
  streak: 0,
  lastActivityDate: null,
  esercizi_completati: 0,
  eserciziFattiOggi: 0,
  eserciziDelGiorno: [],
  userLevels: {},
  progressiSettimanali: [],
  sessioniRecenti: [],
  trendCategorie: {},
  familiari: [],
  pausaAttivaRichiesta: false,
  pausaAttivaInizio: null,
  navNascosta: false,
  messaggi: [],

  setUser: (data) => set((s) => ({ ...s, ...data })),

  setGuest: () => set({
    initialized: true,
    isGuest: true,
    userId: null,
    nome: "Ospite",
    cognome: "",
    telefono: "",
    email: "",
    anno_nascita: 0,
    orario_notifica: "09:00",
    canale_notifica: "email",
    consenso_notifiche: false,
    medaglie: [],
    medaglieDate: {},
    medaglieDefinizioni: [],
    streak: 0,
    lastActivityDate: null,
    esercizi_completati: 0,
    familiari: [],
    eserciziFattiOggi: 0,
    eserciziDelGiorno: [],
    userLevels: {},
    progressiSettimanali: [],
    sessioniRecenti: [],
    trendCategorie: {},
    messaggi: [],
    pausaAttivaRichiesta: false,
    pausaAttivaInizio: null,
  }),

  setPausaAttivaRichiesta: (v) => set({ pausaAttivaRichiesta: v }),
  setPausaAttivaInizio: (v) => set({ pausaAttivaInizio: v }),
  setNavNascosta: (v) => set({ navNascosta: v }),

  marcaEsercizioDelGiornoCompletato: (esercizioId) =>
    set((s) => ({
      eserciziDelGiorno: s.eserciziDelGiorno.map((e) =>
        e.id === esercizioId ? { ...e, completato: true } : e
      ),
    })),

  segnaMessaggioLettoLocale: (id) =>
    set((s) => ({
      messaggi: s.messaggi.map((m) => m.id === id ? { ...m, letto: true } : m),
    })),

  aggiungiMedaglia: (id) =>
    set((s) => ({
      medaglie: s.medaglie.includes(id) ? s.medaglie : [...s.medaglie, id],
    })),

  aggiornaFamiliare: (id, data) =>
    set((s) => ({
      familiari: s.familiari.map((f) =>
        f.id === id ? { ...f, ...data } : f
      ),
    })),

  rimuoviFamiliare: (id) =>
    set((s) => ({
      familiari: s.familiari.filter((f) => f.id !== id),
    })),
}));
