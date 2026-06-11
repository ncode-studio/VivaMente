"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import {
  initUserData,
  fetchOrCreateEserciziDelGiorno,
  fetchUserLevels,
  fetchProgressiSettimanali,
  fetchSessioniRecenti,
  fetchTrendCategorie,
  fetchFamiliari,
  fetchMessaggi,
  fetchMedaglie,
  fetchEserciziDelGiornoGuest,
} from "@/lib/sync";

export default function UserInit() {
  const { setUser, setGuest, isGuest } = useUserStore();

  useEffect(() => {
    // Fetch medaglie definitions per tutti (dati statici pubblici)
    fetchMedaglie().then((defs) => setUser({ medaglieDefinizioni: defs }));
  }, [setUser]);

  // Ospite: carica i 5 esercizi del giorno reali (uno per dominio) così può
  // provarli senza account. Vengono ripopolati anche dopo un reload.
  useEffect(() => {
    if (!isGuest) return;
    let annullato = false;
    fetchEserciziDelGiornoGuest().then((eserciziDelGiorno) => {
      if (!annullato) setUser({ eserciziDelGiorno });
    });
    return () => { annullato = true; };
  }, [isGuest, setUser]);

  useEffect(() => {
    if (isGuest) return;

    const supabase = createClient();
    let cancelled = false;
    let channels: ReturnType<typeof supabase.channel>[] = [];

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Nessuna sessione: se è presente il cookie ospite ripristina la
        // modalità ospite (es. dopo un reload) così i 5 esercizi tornano.
        if (typeof document !== "undefined" && document.cookie.includes("vm_guest=1")) {
          setGuest();
        }
        return;
      }

      const [data, eserciziDelGiorno, userLevels, progressiSettimanali, sessioniRecenti, trendCategorie, familiari, messaggi, medaglieDefinizioni] =
        await Promise.all([
          initUserData(user.id),
          fetchOrCreateEserciziDelGiorno(user.id),
          fetchUserLevels(user.id),
          fetchProgressiSettimanali(user.id),
          fetchSessioniRecenti(user.id),
          fetchTrendCategorie(user.id),
          fetchFamiliari(user.id),
          fetchMessaggi(user.id),
          fetchMedaglie(),
        ]);

      if (data) {
        // Merge guadagnata_at nelle definizioni
        const medaglieConDate = medaglieDefinizioni.map((m) => ({
          ...m,
          guadagnata_at: data.medaglieDate?.[m.id] ?? null,
        }));
        setUser({
          ...data,
          eserciziDelGiorno,
          userLevels,
          progressiSettimanali,
          sessioniRecenti,
          trendCategorie,
          familiari,
          messaggi,
          medaglieDefinizioni: medaglieConDate,
          initialized: true,
        });
      } else {
        setUser({ initialized: true });
      }

      // ── Sincronizzazione live (Supabase Realtime) ───────────────────────
      // Aggiorna messaggi e familiari in tempo reale: quando un familiare
      // invia un messaggio o si collega, lo store si aggiorna senza ricaricare.
      // Su ogni evento rifacciamo il fetch completo (mantiene join nome/relazione
      // dei messaggi e l'ordinamento). RLS limita gli eventi alle proprie righe.
      // NB: richiede che le tabelle siano nella publication `supabase_realtime`.
      if (cancelled) return;
      const refetchMessaggi = () => fetchMessaggi(user.id).then((m) => { if (!cancelled) setUser({ messaggi: m }); });
      const refetchFamiliari = () => fetchFamiliari(user.id).then((f) => { if (!cancelled) setUser({ familiari: f }); });
      channels = [
        supabase
          .channel(`rt-messaggi-${user.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "messaggi", filter: `destinatario_id=eq.${user.id}` }, refetchMessaggi)
          .subscribe(),
        supabase
          .channel(`rt-familiari-${user.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "familiari", filter: `user_id=eq.${user.id}` }, refetchFamiliari)
          .subscribe(),
      ];
    }

    init();

    return () => {
      cancelled = true;
      channels.forEach((c) => { supabase.removeChannel(c); });
    };
  }, [isGuest, setUser, setGuest]);

  return null;
}
