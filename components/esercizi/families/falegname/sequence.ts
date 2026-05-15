/**
 * Generatore stimoli per "Il Falegname".
 *
 * Trial:
 *   - Target: una sagoma S mostrata "sul banco" con rotazione di riferimento
 *     (rotRiferimento). Il giocatore deve identificare la stessa sagoma S
 *     tra 4 opzioni, ciascuna ruotata (e dal L5 con prospettiva 3D, dal
 *     L7 alcune specchiate).
 *   - Distrattori: 3 sagome DIVERSE da S, scelte dallo stesso gruppo
 *     semantico (se stessoGruppo) o dal pool generale. Anche i distrattori
 *     sono ruotati/prospettici come il target, per evitare cue percettivi.
 *   - Dal L7: con 50% di probabilità una delle 3 sagome distrattore viene
 *     sostituita dal target SPECCHIATO (il classico "trabocchetto" della
 *     rotazione mentale).
 *
 * No-repeat in sessione: ogni target compare al massimo una volta.
 */

import type { FalegnameLevelConfig } from "./levels";
import type { ShapeId, GruppoSemantico, ShapeRenderKind } from "./shapes";
import { shapesByGruppo, shapesByComplessita, getShape } from "./shapes";

export interface OpzioneFalegname {
  /** Identificatore stabile per React key. */
  key:       string;
  /** Sagoma usata per disegnare l'opzione. */
  shapeId:   ShapeId;
  /** Versione della sagoma: "base" o variante con piccola modifica. */
  kind:      ShapeRenderKind;
  rotZ:      number;
  rotX:      number;
  rotY:      number;
  specchio:  boolean;
  /** true se questa opzione è la risposta corretta (target base, non specchiato). */
  isTarget:  boolean;
}

export interface StimoloFalegname {
  target:          ShapeId;
  /** Rotazione applicata al target mostrato "sul banco". */
  rifRotZ:         number;
  rifRotX:         number;
  rifRotY:         number;
  opzioni:         OpzioneFalegname[];
}

export interface RispostaFalegname {
  /** key dell'opzione scelta (null se timeout — non usato: niente timer). */
  sceltaKey: string | null;
  tempoMs:   number;
}

// ── Stato di sessione ──────────────────────────────────────────────────────

export interface FalegnamePoolRef {
  /**
   * Pool ammesso al livello corrente (in base a bandeComplessita).
   * Calcolato la prima volta in generaFalegname() o ricostruito se la
   * sessione cambia livello (caso teorico — di norma il livello è fisso).
   */
  targetsRimanenti: ShapeId[];
  /** Firma del pool corrente per sapere se serve ricostruirlo. */
  bandeFirma:       string;
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function creaPoolRef(_rng: () => number): FalegnamePoolRef {
  // Inizializzato lazy in generaFalegname() con il pool del livello.
  return { targetsRimanenti: [], bandeFirma: "" };
}

// ── Generazione angoli ─────────────────────────────────────────────────────

/**
 * Genera un angolo casuale entro [−max, +max], evitando |angolo| < 30°
 * (rotazioni troppo piccole rendono il task banale).
 */
function angoloCasuale(max: number, rng: () => number): number {
  const segno = rng() < 0.5 ? -1 : 1;
  const valore = 30 + Math.floor(rng() * (max - 30 + 1));
  return segno * valore;
}

/** Estrae rotazione 2D/3D in base al livello. */
function generaRotazione(
  level: FalegnameLevelConfig,
  rng:   () => number,
): { rotZ: number; rotX: number; rotY: number } {
  const rotZ = angoloCasuale(level.angoloMax, rng);
  if (level.dimensioni === 2) {
    return { rotZ, rotX: 0, rotY: 0 };
  }
  // 3D: piccola rotazione su X e Y per dare prospettiva, oltre alla
  // rotazione principale Z. Tetto a 60° per non rendere l'oggetto illegibile.
  const rotY = angoloCasuale(Math.min(60, level.angoloMax / 2), rng);
  const rotX = angoloCasuale(Math.min(45, level.angoloMax / 2), rng);
  return { rotZ, rotX, rotY };
}

// ── Scelta distrattori ─────────────────────────────────────────────────────

function pickDistrattori(
  target:       ShapeId,
  bande:        readonly (1 | 2 | 3)[],
  stessoGruppo: boolean,
  rng:          () => number,
  n:            number,
): ShapeId[] {
  if (n <= 0) return [];

  // Pool ammesso dal livello (stesse bande di complessità del target).
  const ammessi = shapesByComplessita(bande).map((s) => s.id);

  let pool: ShapeId[];
  if (stessoGruppo) {
    const gruppo: GruppoSemantico = getShape(target).gruppo;
    pool = shapesByGruppo(gruppo)
      .filter((s) => ammessi.includes(s.id))
      .map((s) => s.id)
      .filter((id) => id !== target);
    if (pool.length < n) {
      // Completa col pool ammesso dal livello (mantiene il vincolo banda).
      const extra = ammessi.filter((id) => id !== target && !pool.includes(id));
      pool = [...pool, ...shuffle(extra, rng)];
    }
  } else {
    pool = ammessi.filter((id) => id !== target);
  }
  return shuffle(pool, rng).slice(0, n);
}

// ── Funzione principale ────────────────────────────────────────────────────

export function generaFalegname(
  level:   FalegnameLevelConfig,
  poolRef: FalegnamePoolRef,
  rng:     () => number,
): StimoloFalegname {
  // Costruisci/ricostruisci il pool target in base alle bande del livello.
  const firmaCorrente = level.bandeComplessita.slice().sort().join("-");
  if (poolRef.bandeFirma !== firmaCorrente || poolRef.targetsRimanenti.length === 0) {
    const pool = shapesByComplessita(level.bandeComplessita).map((s) => s.id);
    poolRef.targetsRimanenti = shuffle(pool, rng);
    poolRef.bandeFirma = firmaCorrente;
  }
  const target = poolRef.targetsRimanenti.shift()!;

  // Rotazione di riferimento "sul banco".
  const rif = generaRotazione(level, rng);

  // Decide se inserire un distrattore specchiato (solo se conSpecchio).
  const inserisciSpecchio = level.conSpecchio && rng() < 0.7;

  // Composizione delle 3 opzioni-distrattore:
  //   numVarianti opzioni = varianti del target (near-miss)
  //   eventuale specchio  = una in più (sostituisce un altro slot)
  //   resto               = oggetti diversi
  let nDistrattori = 3;
  let nVarianti = Math.min(level.numVarianti, nDistrattori);
  nDistrattori -= nVarianti;
  if (inserisciSpecchio && nDistrattori === 0) {
    // Servono almeno 3 distrattori. Se varianti hanno saturato, sacrifico 1 variante.
    nVarianti -= 1;
    nDistrattori = 1;
  }
  const nMirror = inserisciSpecchio ? 1 : 0;
  const nAltri  = nDistrattori - nMirror;
  const distrattoriIds = pickDistrattori(
    target,
    level.bandeComplessita,
    level.stessoGruppo,
    rng,
    Math.max(0, nAltri),
  );

  const opzioni: OpzioneFalegname[] = [];

  // Opzione target (base, non specchiata) — rotazione diversa dal riferimento.
  let rotTargetOk = generaRotazione(level, rng);
  let tentativi = 0;
  while (
    Math.abs(rotTargetOk.rotZ - rif.rotZ) < 25 &&
    Math.abs(rotTargetOk.rotY - rif.rotY) < 25 &&
    tentativi < 8
  ) {
    rotTargetOk = generaRotazione(level, rng);
    tentativi += 1;
  }
  opzioni.push({
    key:      "opt-target",
    shapeId:  target,
    kind:     "base",
    rotZ:     rotTargetOk.rotZ,
    rotX:     rotTargetOk.rotX,
    rotY:     rotTargetOk.rotY,
    specchio: false,
    isTarget: true,
  });

  // Varianti del target (1 o 2). Se ho 2 varianti uso sia "variante" sia "variante2".
  const kindsVariante: ShapeRenderKind[] =
    nVarianti === 2 && getShape(target).variante2 ? ["variante", "variante2"] :
    nVarianti === 2                                ? ["variante", "variante"]  :
    nVarianti === 1                                ? ["variante"]              :
                                                     [];
  kindsVariante.forEach((kind, i) => {
    const rot = generaRotazione(level, rng);
    opzioni.push({
      key:      `opt-var-${i}`,
      shapeId:  target,
      kind,
      rotZ:     rot.rotZ,
      rotX:     rot.rotX,
      rotY:     rot.rotY,
      // La variante può apparire specchiata dal L7 con probabilità bassa,
      // così "specchio" e "variante" non sono cue mutuamente esclusivi.
      specchio: level.conSpecchio && rng() < 0.2,
      isTarget: false,
    });
  });

  // Target specchiato (trabocchetto percettivo classico).
  if (inserisciSpecchio) {
    const rotMir = generaRotazione(level, rng);
    opzioni.push({
      key:      "opt-mirror",
      shapeId:  target,
      kind:     "base",
      rotZ:     rotMir.rotZ,
      rotX:     rotMir.rotX,
      rotY:     rotMir.rotY,
      specchio: true,
      isTarget: false,
    });
  }

  // Distrattori di sagoma diversa.
  distrattoriIds.forEach((id, i) => {
    const rot = generaRotazione(level, rng);
    opzioni.push({
      key:      `opt-dist-${i}`,
      shapeId:  id,
      kind:     "base",
      rotZ:     rot.rotZ,
      rotX:     rot.rotX,
      rotY:     rot.rotY,
      specchio: level.conSpecchio && rng() < 0.25,
      isTarget: false,
    });
  });

  return {
    target,
    rifRotZ: rif.rotZ,
    rifRotX: rif.rotX,
    rifRotY: rif.rotY,
    opzioni: shuffle(opzioni, rng).slice(0, 4),
  };
}
