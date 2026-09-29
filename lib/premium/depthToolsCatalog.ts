export type ToolKey =
  | "TEGENPOLEN_DUEL"
  | "SCENARIO_SPIEGEL"
  | "VERHALEN_DRIE_ZINNEN"
  | "RELATIE_KOMPAS";

export type ToolType = ToolKey;

export type DepthTool = {
  key: ToolKey;
  title: string;
  subtitle: string;
  description: string;
  cost: number;
  badge?: string;
  active?: boolean;
};

export const DEPTH_TOOLS: Record<ToolKey, DepthTool> = {
  TEGENPOLEN_DUEL: {
    key: "TEGENPOLEN_DUEL",
    title: "Tegenpolen Duel",
    subtitle: "Psychologische tegenpolen",
    description:
      "Een reeks scherpe keuzes die zichtbaar maakt waar jullie stijl verschilt in tempo, openheid, structuur en verbinding.",
    cost: 2,
    badge: "Diepgang",
    active: true,
  },
  SCENARIO_SPIEGEL: {
    key: "SCENARIO_SPIEGEL",
    title: "Scenario Spiegel",
    subtitle: "Reacties in situaties",
    description:
      "Korte realistische situaties die tonen hoe jij instinctief reageert op spanning, spontaniteit en verschil in contact.",
    cost: 3,
    badge: "Nieuw",
    active: true,
  },
  VERHALEN_DRIE_ZINNEN: {
    key: "VERHALEN_DRIE_ZINNEN",
    title: "Verhalen in 3 zinnen",
    subtitle: "Creatieve connectie",
    description:
      "Schrijf elk een mini-verhaal in drie zinnen. De toon, wending en afloop zeggen vaak meer dan een rechtstreekse vraag.",
    cost: 2,
    badge: "Creatief",
    active: true,
  },
  RELATIE_KOMPAS: {
    key: "RELATIE_KOMPAS",
    title: "Relatie Kompas",
    subtitle: "Sliders op het spectrum",
    description:
      "Gebruik sliders om te tonen waar jij zit op belangrijke relatiedimensies zoals ruimte, openheid, avontuur en conflictaanpak.",
    cost: 3,
    badge: "Spectrum",
    active: true,
  },
};

export const DEPTH_TOOLS_CATALOG: DepthTool[] = [
  DEPTH_TOOLS.TEGENPOLEN_DUEL,
  DEPTH_TOOLS.SCENARIO_SPIEGEL,
  DEPTH_TOOLS.VERHALEN_DRIE_ZINNEN,
  DEPTH_TOOLS.RELATIE_KOMPAS,
];
