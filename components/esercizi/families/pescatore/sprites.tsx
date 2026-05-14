"use client";

/**
 * Sprite SVG flat per "Il Pescatore" — 10 specie con 10 SILHOUETTE distinte.
 *
 * Ogni specie ha una forma unica (non solo palette/dettagli):
 *
 *   trota        → fuso medio + macchie scure
 *   salmone      → corpo allungato, dorso arcuato, mascella a uncino, coda biforcuta
 *   spigola      → corpo snello, due pinne dorsali (la prima spinosa)
 *   persico      → corpo compatto e gobbo, doppia dorsale, bande verticali
 *   sgombro      → corpo molto affusolato + PINNULE caratteristiche verso la coda
 *   pesce_rosso  → corpo ovale alto, coda a velo bipartita ondulata
 *   tonno        → corpo muscolare a fuso + coda FALCATA a mezzaluna + pinnule
 *   pesce_palla  → corpo SFERICO con spuntoni intorno
 *   anguilla     → corpo SERPENTIFORME a S, pinna dorsale continua
 *   cavalluccio  → corpo VERTICALE a S con muso e coda arrotolata
 *
 * Orientamento canonico: TESTA A DESTRA.
 * `dir = -1` applica scaleX(-1) → testa a sinistra (sempre nella direzione del moto).
 *
 * Stile: flat naturalistico, palette adatta a utenti 60+.
 */

import type { PescSpecieId } from "./levels";

// ── Definizioni specie ───────────────────────────────────────────────────────

interface SpecieDef {
  nome:        string;
  bodyTop:     string;
  bodyMid:     string;
  bodyBottom:  string;
  finColor:    string;
  finShadow:   string;
  detailColor: string;
}

const SPECIE_DEF: Record<PescSpecieId, SpecieDef> = {
  trota: {
    nome: "Trota",
    bodyTop: "#6B7B3A", bodyMid: "#A8B570", bodyBottom: "#E8E0BC",
    finColor: "#5A6830", finShadow: "#3F4920", detailColor: "#2E3818",
  },
  salmone: {
    nome: "Salmone",
    bodyTop: "#A8523F", bodyMid: "#D6826A", bodyBottom: "#F2C9B5",
    finColor: "#7E3E2D", finShadow: "#4E2618", detailColor: "#F8E8DE",
  },
  spigola: {
    nome: "Spigola",
    bodyTop: "#5A6E83", bodyMid: "#94A6BA", bodyBottom: "#DCE3EC",
    finColor: "#3F5066", finShadow: "#283545", detailColor: "#2A3848",
  },
  pesce_rosso: {
    nome: "Pesce rosso",
    bodyTop: "#C8410E", bodyMid: "#EB6E2C", bodyBottom: "#F7B98E",
    finColor: "#D8511A", finShadow: "#8A2A05", detailColor: "#7A2407",
  },
  tonno: {
    nome: "Tonno",
    bodyTop: "#1F3F5C", bodyMid: "#4A6E8E", bodyBottom: "#B5C8D8",
    finColor: "#16304A", finShadow: "#0A1C2E", detailColor: "#0E2740",
  },
  persico: {
    nome: "Persico",
    bodyTop: "#73813A", bodyMid: "#B2B86A", bodyBottom: "#E2DC9E",
    finColor: "#5E6A2A", finShadow: "#3F4818", detailColor: "#2F3812",
  },
  pesce_palla: {
    nome: "Pesce palla",
    bodyTop: "#C99A1C", bodyMid: "#E6B83A", bodyBottom: "#F4DC8E",
    finColor: "#A47F0E", finShadow: "#6E5408", detailColor: "#5A4308",
  },
  anguilla: {
    nome: "Anguilla",
    bodyTop: "#3A2E1F", bodyMid: "#5E4B30", bodyBottom: "#A89172",
    finColor: "#2D241A", finShadow: "#19130D", detailColor: "#1A140A",
  },
  sgombro: {
    nome: "Sgombro",
    bodyTop: "#1F4D58", bodyMid: "#3F8A92", bodyBottom: "#C5DBDA",
    finColor: "#173E47", finShadow: "#0A2024", detailColor: "#08191D",
  },
  cavalluccio: {
    nome: "Cavalluccio marino",
    bodyTop: "#C58F22", bodyMid: "#E0AC3F", bodyBottom: "#F5D580",
    finColor: "#9E6E12", finShadow: "#6A4808", detailColor: "#6E4A0A",
  },
};

export function nomeSpecie(id: PescSpecieId): string {
  return SPECIE_DEF[id]?.nome ?? "Pesce";
}

// ── Helper occhio ────────────────────────────────────────────────────────────

function Occhio({ cx, cy, r = 3.4, outline = "#222" }: {
  cx: number; cy: number; r?: number; outline?: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#FAFAF7" stroke={outline} strokeWidth="0.6" />
      <circle cx={cx + r * 0.22} cy={cy} r={r * 0.55} fill="#1A1A1A" />
      <circle cx={cx + r * 0.4} cy={cy - r * 0.25} r={r * 0.22} fill="#FFFFFF" />
    </g>
  );
}

// ── Componente principale ────────────────────────────────────────────────────

interface PesceSpriteProps {
  specie: PescSpecieId;
  dir:    1 | -1;
  size:   number;
}

export function PesceSprite({ specie, dir, size }: PesceSpriteProps) {
  const def = SPECIE_DEF[specie] ?? SPECIE_DEF.trota;
  const gradId    = `psc-grad-${specie}`;
  const gradFinId = `psc-fin-${specie}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={def.bodyTop}    />
          <stop offset="55%"  stopColor={def.bodyMid}    />
          <stop offset="100%" stopColor={def.bodyBottom} />
        </linearGradient>
        <linearGradient id={gradFinId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={def.finShadow} />
          <stop offset="100%" stopColor={def.finColor}  />
        </linearGradient>
      </defs>

      <g transform={dir === -1 ? "translate(120,0) scale(-1,1)" : undefined}>
        {specie === "trota"        && <SpriteTrota       def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "salmone"      && <SpriteSalmone     def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "spigola"      && <SpriteSpigola     def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "pesce_rosso"  && <SpritePesceRosso  def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "tonno"        && <SpriteTonno       def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "persico"      && <SpritePersico     def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "pesce_palla"  && <SpritePescePalla  def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "anguilla"     && <SpriteAnguilla    def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "sgombro"      && <SpriteSgombro     def={def} gradId={gradId} gradFinId={gradFinId} />}
        {specie === "cavalluccio"  && <SpriteCavalluccio def={def} gradId={gradId} gradFinId={gradFinId} />}
      </g>
    </svg>
  );
}

interface FormaProps { def: SpecieDef; gradId: string; gradFinId: string; }

// ── 1. TROTA — fuso classico medio + macchie ─────────────────────────────────

function SpriteTrota({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda triangolare a 3 punte */}
      <path d="M 22,40 L 4,18 L 8,40 L 4,62 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.8" strokeLinejoin="round" />
      {/* Pinna dorsale singola */}
      <path d="M 50,22 Q 60,8 78,18 L 70,28 Q 58,26 50,28 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Pinna ventrale */}
      <path d="M 52,58 Q 60,70 72,64 L 68,56 Q 60,55 52,55 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Corpo fuso */}
      <path
        d="M 22,40 C 26,18 56,12 90,22 C 104,26 112,32 116,40 C 112,48 104,54 90,58 C 56,68 26,62 22,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      {/* Macchie scure caratteristiche */}
      <g fill={def.detailColor} opacity="0.8">
        <ellipse cx="50" cy="28" rx="2.2" ry="1.6" />
        <ellipse cx="62" cy="24" rx="2.4" ry="1.7" />
        <ellipse cx="74" cy="26" rx="2.0" ry="1.5" />
        <ellipse cx="86" cy="30" rx="1.8" ry="1.4" />
        <ellipse cx="44" cy="42" rx="2.4" ry="1.7" />
        <ellipse cx="58" cy="44" rx="2.0" ry="1.5" />
        <ellipse cx="72" cy="42" rx="2.2" ry="1.6" />
        <ellipse cx="84" cy="44" rx="1.6" ry="1.2" />
      </g>
      <path d="M 88,30 Q 84,40 88,52" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={100} cy={35} outline={def.finShadow} />
      <path d="M 114,42 Q 112,44 108,44" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="65" cy="55" rx="32" ry="3" fill={def.bodyBottom} opacity="0.45" />
    </g>
  );
}

// ── 2. SALMONE — allungato, dorso arcuato, mascella a uncino, coda biforcuta ──

function SpriteSalmone({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda biforcuta più pronunciata */}
      <path
        d="M 18,40 L 0,12 L 6,28 L 0,40 L 6,52 L 0,68 Z"
        fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.8" strokeLinejoin="round"
      />
      {/* Pinna dorsale ampia (più indietro) */}
      <path d="M 56,18 Q 66,4 82,12 L 74,24 Q 62,22 56,24 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Pinna adiposa (caratteristica salmonidi) */}
      <path d="M 30,28 Q 36,22 42,28 Q 36,32 30,28 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" opacity="0.85" />
      {/* Pinna ventrale */}
      <path d="M 54,58 Q 62,72 76,64 L 70,56 Q 60,55 54,55 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Corpo con dorso ARCUATO (caratteristico maschio in risalita) */}
      <path
        d="M 18,40
           C 20,28 38,8  68,12
           C 92,15 108,24 118,38
           C 116,46 108,52 92,56
           C 60,64 28,60 18,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      {/* MASCELLA INFERIORE A UNCINO (becco rivolto verso l'alto) */}
      <path
        d="M 116,42 Q 122,40 124,34 Q 122,36 118,38 L 116,38 Z"
        fill={def.bodyMid} stroke={def.bodyTop} strokeWidth="0.8" strokeLinejoin="round"
      />
      {/* Riflessi argento sui fianchi */}
      <g fill={def.detailColor} opacity="0.5">
        <ellipse cx="44" cy="44" rx="6"  ry="1.4" />
        <ellipse cx="62" cy="46" rx="7"  ry="1.5" />
        <ellipse cx="82" cy="44" rx="5"  ry="1.3" />
      </g>
      <path d="M 92,28 Q 88,40 92,52" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={104} cy={32} r={3} outline={def.finShadow} />
      <path d="M 116,42 Q 114,40 108,40" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// ── 3. SPIGOLA — corpo snello, DUE pinne dorsali (prima spinosa) ─────────────

function SpriteSpigola({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda triangolare media */}
      <path d="M 20,40 L 4,22 L 8,40 L 4,58 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* PRIMA pinna dorsale SPINOSA (raggi a dente di sega) */}
      <g fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6">
        <path d="M 42,30 L 44,16 L 48,28 L 52,14 L 56,26 L 60,16 L 64,28 L 66,30 Z" />
      </g>
      {/* SECONDA pinna dorsale (più indietro, morbida) */}
      <path d="M 72,28 Q 78,18 86,22 L 84,30 Q 78,30 72,30 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" />
      {/* Pinna ventrale */}
      <path d="M 56,54 Q 62,66 72,60 L 68,53 Q 60,52 56,52 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" />
      {/* Pinna pettorale */}
      <path d="M 86,46 Q 92,54 88,58 Q 84,54 82,48 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" opacity="0.9" />
      {/* Corpo SNELLO e quasi rettilineo */}
      <path
        d="M 20,40
           C 26,28 56,26 94,30
           C 108,32 114,34 116,40
           C 114,46 108,48 94,50
           C 56,54 26,52 20,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      {/* Riga laterale netta */}
      <path d="M 26,40 Q 60,38 96,40" fill="none" stroke={def.detailColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      {/* Macchia opercolare scura (caratteristica) */}
      <ellipse cx="90" cy="38" rx="2.2" ry="1.4" fill={def.detailColor} opacity="0.6" />
      <path d="M 88,32 Q 84,40 88,48" fill="none" stroke={def.bodyTop} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={100} cy={37} r={2.8} outline={def.finShadow} />
      <path d="M 114,42 Q 112,43 108,43" fill="none" stroke={def.finShadow} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

// ── 4. PESCE ROSSO — corpo ovale alto + coda a velo ──────────────────────────

function SpritePesceRosso({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda a velo bipartita */}
      <path
        d="M 28,38 C 14,18 0,10 -2,16 C 6,26 12,32 18,38 C 12,44 6,54 -2,64 C 0,70 14,62 28,42 Z"
        fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.8" opacity="0.92"
      />
      {/* Pinna dorsale ondulata alta */}
      <path d="M 56,16 Q 66,4 84,14 Q 80,20 78,28 Q 64,22 56,24 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Pinna ventrale ondulata */}
      <path d="M 56,58 Q 64,72 80,68 Q 76,62 76,56 Q 62,58 56,58 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Corpo OVALE ALTO */}
      <path
        d="M 28,40
           C 32,12 60,8  88,16
           C 106,22 116,30 118,40
           C 116,52 106,60 88,66
           C 60,74 32,68 28,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      {/* Squame */}
      <g fill="none" stroke={def.bodyTop} strokeWidth="0.5" opacity="0.35">
        <path d="M 50,22 Q 56,28 50,34" />
        <path d="M 62,20 Q 68,26 62,32" />
        <path d="M 74,22 Q 80,28 74,34" />
        <path d="M 50,46 Q 56,52 50,58" />
        <path d="M 62,48 Q 68,54 62,60" />
        <path d="M 74,46 Q 80,52 74,58" />
      </g>
      <path d="M 92,28 Q 88,40 92,52" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={102} cy={36} outline={def.finShadow} />
      <path d="M 116,44 Q 113,46 109,45" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// ── 5. TONNO — corpo muscolare + coda falcata + pinnule ──────────────────────

function SpriteTonno({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda a mezzaluna falcata */}
      <path
        d="M 18,40
           C 8,18 -4,12 -4,18
           C 6,28 10,34 14,40
           C 10,46 6,52 -4,62
           C -4,68 8,62 18,40 Z"
        fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.9"
      />
      {/* Pinna dorsale alta */}
      <path d="M 52,20 Q 60,6 72,12 L 68,26 Q 58,24 52,26 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Seconda pinna dorsale piccola */}
      <path d="M 76,25 Q 82,18 88,24 L 84,30 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" />
      {/* Pinnule dorsali e ventrali (piccoli triangoli) */}
      <g fill={def.finColor} stroke={def.finShadow} strokeWidth="0.4">
        <path d="M 38,33 L 42,28 L 44,33 Z" />
        <path d="M 30,34 L 34,30 L 36,34 Z" />
        <path d="M 38,47 L 42,52 L 44,47 Z" />
        <path d="M 30,46 L 34,50 L 36,46 Z" />
      </g>
      {/* Pinna ventrale */}
      <path d="M 54,56 Q 62,68 72,62 L 66,55 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" />
      {/* Corpo muscolare */}
      <path
        d="M 18,40
           C 24,16 56,8  92,18
           C 108,22 116,30 118,40
           C 116,50 108,58 92,62
           C 56,72 24,64 18,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      <path d="M 60,40 Q 84,38 110,40" fill="none" stroke={def.detailColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M 90,28 Q 86,40 90,52" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={102} cy={34} outline={def.finShadow} />
      <path d="M 115,42 Q 113,44 109,43" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// ── 6. PERSICO — corpo COMPATTO/GOBBO + doppia dorsale + bande verticali ─────

function SpritePersico({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda triangolare media */}
      <path d="M 24,42 L 6,22 L 12,42 L 6,62 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.8" />
      {/* PRIMA dorsale SPINOSA (a dente di sega) */}
      <g fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6">
        <path d="M 38,28 L 40,12 L 44,24 L 48,10 L 52,22 L 56,12 L 60,24 L 62,28 Z" />
      </g>
      {/* SECONDA dorsale arrotondata */}
      <path d="M 68,26 Q 76,18 86,22 Q 84,30 76,32 Q 70,32 68,30 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" />
      {/* Pinna ventrale */}
      <path d="M 54,60 Q 62,72 74,66 L 70,58 Q 60,57 54,57 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      {/* Pinna pettorale */}
      <path d="M 88,48 Q 96,54 92,60 Q 86,56 84,50 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" opacity="0.9" />
      {/* Corpo COMPATTO E ALTO (gobba dorsale evidente) */}
      <path
        d="M 24,42
           C 28,18 50,8  74,12
           C 96,16 112,26 118,42
           C 114,54 100,62 78,66
           C 50,72 28,66 24,42 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      {/* Bande verticali scure caratteristiche */}
      <g fill={def.detailColor} opacity="0.6">
        <path d="M 42,22 Q 44,42 42,62 L 39,62 Q 37,42 39,22 Z" />
        <path d="M 56,18 Q 58,42 56,64 L 53,64 Q 51,42 53,18 Z" />
        <path d="M 70,16 Q 72,42 70,64 L 67,64 Q 65,42 67,16 Z" />
        <path d="M 84,18 Q 86,42 84,62 L 81,62 Q 79,42 81,18 Z" />
      </g>
      <path d="M 92,32 Q 88,42 92,54" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={102} cy={36} outline={def.finShadow} />
      <path d="M 116,44 Q 114,46 109,45" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// ── 7. PESCE PALLA — sferico con spuntoni ────────────────────────────────────

function SpritePescePalla({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      <path d="M 16,40 L 4,28 L 8,40 L 4,52 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7" />
      <path d="M 52,18 Q 60,12 68,18 L 64,26 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.6" />
      <path d="M 52,62 Q 60,68 68,62 L 64,54 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.6" />
      {/* Spuntoni intorno al corpo */}
      <g fill={def.finShadow} opacity="0.85">
        <path d="M 32,28 L 30,22 L 35,29 Z" />
        <path d="M 28,40 L 22,38 L 28,43 Z" />
        <path d="M 32,52 L 30,58 L 35,51 Z" />
        <path d="M 48,18 L 46,12 L 51,19 Z" />
        <path d="M 70,16 L 70,10 L 74,17 Z" />
        <path d="M 86,20 L 88,14 L 90,21 Z" />
        <path d="M 48,62 L 46,68 L 51,61 Z" />
        <path d="M 70,64 L 70,70 L 74,63 Z" />
        <path d="M 86,60 L 88,66 L 90,59 Z" />
        <path d="M 96,30 L 102,28 L 96,33 Z" />
        <path d="M 96,50 L 102,52 L 96,47 Z" />
      </g>
      <ellipse cx="60" cy="40" rx="38" ry="30" fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.2" />
      <ellipse cx="60" cy="52" rx="26" ry="10" fill={def.bodyBottom} opacity="0.5" />
      <path d="M 86,30 Q 82,40 86,52" fill="none" stroke={def.bodyTop} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <Occhio cx={92} cy={34} r={4.2} outline={def.finShadow} />
      <path d="M 100,42 Q 96,44 92,42" fill="none" stroke={def.finShadow} strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

// ── 8. ANGUILLA — serpentiforme a S ──────────────────────────────────────────

function SpriteAnguilla({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Pinna dorsale lunga e continua (caratteristica) */}
      <path
        d="M 12,38 C 30,30 60,28 90,30 C 102,30 110,32 116,34 L 116,38 C 100,36 60,38 30,42 L 12,42 Z"
        fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" opacity="0.85"
      />
      {/* Corpo a S sinuoso */}
      <path
        d="M 8,42 C 26,32 42,52 60,40 C 78,28 96,48 116,40 L 116,46 C 96,54 78,34 60,46 C 42,58 26,38 8,48 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1"
      />
      <g fill={def.detailColor} opacity="0.55">
        <ellipse cx="22" cy="44"  rx="1.6" ry="1.1" />
        <ellipse cx="38" cy="46"  rx="1.6" ry="1.1" />
        <ellipse cx="54" cy="42"  rx="1.6" ry="1.1" />
        <ellipse cx="70" cy="38"  rx="1.6" ry="1.1" />
        <ellipse cx="86" cy="40"  rx="1.6" ry="1.1" />
        <ellipse cx="100" cy="42" rx="1.4" ry="1.0" />
      </g>
      <Occhio cx={108} cy={41} r={2.6} outline={def.finShadow} />
      <path d="M 116,44 Q 110,46 106,44" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// ── 9. SGOMBRO — molto affusolato + PINNULE + zigzag dorsale ─────────────────

function SpriteSgombro({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      {/* Coda forcuta sottile */}
      <path
        d="M 16,40 L 0,22 L 6,38 L 0,42 L 6,42 L 0,58 Z"
        fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.7"
      />
      {/* Prima pinna dorsale piccola */}
      <path d="M 56,32 Q 62,22 70,28 L 66,34 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" />
      {/* Seconda pinna dorsale piccola */}
      <path d="M 76,32 Q 80,26 86,30 L 82,34 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" />
      {/* PINNULE dorsali (caratteristica scombridi) */}
      <g fill={def.finColor} stroke={def.finShadow} strokeWidth="0.4">
        <path d="M 26,36 L 30,32 L 32,36 Z" />
        <path d="M 34,36 L 38,32 L 40,36 Z" />
        <path d="M 42,36 L 46,32 L 48,36 Z" />
      </g>
      {/* PINNULE ventrali */}
      <g fill={def.finColor} stroke={def.finShadow} strokeWidth="0.4">
        <path d="M 26,44 L 30,48 L 32,44 Z" />
        <path d="M 34,44 L 38,48 L 40,44 Z" />
        <path d="M 42,44 L 46,48 L 48,44 Z" />
      </g>
      {/* Pinna ventrale */}
      <path d="M 60,50 Q 66,60 74,55 L 70,48 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" />
      {/* Corpo SOTTILE ED AFFUSOLATO */}
      <path
        d="M 16,40
           C 22,32 56,28 92,32
           C 108,34 116,36 118,40
           C 116,44 108,46 92,48
           C 56,52 22,48 16,40 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1"
      />
      {/* Strisce dorsali a ZIG-ZAG (caratteristiche dello sgombro) */}
      <path
        d="M 30,32 L 38,35 L 46,32 L 54,35 L 62,32 L 70,35 L 78,32 L 86,35 L 94,33"
        fill="none" stroke={def.detailColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"
      />
      <path
        d="M 30,38 L 38,40 L 46,38 L 54,40 L 62,38 L 70,40 L 78,38 L 86,40 L 94,38"
        fill="none" stroke={def.detailColor} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
      />
      <Occhio cx={104} cy={38} r={2.6} outline={def.finShadow} />
      <path d="M 116,42 Q 113,43 109,42" fill="none" stroke={def.finShadow} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

// ── 10. CAVALLUCCIO — verticale a S ──────────────────────────────────────────

function SpriteCavalluccio({ def, gradId, gradFinId }: FormaProps) {
  return (
    <g>
      <path d="M 60,30 Q 78,18 80,38 Q 76,40 70,42 Z" fill={`url(#${gradFinId})`} stroke={def.finShadow} strokeWidth="0.6" />
      <path d="M 78,46 Q 88,46 86,54 Q 82,52 78,52 Z" fill={def.finColor} stroke={def.finShadow} strokeWidth="0.5" />
      <path
        d="M 92,8 C 96,10 92,18 86,22 C 76,28 60,30 64,42
           C 68,56 78,58 76,68 C 72,76 60,76 56,72
           C 56,66 60,62 54,58 C 48,56 46,68 50,74
           C 54,80 48,84 44,78 C 38,68 42,52 52,46
           C 58,42 66,38 64,30 C 62,20 72,12 80,10
           C 86,8 90,6 92,8 Z"
        fill={`url(#${gradId})`} stroke={def.bodyTop} strokeWidth="1.1"
      />
      <g fill="none" stroke={def.bodyTop} strokeWidth="0.6" opacity="0.45">
        <path d="M 76,22 Q 70,26 66,30" />
        <path d="M 70,32 Q 64,36 62,40" />
        <path d="M 66,44 Q 64,48 64,52" />
        <path d="M 68,56 Q 70,60 72,64" />
      </g>
      <path d="M 90,12 L 100,12 L 98,18 L 88,17 Z" fill={def.bodyMid} stroke={def.bodyTop} strokeWidth="0.7" />
      <Occhio cx={84} cy={14} r={2.6} outline={def.finShadow} />
      <path d="M 80,8 Q 82,4 85,8 Q 87,4 90,8" fill="none" stroke={def.finShadow} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}
