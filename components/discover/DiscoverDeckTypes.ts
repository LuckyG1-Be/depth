export type DiscoverAction = "LIKE" | "PASS" | "SUPERLIKE";

export type DiscoverActionResponse = {
  ok?: boolean;
  error?: string;
  seenUsed?: number;
  matchCreated?: boolean;
  queuedMatch?: boolean;
};

export type DiscoverCandidate = {
  id: string;
  name: string;
  city: string;
  age: number | null;
  score: number;

  scoreBreakdown: {
    baseScore: number;
    baseline?: number;

    valuesHit: number;
    passionsHit: number;
    valuesPoints?: number;
    passionsPoints?: number;
    qaSimilarityPct?: number;
    qaPoints?: number;

    sameCity: boolean;
    cityBoost: number;
    distancePoints?: number;

    intentHit?: boolean;
    religionHit?: boolean;
    intentBoost?: number;
    religionBoost?: number;
    intentPenalty?: number;
    religionPenalty?: number;
    lifestylePoints?: number;
    activityPoints?: number;
    qualityPoints?: number;
  };

  photoId: string | null;

  intent: string | null;
  religion: string | null;
  values: string[];
  passions: string[];

  education?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  exercise?: string | null;

  q: Array<{ question: string; answer: string }>;

  distanceKm?: number | null;
  isNew?: boolean;
  matchReasons?: string[];
};
