/**
 * components/esercizi/families/conoscenza-generale/questions.ts
 *
 * Pool domande per Conoscenza Generale — calibrate per utente 60+ italiano.
 * 35 molto_nota · 35 nota · 30 media · 20 meno_nota · 15 rara = 135 domande
 *
 * indiceCor: indice (0-3) dell'opzione corretta nell'array opzioni.
 * Le opzioni sono già miscelate (il corretto non è sempre in posizione 0).
 */

import type { CGRarità } from "./levels";

export interface CGDomanda {
  id:        string;
  domanda:   string;
  opzioni:   [string, string, string, string];
  indiceCor: 0 | 1 | 2 | 3;
  rarità:    CGRarità;
}

// ── Molto nota ────────────────────────────────────────────────────────────────

const MOLTO_NOTA: CGDomanda[] = [
  { id: "mn01", rarità: "molto_nota", domanda: "Qual è la capitale d'Italia?", opzioni: ["Roma", "Milano", "Napoli", "Torino"], indiceCor: 0 },
  { id: "mn02", rarità: "molto_nota", domanda: "Chi ha dipinto la Gioconda?", opzioni: ["Raffaello", "Leonardo da Vinci", "Michelangelo", "Caravaggio"], indiceCor: 1 },
  { id: "mn03", rarità: "molto_nota", domanda: "In quale paese si trova la Torre Eiffel?", opzioni: ["Italia", "Spagna", "Francia", "Germania"], indiceCor: 2 },
  { id: "mn04", rarità: "molto_nota", domanda: "Chi scrisse la Divina Commedia?", opzioni: ["Francesco Petrarca", "Dante Alighieri", "Giovanni Boccaccio", "Ludovico Ariosto"], indiceCor: 1 },
  { id: "mn05", rarità: "molto_nota", domanda: "In quale nazione si trova il Colosseo?", opzioni: ["Grecia", "Turchia", "Egitto", "Italia"], indiceCor: 3 },
  { id: "mn06", rarità: "molto_nota", domanda: "Quanti continenti ci sono sulla Terra?", opzioni: ["Cinque", "Sei", "Sette", "Otto"], indiceCor: 2 },
  { id: "mn07", rarità: "molto_nota", domanda: "Qual è il pianeta più vicino al Sole?", opzioni: ["Venere", "Mercurio", "Terra", "Marte"], indiceCor: 1 },
  { id: "mn08", rarità: "molto_nota", domanda: "Chi fu il primo uomo a camminare sulla Luna?", opzioni: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn", "Neil Armstrong"], indiceCor: 3 },
  { id: "mn09", rarità: "molto_nota", domanda: "In quale anno finì la Seconda Guerra Mondiale?", opzioni: ["1939", "1945", "1918", "1950"], indiceCor: 1 },
  { id: "mn10", rarità: "molto_nota", domanda: "Qual è la montagna più alta del mondo?", opzioni: ["K2", "Mont Blanc", "Everest", "Kilimanjaro"], indiceCor: 2 },
  { id: "mn11", rarità: "molto_nota", domanda: "Qual è il simbolo chimico dell'acqua?", opzioni: ["CO₂", "O₂", "NaCl", "H₂O"], indiceCor: 3 },
  { id: "mn12", rarità: "molto_nota", domanda: "Qual è la capitale della Germania?", opzioni: ["Monaco", "Berlino", "Amburgo", "Francoforte"], indiceCor: 1 },
  { id: "mn13", rarità: "molto_nota", domanda: "In quale città si trova il Vaticano?", opzioni: ["Firenze", "Napoli", "Roma", "Milano"], indiceCor: 2 },
  { id: "mn14", rarità: "molto_nota", domanda: "Chi compose la Nona Sinfonia?", opzioni: ["Mozart", "Bach", "Verdi", "Beethoven"], indiceCor: 3 },
  { id: "mn15", rarità: "molto_nota", domanda: "In quale nazione si trovano le Piramidi di Giza?", opzioni: ["Libia", "Egitto", "Marocco", "Sudan"], indiceCor: 1 },
  { id: "mn16", rarità: "molto_nota", domanda: "Quante stelle ha la bandiera degli Stati Uniti?", opzioni: ["48", "52", "46", "50"], indiceCor: 3 },
  { id: "mn17", rarità: "molto_nota", domanda: "Qual è la lingua ufficiale del Brasile?", opzioni: ["Spagnolo", "Portoghese", "Inglese", "Francese"], indiceCor: 1 },
  { id: "mn18", rarità: "molto_nota", domanda: "In quale stagione cadono le foglie degli alberi decidui?", opzioni: ["Estate", "Autunno", "Primavera", "Inverno"], indiceCor: 1 },
  { id: "mn19", rarità: "molto_nota", domanda: "Come si chiama il processo con cui le piante producono cibo grazie alla luce solare?", opzioni: ["Fermentazione", "Respirazione", "Fotosintesi", "Digestione"], indiceCor: 2 },
  { id: "mn20", rarità: "molto_nota", domanda: "Quale pianeta è famoso per i suoi anelli?", opzioni: ["Giove", "Urano", "Saturno", "Marte"], indiceCor: 2 },
  { id: "mn21", rarità: "molto_nota", domanda: "Quanti colori ha l'arcobaleno?", opzioni: ["5", "6", "8", "7"], indiceCor: 3 },
  { id: "mn22", rarità: "molto_nota", domanda: "Quale pittore olandese dipinse «I girasoli»?", opzioni: ["Rembrandt", "Van Gogh", "Vermeer", "Mondrian"], indiceCor: 1 },
  { id: "mn23", rarità: "molto_nota", domanda: "In quale città italiana si trova la Torre pendente?", opzioni: ["Siena", "Lucca", "Firenze", "Pisa"], indiceCor: 3 },
  { id: "mn24", rarità: "molto_nota", domanda: "Qual è l'animale più grande del mondo?", opzioni: ["Elefante africano", "Squalo balena", "Giraffa", "Balenottera azzurra"], indiceCor: 3 },
  { id: "mn25", rarità: "molto_nota", domanda: "In quale nazione si trova la capitale Madrid?", opzioni: ["Portogallo", "Messico", "Spagna", "Argentina"], indiceCor: 2 },
  { id: "mn26", rarità: "molto_nota", domanda: "Quale strumento usa il medico per ascoltare il cuore?", opzioni: ["Termometro", "Stetoscopio", "Otoscopio", "Sfigmomanometro"], indiceCor: 1 },
  { id: "mn27", rarità: "molto_nota", domanda: "Di che colore è il rubino?", opzioni: ["Blu", "Verde", "Rosso", "Giallo"], indiceCor: 2 },
  { id: "mn28", rarità: "molto_nota", domanda: "Quanti lati ha un triangolo?", opzioni: ["4", "2", "5", "3"], indiceCor: 3 },
  { id: "mn29", rarità: "molto_nota", domanda: "Qual è l'oceano più grande del mondo?", opzioni: ["Atlantico", "Indiano", "Pacifico", "Artico"], indiceCor: 2 },
  { id: "mn30", rarità: "molto_nota", domanda: "Chi fu Romolo nella leggenda di Roma?", opzioni: ["Il primo imperatore", "Il fondatore di Roma", "Un grande generale", "Il primo console"], indiceCor: 1 },
  { id: "mn31", rarità: "molto_nota", domanda: "In quale regione italiana si trova Venezia?", opzioni: ["Friuli-Venezia Giulia", "Lombardia", "Veneto", "Toscana"], indiceCor: 2 },
  { id: "mn32", rarità: "molto_nota", domanda: "Qual è il pianeta più grande del sistema solare?", opzioni: ["Saturno", "Nettuno", "Urano", "Giove"], indiceCor: 3 },
  { id: "mn33", rarità: "molto_nota", domanda: "Come si chiama l'organo del corpo umano che pompa il sangue?", opzioni: ["Fegato", "Polmone", "Cuore", "Rene"], indiceCor: 2 },
  { id: "mn34", rarità: "molto_nota", domanda: "In quale anno scoprì l'America Cristoforo Colombo?", opzioni: ["1498", "1482", "1510", "1492"], indiceCor: 3 },
  { id: "mn35", rarità: "molto_nota", domanda: "Qual è la capitale della Francia?", opzioni: ["Lione", "Marsiglia", "Parigi", "Bordeaux"], indiceCor: 2 },
];

// ── Nota ──────────────────────────────────────────────────────────────────────

const NOTA: CGDomanda[] = [
  { id: "no01", rarità: "nota", domanda: "In quale anno fu proclamata l'Unità d'Italia?", opzioni: ["1848", "1871", "1861", "1900"], indiceCor: 2 },
  { id: "no02", rarità: "nota", domanda: "Chi scrisse «I Promessi Sposi»?", opzioni: ["Giovanni Verga", "Alessandro Manzoni", "Giacomo Leopardi", "Luigi Pirandello"], indiceCor: 1 },
  { id: "no03", rarità: "nota", domanda: "In quale anno iniziò la Prima Guerra Mondiale?", opzioni: ["1912", "1918", "1916", "1914"], indiceCor: 3 },
  { id: "no04", rarità: "nota", domanda: "Chi compose l'opera «Aida»?", opzioni: ["Puccini", "Rossini", "Donizetti", "Verdi"], indiceCor: 3 },
  { id: "no05", rarità: "nota", domanda: "In quale città italiana si trova il Museo degli Uffizi?", opzioni: ["Roma", "Venezia", "Firenze", "Milano"], indiceCor: 2 },
  { id: "no06", rarità: "nota", domanda: "Come si chiama la valuta italiana prima dell'euro?", opzioni: ["Franco", "Marco", "Peseta", "Lira"], indiceCor: 3 },
  { id: "no07", rarità: "nota", domanda: "In quale anno entrò in vigore la Costituzione Italiana?", opzioni: ["1946", "1950", "1947", "1948"], indiceCor: 3 },
  { id: "no08", rarità: "nota", domanda: "In quale secolo fu costruita la Torre Eiffel?", opzioni: ["XVII", "XX", "XVIII", "XIX"], indiceCor: 3 },
  { id: "no09", rarità: "nota", domanda: "Chi fondò la Croce Rossa Internazionale?", opzioni: ["Florence Nightingale", "Henry Dunant", "Albert Schweitzer", "Louis Pasteur"], indiceCor: 1 },
  { id: "no10", rarità: "nota", domanda: "In quale città si svolge il carnevale più famoso d'Italia?", opzioni: ["Roma", "Venezia", "Napoli", "Milano"], indiceCor: 1 },
  { id: "no11", rarità: "nota", domanda: "Qual è il lago più grande d'Italia?", opzioni: ["Lago Maggiore", "Lago di Garda", "Lago di Como", "Lago di Bolsena"], indiceCor: 1 },
  { id: "no12", rarità: "nota", domanda: "Chi inventò la stampa a caratteri mobili in Europa?", opzioni: ["Leonardo da Vinci", "Galileo Galilei", "Gutenberg", "Isaac Newton"], indiceCor: 2 },
  { id: "no13", rarità: "nota", domanda: "Qual è la capitale dell'Australia?", opzioni: ["Sydney", "Canberra", "Melbourne", "Perth"], indiceCor: 1 },
  { id: "no14", rarità: "nota", domanda: "In quale anno iniziò la Rivoluzione Francese?", opzioni: ["1776", "1815", "1789", "1848"], indiceCor: 2 },
  { id: "no15", rarità: "nota", domanda: "Qual è il fiume più lungo d'Italia?", opzioni: ["Tevere", "Arno", "Adige", "Po"], indiceCor: 3 },
  { id: "no16", rarità: "nota", domanda: "Quale famoso compositore divenne sordo nella seconda metà della vita?", opzioni: ["Mozart", "Chopin", "Bach", "Beethoven"], indiceCor: 3 },
  { id: "no17", rarità: "nota", domanda: "Chi fu il primo presidente degli Stati Uniti d'America?", opzioni: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "Benjamin Franklin"], indiceCor: 2 },
  { id: "no18", rarità: "nota", domanda: "Qual è il nome del vulcano attivo sulla Sicilia?", opzioni: ["Vesuvio", "Stromboli", "Vulcano", "Etna"], indiceCor: 3 },
  { id: "no19", rarità: "nota", domanda: "In quanti libri è divisa la Divina Commedia?", opzioni: ["2", "4", "3", "1"], indiceCor: 2 },
  { id: "no20", rarità: "nota", domanda: "In quale nazione si trova l'Acropoli di Atene?", opzioni: ["Turchia", "Grecia", "Italia", "Cipro"], indiceCor: 1 },
  { id: "no21", rarità: "nota", domanda: "Quale scienziato italiano difese con il telescopio l'eliocentrismo?", opzioni: ["Giordano Bruno", "Galileo Galilei", "Nicolò Copernico", "Giovanni Cassini"], indiceCor: 1 },
  { id: "no22", rarità: "nota", domanda: "In quale regione si trova il vulcano Vesuvio?", opzioni: ["Sicilia", "Campania", "Calabria", "Lazio"], indiceCor: 1 },
  { id: "no23", rarità: "nota", domanda: "Come si chiama il mare che bagna le coste orientali dell'Italia?", opzioni: ["Mar Tirreno", "Mar Adriatico", "Mar Ligure", "Mar Ionio"], indiceCor: 1 },
  { id: "no24", rarità: "nota", domanda: "In quale secolo visse Leonardo da Vinci?", opzioni: ["XVI", "XIV", "XVII", "XV"], indiceCor: 0 },
  { id: "no25", rarità: "nota", domanda: "Chi scrisse «Il Gattopardo»?", opzioni: ["Italo Calvino", "Alberto Moravia", "Giuseppe Tomasi di Lampedusa", "Cesare Pavese"], indiceCor: 2 },
  { id: "no26", rarità: "nota", domanda: "Quale paese vinse il primo Campionato Mondiale di Calcio (1930)?", opzioni: ["Brasil", "Argentina", "Uruguay", "Italia"], indiceCor: 2 },
  { id: "no27", rarità: "nota", domanda: "In quale anno l'Italia vinse il suo primo Campionato Mondiale di Calcio?", opzioni: ["1938", "1930", "1934", "1966"], indiceCor: 2 },
  { id: "no28", rarità: "nota", domanda: "Come si chiama il famoso affresco di Leonardo nell'Ultima Cena?", opzioni: ["La Madonna delle Rocce", "L'Ultima Cena", "La Vergine delle Rocce", "Il Cenacolo"], indiceCor: 3 },
  { id: "no29", rarità: "nota", domanda: "In quale città si trova la Scala, il celebre teatro lirico?", opzioni: ["Roma", "Napoli", "Torino", "Milano"], indiceCor: 3 },
  { id: "no30", rarità: "nota", domanda: "Qual è il nome del primo satellite artificiale lanciato nello spazio?", opzioni: ["Explorer 1", "Vostok 1", "Apollo 11", "Sputnik 1"], indiceCor: 3 },
  { id: "no31", rarità: "nota", domanda: "Chi fu il primo astronauta a volare nello spazio?", opzioni: ["Neil Armstrong", "Buzz Aldrin", "John Glenn", "Yuri Gagarin"], indiceCor: 3 },
  { id: "no32", rarità: "nota", domanda: "In quale regione italiana si trova la città di Firenze?", opzioni: ["Umbria", "Lazio", "Toscana", "Emilia-Romagna"], indiceCor: 2 },
  { id: "no33", rarità: "nota", domanda: "Chi fu il principale autore del Rinascimento italiano dei Sonetti?", opzioni: ["Dante Alighieri", "Francesco Petrarca", "Giovanni Boccaccio", "Ludovico Ariosto"], indiceCor: 1 },
  { id: "no34", rarità: "nota", domanda: "Quale artista rinascimentale scolpì il David esposto a Firenze?", opzioni: ["Donatello", "Bernini", "Canova", "Michelangelo"], indiceCor: 3 },
  { id: "no35", rarità: "nota", domanda: "Come si chiama il premio letterario più importante d'Italia?", opzioni: ["Premio Campiello", "Premio Strega", "Premio Bancarella", "Premio Bagutta"], indiceCor: 1 },
];

// ── Media ─────────────────────────────────────────────────────────────────────

const MEDIA: CGDomanda[] = [
  { id: "me01", rarità: "media", domanda: "Come si chiama la prima opera lirica della storia, composta da Jacopo Peri?", opzioni: ["Orfeo", "Euridice", "Dafne", "Arianna"], indiceCor: 2 },
  { id: "me02", rarità: "media", domanda: "In quale anno avvenne la caduta del Muro di Berlino?", opzioni: ["1991", "1985", "1989", "1990"], indiceCor: 2 },
  { id: "me03", rarità: "media", domanda: "Chi scrisse il romanzo «I Malavoglia»?", opzioni: ["Luigi Pirandello", "Giovanni Verga", "Italo Svevo", "Grazia Deledda"], indiceCor: 1 },
  { id: "me04", rarità: "media", domanda: "In quale anno fu assassinato Aldo Moro?", opzioni: ["1976", "1980", "1975", "1978"], indiceCor: 3 },
  { id: "me05", rarità: "media", domanda: "Come si chiama il processo di trasformazione del mosto d'uva in vino?", opzioni: ["Distillazione", "Fermentazione", "Pastorizzazione", "Ossidazione"], indiceCor: 1 },
  { id: "me06", rarità: "media", domanda: "Qual è il nome dell'opera di Verdi ambientata a Venezia?", opzioni: ["La Traviata", "Aida", "Rigoletto", "Otello"], indiceCor: 2 },
  { id: "me07", rarità: "media", domanda: "Quante sono le regioni d'Italia?", opzioni: ["18", "21", "20", "22"], indiceCor: 2 },
  { id: "me08", rarità: "media", domanda: "Quale artista italiano vinse il Leone d'oro alla Mostra di Venezia più volte?", opzioni: ["Federico Fellini", "Luchino Visconti", "Roberto Rossellini", "Michelangelo Antonioni"], indiceCor: 0 },
  { id: "me09", rarità: "media", domanda: "In quale anno fu fondato il Partito Comunista Italiano?", opzioni: ["1919", "1924", "1921", "1946"], indiceCor: 2 },
  { id: "me10", rarità: "media", domanda: "Come si chiama il celebre dipinto di Sandro Botticelli che raffigura la nascita della dea Venere?", opzioni: ["La Primavera", "L'Annunciazione", "La Nascita di Venere", "Pallade e il Centauro"], indiceCor: 2 },
  { id: "me11", rarità: "media", domanda: "Quale scrittore siciliano vinse il Premio Nobel per la Letteratura nel 1934?", opzioni: ["Giovanni Verga", "Luigi Pirandello", "Leonardo Sciascia", "Vitaliano Brancati"], indiceCor: 1 },
  { id: "me12", rarità: "media", domanda: "In quale città si tenne il Concilio che stabilì il dogma della Trinità nel 325 d.C.?", opzioni: ["Costantinopoli", "Roma", "Nicea", "Alessandria"], indiceCor: 2 },
  { id: "me13", rarità: "media", domanda: "Quale teorema afferma che il quadrato dell'ipotenusa è uguale alla somma dei quadrati dei cateti?", opzioni: ["Teorema di Talete", "Teorema di Euclide", "Teorema di Pitagora", "Teorema di Archimede"], indiceCor: 2 },
  { id: "me14", rarità: "media", domanda: "Come si chiama la corrente artistica di Monet, Renoir e Degas?", opzioni: ["Cubismo", "Impressionismo", "Futurismo", "Surrealismo"], indiceCor: 1 },
  { id: "me15", rarità: "media", domanda: "Quale politico italiano fu soprannominato «il Cavaliere»?", opzioni: ["Romano Prodi", "Giulio Andreotti", "Silvio Berlusconi", "Bettino Craxi"], indiceCor: 2 },
  { id: "me16", rarità: "media", domanda: "In quale anno fu lanciata la lira italiana in sostituzione della lira toscana?", opzioni: ["1861", "1848", "1871", "1900"], indiceCor: 0 },
  { id: "me17", rarità: "media", domanda: "Chi fu il primo segretario generale dell'ONU?", opzioni: ["Dag Hammarskjöld", "Trygve Lie", "U Thant", "Kurt Waldheim"], indiceCor: 1 },
  { id: "me18", rarità: "media", domanda: "Come si chiama l'antibiotico scoperto da Alexander Fleming?", opzioni: ["Penicillina", "Streptomicina", "Ampicillina", "Amoxicillina"], indiceCor: 0 },
  { id: "me19", rarità: "media", domanda: "In quale anno si tenne il primo Concilio Vaticano?", opzioni: ["1854", "1878", "1870", "1869"], indiceCor: 3 },
  { id: "me20", rarità: "media", domanda: "Quale compositore scrisse «Le Quattro Stagioni»?", opzioni: ["Bach", "Handel", "Vivaldi", "Telemann"], indiceCor: 2 },
  { id: "me21", rarità: "media", domanda: "In quale anno fu fondata la città di Roma secondo la tradizione?", opzioni: ["753 a.C.", "509 a.C.", "264 a.C.", "476 d.C."], indiceCor: 0 },
  { id: "me22", rarità: "media", domanda: "Come si chiama la guerra civile americana (1861–1865)?", opzioni: ["Guerra di Secessione", "Guerra d'indipendenza", "Guerra messicano-americana", "Guerra dei Sette Anni"], indiceCor: 0 },
  { id: "me23", rarità: "media", domanda: "Quale scienziato formulò la teoria della relatività ristretta?", opzioni: ["Max Planck", "Albert Einstein", "Niels Bohr", "Werner Heisenberg"], indiceCor: 1 },
  { id: "me24", rarità: "media", domanda: "In quale nazione nacque Frédéric Chopin?", opzioni: ["Austria", "Germania", "Polonia", "Francia"], indiceCor: 2 },
  { id: "me25", rarità: "media", domanda: "Come si chiama il periodo storico tra le due guerre mondiali in Italia, caratterizzato dal regime fascista?", opzioni: ["Belle Époque", "Periodo giolittiano", "Ventennio fascista", "Triennio rosso"], indiceCor: 2 },
  { id: "me26", rarità: "media", domanda: "Quale fiume scorre attraverso Roma?", opzioni: ["Arno", "Po", "Adige", "Tevere"], indiceCor: 3 },
  { id: "me27", rarità: "media", domanda: "In quale anno fu abolita la pena di morte in Italia?", opzioni: ["1944", "1948", "1948 (Costituzione)", "1975"], indiceCor: 2 },
  { id: "me28", rarità: "media", domanda: "Chi fu il fondatore del Futurismo italiano?", opzioni: ["Umberto Boccioni", "Filippo Tommaso Marinetti", "Giacomo Balla", "Gino Severini"], indiceCor: 1 },
  { id: "me29", rarità: "media", domanda: "Quale compositore scrisse la Messa da Requiem più celebre del Romanticismo?", opzioni: ["Berlioz", "Brahms", "Verdi", "Mozart"], indiceCor: 2 },
  { id: "me30", rarità: "media", domanda: "Come si chiama la piazza principale di Siena, famosa per il Palio?", opzioni: ["Piazza della Signoria", "Piazza Navona", "Piazza del Campo", "Piazza San Marco"], indiceCor: 2 },
];

// ── Meno nota ─────────────────────────────────────────────────────────────────

const MENO_NOTA: CGDomanda[] = [
  { id: "mn_01", rarità: "meno_nota", domanda: "In quale anno fu firmata la pace di Westfalia, che concluse la Guerra dei Trent'anni?", opzioni: ["1618", "1648", "1683", "1618"], indiceCor: 1 },
  { id: "mn_02", rarità: "meno_nota", domanda: "Chi fu il pittore della scuola veneziana noto per «Tempesta»?", opzioni: ["Tiziano", "Giorgione", "Tintoretto", "Veronese"], indiceCor: 1 },
  { id: "mn_03", rarità: "meno_nota", domanda: "Come si chiama il processo economico di riduzione del potere d'acquisto della moneta?", opzioni: ["Deflazione", "Recessione", "Inflazione", "Stagflazione"], indiceCor: 2 },
  { id: "mn_04", rarità: "meno_nota", domanda: "In quale anno fu fondata la Repubblica di Venezia?", opzioni: ["421 d.C.", "568 d.C.", "697 d.C.", "800 d.C."], indiceCor: 2 },
  { id: "mn_05", rarità: "meno_nota", domanda: "Quale filosofo greco fu maestro di Aristotele?", opzioni: ["Socrate", "Platone", "Talete", "Eraclito"], indiceCor: 1 },
  { id: "mn_06", rarità: "meno_nota", domanda: "Come si chiama la struttura proteica che trasporta l'ossigeno nel sangue?", opzioni: ["Mioglobina", "Albumina", "Emoglobina", "Globulina"], indiceCor: 2 },
  { id: "mn_07", rarità: "meno_nota", domanda: "In quale anno vinse il Premio Nobel per la Fisica Guglielmo Marconi?", opzioni: ["1909", "1901", "1921", "1935"], indiceCor: 0 },
  { id: "mn_08", rarità: "meno_nota", domanda: "Come si chiama la regione italiana in cui si trova Matera, nominata Capitale Europea della Cultura?", opzioni: ["Puglia", "Calabria", "Basilicata", "Campania"], indiceCor: 2 },
  { id: "mn_09", rarità: "meno_nota", domanda: "Quale trattato del 1929 regolò i rapporti tra lo Stato italiano e la Santa Sede?", opzioni: ["Concordato di Worms", "Patti Lateranensi", "Trattato di Utrecht", "Concordato di Bologna"], indiceCor: 1 },
  { id: "mn_10", rarità: "meno_nota", domanda: "Chi fu il primo Presidente del Consiglio della Repubblica Italiana?", opzioni: ["Alcide De Gasperi", "Luigi Einaudi", "Pietro Nenni", "Giuseppe Saragat"], indiceCor: 0 },
  { id: "mn_11", rarità: "meno_nota", domanda: "In quale anno fu inaugurata la linea ferroviaria Napoli-Portici, la prima d'Italia?", opzioni: ["1839", "1848", "1861", "1830"], indiceCor: 0 },
  { id: "mn_12", rarità: "meno_nota", domanda: "Come si chiama il teorema che lega i lati di un triangolo rettangolo?", opzioni: ["Teorema di Talete", "Teorema di Pitagora", "Teorema di Euclide", "Teorema di Fermat"], indiceCor: 1 },
  { id: "mn_13", rarità: "meno_nota", domanda: "Quale artista del Barocco dipinse «La vocazione di san Matteo»?", opzioni: ["Rubens", "Rembrandt", "Caravaggio", "Velázquez"], indiceCor: 2 },
  { id: "mn_14", rarità: "meno_nota", domanda: "In quale anno fu fondata l'Unione Europea con il Trattato di Maastricht?", opzioni: ["1989", "1992", "1995", "2002"], indiceCor: 1 },
  { id: "mn_15", rarità: "meno_nota", domanda: "Come si chiama la prima donna a vincere il Premio Nobel per la Fisica (1903)?", opzioni: ["Lise Meitner", "Marie Curie", "Irène Joliot-Curie", "Rosalind Franklin"], indiceCor: 1 },
  { id: "mn_16", rarità: "meno_nota", domanda: "Quale filosofo scrisse «La Critica della Ragion Pura»?", opzioni: ["Hegel", "Locke", "Kant", "Descartes"], indiceCor: 2 },
  { id: "mn_17", rarità: "meno_nota", domanda: "Come si chiama il mare chiuso tra la Sicilia e la Tunisia?", opzioni: ["Canale di Sicilia", "Stretto di Messina", "Canale di Otranto", "Stretto di Gibilterra"], indiceCor: 0 },
  { id: "mn_18", rarità: "meno_nota", domanda: "In quale anno fu abolita la monarchia in Italia con referendum?", opzioni: ["1944", "1948", "1946", "1943"], indiceCor: 2 },
  { id: "mn_19", rarità: "meno_nota", domanda: "Come si chiama la fase della storia italiana di ricostruzione post-bellica e sviluppo economico (anni '50-'60)?", opzioni: ["Anni di piombo", "Miracolo economico", "Biennio rosso", "Autunno caldo"], indiceCor: 1 },
  { id: "mn_20", rarità: "meno_nota", domanda: "Quale compositore scrisse il Rigoletto, La Traviata e il Trovatore nello stesso decennio?", opzioni: ["Puccini", "Donizetti", "Verdi", "Rossini"], indiceCor: 2 },
];

// ── Rara ──────────────────────────────────────────────────────────────────────

const RARA: CGDomanda[] = [
  { id: "ra01", rarità: "rara", domanda: "In quale anno fu approvata la legge Basaglia, che riformò la psichiatria italiana?", opzioni: ["1971", "1978", "1982", "1968"], indiceCor: 1 },
  { id: "ra02", rarità: "rara", domanda: "Come si chiama il trattato del 1947 che definì i confini dell'Italia post-bellica?", opzioni: ["Trattato di Versailles", "Trattato di Parigi", "Trattato di Losanna", "Trattato di Vienna"], indiceCor: 1 },
  { id: "ra03", rarità: "rara", domanda: "Quale chimico italiano scoprì che i gas a parità di volume contengono lo stesso numero di molecole?", opzioni: ["Stanislao Cannizzaro", "Amedeo Avogadro", "Luigi Galvani", "Alessandro Volta"], indiceCor: 1 },
  { id: "ra04", rarità: "rara", domanda: "In quale anno fu istituita la Corte Costituzionale italiana?", opzioni: ["1948", "1956", "1960", "1947"], indiceCor: 1 },
  { id: "ra05", rarità: "rara", domanda: "Come si chiama il processo biochimico con cui le cellule producono energia in assenza di ossigeno?", opzioni: ["Respirazione aerobica", "Fotosintesi", "Glicolisi anaerobica", "Beta-ossidazione"], indiceCor: 2 },
  { id: "ra06", rarità: "rara", domanda: "Chi fu il primo Segretario Generale del Partito Comunista Italiano?", opzioni: ["Palmiro Togliatti", "Amadeo Bordiga", "Antonio Gramsci", "Luigi Longo"], indiceCor: 1 },
  { id: "ra07", rarità: "rara", domanda: "In quale anno fu fondata la Fiat a Torino?", opzioni: ["1906", "1899", "1911", "1921"], indiceCor: 1 },
  { id: "ra08", rarità: "rara", domanda: "Come si chiama la fonte del diritto romano che codificò il diritto sotto Giustiniano?", opzioni: ["Lex Salica", "Corpus Juris Civilis", "Dodici Tavole", "Pandette"], indiceCor: 1 },
  { id: "ra09", rarità: "rara", domanda: "Quale matematico italiano diede il nome alla successione numerica 1,1,2,3,5,8,13...?", opzioni: ["Tartaglia", "Fibonacci", "Cardano", "Cavalieri"], indiceCor: 1 },
  { id: "ra10", rarità: "rara", domanda: "In quale anno fu varata la prima Costituzione del Regno d'Italia (Statuto Albertino)?", opzioni: ["1848", "1861", "1831", "1870"], indiceCor: 0 },
  { id: "ra11", rarità: "rara", domanda: "Come si chiama il dipinto di Raffaello che raffigura filosofi dell'Antichità nelle Stanze Vaticane?", opzioni: ["Il Trionfo di Galatea", "La Disputa del Sacramento", "La Scuola di Atene", "Il Parnaso"], indiceCor: 2 },
  { id: "ra12", rarità: "rara", domanda: "Quale ingegnere italiano progettò la cupola del Duomo di Firenze?", opzioni: ["Leon Battista Alberti", "Andrea Palladio", "Filippo Brunelleschi", "Donato Bramante"], indiceCor: 2 },
  { id: "ra13", rarità: "rara", domanda: "In quale anno nacque Galileo Galilei?", opzioni: ["1543", "1564", "1571", "1546"], indiceCor: 1 },
  { id: "ra14", rarità: "rara", domanda: "Come si chiama la battaglia del 1176 in cui la Lega Lombarda sconfisse Federico Barbarossa?", opzioni: ["Battaglia di Legnano", "Battaglia di Benevento", "Battaglia di Cortenuova", "Battaglia del Verbano"], indiceCor: 0 },
  { id: "ra15", rarità: "rara", domanda: "Quale artista italiano del XX secolo è noto per le «Metafisiche» con manichini e piazze deserte?", opzioni: ["Umberto Boccioni", "Amedeo Modigliani", "Giorgio de Chirico", "Carlo Carrà"], indiceCor: 2 },
];

// ── Export pool completo per rarità ──────────────────────────────────────────

export const DOMANDE_PER_RARITÀ: Record<string, CGDomanda[]> = {
  molto_nota: MOLTO_NOTA,
  nota:       NOTA,
  media:      MEDIA,
  meno_nota:  MENO_NOTA,
  rara:       RARA,
};

export type { CGDomanda };
