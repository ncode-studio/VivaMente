/**
 * wordlists.generated.ts — wordlist semantiche espanse per Verbal Fluency.
 *
 * ⚠️ IN REVISIONE — non ancora cablato nella validazione. Sostituirà wordlists.ts
 * dopo l'approvazione delle liste.
 *
 * Una parola digitata in fluenza categoriale è VALIDA se (dopo normalizzazione)
 * è presente nel Set della categoria. La lista è autoritativa: per questo deve
 * essere generosa e contenere i sinonimi/varianti comuni che un anziano digita.
 *
 * Le parole qui sono in forma leggibile (con accenti); vengono normalizzate
 * (lowercase + accenti → ASCII) da buildWordlistSet() per il confronto.
 */

import { normalizzaParola } from "./dizionario";

function buildWordlistSet(words: string[]): Set<string> {
  return new Set(words.map(normalizzaParola));
}

/** Liste grezze (leggibili). Chiave = id categoria in categorie.ts. */
export const VF_WORDLISTS_RAW: Record<string, string[]> = {
  // ───────────────────────────── animali (molto ampia) ─────────────────────────
  animali: [
    "cane", "gatto", "topo", "ratto", "leone", "leonessa", "tigre", "elefante", "giraffa", "scimmia",
    "gorilla", "scimpanzé", "orango", "babbuino", "lemure", "orso", "orsa", "lupo", "lupa", "volpe",
    "cervo", "cerva", "capriolo", "daino", "renna", "alce", "cinghiale", "coniglio", "lepre", "mucca",
    "vacca", "toro", "vitello", "bue", "cavallo", "cavalla", "puledro", "asino", "mulo", "pony",
    "pecora", "agnello", "montone", "ariete", "capra", "capretto", "maiale", "scrofa", "porcello", "verro",
    "gallina", "gallo", "pulcino", "anatra", "anatroccolo", "oca", "tacchino", "faraona", "quaglia", "fagiano",
    "piccione", "colomba", "passero", "passerotto", "rondine", "merlo", "usignolo", "cardellino", "fringuello", "cinciallegra",
    "pettirosso", "tordo", "allodola", "cuculo", "picchio", "aquila", "falco", "poiana", "avvoltoio", "gufo",
    "civetta", "barbagianni", "corvo", "cornacchia", "gazza", "ghiandaia", "cigno", "airone", "fenicottero", "pellicano",
    "gabbiano", "cormorano", "pinguino", "struzzo", "emù", "pavone", "tucano", "pappagallo", "cocorita", "canarino",
    "balena", "capodoglio", "delfino", "orca", "squalo", "tonno", "sardina", "acciuga", "sgombro", "trota",
    "salmone", "merluzzo", "nasello", "branzino", "orata", "sogliola", "spigola", "carpa", "luccio", "anguilla",
    "polpo", "seppia", "calamaro", "totano", "granchio", "gambero", "gamberetto", "aragosta", "astice", "scampo",
    "cozza", "vongola", "ostrica", "capesante", "lumaca", "chiocciola", "medusa", "stella", "riccio", "cavalluccio",
    "serpente", "vipera", "biscia", "pitone", "boa", "cobra", "lucertola", "geco", "ramarro", "iguana",
    "camaleonte", "coccodrillo", "alligatore", "varano", "rana", "rospo", "raganella", "tartaruga", "testuggine", "salamandra",
    "ape", "vespa", "calabrone", "bombo", "mosca", "moscerino", "zanzara", "tafano", "formica", "termite",
    "ragno", "scorpione", "acaro", "zecca", "pulce", "pidocchio", "farfalla", "falena", "bruco", "libellula",
    "cavalletta", "grillo", "cicala", "mantide", "scarabeo", "coccinella", "lucciola", "scarafaggio", "blatta", "millepiedi",
    "lumacone", "verme", "lombrico", "panda", "koala", "canguro", "vombato", "ornitorinco", "zebra", "ippopotamo",
    "rinoceronte", "cammello", "dromedario", "alpaca", "lama", "bisonte", "bufalo", "gnu", "antilope", "gazzella",
    "criceto", "scoiattolo", "marmotta", "ghiro", "castoro", "talpa", "donnola", "furetto", "puzzola", "tasso",
    "lontra", "procione", "ghepardo", "leopardo", "giaguaro", "puma", "pantera", "lince", "ocelot", "iena",
    "sciacallo", "suricato", "armadillo", "bradipo", "formichiere", "tapiro", "okapi", "pangolino", "istrice", "porcospino",
  ],

  // ──────────────────────── cibo / cose da mangiare (molto ampia) ──────────────
  cibo: [
    "pane", "pasta", "pizza", "riso", "carne", "pesce", "pollo", "tacchino", "coniglio", "manzo",
    "vitello", "maiale", "agnello", "prosciutto", "salame", "mortadella", "bresaola", "speck", "pancetta", "salsiccia",
    "wurstel", "hamburger", "bistecca", "arrosto", "stufato", "spezzatino", "cotoletta", "scaloppina", "polpetta", "polpettone",
    "uovo", "uova", "frittata", "omelette", "formaggio", "mozzarella", "parmigiano", "grana", "pecorino", "gorgonzola",
    "stracchino", "ricotta", "mascarpone", "scamorza", "provola", "fontina", "caciotta", "yogurt", "latte", "burro",
    "panna", "gelato", "torta", "biscotto", "crostata", "cornetto", "brioche", "panettone", "pandoro", "colomba",
    "cioccolato", "caramella", "marmellata", "miele", "zucchero", "sale", "pepe", "olio", "aceto", "senape",
    "lasagna", "cannelloni", "gnocchi", "risotto", "tortellini", "ravioli", "spaghetti", "penne", "fusilli", "rigatoni",
    "tagliatelle", "fettuccine", "linguine", "maccheroni", "farfalle", "orecchiette", "trofie", "tortelloni", "agnolotti", "passatelli",
    "insalata", "minestra", "minestrone", "zuppa", "brodo", "vellutata", "passato", "polenta", "couscous", "farro",
    "frutta", "verdura", "mela", "pera", "banana", "arancia", "uva", "fragola", "ciliegia", "pesca",
    "albicocca", "prugna", "melone", "anguria", "ananas", "kiwi", "limone", "mandarino", "fico", "pompelmo",
    "pomodoro", "carota", "patata", "zucchina", "melanzana", "peperone", "cipolla", "aglio", "sedano", "finocchio",
    "spinaci", "broccoli", "cavolfiore", "cavolo", "zucca", "cetriolo", "fagioli", "piselli", "ceci", "lenticchie",
    "prezzemolo", "basilico", "rosmarino", "salvia", "origano", "panino", "tramezzino", "piadina", "focaccia", "grissini",
    "cracker", "fette", "biscottate", "cereali", "muesli", "cornflakes", "marmellate", "nutella", "crema", "budino",
    "tonno", "salmone", "acciughe", "baccalà", "calamari", "gamberi", "cozze", "vongole", "frittura", "sushi",
    "noci", "nocciole", "mandorle", "pistacchi", "arachidi", "castagne", "pinoli", "datteri", "uvetta", "fichi",
    "caffè", "tè", "cappuccino", "succo", "spremuta", "acqua", "vino", "birra", "aranciata", "limonata",
    "popcorn", "patatine", "olive", "sottaceti", "maionese", "ketchup", "ragù", "pesto", "besciamella", "sugo",
  ],

  // ────────────────────── oggetti che si trovano in casa (molto ampia) ─────────
  oggetti_casa: [
    "tavolo", "sedia", "poltrona", "divano", "letto", "cuscino", "coperta", "lenzuolo", "materasso", "armadio",
    "cassettiera", "comodino", "libreria", "scrivania", "scaffale", "mensola", "tappeto", "specchio", "quadro", "lampada",
    "lampadario", "candela", "tenda", "orologio", "sveglia", "televisore", "telefono", "computer", "radio", "stereo",
    "frigorifero", "forno", "lavatrice", "lavastoviglie", "aspirapolvere", "ferro", "asse", "bilancia", "scala", "sgabello",
    "scopa", "spazzola", "secchio", "straccio", "paletta", "panno", "strofinaccio", "asciugamano", "accappatoio", "sapone",
    "shampoo", "spazzolino", "dentifricio", "pettine", "rasoio", "phon", "piatto", "bicchiere", "tazza", "tazzina",
    "ciotola", "scodella", "coltello", "forchetta", "cucchiaio", "cucchiaino", "tegame", "pentola", "padella", "casseruola",
    "colino", "mestolo", "grattugia", "apriscatole", "tappo", "cavatappi", "tovaglia", "tovagliolo", "sottobicchiere", "vassoio",
    "vaso", "portafiori", "chiavi", "portachiavi", "portafoglio", "borsa", "ombrello", "gruccia", "stampella", "cesto",
    "scatola", "valigia", "trolley", "zaino", "libro", "quaderno", "penna", "matita", "gomma", "forbici",
    "righello", "temperino", "colla", "nastro", "spago", "filo", "ago", "bottone", "spilla", "molletta",
    "candeggina", "detersivo", "spugna", "guanti", "cestino", "pattumiera", "bidone", "scopino", "vaschetta", "bacinella",
    "asciugacapelli", "ventilatore", "stufa", "termosifone", "caldaia", "boiler", "interruttore", "presa", "spina", "lampadina",
    "chiave", "serratura", "maniglia", "cardine", "gancio", "chiodo", "vite", "martello", "cacciavite", "pinza",
    "trapano", "sega", "tenaglia", "livella", "metro", "carriola", "innaffiatoio", "rastrello", "vanga", "zappa",
    "fornello", "cappa", "tostapane", "frullatore", "spremiagrumi", "bollitore", "moka", "caffettiera", "teiera", "zuccheriera",
  ],

  // ────────────────────────── mezzi di trasporto (molto ampia) ─────────────────
  mezzi_trasporto: [
    "automobile", "auto", "macchina", "camion", "autobus", "pullman", "corriera", "tram", "metropolitana", "metro",
    "treno", "locomotiva", "vagone", "moto", "motocicletta", "motorino", "scooter", "ciclomotore", "bicicletta", "bici",
    "monopattino", "tandem", "risciò", "aereo", "aeroplano", "elicottero", "deltaplano", "aliante", "parapendio", "mongolfiera",
    "dirigibile", "razzo", "navicella", "barca", "barchetta", "nave", "traghetto", "battello", "motoscafo", "gommone",
    "canoa", "kayak", "yacht", "veliero", "zattera", "gondola", "piroga", "sottomarino", "peschereccio", "rimorchiatore",
    "trattore", "camioncino", "furgone", "furgoncino", "autocarro", "bisarca", "betoniera", "ruspa", "escavatore", "gru",
    "ambulanza", "pompieri", "autopompa", "volante", "taxi", "limousine", "fuoristrada", "suv", "jeep", "cabriolet",
    "decappottabile", "monovolume", "berlina", "utilitaria", "coupé", "roulotte", "camper", "caravan", "rimorchio",
    "carrozza", "calesse", "carro", "carretto", "carriola", "slitta", "slittino", "bob", "skateboard", "pattini",
    "monociclo", "funivia", "cabinovia", "seggiovia", "funicolare", "teleferica", "sciovia",
    "aliscafo", "catamarano", "chiatta", "portaerei", "cacciatorpediniere", "fregata", "galeone", "caravella", "vaporetto",
  ],

  // ─────────────────────── capi di abbigliamento (molto ampia) ─────────────────
  abbigliamento: [
    "maglia", "maglietta", "camicia", "camicetta", "blusa", "felpa", "maglione", "pullover", "cardigan", "gilet",
    "giacca", "giacchetta", "giubbotto", "giubbino", "cappotto", "soprabito", "piumino", "impermeabile", "trench", "mantella",
    "poncho", "pantaloni", "pantaloncini", "jeans", "leggings", "gonna", "minigonna", "vestito", "abito", "tailleur",
    "tuta", "tutina", "pigiama", "vestaglia", "camicione", "sottoveste", "reggiseno", "mutande", "slip", "boxer",
    "calzini", "calze", "collant", "calzamaglia", "sciarpa", "foulard", "guanti", "muffole", "cappello", "berretto",
    "cuffia", "cappuccio", "cintura", "bretelle", "fazzoletto", "cravatta", "papillon", "scarpe", "scarpa", "stivali",
    "stivaletti", "scarponi", "sandali", "ciabatte", "pantofole", "mocassini", "ballerine", "sneakers", "tacchi", "infradito",
    "zoccoli", "occhiali", "grembiule", "bermuda", "shorts", "costume", "bikini", "salopette", "smoking",
    "frac", "kimono", "tunica", "casacca", "polo", "canottiera", "body", "calzoncini", "pareo", "scialle",
    "golfino", "maglioncino", "spolverino", "parka", "montgomery", "loden", "panciotto", "corpetto",
  ],

  // ──────────────────────────────── colori (molto ampia) ───────────────────────
  colori: [
    "rosso", "blu", "verde", "giallo", "nero", "bianco", "grigio", "marrone", "viola", "rosa",
    "arancione", "arancio", "celeste", "azzurro", "beige", "ocra", "fucsia", "magenta", "ciano", "turchese",
    "smeraldo", "oro", "dorato", "argento", "argentato", "bronzo", "rame", "avorio", "panna", "crema",
    "sabbia", "ruggine", "indaco", "lavanda", "lilla", "amaranto", "cremisi", "scarlatto", "vermiglio", "carminio",
    "porpora", "bordeaux", "granata", "corallo", "salmone", "albicocca", "pesca", "menta", "pistacchio", "oliva",
    "kaki", "senape", "cobalto", "petrolio", "carta", "ardesia", "antracite", "ebano", "fumo", "perla",
    "ghiaccio", "neve", "latte", "cipria", "malva", "glicine", "prugna", "melanzana", "mattone", "terracotta",
    "cammello", "tabacco", "cioccolato", "caffè", "nocciola", "castagna", "miele", "ambra", "zafferano", "limone",
  ],

  // ────────────────────────── mobili e arredi (molto ampia) ────────────────────
  mobili: [
    "tavolo", "tavolino", "sedia", "sgabello", "poltrona", "divano", "divanetto", "letto", "lettino", "armadio",
    "armadietto", "cassettiera", "comò", "comodino", "libreria", "scaffale", "scrivania", "mensola", "credenza", "vetrina",
    "buffet", "madia", "panca", "panchetto", "guardaroba", "cabina", "attaccapanni", "appendiabiti", "specchiera", "toeletta",
    "consolle", "cassapanca", "baule", "portariviste", "portaombrelli", "scarpiera", "pensile", "boiserie", "paravento", "trespolo",
    "poggiapiedi", "pouf", "ottomana", "branda", "culla", "fasciatoio", "box", "seggiolone",
    "cuccia", "cucina", "fornelli", "lavello", "bancone", "isola", "piano", "tavolato",
  ],

  // ─────────────────────── giochi e giocattoli (molto ampia) ───────────────────
  giocattoli: [
    "bambola", "bambolotto", "peluche", "orsacchiotto", "pupazzo", "macchinina", "trenino", "aeroplanino", "robot", "soldatino",
    "palla", "pallone", "pallina", "biglie", "trottola", "yoyo", "aquilone", "cerchio", "corda",
    "altalena", "scivolo", "dondolo", "cavalluccio", "monopattino", "triciclo", "pattini", "skateboard",
    "spada", "pistola", "fucile", "arco", "fionda", "tamburo", "trombetta", "fischietto", "carillon", "girandola",
    "puzzle", "cubo", "lego", "costruzioni", "mattoncini", "domino", "dama", "scacchi", "tombola",
    "carte", "monopoli", "battaglia", "navale", "oca", "dadi", "birilli",
    "secchiello", "paletta", "formine", "rastrello", "telecomando", "videogioco", "console",
    "kit", "plastilina", "pongo", "perline", "burattino", "marionetta", "teatrino", "casetta",
  ],

  // ───────────────────────── nazioni del mondo (molto ampia) ───────────────────
  paesi: [
    "italia", "francia", "germania", "spagna", "portogallo", "inghilterra", "irlanda", "scozia", "galles", "olanda",
    "belgio", "lussemburgo", "svizzera", "austria", "grecia", "turchia", "russia", "ucraina", "polonia", "romania",
    "ungheria", "danimarca", "svezia", "norvegia", "finlandia", "islanda", "slovenia", "croazia", "serbia", "bosnia",
    "montenegro", "albania", "bulgaria", "slovacchia", "cechia", "estonia", "lettonia", "lituania", "cipro", "malta",
    "monaco", "andorra", "vaticano", "marino", "liechtenstein", "moldavia", "bielorussia", "georgia", "armenia", "azerbaigian",
    "stati", "uniti", "america", "canada", "messico", "guatemala", "honduras", "nicaragua", "panama", "cuba",
    "giamaica", "haiti", "brasile", "argentina", "cile", "perù", "colombia", "venezuela", "ecuador", "bolivia",
    "paraguay", "uruguay", "cina", "giappone", "corea", "india", "pakistan", "bangladesh", "vietnam", "cambogia",
    "indonesia", "filippine", "malesia", "singapore", "mongolia", "nepal", "thailandia", "iran", "iraq", "israele",
    "siria", "libano", "giordania", "arabia", "yemen", "oman", "kuwait", "qatar", "egitto", "libia",
    "tunisia", "algeria", "marocco", "sudan", "etiopia", "kenya", "nigeria", "ghana", "senegal", "camerun",
    "congo", "angola", "mozambico", "tanzania", "uganda", "zambia", "zimbabwe", "namibia", "botswana", "sudafrica",
    "madagascar", "australia", "zelanda", "fiji", "samoa", "tonga", "afghanistan", "kazakistan", "uzbekistan", "turkmenistan", "tagikistan",
  ],

  // ──────────────────────── professioni e mestieri (molto ampia) ───────────────
  professioni: [
    "medico", "dottore", "infermiere", "farmacista", "dentista", "veterinario", "chirurgo", "psicologo", "fisioterapista", "ostetrica",
    "avvocato", "giudice", "notaio", "commercialista", "ragioniere", "architetto", "ingegnere", "geometra", "perito", "consulente",
    "insegnante", "maestro", "maestra", "professore", "preside", "bidello", "educatore", "ricercatore", "scienziato", "biologo",
    "fornaio", "panettiere", "pasticcere", "gelataio", "cuoco", "chef", "cameriere", "barista", "pizzaiolo", "macellaio",
    "salumiere", "fruttivendolo", "pescivendolo", "fioraio", "libraio", "cartolaio", "tabaccaio", "barbiere", "parrucchiere", "estetista",
    "sarto", "stilista", "calzolaio", "muratore", "idraulico", "elettricista", "falegname", "fabbro", "imbianchino", "piastrellista",
    "meccanico", "carrozziere", "gommista", "tassista", "autista", "camionista", "ferroviere", "pilota", "hostess", "marinaio",
    "capitano", "pescatore", "contadino", "agricoltore", "allevatore", "pastore", "giardiniere", "boscaiolo", "minatore", "operaio",
    "artigiano", "commerciante", "negoziante", "venditore", "commesso", "magazziniere", "fattorino", "corriere", "postino", "spazzino",
    "segretario", "impiegato", "manager", "direttore", "amministratore", "contabile", "cassiere", "bancario", "assicuratore", "agente",
    "poliziotto", "carabiniere", "vigile", "pompiere", "soldato", "generale", "guardia", "sentinella", "doganiere", "guardiano",
    "sacerdote", "prete", "suora", "monaco", "frate", "vescovo", "missionario", "attore", "attrice", "regista",
    "cantante", "musicista", "ballerino", "scrittore", "poeta", "pittore", "scultore", "fotografo", "giornalista", "conduttore",
    "presentatore", "politico", "sindaco", "presidente", "ministro", "deputato", "senatore", "diplomatico", "ambasciatore", "console",
    "astronauta", "esploratore", "archeologo", "geologo", "astronomo", "matematico", "fisico", "chimico", "informatico", "programmatore",
  ],

  // ─────────────────────────── tipi di frutta (media) ──────────────────────────
  frutta: [
    "mela", "pera", "banana", "arancia", "mandarino", "clementina", "limone", "lime", "pompelmo", "cedro",
    "bergamotto", "uva", "uvetta", "fragola", "fragolina", "lampone", "mirtillo", "mora", "ribes", "uvaspina",
    "ciliegia", "amarena", "pesca", "percoca", "nettarina", "albicocca", "prugna", "susina", "mirabella", "nespola",
    "melone", "anguria", "cocomero", "ananas", "kiwi", "mango", "papaya", "cocco", "fico", "carruba",
    "datteri", "melograno", "cachi", "loto", "castagna", "marrone", "noce", "nocciola", "mandorla", "pistacchio",
    "arachide", "pinolo", "avocado", "litchi",
    "sorba", "giuggiola", "corbezzolo", "azzeruolo", "gelso", "melagrana",
  ],

  // ──────────────────────── verdure e ortaggi (media) ──────────────────────────
  verdure: [
    "insalata", "lattuga", "rucola", "radicchio", "spinaci", "bietola", "cicoria", "scarola", "valeriana", "indivia",
    "carota", "patata", "cipolla", "aglio", "scalogno", "porro", "pomodoro", "peperone", "peperoncino", "melanzana",
    "zucchina", "zucca", "cetriolo", "sedano", "finocchio", "cavolo", "cavolfiore", "broccolo", "verza", "cavoletto",
    "rapa", "ravanello", "barbabietola", "carciofo", "asparago", "pisello", "fagiolo", "fava", "cece", "lenticchia",
    "fagiolino", "fungo", "champignon", "porcino", "tartufo", "prezzemolo", "basilico", "rosmarino", "salvia", "menta",
    "origano", "timo", "alloro", "erba", "cipollina", "mais", "granoturco", "oliva", "topinambur", "rafano",
    "crescione", "tarassaco", "ortica", "borragine", "catalogna", "puntarella", "cardo", "pastinaca", "rabarbaro", "agretti",
  ],

  // ──────────────────────── sport e attività fisiche (media) ───────────────────
  sport: [
    "calcio", "calcetto", "tennis", "pallavolo", "basket", "pallacanestro", "rugby", "golf", "cricket",
    "baseball", "hockey", "pallanuoto", "pallamano", "nuoto", "tuffi", "ginnastica", "atletica", "corsa", "maratona",
    "ciclismo", "sci", "snowboard", "slittino", "bob", "pattinaggio", "equitazione", "ippica", "tiro", "arco",
    "scherma", "boxe", "pugilato", "judo", "karate", "taekwondo", "lotta", "wrestling", "sumo",
    "vela", "windsurf", "surf", "canoa", "kayak", "canottaggio", "rafting", "arrampicata", "alpinismo",
    "trekking", "escursionismo", "yoga", "pilates", "danza", "ballo", "aerobica", "fitness", "spinning",
    "scacchi", "biliardo", "bocce", "bowling", "freccette", "tennistavolo", "pingpong", "badminton", "squash", "paracadutismo",
    "parapendio", "deltaplano", "immersione", "subacquea", "motociclismo", "automobilismo", "kart", "triathlon", "biathlon", "pentathlon",
  ],

  // ───────────────────────── strumenti musicali (media) ────────────────────────
  strumenti: [
    "chitarra", "basso", "violino", "viola", "violoncello", "contrabbasso", "arpa", "mandolino", "banjo", "ukulele",
    "liuto", "cetra", "pianoforte", "piano", "tastiera", "organo", "fisarmonica", "clavicembalo", "spinetta", "sintetizzatore",
    "celesta", "flauto", "ottavino", "oboe", "clarinetto", "fagotto", "sassofono", "corno", "tromba", "trombone",
    "tuba", "cornetta", "armonica", "ocarina", "zampogna", "cornamusa", "piffero", "bombarda",
    "tamburo", "batteria", "timpani", "piatti", "cembalo", "triangolo", "xilofono", "marimba", "vibrafono",
    "maracas", "tamburello", "castagnette", "nacchere", "bongo", "conga", "gong", "campana",
    "campanello", "carillon", "sonaglio", "tamtam", "rullante", "grancassa",
  ],

  // ──────────────────────────── fiori e piante (media) ─────────────────────────
  fiori: [
    "rosa", "tulipano", "margherita", "girasole", "orchidea", "giglio", "iris", "mimosa", "narciso", "fresia",
    "gerbera", "calla", "peonia", "camelia", "gardenia", "ortensia", "glicine", "gelsomino", "lavanda", "viola",
    "violetta", "ciclamino", "papavero", "fiordaliso", "ranuncolo", "anemone", "crisantemo", "dalia", "azalea", "rododendro",
    "magnolia", "oleandro", "ibisco", "bouganville", "clematide", "geranio", "petunia", "begonia", "primula", "mughetto",
    "edera", "felce", "cactus", "rosmarino", "basilico", "menta", "salvia", "timo", "ortica", "trifoglio",
    "quercia", "pino", "abete", "cipresso", "palma", "olivo", "olmo", "tiglio", "acero", "betulla",
    "platano", "pioppo", "faggio", "castagno", "noce", "salice", "frassino", "ontano", "larice", "sequoia",
    "bosso", "alloro", "agrifoglio", "ginepro", "biancospino", "sambuco", "nocciolo", "melo", "ciliegio", "mandorlo",
  ],

  // ─────────────────────────── paesi europei (media) ───────────────────────────
  paesi_europei: [
    "italia", "francia", "germania", "spagna", "portogallo", "inghilterra", "irlanda", "scozia", "galles", "olanda",
    "belgio", "lussemburgo", "svizzera", "austria", "grecia", "russia", "ucraina", "polonia", "romania", "ungheria",
    "danimarca", "svezia", "norvegia", "finlandia", "islanda", "slovenia", "croazia", "serbia", "bosnia", "montenegro",
    "albania", "macedonia", "bulgaria", "slovacchia", "cechia", "moldavia", "bielorussia", "estonia", "lettonia", "lituania",
    "cipro", "malta", "monaco", "andorra", "vaticano", "marino", "liechtenstein", "kosovo", "turchia", "georgia",
  ],

  // ────────────────────────── animali domestici (media) ───────────────────────
  animali_domestici: [
    "cane", "gatto", "coniglio", "criceto", "cavia", "porcellino", "topo", "ratto", "gerbillo", "furetto",
    "canarino", "pappagallo", "cocorita", "cardellino", "pettirosso", "passero", "piccione", "colomba", "tartaruga", "testuggine",
    "pesce", "pesciolino", "carpa", "guppy", "scalare", "betta", "iguana", "geco", "camaleonte", "serpente",
    "biscia", "scoiattolo", "gallina", "oca", "anatra", "tacchino", "faraona", "quaglia", "colombo", "pavone",
    "fagiano", "cincia", "fringuello", "merlo", "usignolo", "tortora", "inseparabile", "calopsite", "diamantino", "pony",
  ],

  // ──────────────── cibi e dolci tipici italiani (media) ───────────────────────
  cibi_dolci: [
    "tiramisù", "pannacotta", "cannolo", "cannoli", "cassata", "sfogliatella", "babà", "zeppola", "struffoli", "mostaccioli",
    "cantucci", "ricciarelli", "panforte", "torrone", "croccante", "mandorlato", "amaretto", "amaretti", "pandoro", "panettone",
    "colomba", "crostata", "caprese", "sacher", "millefoglie", "profiterole", "bignè", "cioccolatino", "tartufo", "pralina",
    "cremino", "gianduiotto", "gianduia", "semifreddo", "gelato", "sorbetto", "granita", "budino", "mousse", "zabaione",
    "castagnaccio", "frittella", "krapfen", "ciambella", "ciambellone", "muffin", "biscotto", "savoiardo", "frollino", "baci",
    "wafer", "cheesecake", "crostatina", "pastiera", "zuccotto", "bonet", "panna", "meringa", "spumone", "cassatella",
    "torta", "plumcake", "strudel", "brioche", "cornetto", "maritozzo", "graffa", "bombolone", "sfoglia", "pasticcino",
  ],

  // ────────────────────────── elettrodomestici (media) ────────────────────────
  elettrodomestici: [
    "frigorifero", "frigo", "congelatore", "freezer", "forno", "fornello", "microonde", "lavatrice", "lavastoviglie", "asciugatrice",
    "asciugacapelli", "phon", "piastra", "ferro", "aspirapolvere", "scopa", "robot", "ventilatore", "condizionatore", "climatizzatore",
    "stufa", "stufetta", "umidificatore", "deumidificatore", "purificatore", "tostapane", "frullatore", "mixer", "sbattitore", "planetaria",
    "impastatrice", "spremiagrumi", "centrifuga", "estrattore", "bollitore", "scaldabagno", "caldaia", "televisore", "radio", "stereo",
    "amplificatore", "computer", "tablet", "stampante", "scanner", "telefono", "smartphone", "cellulare", "decoder", "videoregistratore",
    "macinacaffè", "tritatutto", "grattugia", "yogurtiera", "gelatiera", "friggitrice", "vaporiera", "macchina", "depuratore", "videocitofono",
  ],

  // ────────────────────────── utensili da cucina (media) ───────────────────────
  lavori_cucina: [
    "coltello", "forchetta", "cucchiaio", "cucchiaino", "mestolo", "schiumarola", "frusta", "sbattitore", "grattugia", "pelapatate",
    "spremiagrumi", "apriscatole", "cavatappi", "tagliere", "mattarello", "matterello", "scolapasta", "colino", "imbuto", "caraffa",
    "brocca", "bottiglia", "barattolo", "contenitore", "vassoio", "sottopentola", "strofinaccio", "canovaccio", "pentola", "pentolino",
    "casseruola", "padella", "tegame", "wok", "crepiera", "bistecchiera", "piastra", "griglia", "teglia", "stampo",
    "tortiera", "ciotola", "insalatiera", "zuppiera", "piatto", "piattino", "bicchiere", "tazza", "tazzina", "calice",
    "tovaglia", "tovagliolo", "posata", "centrotavola", "sottobicchiere", "oliera", "saliera", "pepiera", "zuccheriera", "formaggera",
    "schiaccianoci", "schiacciapatate", "spatola", "paletta", "pennello", "siringa", "termometro", "timer", "dosatore", "macinino",
  ],
};

/** Wordlist normalizzate (id categoria → Set<string>). */
export const VF_WORDLISTS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(VF_WORDLISTS_RAW).map(([id, words]) => [id, buildWordlistSet(words)]),
);

export function hasWordlist(categoriaId: string): boolean {
  return categoriaId in VF_WORDLISTS;
}

export function getWordlist(categoriaId: string): Set<string> | undefined {
  return VF_WORDLISTS[categoriaId];
}
