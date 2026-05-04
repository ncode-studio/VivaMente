# Famiglia 2 — Recall Grid (3 esercizi: 2 MBT + 1 MLT)

**Dominio cognitivo**: Memoria
**Classificazione**: 2 esercizi MBT (Parole, Immagini) + 1 esercizio MLT (Immagini differite).

## Meccanica core

Il giocatore osserva una griglia con stimoli posizionati casualmente. La griglia scompare per un breve delay, poi riappare vuota: il giocatore deve riposizionare ogni stimolo nella cella corretta.

L'utente deve ricordare **sia lo stimolo che la sua posizione** (non solo la posizione).

Ispirato al Corsi Block-Tapping Test e al paradigma delayed match-to-sample.

## Struttura famiglia

I 2 esercizi MBT (Parole e Immagini) **condividono la stessa tabella livelli** — l'unica variabile è lo `stimulusType`.

L'esercizio MLT (Immagini differite) ha **tabella livelli separata** per struttura temporale diversa e conta come esercizio distinto ai fini di selezione giornaliera, progressione e tracking.

## Interfaccia (vedi `shared/05-ui-conventions.md`)

- griglia ≤ 4×4: **drag and drop**
- griglia ≥ 5×5: **tap-to-select + tap-to-place**

## Micro-progressione

+1 stimolo da ricordare per trial bonus (max +2 oltre base). Regola standard di `shared/03-progression.md`.

## Delay

- **MBT**: schermata con timer a conto alla rovescia visibile (nessun contenuto cognitivo).
- **MLT**: task distrattore motorio standard (palla rimbalzante — vedi `shared/04-memory-types.md`).

---

## Esercizi 1 e 2 — Recall Grid Parole MBT / Immagini MBT

**id JSON**: `recall_grid_parole_mbt`, `recall_grid_immagini_mbt`
**Classificazione**: MBT — delay massimo 5 secondi, nessun task distrattore.

### Istruzioni utente

**Parole**:
> *"Osserva la griglia: vedrai alcune parole, ognuna in una posizione precisa. Quando la griglia scomparirà, riposiziona ogni parola nella cella dove l'hai vista."*

**Immagini**:
> *"Osserva la griglia: vedrai alcune immagini, ognuna in una posizione precisa. Quando la griglia scomparirà, riposiziona ogni immagine nella cella dove l'hai vista."*

### Tabella livelli (condivisa Parole e Immagini)

| Lv | Griglia | N Stim | Espos (ms) | Delay (ms) | T.Lim Riprod. (ms) | Trial |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | 3×3 | 2 | 3000 | 1000 | — | 4 |
| 2 | 3×3 | 2 | 3000 | 1500 | — | 4 |
| 3 | 3×3 | 3 | 2950 | 1500 | — | 5 |
| 4 | 3×3 | 3 | 2950 | 2000 | — | 5 |
| 5 | 3×3 | 4 | 2900 | 2000 | — | 5 |
| 6 | 4×4 | 4 | 2900 | 2000 | — | 6 |
| 7 | 4×4 | 4 | 2850 | 2500 | — | 6 |
| 8 | 4×4 | 5 | 2850 | 2500 | — | 6 |
| 9 | 4×4 | 5 | 2800 | 3000 | — | 6 |
| 10 | 4×4 | 5 | 2800 | 3000 | — | 6 |
| 11 | 4×4 | 6 | 1600 | 3000 | — | 9 |
| 12 | 4×4 | 6 | 1500 | 3500 | — | 9 |
| 13 | 5×5 | 6 | 1500 | 3500 | — | 9 |
| 14 | 5×5 | 7 | 1400 | 3500 | — | 9 |
| 15 | 5×5 | 7 | 1400 | 4000 | — | 9 |
| 16 | 5×5 | 8 | 1200 | 4000 | 30000 | 10 |
| 17 | 5×5 | 8 | 1200 | 4000 | 30000 | 10 |
| 18 | 5×5 | 9 | 1000 | 4500 | 25000 | 10 |
| 19 | 6×6 | 9 | 1000 | 4500 | 25000 | 10 |
| 20 | 6×6 | 10 | 800 | 5000 | 20000 | 10 |

### Timer di sessione

- 90s (lv 1–10)
- 120s (lv 11–18)
- 180s (lv 19–20)

### Generazione stimoli — Parole

- **Fonte**: NVdB italiano.
- **Lunghezza parola**: 4–8 caratteri (leggibile in cella su mobile).
- **Fascia frequenza**: FO (lv 1–10), FO+AU (lv 11–20).
- **Filtro grammaticale**: nomi concreti; esclusi termini con accenti grafici problematici, omografi, nomi propri.
- **Non ripetizione**: una parola non si ripete entro 10 trial dello stesso esercizio.
- **Dataset minimo**: ~300 nomi concreti.

### Generazione stimoli — Immagini

- **Fonte**: Twemoji/Noto Emoji (set categorizzato).
- **8 categorie semantiche distinte**: animali, cibo, oggetti casa, trasporti, natura, attrezzi, sport, abbigliamento.
- **Regola di diversità intra-trial**: non più di 1 stimolo per categoria nella stessa griglia (evita confusione tra stimoli simili).
- **Dataset minimo**: ~200 emoji categorizzate.

---

## Esercizio 3 — Recall Grid Immagini MLT *(nuovo)*

**id JSON**: `recall_grid_immagini_mlt`
**Classificazione**: MLT — delay 30s → 3min con task distrattore motorio.
**Dominio cognitivo**: Memoria (visuospaziale differita).

### Istruzioni utente

> *"Osserva la griglia: ricorda le immagini e le loro posizioni. La griglia scomparirà e farai una breve attività. Poi ti chiederemo di riposizionare ogni immagine nella cella dove l'hai vista."*

### Tabella livelli

| Lv | Griglia | N Stim | Espos (ms) | Delay | T.Lim Riprod. (ms) | Trial |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | 3×3 | 2 | 3500 | 30 s | — | 5 |
| 2 | 3×3 | 2 | 3500 | 30 s | — | 5 |
| 3 | 3×3 | 3 | 3200 | 30 s | — | 5 |
| 4 | 3×3 | 3 | 3200 | 30 s | — | 5 |
| 5 | 3×3 | 3 | 3000 | 1 min | — | 3 |
| 6 | 4×4 | 3 | 3000 | 1 min | — | 3 |
| 7 | 4×4 | 4 | 2900 | 1 min | — | 3 |
| 8 | 4×4 | 4 | 2900 | 1 min | — | 3 |
| 9 | 4×4 | 4 | 2800 | 1 min 30 s | — | 2 |
| 10 | 4×4 | 4 | 2800 | 1 min 30 s | — | 2 |
| 11 | 4×4 | 5 | 2300 | 1 min 30 s | — | 3 |
| 12 | 4×4 | 5 | 2000 | 1 min 30 s | — | 3 |
| 13 | 5×5 | 5 | 2000 | 2 min | — | 2 |
| 14 | 5×5 | 5 | 2000 | 2 min | — | 2 |
| 15 | 5×5 | 6 | 1800 | 2 min | 30000 | 2 |
| 16 | 5×5 | 6 | 1800 | 2 min | 25000 | 2 |
| 17 | 5×5 | 6 | 1600 | 3 min | 25000 | 2 |
| 18 | 5×5 | 6 | 1600 | 3 min | 20000 | 2 |
| 19 | 5×5 | 7 | 1500 | 3 min | 20000 | 2 |
| 20 | 5×5 | 7 | 1500 | 3 min | 20000 | 2 |

**Note**: max 5×5 (mai 6×6 — carico complessivo con delay lungo sarebbe eccessivo per un 60+). N stimoli max 7 (vs 10 MBT).

### Timer di sessione

**Modello B — sessione a completamento** (vedi `shared/01-session-rules.md`). La sessione termina al completamento dei trial previsti. Durata stimata:

- ~3-4 min (lv 1–4)
- ~6–7 min (lv 5–12)
- ~10–12 min (lv 13–20)

### Generazione stimoli

Stesse regole dell'esercizio Immagini MBT.

---

## JSON di configurazione esempio

```json
{
  "family": "recall_grid",
  "exercises": [
    {
      "id": "recall_grid_parole_mbt",
      "stimulusType": "parole",
      "classification": "MBT",
      "levelTable": {
        "1":  { "gridSize": "3x3", "nStimuli": 2, "exposureMs": 3000, "delayMs": 1000,  "timeLimitReproMs": null, "trialsPerSession": 5 },
        "20": { "gridSize": "6x6", "nStimuli": 10, "exposureMs": 800,  "delayMs": 5000, "timeLimitReproMs": 20000, "trialsPerSession": 10 }
      },
      "microProgression": {
        "parameter": "nStimuli",
        "increment": 1,
        "maxOverBase": 2,
        "trialsBeforeBonus": 3,
        "bonusCountsForAccuracy": false
      },
      "stimulusGeneration": {
        "source": "NVdB_italiano",
        "wordLength": [4, 8],
        "frequencyBandByLevel": { "lv1to10": ["FO"], "lv11to20": ["FO", "AU"] },
        "grammaticalFilter": ["nome_concreto"],
        "exclusions": ["parolacce", "caratteri_accentati", "omografi", "nomi_propri"],
        "noRepetitionWithinTrials": 10
      },
      "delayScreen": "countdown_timer",
      "sessionTimerSec": { "lv1to10": 90, "lv11to18": 120, "lv19to20": 180 }
    },
    {
      "id": "recall_grid_immagini_mlt",
      "stimulusType": "immagini",
      "classification": "MLT",
      "levelTable": {
        "1":  { "gridSize": "3x3", "nStimuli": 2, "exposureMs": 3500, "delayS": 30,  "timeLimitReproMs": null, "trialsPerSession": 5 },
        "20": { "gridSize": "5x5", "nStimuli": 7, "exposureMs": 1500, "delayS": 180, "timeLimitReproMs": 20000, "trialsPerSession": 2 }
      },
      "microProgression": {
        "parameter": "nStimuli",
        "increment": 1,
        "maxOverBase": 2,
        "trialsBeforeBonus": 3,
        "bonusCountsForAccuracy": false
      },
      "stimulusGeneration": {
        "source": "twemoji_noto",
        "categories": ["animali","cibo","oggetti_casa","trasporti","natura","attrezzi","sport","abbigliamento"],
        "diversityRule": "max_1_per_category_per_trial",
        "minDataset": 200
      },
      "delayTask": "bouncing_ball_tap",
      "sessionTimer": "no_fixed_timer"
    }
  ]
}
```
