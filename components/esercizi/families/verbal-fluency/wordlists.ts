/**
 * Wordlist per la fluenza semantica.
 * Liste non esaustive ma con parole comuni: una parola fuori lista viene
 * marcata come "non riconosciuta" e non contata nel punteggio.
 *
 * Le parole sono normalizzate (lowercase, senza accenti) — la match avviene
 * dopo normalize() della parola utente.
 */

function set(words: string[]): Set<string> {
  return new Set(words.map(w =>
    w.toLowerCase()
      .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
  ));
}

export const VF_WORDLISTS: Record<string, Set<string>> = {
  animali: set([
    "cane","gatto","topo","leone","tigre","elefante","giraffa","scimmia","orso","lupo",
    "volpe","cervo","cinghiale","coniglio","lepre","mucca","vacca","toro","cavallo","asino",
    "pecora","capra","maiale","gallina","gallo","anatra","oca","tacchino","piccione","passero",
    "rondine","aquila","falco","gufo","civetta","corvo","cornacchia","cigno","pinguino","struzzo",
    "balena","delfino","squalo","tonno","sardina","trota","salmone","merluzzo","polpo","seppia",
    "calamaro","granchio","gambero","aragosta","cozza","vongola","stella","serpente","lucertola","coccodrillo",
    "rana","rospo","tartaruga","ape","vespa","mosca","zanzara","formica","ragno","scorpione",
    "farfalla","cavalletta","grillo","scarafaggio","lumaca","verme","lombrico","pesce","uccello","insetto",
    "panda","koala","canguro","zebra","ippopotamo","rinoceronte","cammello","dromedario","alpaca","lama",
    "criceto","scoiattolo","riccio","castoro","procione","ghepardo","leopardo","giaguaro","puma","pantera",
  ]),
  cibo: set([
    "pane","pasta","pizza","riso","carne","pesce","pollo","tacchino","prosciutto","salame",
    "mortadella","bresaola","speck","wurstel","hamburger","bistecca","arrosto","stufato","spezzatino","cotoletta",
    "uovo","uova","formaggio","mozzarella","parmigiano","stracchino","ricotta","yogurt","latte","burro",
    "panna","gelato","torta","biscotto","crostata","cornetto","brioche","panettone","pandoro","colomba",
    "cioccolato","caramella","gelatina","marmellata","miele","zucchero","sale","pepe","olio","aceto",
    "lasagna","gnocchi","risotto","tortellini","ravioli","spaghetti","penne","fusilli","rigatoni","tagliatelle",
    "insalata","minestra","minestrone","zuppa","brodo","pollo","tonno","frittata","omelette","crepes",
    "frutta","verdura","mela","pera","banana","arancia","uva","fragola","ciliegia","pesca",
    "pomodoro","carota","patata","zucchina","melanzana","peperone","cipolla","aglio","prezzemolo","basilico",
    "pancake","muesli","cereali","fette","biscotte","grissini","cracker","focaccia","piadina","tramezzino",
    "panino","sandwich","kebab","sushi","risotti","polenta","castagne","noci","mandorle","nocciole",
  ]),
  oggetti_casa: set([
    "tavolo","sedia","poltrona","divano","letto","cuscino","coperta","lenzuolo","materasso","armadio",
    "cassettiera","comodino","libreria","scrivania","scaffale","mensola","tappeto","specchio","quadro","lampada",
    "lampadario","abat-jour","candela","tenda","tende","orologio","sveglia","televisore","telefono","computer",
    "frigorifero","forno","lavatrice","lavastoviglie","aspirapolvere","ferro","stiro","asse","bilancia","scala",
    "scopa","spazzola","secchio","mocio","panno","strofinaccio","asciugamano","accappatoio","saponetta","shampoo",
    "spazzolino","dentifricio","pettine","spazzolino","piatto","bicchiere","tazza","tazzina","ciotola","coltello",
    "forchetta","cucchiaio","cucchiaino","tegame","pentola","padella","casseruola","colino","mestolo","grattugia",
    "apriscatole","tappo","cavatappi","tovaglia","tovagliolo","sottobicchiere","portacenere","posacenere","vaso","portafiori",
    "chiavi","portachiavi","portafoglio","borsa","ombrello","scarpiera","appendiabiti","gruccia","stampella","cesto",
    "scatola","valigia","trolley","zaino","libro","quaderno","penna","matita","gomma","forbici",
  ]),
  mezzi_trasporto: set([
    "automobile","auto","macchina","camion","autobus","pullman","tram","metropolitana","metro","treno",
    "moto","motocicletta","scooter","bicicletta","monopattino","aereo","elicottero","barca","nave","traghetto",
    "gommone","canoa","kayak","yacht","veliero","sottomarino","mongolfiera","dirigibile","razzo","navicella",
    "trattore","camioncino","furgone","ambulanza","pompieri","polizia","carabinieri","taxi","limousine","fuoristrada",
    "suv","cabriolet","decappottabile","monovolume","berlina","utilitaria","station","wagon","coupe","jeep",
    "carrozza","calesse","slitta","carro","carretto","carriola","skateboard","pattini","monociclo","trike",
    "bici","mountain","bike","tandem","gondola","zattera","piroga","ape","camper","roulotte",
  ]),
  abbigliamento: set([
    "maglia","maglietta","camicia","camicetta","blusa","felpa","maglione","pullover","cardigan","gilet",
    "giacca","giubbotto","cappotto","piumino","impermeabile","trench","pantaloni","jeans","gonna","minigonna",
    "vestito","abito","tuta","tutina","pigiama","camicia","da","notte","accappatoio","reggiseno",
    "mutande","slip","boxer","calzini","calze","collant","calzamaglia","sciarpa","guanti","cappello",
    "berretto","cuffia","cappuccio","cintura","bretelle","fazzoletto","cravatta","papillon","scarpe","stivali",
    "stivaletti","scarponi","sandali","ciabatte","pantofole","mocassini","decollete","ballerine","sneakers","tacchi",
    "infradito","zoccoli","calzini","fazzoletti","occhiali","papille","grembiule","tuta","da","ginnastica",
    "shorts","bermuda","costume","da","bagno","bikini","tanga","short","slip","jeans",
  ]),
  colori: set([
    "rosso","blu","verde","giallo","nero","bianco","grigio","marrone","viola","rosa",
    "arancione","celeste","azzurro","beige","ocra","fucsia","magenta","ciano","turchese","verde",
    "smeraldo","oro","argento","bronzo","rame","avorio","panna","crema","sabbia","ruggine",
    "indaco","lavanda","lilla","amaranto","cremisi","scarlatto","vermiglio","carminio","mogano","caffe",
    "cacao","cioccolato","melanzana","prugna","corallo","salmone","albicocca","pesca","menta","pistacchio",
    "oliva","kaki","khaki","verde","acqua","verde","mela","verde","bottiglia","verde","oliva",
  ]),
  mobili: set([
    "tavolo","sedia","poltrona","divano","letto","armadio","cassettiera","comodino","libreria","scrivania",
    "scaffale","mensola","credenza","vetrina","tavolino","sgabello","panca","panchetto","sedile","sgabello",
    "guardaroba","cabina","armadietto","portaombrelli","appendiabiti","attaccapanni","specchiera","toilette","trumeau","secretaire",
    "consolle","etagere","comoda","cassapanca","baule","cesto","portariviste","portagiornali","portavasi","portafiori",
  ]),
  giocattoli: set([
    "bambola","peluche","orsacchiotto","macchinina","trenino","aeroplano","robot","pupazzo","palla","pallone",
    "pistola","spada","carta","carte","scacchi","dama","monopoli","puzzle","cubo","lego",
    "trottola","yo-yo","aquilone","biglie","pattini","skateboard","monopattino","altalena","scivolo","cavallino",
    "dondolo","cerchio","corda","saltarella","videogioco","console","playstation","nintendo","xbox","tablet",
    "telefonino","memory","tombola","mercante","risiko","cluedo","battaglia","navale","biliardo","ping-pong",
  ]),
  paesi: set([
    "italia","francia","germania","spagna","portogallo","inghilterra","gran","bretagna","irlanda","scozia",
    "olanda","belgio","lussemburgo","svizzera","austria","grecia","turchia","russia","ucraina","polonia",
    "romania","ungheria","danimarca","svezia","norvegia","finlandia","islanda","stati","uniti","america",
    "canada","messico","brasile","argentina","cile","peru","colombia","venezuela","cuba","cina",
    "giappone","corea","india","pakistan","iran","iraq","israele","egitto","libia","marocco",
    "tunisia","algeria","sudafrica","kenya","nigeria","etiopia","australia","nuova","zelanda","filippine",
    "indonesia","tailandia","vietnam","singapore","malesia","mongolia","kazakistan","afghanistan","siria","libano",
  ]),
  professioni: set([
    "medico","dottore","infermiere","infermiera","farmacista","dentista","veterinario","chirurgo","psicologo","fisioterapista",
    "avvocato","giudice","notaio","commercialista","contabile","ragioniere","architetto","ingegnere","geometra","perito",
    "insegnante","maestro","maestra","professore","professoressa","preside","bidello","educatore","ricercatore","scienziato",
    "fornaio","panettiere","pasticcere","gelataio","cuoco","chef","cameriere","barista","pizzaiolo","macellaio",
    "salumiere","fruttivendolo","pescivendolo","fioraio","libraio","cartolaio","tabaccaio","barbiere","parrucchiere","estetista",
    "sarto","sarta","stilista","calzolaio","ciabattino","muratore","idraulico","elettricista","falegname","fabbro",
    "meccanico","carrozziere","gommista","tassista","autista","camionista","ferroviere","pilota","hostess","steward",
    "marinaio","capitano","pescatore","contadino","agricoltore","pastore","giardiniere","operaio","artigiano","commerciante",
    "negoziante","venditore","commesso","commessa","segretario","segretaria","impiegato","manager","direttore","amministratore",
    "poliziotto","carabiniere","vigile","pompiere","soldato","generale","capitano","sacerdote","prete","suora",
    "monaco","frate","attore","attrice","cantante","musicista","ballerino","ballerina","scrittore","poeta",
    "pittore","scultore","fotografo","giornalista","conduttore","presentatore","politico","sindaco","presidente","ministro",
  ]),
  frutta: set([
    "mela","pera","banana","arancia","mandarino","limone","pompelmo","clementina","uva","fragola",
    "lampone","mirtillo","mora","ribes","ciliegia","ciliegie","pesca","pesche","albicocca","prugna",
    "susina","nespola","melone","anguria","cocomero","ananas","kiwi","mango","papaya","cocco",
    "fico","fichi","datteri","melograno","cachi","kaki","loto","castagna","castagne","noce",
    "nocciola","mandorla","pistacchio","arachide","pinolo","avocado","lime","cedro","bergamotto","kumquat",
  ]),
  verdure: set([
    "insalata","lattuga","rucola","radicchio","spinaci","bietola","cicoria","scarola","valeriana","indivia",
    "carota","patata","cipolla","aglio","scalogno","porro","pomodoro","peperone","peperoncino","melanzana",
    "zucchina","zucca","cetriolo","sedano","finocchio","cavolo","cavolfiore","broccolo","broccoli","verza",
    "rapa","ravanello","barbabietola","topinambur","carciofo","asparago","asparagi","piselli","fagioli","fave",
    "ceci","lenticchie","fagiolini","funghi","champignon","porcini","tartufo","prezzemolo","basilico","rosmarino",
    "salvia","menta","origano","timo","alloro","erba","cipollina","mais","granoturco","oliva","olive",
  ]),
  sport: set([
    "calcio","calcetto","tennis","pallavolo","basket","pallacanestro","rugby","golf","cricket","baseball",
    "hockey","pallanuoto","nuoto","tuffi","ginnastica","atletica","corsa","maratona","ciclismo","mountain",
    "bike","sci","snowboard","slittino","bob","pattinaggio","equitazione","ippica","tiro","arco",
    "scherma","boxe","pugilato","judo","karate","taekwondo","lotta","wrestling","sumo","mma",
    "vela","windsurf","surf","kitesurf","canoa","kayak","canottaggio","rafting","arrampicata","alpinismo",
    "trekking","escursionismo","yoga","pilates","danza","ballo","aerobica","fitness","spinning","crossfit",
    "scacchi","biliardo","bocce","bowling","freccette","tiro","piattello","tennistavolo","ping-pong","badminton",
  ]),
  strumenti: set([
    "chitarra","basso","violino","viola","violoncello","contrabbasso","arpa","mandolino","banjo","ukulele",
    "pianoforte","piano","tastiera","organo","fisarmonica","clavicembalo","spinetta","sintetizzatore","celesta","harmonium",
    "flauto","flauto","traverso","ottavino","oboe","clarinetto","fagotto","sassofono","corno","tromba",
    "trombone","tuba","cornetta","armonica","ocarina","zampogna","cornamusa","didgeridoo","kazoo","ottoni",
    "tamburo","batteria","timpani","piatti","cembalo","triangolo","xilofono","marimba","vibrafono","glockenspiel",
    "maracas","tamburello","castagnette","bongo","conga","djembe","cajon","gong","campana","campanello",
  ]),
  fiori: set([
    "rosa","tulipano","margherita","girasole","orchidea","giglio","iris","mimosa","narciso","fresia",
    "gerbera","calla","peonia","camelia","gardenia","ortensia","glicine","gelsomino","lavanda","viola",
    "ciclamino","stella","alpina","papavero","fiordaliso","ranuncolo","anemone","crisantemo","dalia","gardenia",
    "azalea","rododendro","magnolia","oleandro","ibisco","bouganville","clematide","edera","felce","cactus",
    "geranio","petunia","begonia","primula","violetta","mughetto","fiore","albero","pianta","arbusto",
    "siepe","cespuglio","quercia","pino","abete","cipresso","palma","olivo","olmo","tiglio",
    "acero","betulla","platano","pioppo","faggio","castagno","noce","melograno","fico","gelso",
  ]),
  paesi_europei: set([
    "italia","francia","germania","spagna","portogallo","inghilterra","gran","bretagna","irlanda","scozia",
    "olanda","belgio","lussemburgo","svizzera","austria","grecia","turchia","russia","ucraina","polonia",
    "romania","ungheria","danimarca","svezia","norvegia","finlandia","islanda","slovenia","croazia","serbia",
    "bosnia","montenegro","albania","macedonia","bulgaria","slovacchia","repubblica","ceca","moldavia","bielorussia",
    "estonia","lettonia","lituania","cipro","malta","san","marino","vaticano","monaco","andorra","liechtenstein",
  ]),
  animali_domestici: set([
    "cane","gatto","coniglio","criceto","cavia","porcellino","d'india","topo","ratto","gerbillo",
    "canarino","pappagallo","cocorita","cardellino","pettirosso","passero","piccione","colomba","tartaruga","testuggine",
    "pesce","pesce","rosso","carpa","koi","guppy","scalare","barbo","betta","ramirezi",
    "iguana","gechi","camaleonte","serpente","biacco","biscia","furetto","scoiattolo","gallina","oca",
    "anatra","tacchino","faraona","quaglia","piccione","colombo","pavone","fagiano","cincia","fringuello",
  ]),
  cibi_dolci: set([
    "tiramisu","panna","cotta","cannoli","cannolo","cassata","sfogliatella","babà","baba","zeppole",
    "struffoli","mostaccioli","cantucci","ricciarelli","panforte","torrone","croccante","mandorlato","amaretto","amaretti",
    "pandoro","panettone","colomba","crostata","torta","caprese","sacher","mimosa","saint","honoré",
    "millefoglie","profiterole","bigne","cioccolato","tartufo","tartufi","praline","cremino","gianduiotto","gianduia",
    "nocciolato","semifreddo","gelato","sorbetto","granita","budino","mousse","creme","caramel","crema",
    "catalana","zabaione","zabaglione","castagnaccio","frittelle","krapfen","ciambella","ciambelle","donut","muffin",
    "biscotti","biscotto","savoiardo","savoiardi","frollini","baci","gocciole","wafer","brownies","cheesecake",
  ]),
  elettrodomestici: set([
    "frigorifero","frigo","congelatore","freezer","forno","fornello","piastra","induzione","microonde","lavatrice",
    "lavastoviglie","asciugatrice","asciugacapelli","phon","piastra","capelli","ferro","stiro","stirastiro","stiratrice",
    "aspirapolvere","scopa","elettrica","robot","vapore","ventilatore","condizionatore","climatizzatore","stufa","stufetta",
    "termoventilatore","umidificatore","deumidificatore","purificatore","aria","tostapane","tostiera","frullatore","mixer","sbattitore",
    "robot","cucina","planetaria","impastatrice","spremiagrumi","centrifuga","estrattore","macchina","caffè","moka",
    "bollitore","scaldabagno","caldaia","televisore","tv","radio","decoder","stereo","amplificatore","casse",
    "computer","pc","laptop","tablet","stampante","scanner","fax","telefono","smartphone","cellulare",
  ]),
  lavori_cucina: set([
    "coltello","forchetta","cucchiaio","cucchiaino","mestolo","schiumarola","frusta","sbattitore","grattugia","pelapatate",
    "spremiagrumi","apriscatole","cavatappi","tappo","tagliere","mattarello","sfogliatrice","matterello","scolapasta","colino",
    "imbuto","caraffa","brocca","bottiglia","barattolo","contenitore","vassoio","sottopentola","strofinaccio","canovaccio",
    "pentola","pentolino","casseruola","padella","tegame","wok","crepiera","bistecchiera","piastra","griglia",
    "teglia","stampo","stampi","leccarda","placca","tortiera","plumcake","sformato","ciotola","insalatiera",
    "zuppiera","piatto","fondo","piano","piattino","bicchiere","tazza","tazzina","calice","flute",
    "tovaglia","tovagliolo","posata","posate","posateria","centrotavola","sottobicchiere","portatovaglioli","portasale","oliera",
  ]),
};

/** Restituisce true se la categoria ha una wordlist riconosciuta. */
export function hasWordlist(categoriaId: string): boolean {
  return categoriaId in VF_WORDLISTS;
}

/** Verifica se la parola normalizzata è nella wordlist della categoria. */
export function isInWordlist(categoriaId: string, parolaNorm: string): boolean {
  const wl = VF_WORDLISTS[categoriaId];
  return wl ? wl.has(parolaNorm) : false;
}
