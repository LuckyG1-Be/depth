// lib/matching.ts

export type MatchScoreInput = {
  myValues: string[];
  myPassions: string[];
  otherValues: string[];
  otherPassions: string[];
  myCity?: string | null;
  otherCity?: string | null;

  myIntent?: string | null;
  otherIntent?: string | null;
  myReligion?: string | null;
  otherReligion?: string | null;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

function norm(s?: string | null) {
  return String(s || "").trim().toLowerCase();
}

function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Weging / model:
 * - Values:   45
 * - Passions: 20
 * - Intent:   +25 match, -10 mismatch
 * - Religion: +5  match, -5 mismatch
 * - City:     +5  match
 *
 * Score clamped 0..100
 */
export function computeMatchScore(input: MatchScoreInput) {
  const myValues = uniq(input.myValues || []);
  const myPassions = uniq(input.myPassions || []);
  const otherValues = uniq(input.otherValues || []);
  const otherPassions = uniq(input.otherPassions || []);

  const vOver = overlap(myValues, otherValues);
  const pOver = overlap(myPassions, otherPassions);

  // Values: max 45
  const vScore =
    otherValues.length === 0 || myValues.length === 0
      ? 0
      : Math.round((vOver.length / Math.min(myValues.length, otherValues.length)) * 45);

  // Passions: max 20
  const pScore =
    otherPassions.length === 0 || myPassions.length === 0
      ? 0
      : Math.round((pOver.length / Math.min(myPassions.length, otherPassions.length)) * 20);

  // Intent: +25 / -10 (only if both set)
  const myIntent = norm(input.myIntent);
  const otherIntent = norm(input.otherIntent);
  const hasIntentBoth = Boolean(myIntent && otherIntent);
  const intentHit = hasIntentBoth && myIntent === otherIntent;

  const intentBoost = intentHit ? 25 : 0;
  const intentPenalty = hasIntentBoth && !intentHit ? -10 : 0;

  // Religion: +5 / -5 (only if both set)
  const myReligion = norm(input.myReligion);
  const otherReligion = norm(input.otherReligion);
  const hasRelBoth = Boolean(myReligion && otherReligion);
  const religionHit = hasRelBoth && myReligion === otherReligion;

  const religionBoost = religionHit ? 5 : 0;
  const religionPenalty = hasRelBoth && !religionHit ? -5 : 0;

  // City: +5 match
  const myCity = norm(input.myCity);
  const otherCity = norm(input.otherCity);
  const sameCity = Boolean(myCity && otherCity && myCity === otherCity);
  const cityBoost = sameCity ? 5 : 0;

  const baseScoreRaw =
    vScore + pScore + intentBoost + intentPenalty + religionBoost + religionPenalty;

  const baseScore = clamp(baseScoreRaw, 0, 100);
  const score = clamp(baseScore + cityBoost, 0, 100);

  return {
    score,
    baseScore,

    valuesHit: vOver.length,
    passionsHit: pOver.length,
    sameCity,
    cityBoost,

    intentHit,
    religionHit,
    intentBoost,
    religionBoost,
    intentPenalty,
    religionPenalty,

    valueOverlap: vOver,
    passionOverlap: pOver,
  };
}


