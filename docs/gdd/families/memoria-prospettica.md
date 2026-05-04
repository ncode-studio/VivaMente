# Famiglia 10 — Memoria Prospettica (1 esercizio)

**Dominio cognitivo**: Memoria
**Classificazione**: **MP (Memoria Prospettica)** — costrutto distinto da MBT e MLT. Il delay non è di ritenzione ma di mantenimento dell'intenzione prospettica durante un'attività cognitiva concorrente.

## Meccanica core

L'utente riceve un'**istruzione prospettica** (cosa fare quando si verificherà un evento specifico, o a intervalli regolari di tempo), poi svolge un task di attenzione selettiva come attività principale.

La risposta prospettica corretta è l'esecuzione dell'azione nel momento giusto — **non una scelta multipla**.

Fondamento: paradigma Event-based e Time-based Prospective Memory (Einstein & McDaniel, 1990).

## Struttura della sessione

**Singolo trial continuo per sessione**, articolato in 2 fasi:

**Fase 1 — Istruzione prospettica**: schermata con istruzione mostrata per **5 secondi** con esempio animato. L'utente conferma con **"Ho capito"** prima di procedere.

**Fase 2 — Task continuo**: l'utente svolge un task di attenzione selettiva — stimoli di categorie diverse scorrono sullo schermo, l'utente tocca ogni stimolo della **categoria target** designata per la sessione. Durante questo task il cue prospettico è embedded nello stream (Event-based) oppure l'utente monitora autonomamente il tempo (Time-based).

## Risposta prospettica

**Tasto "Ricordami" dedicato**, sempre visibile ma non prominente, distinto visivamente e funzionalmente dal tap del task distrattore (nessuna ambiguità tra le due risposte).

## Micro-progressione

**Non applicata** — la sessione è un singolo trial continuo. La progressione della difficoltà avviene esclusivamente attraverso i parametri della tabella livelli.

## Accuratezza

```
N_finestre_risposta_corrette / N_finestre_totali
```

**Nota**: ai livelli 1–4 con N_finestre = 3, i valori possibili sono 0%, 33%, 67%, 100% — granularità limitata ma accettabile perché la performance attesa a quei livelli è 100%.

## Timer di sessione

**Modello B — sessione a completamento** (vedi `shared/01-session-rules.md`). La sessione termina al completamento del trial (Fase 2 ha durata definita dalla tabella livelli).

---

## Esercizio 1 — Memoria Prospettica Ibrida (Time-based + Attenzione Selettiva)

**id JSON**: `memoria_prospettica_time_based`

### Struttura dual-task

Due compiti sovrapposti eseguiti simultaneamente:

1. **Task ongoing (bottone 1)** — attenzione selettiva: parole scorrono sullo schermo, l'utente tocca il bottone categoria ogni volta che vede una parola appartenente al gruppo target della sessione.
2. **Task prospettico (bottone 2)** — memoria prospettica: l'utente deve premere "Ricordami" ogni N secondi, monitorando il tempo autonomamente con l'aiuto dell'orologio mm:ss sempre visibile.

### Istruzioni utente (Fase 1)

> *"Hai due cose da fare. Prima: vedrai delle parole scorrere sullo schermo — tocca il pulsante '[Categoria]' ogni volta che la parola appartiene a quel gruppo. Seconda: ogni [N] secondi, tocca il pulsante 'Ricordami'. L'orologio in alto ti aiuta a tenere il tempo. Pronto? Tocca 'Ho capito' per iniziare."*

### Tabella livelli

| Lv | Intervallo | N finestre | Tolleranza (s) | ISI stream (ms) | Categorie | Durata est. |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | 30 s | 3 | ±20 | 3500 | distanti | ~1m45s |
| 2 | 30 s | 3 | ±15 | 3300 | distanti | ~1m45s |
| 3 | 30 s | 4 | ±10 | 3300 | distanti | ~2m15s |
| 4 | 30 s | 4 | ±10 | 3000 | distanti | ~2m15s |
| 5 | 45 s | 3 | ±10 | 3000 | moderate | ~2m30s |
| 6 | 45 s | 3 | ±10 | 2800 | moderate | ~2m30s |
| 7 | 45 s | 3 | ±5 | 2800 | moderate | ~2m30s |
| 8 | 60 s | 2 | ±5 | 2600 | vicine | ~2m15s |
| 9 | 60 s | 2 | ±5 | 2600 | vicine | ~2m15s |
| 10 | 60 s | 2 | ±5 | 2500 | vicine | ~2m15s |

**Orologio**: mm:ss sempre visibile a tutti i livelli.

### Distanza semantica categorie (task ongoing)

- **Distante (lv 1–4)**: categorie chiaramente diverse (es. Animali vs Oggetti di casa).
- **Moderata (lv 5–7)**: stessa macro-categoria, sotto-categorie diverse (es. Animali domestici vs Selvatici).
- **Vicina (lv 8–10)**: categorie molto simili (es. Mobili vs Elettrodomestici).

Le coppie semantiche sono condivise con il pool di Go/No-Go Semantico.

### Soglie cambio meccanica

- **lv 4→5**: intervallo 30s→45s + categorie distante→moderata.
- **lv 7→8**: intervallo 45s→60s + categorie moderata→vicina.

### Generazione stimoli

- **Pool**: parole italiane categorizzate (stesso pool Go/No-Go Semantico).
- **Per sessione**: 1 coppia semantica estratta casualmente tra quelle ammesse al livello.

---

## JSON di configurazione esempio

```json
{
  "family": "memoria_prospettica",
  "exercises": [
    {
      "id": "memoria_prospettica_event_based",
      "classification": "MP",
      "cognitiveDomain": "Memoria",
      "sessionStructure": "single_continuous_trial",
      "levelTable": {
        "1":  { "durationMin": 2, "nWindows": 3, "cueSalience": "alta",  "distractorISIMs": 3000 },
        "20": { "durationMin": 8, "nWindows": 6, "cueSalience": "bassa", "distractorISIMs": 1100 }
      },
      "microProgression": null,
      "prospectiveResponse": "dedicated_button",
      "distractorTask": { "type": "selective_attention", "stimulusPool": "twemoji_categorized" },
      "accuracyUnit": "windows_correct_over_total",
      "sessionTimer": "no_fixed_timer"
    },
    {
      "id": "memoria_prospettica_time_based",
      "classification": "MP",
      "cognitiveDomain": "Memoria",
      "sessionStructure": "single_continuous_trial",
      "levelTable": {
        "1":  { "intervalS": 30,  "nWindows": 3, "toleranceS": 20, "clockVisibility": "piena",   "distractorISIMs": 3000 },
        "20": { "intervalS": 120, "nWindows": 4, "toleranceS": 5,  "clockVisibility": "assente", "distractorISIMs": 1100 }
      },
      "microProgression": null,
      "prospectiveResponse": "dedicated_button",
      "distractorTask": { "type": "selective_attention", "stimulusPool": "twemoji_categorized" },
      "accuracyUnit": "windows_correct_within_tolerance_over_total",
      "sessionTimer": "no_fixed_timer"
    }
  ]
}
```
