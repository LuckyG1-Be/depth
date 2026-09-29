import { buildRelatieKompasFlow } from "./toolFlows/relatieKompas";
import { buildScenarioSpiegelFlow } from "./toolFlows/scenarioSpiegel";
import { buildTegenpolenDuelFlow } from "./toolFlows/tegenpolenDuel";
import { buildVerhalenDrieZinnenFlow } from "./toolFlows/verhalenDrieZinnen";
import type { FlowContext, ToolFlow } from "./toolFlowTypes";

export type { ToolFlow, ToolFlowStep } from "./toolFlowTypes";

export function buildFlowForTool(toolKey: string, ctx?: FlowContext): ToolFlow {
  switch (toolKey) {
    case "TEGENPOLEN_DUEL":
      return buildTegenpolenDuelFlow(ctx);
    case "SCENARIO_SPIEGEL":
      return buildScenarioSpiegelFlow(ctx);
    case "VERHALEN_DRIE_ZINNEN":
      return buildVerhalenDrieZinnenFlow(ctx);
    case "RELATIE_KOMPAS":
      return buildRelatieKompasFlow(ctx);
    default:
      return {
        key: toolKey,
        title: "Depth-tool",
        subtitle: "Samen",
        intro: "Deze tool is nog niet actief.",
        tip: "Binnenkort beschikbaar.",
        type: "mini_game",
        steps: [],
        outro: "",
      };
  }
}
