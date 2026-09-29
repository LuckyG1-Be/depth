import type { LocationValue } from "@/components/LocationAutocomplete";
import type { ProfilePhoto } from "@/components/ProfilePhotoManager";

export type Initial = {
  user: {
    name: string;
    city: string;
    gender: string;
    isPaused?: boolean;
    lat?: number | null;
    lng?: number | null;
    placeId?: string | null;
  };
  profile: {
    intent: string;
    religion: string;
    education: string;
    drinking: string;
    smoking: string;
    exercise: string;
    values: string[];
    passions: string[];
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  photos: ProfilePhoto[];
};

export type QKey = "q1" | "q2" | "q3" | "q4" | "q5";

export type ProfileErrors = Record<string, string>;
export type ProfileState = Initial["profile"];
export type UserState = Initial["user"];
export type ApplyProfile = (updater: (prev: ProfileState) => ProfileState) => void;
export type ChecklistItem = { key: string; title: string; hint: string; go: () => void };
export type ProfileLocation = LocationValue | null;
