import { pickVariant, type FlowContext, type ToolFlow } from "../toolFlowTypes";

export function buildRelatieKompasFlow(ctx: FlowContext): ToolFlow {
  const otherName = String(ctx?.otherName || "je match").trim() || "je match";
  const seedBase = `RELATIE_KOMPAS:${ctx?.matchId || "nomatch"}`;

  const variants: ToolFlow[] = [
    {
      key: "RELATIE_KOMPAS",
      title: "Relatie Kompas",
      subtitle: "Spectrum in plaats van zwart-wit",
      intro: `Niet alles in verbinding is een duidelijke keuze. Met deze sliders toon je waar jij ongeveer zit op een aantal belangrijke assen, zodat jij en ${otherName} nuance zien in plaats van alleen tegenpolen.`,
      tip: "Schuif naar wat meestal klopt voor jou, niet naar wat ideaal klinkt.",
      type: "mini_game",
      steps: [
        {
          id: "independence",
          kind: "scale",
          prompt: "In een relatie heb ik het meest behoefte aan…",
          min: 1,
          max: 10,
          minLabel: "Veel eigen ruimte",
          maxLabel: "Veel gedeelde tijd",
        },
        {
          id: "openness",
          kind: "scale",
          prompt: "Mijn gevoelens deel ik meestal…",
          min: 1,
          max: 10,
          minLabel: "Voorzichtig",
          maxLabel: "Heel open",
        },
        {
          id: "lifestyle",
          kind: "scale",
          prompt: "In het leven zoek ik eerder…",
          min: 1,
          max: 10,
          minLabel: "Stabiliteit",
          maxLabel: "Avontuur",
        },
        {
          id: "pace",
          kind: "scale",
          prompt: "Wanneer ik iemand leer kennen…",
          min: 1,
          max: 10,
          minLabel: "Rustig tempo",
          maxLabel: "Snelle intensiteit",
        },
        {
          id: "conflict",
          kind: "scale",
          prompt: "Bij spanning of conflict…",
          min: 1,
          max: 10,
          minLabel: "Neem ik eerst afstand",
          maxLabel: "Praat ik het meteen uit",
        },
        {
          id: "reflection",
          kind: "free",
          prompt: `Op welke van deze assen verwacht je het meeste verschil met ${otherName}?`,
          hint: "Je hoeft niet zeker te zijn. Het mag ook een vermoeden zijn.",
          placeholder: "Bijvoorbeeld: ik denk dat ik meer ruimte nodig heb dan jij, maar dat hoeft niet negatief te zijn.",
          multiline: true,
        },
      ],
      outro: `Kijk waar jij en ${otherName} dicht bij elkaar zitten en waar het kompas anders wijst. De interessantste gesprekken ontstaan vaak niet uit extremen, maar uit kleine nuanceverschillen.`,
    },
    {
      key: "RELATIE_KOMPAS",
      title: "Relatie Kompas",
      subtitle: "Sliders met nuance",
      intro: `Deze tool laat je niet kiezen tussen twee uitersten, maar zoeken waar jij ergens ertussen zit. Zo krijg je samen met ${otherName} een genuanceerder beeld van verbinding, autonomie en tempo.`,
      tip: "De middenzone is ook een antwoord. Je hoeft jezelf niet extremer te maken dan je bent.",
      type: "mini_game",
      steps: [
        {
          id: "independence",
          kind: "scale",
          prompt: "Als ik dicht bij iemand sta, heb ik meestal meer nood aan…",
          min: 1,
          max: 10,
          minLabel: "Ruimte voor mezelf",
          maxLabel: "Veel gedeelde nabijheid",
        },
        {
          id: "openness",
          kind: "scale",
          prompt: "Mijn binnenwereld laat ik meestal zien op een manier die eerder…",
          min: 1,
          max: 10,
          minLabel: "Geleidelijk opent",
          maxLabel: "Vrij direct zichtbaar is",
        },
        {
          id: "lifestyle",
          kind: "scale",
          prompt: "Mijn leven voelt idealer als er meer is van…",
          min: 1,
          max: 10,
          minLabel: "Rust en voorspelbaarheid",
          maxLabel: "Beweging en avontuur",
        },
        {
          id: "pace",
          kind: "scale",
          prompt: "Wanneer een connectie goed voelt, beweeg ik meestal richting…",
          min: 1,
          max: 10,
          minLabel: "Langzaam verdiepen",
          maxLabel: "Vrij snelle intensiteit",
        },
        {
          id: "conflict",
          kind: "scale",
          prompt: "Bij spanning tussen twee mensen neig ik vaker naar…",
          min: 1,
          max: 10,
          minLabel: "Eerst afstand en verwerking",
          maxLabel: "Snel uitspreken en helderheid",
        },
        {
          id: "reflection",
          kind: "free",
          prompt: `Welke slider zegt volgens jou het meest over hoe jij en ${otherName} elkaar zouden kunnen aanvullen?`,
          hint: "Denk aan tempo, ruimte, openheid of conflictaanpak.",
          placeholder: "Bijvoorbeeld: verschil in tempo kan net goed zijn als we het allebei begrijpen.",
          multiline: true,
        },
      ],
      outro: `Gebruik deze sliders niet als score, maar als startpunt. Waar jij en ${otherName} anders schuiven, zit vaak precies het interessantste gesprek.`,
    },
  ];

  return pickVariant(variants, seedBase);
}
