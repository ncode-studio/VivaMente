/**
 * components/esercizi/families/memoria-comprensione-testo/testi-ordine.ts
 *
 * Pool di testi narrativi per Ordine Narrativo MBT (esercizio 3 — Tabella B).
 * Ogni testo ha una sequenza causale esplicita scomponibile in eventi atomici.
 *
 * Band per nEventi base:
 *   3 eventi → lv 1-2  (nFrasi ≈ 3, max 5 eventi con micro-prog)
 *   4 eventi → lv 3-5  (nFrasi ≈ 4, max 6 eventi con micro-prog)
 *   5 eventi → lv 6-8  (nFrasi ≈ 5, max 7 eventi con micro-prog)
 *   6 eventi → lv 9-10 (nFrasi ≈ 6, max 8 eventi con micro-prog)
 *
 * Formato eventi: azione + soggetto, senza connettivi causali espliciti.
 * Distrattori: eventi coerenti con il tema ma assenti nel testo.
 */

export interface EventoNarrativo {
  id:    string;
  testo: string;
}

export interface MCTOrdineTestoEntry {
  id:          string;
  nEventi:     number;  // numero eventi corretti nella sequenza base
  testo:       string;
  eventi:      EventoNarrativo[];  // in ordine corretto; length ≥ nEventi + 2
  distrattori: EventoNarrativo[];  // pool per questa storia (almeno 3)
}

// ── Band nEventi = 3 (lv 1-2) ─────────────────────────────────────────────────

export const MCTON_TESTI_3: readonly MCTOrdineTestoEntry[] = [

  {
    id: "on_pane_fornaio",
    nEventi: 3,
    testo:
      "Il fornaio impasta la farina con l'acqua e il lievito nella grande ciotola. " +
      "Mette il pane nel forno caldo e aspetta che lieviti. " +
      "Quando il pane è dorato, lo tira fuori e lo mette sul bancone.",
    eventi: [
      { id: "e1", testo: "Il fornaio impasta la farina nella ciotola." },
      { id: "e2", testo: "Il fornaio mette il pane nel forno." },
      { id: "e3", testo: "Il fornaio tira fuori il pane dorato." },
      { id: "e4", testo: "Il fornaio mette il pane sul bancone." },
      { id: "e5", testo: "I clienti entrano a comprare il pane." },
    ],
    distrattori: [
      { id: "d1", testo: "Il fornaio consegna il pane a domicilio." },
      { id: "d2", testo: "Il fornaio compra nuovi sacchi di farina." },
      { id: "d3", testo: "Il fornaio pulisce il forno." },
    ],
  },

  {
    id: "on_lettera_nonno",
    nEventi: 3,
    testo:
      "Il nonno scrive una lunga lettera alla nipote che vive lontano. " +
      "Chiude la lettera nella busta e ci scrive l'indirizzo. " +
      "Esce di casa e la porta all'ufficio postale per spedirla.",
    eventi: [
      { id: "e1", testo: "Il nonno scrive la lettera alla nipote." },
      { id: "e2", testo: "Il nonno chiude la lettera nella busta." },
      { id: "e3", testo: "Il nonno porta la lettera all'ufficio postale." },
      { id: "e4", testo: "Il postino prende in consegna la lettera." },
      { id: "e5", testo: "La nipote riceve la lettera a casa." },
    ],
    distrattori: [
      { id: "d1", testo: "Il nonno compra un francobollo al bar." },
      { id: "d2", testo: "La nipote risponde con un messaggio." },
      { id: "d3", testo: "Il nonno telefona alla nipote." },
    ],
  },

  {
    id: "on_temporale_panni",
    nEventi: 3,
    testo:
      "Il cielo si copre di nuvole nere e inizia a tuonare. " +
      "La signora Marta raccoglie in fretta i panni stesi in giardino. " +
      "Corre in casa e chiude tutte le finestre prima della pioggia.",
    eventi: [
      { id: "e1", testo: "Il cielo si copre di nuvole nere." },
      { id: "e2", testo: "La signora Marta raccoglie i panni dal giardino." },
      { id: "e3", testo: "La signora Marta chiude le finestre di casa." },
      { id: "e4", testo: "La pioggia inizia a cadere forte." },
      { id: "e5", testo: "La signora Marta accende il riscaldamento." },
    ],
    distrattori: [
      { id: "d1", testo: "La signora Marta telefona al marito." },
      { id: "d2", testo: "La signora Marta porta l'ombrello fuori." },
      { id: "d3", testo: "Il temporale dura tutta la notte." },
    ],
  },

  {
    id: "on_cane_cancello",
    nEventi: 3,
    testo:
      "Il bambino sente il cane del vicino abbaiare forte fuori dal cancello. " +
      "Apre il cancello e lo fa entrare nel giardino di casa. " +
      "Poi va a chiamare il vicino per avvisarlo.",
    eventi: [
      { id: "e1", testo: "Il bambino sente il cane abbaiare fuori dal cancello." },
      { id: "e2", testo: "Il bambino apre il cancello e fa entrare il cane." },
      { id: "e3", testo: "Il bambino va a chiamare il vicino." },
      { id: "e4", testo: "Il vicino ringrazia il bambino." },
      { id: "e5", testo: "Il cane viene riportato a casa sua." },
    ],
    distrattori: [
      { id: "d1", testo: "Il bambino porta da mangiare al cane." },
      { id: "d2", testo: "Il cane scappa nel giardino." },
      { id: "d3", testo: "Il bambino chiama i suoi genitori." },
    ],
  },

  {
    id: "on_gita_lago",
    nEventi: 3,
    testo:
      "Lucia prepara uno zaino con un panino, l'acqua e la giacca impermeabile. " +
      "Parte a piedi verso il lago a pochi chilometri da casa. " +
      "Arriva al lago, si siede sulla riva e guarda i pesci nuotare.",
    eventi: [
      { id: "e1", testo: "Lucia prepara lo zaino con panino e giacca." },
      { id: "e2", testo: "Lucia parte a piedi verso il lago." },
      { id: "e3", testo: "Lucia si siede sulla riva del lago." },
      { id: "e4", testo: "Lucia mangia il panino guardando l'acqua." },
      { id: "e5", testo: "Lucia torna a casa prima di sera." },
    ],
    distrattori: [
      { id: "d1", testo: "Lucia incontra un'amica al lago." },
      { id: "d2", testo: "Lucia fa il bagno nel lago." },
      { id: "d3", testo: "Lucia fotografa i paesaggi." },
    ],
  },
];

// ── Band nEventi = 4 (lv 3-5) ─────────────────────────────────────────────────

export const MCTON_TESTI_4: readonly MCTOrdineTestoEntry[] = [

  {
    id: "on_visita_nonna",
    nEventi: 4,
    testo:
      "La domenica mattina, Giorgio sale in macchina e parte per andare a trovare sua nonna. " +
      "Arriva al palazzo, suona il campanello e sale le scale. " +
      "La nonna lo abbraccia alla porta e lo fa entrare in cucina. " +
      "Mangiano insieme la minestra calda che lei aveva preparato.",
    eventi: [
      { id: "e1", testo: "Giorgio sale in macchina e parte." },
      { id: "e2", testo: "Giorgio suona il campanello della nonna." },
      { id: "e3", testo: "Giorgio sale le scale del palazzo." },
      { id: "e4", testo: "La nonna abbraccia Giorgio alla porta." },
      { id: "e5", testo: "Giorgio e la nonna mangiano la minestra insieme." },
      { id: "e6", testo: "Giorgio saluta la nonna e torna a casa." },
    ],
    distrattori: [
      { id: "d1", testo: "Giorgio porta un dolce alla nonna." },
      { id: "d2", testo: "La nonna prepara il caffè." },
      { id: "d3", testo: "Giorgio guarda la televisione con la nonna." },
    ],
  },

  {
    id: "on_bici_forata",
    nEventi: 4,
    testo:
      "Marco nota che la ruota della sua bicicletta è completamente sgonfia. " +
      "Prende il kit di riparazione dalla rimessa e cerca il buco nel copertone. " +
      "Trova il foro immergengo la camera d'aria in un catino d'acqua. " +
      "Incolla la toppa sul buco, rimonta la ruota e gonfia la camera d'aria.",
    eventi: [
      { id: "e1", testo: "Marco nota che la ruota è sgonfia." },
      { id: "e2", testo: "Marco prende il kit di riparazione dalla rimessa." },
      { id: "e3", testo: "Marco immerge la camera d'aria nel catino d'acqua." },
      { id: "e4", testo: "Marco trova il buco nella camera d'aria." },
      { id: "e5", testo: "Marco incolla la toppa sul buco." },
      { id: "e6", testo: "Marco gonfia di nuovo la ruota della bici." },
    ],
    distrattori: [
      { id: "d1", testo: "Marco porta la bici in un negozio." },
      { id: "d2", testo: "Marco compra una ruota nuova." },
      { id: "d3", testo: "Marco chiede aiuto a suo padre." },
    ],
  },

  {
    id: "on_funghi_bosco",
    nEventi: 4,
    testo:
      "La mattina presto, Enzo e suo fratello si alzano e si vestono con stivali pesanti. " +
      "Prendono i cestini di vimini e partono verso il bosco vicino al paese. " +
      "Camminano tra gli alberi cercando i porcini sotto le foglie bagnate. " +
      "Tornano a casa a mezzogiorno con i cestini pieni di funghi.",
    eventi: [
      { id: "e1", testo: "Enzo e suo fratello si alzano presto." },
      { id: "e2", testo: "I due fratelli si vestono con stivali pesanti." },
      { id: "e3", testo: "I fratelli prendono i cestini e partono." },
      { id: "e4", testo: "Cercano i porcini sotto le foglie nel bosco." },
      { id: "e5", testo: "I fratelli tornano a casa con i cestini pieni." },
      { id: "e6", testo: "Enzo pulisce i funghi in cucina." },
    ],
    distrattori: [
      { id: "d1", testo: "I fratelli si perdono nel bosco." },
      { id: "d2", testo: "Enzo vende i funghi al mercato." },
      { id: "d3", testo: "I fratelli trovano un sentiero nuovo." },
    ],
  },

  {
    id: "on_pittura_stanza",
    nEventi: 4,
    testo:
      "La signora Elena decide di ridipingere il salotto di casa. " +
      "Compra la vernice al negozio di ferramenta e prepara pennelli e rulli. " +
      "Copre i mobili con fogli di plastica per non sporcarli. " +
      "Passa due mani di vernice sulle pareti e aspetta che la vernice asciughi.",
    eventi: [
      { id: "e1", testo: "Elena decide di ridipingere il salotto." },
      { id: "e2", testo: "Elena compra la vernice e i pennelli." },
      { id: "e3", testo: "Elena copre i mobili con fogli di plastica." },
      { id: "e4", testo: "Elena passa la prima mano di vernice sulle pareti." },
      { id: "e5", testo: "Elena aspetta che la vernice asciughi." },
      { id: "e6", testo: "Elena toglie i fogli di plastica dai mobili." },
    ],
    distrattori: [
      { id: "d1", testo: "Elena chiama un imbianchino professionista." },
      { id: "d2", testo: "Il marito di Elena aiuta a dipingere." },
      { id: "d3", testo: "Elena sceglie un colore diverso." },
    ],
  },

  {
    id: "on_orto_nonna",
    nEventi: 4,
    testo:
      "In primavera la nonna Ida prepara la terra dell'orto con la vanga. " +
      "Fa dei piccoli solchi nel terreno con un bastoncino. " +
      "Mette i semi di pomodoro nei solchi e li copre di terra. " +
      "Annaffia tutto con cura e aspetta che spuntino le prime piantine.",
    eventi: [
      { id: "e1", testo: "La nonna prepara la terra con la vanga." },
      { id: "e2", testo: "La nonna fa i solchi nel terreno." },
      { id: "e3", testo: "La nonna mette i semi di pomodoro nei solchi." },
      { id: "e4", testo: "La nonna copre i semi di terra." },
      { id: "e5", testo: "La nonna annaffia l'orto con cura." },
      { id: "e6", testo: "La nonna aspetta che spuntino le piantine." },
    ],
    distrattori: [
      { id: "d1", testo: "La nonna raccoglie i pomodori maturi." },
      { id: "d2", testo: "La nonna compra le piantine al vivaio." },
      { id: "d3", testo: "La nonna mette il concime nella terra." },
    ],
  },
];

// ── Band nEventi = 5 (lv 6-8) ─────────────────────────────────────────────────

export const MCTON_TESTI_5: readonly MCTOrdineTestoEntry[] = [

  {
    id: "on_festa_sorpresa",
    nEventi: 5,
    testo:
      "La mattina di sabato, il signor Bruno decide di organizzare una festa a sorpresa per il compleanno della moglie. " +
      "Va al supermercato e compra dolci, bevande e tutto l'occorrente per cucinare. " +
      "Torna a casa e prepara panini e torta mentre la moglie è fuori a fare una passeggiata. " +
      "Telefona agli amici e li invita a venire nel pomeriggio. " +
      "Quando la moglie rientra, trova tutti i suoi amici riuniti ad aspettarla con un grande applauso.",
    eventi: [
      { id: "e1", testo: "Bruno decide di organizzare una festa a sorpresa." },
      { id: "e2", testo: "Bruno va al supermercato a fare la spesa." },
      { id: "e3", testo: "Bruno prepara i panini e la torta in cucina." },
      { id: "e4", testo: "Bruno telefona agli amici e li invita." },
      { id: "e5", testo: "Gli amici arrivano a casa di Bruno." },
      { id: "e6", testo: "La moglie rientra e trova tutti ad aspettarla." },
      { id: "e7", testo: "Gli amici cantano 'Tanti auguri' alla moglie." },
    ],
    distrattori: [
      { id: "d1", testo: "Bruno compra un regalo per la moglie." },
      { id: "d2", testo: "Gli amici portano dei fiori." },
      { id: "d3", testo: "Bruno decora il salotto con i palloncini." },
    ],
  },

  {
    id: "on_gatto_tetto",
    nEventi: 5,
    testo:
      "Il gatto di Teresa, Pallino, sale sul tetto di casa e non riesce a scendere. " +
      "Teresa lo chiama dal basso, ma lui miagola spaventato senza muoversi. " +
      "La donna chiama i pompieri al telefono per chiedere aiuto. " +
      "I pompieri arrivano con l'autoscala e salgono fino al tetto. " +
      "Con delicatezza, uno di loro prende Pallino in braccio e lo porta giù sano e salvo.",
    eventi: [
      { id: "e1", testo: "Pallino sale sul tetto e non riesce a scendere." },
      { id: "e2", testo: "Teresa chiama Pallino dal basso senza risultato." },
      { id: "e3", testo: "Teresa chiama i pompieri al telefono." },
      { id: "e4", testo: "I pompieri arrivano con l'autoscala." },
      { id: "e5", testo: "Un pompiere sale fino al tetto." },
      { id: "e6", testo: "Il pompiere prende Pallino e lo porta giù." },
      { id: "e7", testo: "Teresa ringrazia i pompieri con sollievo." },
    ],
    distrattori: [
      { id: "d1", testo: "I vicini escono in strada a guardare." },
      { id: "d2", testo: "Teresa porta da mangiare a Pallino." },
      { id: "d3", testo: "I pompieri portano una lunga scala di legno." },
    ],
  },

  {
    id: "on_ricetta_perduta",
    nEventi: 5,
    testo:
      "La signora Franca cerca per tutta la casa la ricetta della crostata copiata da un vecchio libro. " +
      "Trova un foglietto sgualcito in fondo a un cassetto della cucina. " +
      "Legge con attenzione gli ingredienti e li segna su un foglio nuovo. " +
      "Va al mercato e compra burro, marmellata e farina. " +
      "Torna a casa e prepara la crostata seguendo passo per passo la ricetta ritrovata.",
    eventi: [
      { id: "e1", testo: "La signora Franca cerca la ricetta in tutta la casa." },
      { id: "e2", testo: "Trova il foglietto sgualcito in un cassetto." },
      { id: "e3", testo: "Legge gli ingredienti e li segna su un foglio." },
      { id: "e4", testo: "Va al mercato a comprare gli ingredienti." },
      { id: "e5", testo: "Torna a casa e prepara la crostata." },
      { id: "e6", testo: "Mette la crostata nel forno e aspetta." },
      { id: "e7", testo: "La signora Franca assaggia la crostata con soddisfazione." },
    ],
    distrattori: [
      { id: "d1", testo: "La crostata brucia nel forno." },
      { id: "d2", testo: "La signora Franca chiede la ricetta a un'amica." },
      { id: "d3", testo: "La signora Franca trova la ricetta su internet." },
    ],
  },

  {
    id: "on_viaggio_treno",
    nEventi: 5,
    testo:
      "Il signor Alfredo deve prendere il treno per andare dal fratello che vive lontano. " +
      "La mattina presto si alza, fa la valigia e chiama un taxi per la stazione. " +
      "In stazione compra il biglietto alla macchinetta e trova il binario giusto. " +
      "Il treno parte puntuale e Alfredo trova un posto vicino al finestrino. " +
      "Dopo tre ore di viaggio, scende alla stazione giusta dove il fratello lo aspetta.",
    eventi: [
      { id: "e1", testo: "Alfredo si alza presto e fa la valigia." },
      { id: "e2", testo: "Alfredo chiama un taxi per andare in stazione." },
      { id: "e3", testo: "Alfredo compra il biglietto alla macchinetta." },
      { id: "e4", testo: "Alfredo trova il binario e sale sul treno." },
      { id: "e5", testo: "Il treno parte puntuale." },
      { id: "e6", testo: "Alfredo scende alla stazione dove lo aspetta il fratello." },
      { id: "e7", testo: "I due fratelli si abbracciano sul marciapiede." },
    ],
    distrattori: [
      { id: "d1", testo: "Alfredo perde il treno." },
      { id: "d2", testo: "Alfredo mangia qualcosa al bar della stazione." },
      { id: "d3", testo: "Il fratello telefona ad Alfredo durante il viaggio." },
    ],
  },

  {
    id: "on_perdita_acqua",
    nEventi: 5,
    testo:
      "Di notte Silvana sente un rumore strano provenire dal bagno. " +
      "Accende la luce e trova il tubo sotto il lavandino che perde acqua. " +
      "Prende un secchio e lo mette sotto il tubo per raccogliere l'acqua. " +
      "Poi trova il rubinetto principale e lo chiude per fermare la perdita. " +
      "La mattina dopo chiama un idraulico che viene a riparare il tubo rotto.",
    eventi: [
      { id: "e1", testo: "Silvana sente un rumore strano di notte." },
      { id: "e2", testo: "Silvana accende la luce e trova il tubo che perde." },
      { id: "e3", testo: "Silvana mette un secchio sotto il tubo." },
      { id: "e4", testo: "Silvana chiude il rubinetto principale dell'acqua." },
      { id: "e5", testo: "La mattina Silvana chiama l'idraulico." },
      { id: "e6", testo: "L'idraulico arriva e ripara il tubo rotto." },
      { id: "e7", testo: "Silvana riapre il rubinetto principale." },
    ],
    distrattori: [
      { id: "d1", testo: "Il pavimento del bagno si allaga." },
      { id: "d2", testo: "Silvana sveglia il marito per chiedere aiuto." },
      { id: "d3", testo: "L'idraulico arriva nel cuore della notte." },
    ],
  },
];

// ── Band nEventi = 6 (lv 9-10) ────────────────────────────────────────────────

export const MCTON_TESTI_6: readonly MCTOrdineTestoEntry[] = [

  {
    id: "on_borsa_perduta",
    nEventi: 6,
    testo:
      "La signora Ada è seduta sulla panchina del parco quando vede per terra una borsa abbandonata. " +
      "La raccoglie e la apre per cercare un documento del proprietario. " +
      "Trova un portafoglio con la carta d'identità di un uomo di nome Roberto Marini. " +
      "Chiama la polizia municipale per segnalare il ritrovamento. " +
      "Due agenti arrivano in poco tempo e prendono in consegna la borsa. " +
      "Il giorno dopo Ada riceve una telefonata di ringraziamento dall'uomo.",
    eventi: [
      { id: "e1", testo: "Ada vede una borsa abbandonata per terra nel parco." },
      { id: "e2", testo: "Ada raccoglie la borsa e la apre." },
      { id: "e3", testo: "Ada trova la carta d'identità di Roberto Marini." },
      { id: "e4", testo: "Ada chiama la polizia municipale." },
      { id: "e5", testo: "Due agenti arrivano nel parco." },
      { id: "e6", testo: "Gli agenti prendono in consegna la borsa." },
      { id: "e7", testo: "Roberto Marini telefona ad Ada per ringraziarla." },
      { id: "e8", testo: "Ada racconta l'accaduto ai suoi famigliari." },
    ],
    distrattori: [
      { id: "d1", testo: "Ada porta la borsa direttamente in commissariato." },
      { id: "d2", testo: "Roberto arriva di persona a ringraziare Ada." },
      { id: "d3", testo: "Ada trova molto denaro nella borsa." },
    ],
  },

  {
    id: "on_aquilone_nonno",
    nEventi: 6,
    testo:
      "Nonno Pietro decide di costruire un aquilone insieme ai nipoti per il pomeriggio. " +
      "Raccoglie dal ripostiglio due bastoncini sottili, carta velina colorata e uno spago. " +
      "Lega i bastoncini a croce con lo spago per formare la struttura. " +
      "Incolla la carta velina sopra la struttura e aspetta che asciughi. " +
      "Nel tardo pomeriggio porta i nipoti nel prato grande dietro casa. " +
      "Corre contro il vento con lo spago e l'aquilone sale in cielo tra le grida di gioia dei bambini.",
    eventi: [
      { id: "e1", testo: "Nonno Pietro decide di costruire un aquilone." },
      { id: "e2", testo: "Pietro raccoglie dal ripostiglio bastoncini, carta e spago." },
      { id: "e3", testo: "Pietro lega i bastoncini a croce per fare la struttura." },
      { id: "e4", testo: "Pietro incolla la carta velina sulla struttura e aspetta." },
      { id: "e5", testo: "Pietro porta i nipoti nel prato dietro casa." },
      { id: "e6", testo: "Pietro corre contro il vento tenendo lo spago." },
      { id: "e7", testo: "L'aquilone sale in cielo tra le urla di gioia." },
      { id: "e8", testo: "I nipoti chiedono di tenere lo spago a turno." },
    ],
    distrattori: [
      { id: "d1", testo: "I nipoti decorano l'aquilone con i pennarelli." },
      { id: "d2", testo: "L'aquilone si rompe e cade." },
      { id: "d3", testo: "Pietro compra un aquilone al negozio." },
    ],
  },

  {
    id: "on_spettacolo_scuola",
    nEventi: 6,
    testo:
      "La scuola organizza uno spettacolo teatrale per la fine dell'anno. " +
      "Le maestre scelgono il testo di una favola e assegnano le parti agli alunni. " +
      "I bambini provano ogni pomeriggio per tre settimane. " +
      "La scenografia viene dipinta dai genitori con l'aiuto degli insegnanti. " +
      "Il giorno dello spettacolo i bambini si truccano e indossano i costumi. " +
      "Il sipario si apre e il pubblico applaude i piccoli attori con grande entusiasmo.",
    eventi: [
      { id: "e1", testo: "Le maestre scelgono la favola da rappresentare." },
      { id: "e2", testo: "Le maestre assegnano le parti agli alunni." },
      { id: "e3", testo: "I bambini provano ogni pomeriggio per tre settimane." },
      { id: "e4", testo: "I genitori dipingono la scenografia con gli insegnanti." },
      { id: "e5", testo: "Il giorno dello spettacolo i bambini si truccano." },
      { id: "e6", testo: "I bambini indossano i costumi." },
      { id: "e7", testo: "Il sipario si apre." },
      { id: "e8", testo: "Il pubblico applaude i bambini con entusiasmo." },
    ],
    distrattori: [
      { id: "d1", testo: "Un bambino dimentica le battute sul palco." },
      { id: "d2", testo: "Le maestre distribuiscono il programma di sala." },
      { id: "d3", testo: "I bambini imparano le battute a casa." },
    ],
  },

  {
    id: "on_premiazione_volontari",
    nEventi: 6,
    testo:
      "Il Comune organizza una cerimonia per premiare i cittadini che si sono distinti nel volontariato. " +
      "Il sindaco apre la serata con un discorso di ringraziamento rivolto a tutti i volontari. " +
      "Uno per uno, i premiati vengono chiamati sul palco per nome. " +
      "Il sindaco stringe loro la mano e consegna una medaglia ricordo. " +
      "Al termine della cerimonia il Comune offre un rinfresco nella sala accanto. " +
      "I volontari si intrattengono con i famigliari venuti ad assistere.",
    eventi: [
      { id: "e1", testo: "Il Comune organizza la cerimonia di premiazione." },
      { id: "e2", testo: "Il sindaco apre la serata con un discorso." },
      { id: "e3", testo: "I premiati vengono chiamati sul palco uno per uno." },
      { id: "e4", testo: "Il sindaco stringe la mano a ogni premiato." },
      { id: "e5", testo: "Il sindaco consegna le medaglie ai volontari." },
      { id: "e6", testo: "Il Comune offre il rinfresco nella sala accanto." },
      { id: "e7", testo: "I volontari si intrattengono con i famigliari." },
      { id: "e8", testo: "La serata si conclude tra gli applausi." },
    ],
    distrattori: [
      { id: "d1", testo: "Un fotografo scatta le foto ufficiali durante la cerimonia." },
      { id: "d2", testo: "La banda musicale suona all'inizio della serata." },
      { id: "d3", testo: "Il sindaco legge il curriculum di ogni premiato." },
    ],
  },

  {
    id: "on_pulizia_cantina",
    nEventi: 6,
    testo:
      "La famiglia Benedetti decide di fare una grande pulizia in cantina prima dell'estate. " +
      "Il sabato mattina scendono tutti insieme con guanti e sacchi grandi. " +
      "Spostano le casse vecchie e raccolgono gli oggetti da eliminare. " +
      "Dividono le cose in due pile: una da buttare e una da donare. " +
      "Caricano i sacchi sull'auto e portano tutto al centro di raccolta comunale. " +
      "Il pomeriggio tornano in cantina e sistemano ordinatamente le cose rimaste.",
    eventi: [
      { id: "e1", testo: "La famiglia decide di pulire la cantina." },
      { id: "e2", testo: "Scendono in cantina con guanti e sacchi." },
      { id: "e3", testo: "Spostano le casse vecchie e raccolgono gli oggetti." },
      { id: "e4", testo: "Dividono gli oggetti in due pile: da buttare e da donare." },
      { id: "e5", testo: "Caricano i sacchi sull'auto." },
      { id: "e6", testo: "Portano tutto al centro di raccolta comunale." },
      { id: "e7", testo: "Tornano in cantina e sistemano le cose rimaste." },
      { id: "e8", testo: "La cantina è finalmente in ordine." },
    ],
    distrattori: [
      { id: "d1", testo: "La famiglia trova un vecchio album di foto." },
      { id: "d2", testo: "Il padre aggiusta una sedia rotta." },
      { id: "d3", testo: "La cantina viene ridipinta." },
    ],
  },
];
