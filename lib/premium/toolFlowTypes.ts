export type ToolFlowStep =
  | {
      id: string;
      kind: "pick";
      prompt: string;
      hint?: string;
      options: string[];
      multi?: boolean;
    }
  | {
      id: string;
      kind: "scale";
      prompt: string;
      hint?: string;
      min?: number;
      max?: number;
      minLabel: string;
      maxLabel: string;
    }
  | {
      id: string;
      kind: "free";
      prompt: string;
      hint?: string;
      placeholder?: string;
      multiline?: boolean;
    };

export type ToolFlow = {
  key: string;
  title: string;
  subtitle: string;
  intro: string;
  tip: string;
  type: "mini_game" | "scenario";
  steps: ToolFlowStep[];
  outro: string;
};

export type FlowContext = { otherName?: string | null; matchId?: string | null; sessionId?: string | null } | null | undefined;

function seedFrom(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function pickVariant<T>(items: T[], seed: string): T {
  return items[seedFrom(seed) % items.length];
}
