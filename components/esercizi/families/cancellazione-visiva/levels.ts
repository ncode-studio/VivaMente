export interface CancellazioneVisivaLevelConfig {
  livello:    number;
  righe:      number;
  colonne:    number;
  nTarget:    number;
  similarity: "bassa" | "media" | "alta";
}

export const CV_SESSION_TIMER_MS = 60_000;

export const CV_LEVELS: readonly CancellazioneVisivaLevelConfig[] = [
  { livello:  1, righe: 4, colonne: 4, nTarget:  4, similarity: "bassa" },
  { livello:  2, righe: 4, colonne: 4, nTarget:  5, similarity: "bassa" },
  { livello:  3, righe: 4, colonne: 5, nTarget:  5, similarity: "media" },
  { livello:  4, righe: 4, colonne: 5, nTarget:  6, similarity: "media" },
  { livello:  5, righe: 4, colonne: 5, nTarget:  7, similarity: "media" },
  { livello:  6, righe: 5, colonne: 5, nTarget:  7, similarity: "alta"  },
  { livello:  7, righe: 5, colonne: 5, nTarget:  8, similarity: "alta"  },
  { livello:  8, righe: 5, colonne: 5, nTarget:  9, similarity: "alta"  },
  { livello:  9, righe: 5, colonne: 6, nTarget: 10, similarity: "alta"  },
  { livello: 10, righe: 5, colonne: 6, nTarget: 12, similarity: "alta"  },
];

export function getCancellazioneVisivaLevel(
  livello: number,
): CancellazioneVisivaLevelConfig {
  return CV_LEVELS[Math.min(10, Math.max(1, livello)) - 1];
}
