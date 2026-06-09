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
} from "@/lib/sync";

export default function UserInit() {
  const { setUser, isGuest } = useUserStore();

  useEffect(() => {
    // Fetch medaglie definitions per tutti (dati statici pubblici)
    fetchMedaglie().then((defs) => setUser({ medaglieDefinizioni: defs }));
  }, [setUser]);

  useEffect(() => {
    if (isGuest) return;

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    }

    init();
  }, [isGuest, setUser]);

  return null;
}
