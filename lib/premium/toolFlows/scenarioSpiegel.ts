import { pickVariant, type FlowContext, type ToolFlow } from "../toolFlowTypes";

export function buildScenarioSpiegelFlow(ctx: FlowContext): ToolFlow {
  const otherName = String(ctx?.otherName || "je match").trim() || "je match";
  const seedBase = `SCENARIO_SPIEGEL:${ctx?.matchId || "nomatch"}`;

  const variants: ToolFlow[] = [
    {
      key: "SCENARIO_SPIEGEL",
      title: "Scenario Spiegel",
      subtitle: "Reageren in echte situaties",
      intro: `Jullie krijgen een paar herkenbare situaties. Kies telkens hoe jij waarschijnlijk zou reageren. Zo zie je sneller hoe jij en ${otherName} omgaan met spontaniteit, stilte en verschil.`,
      tip: "Kies wat je meestal echt doet, niet wat het mooiste overkomt.",
      type: "scenario",
      steps: [
        {
          id: "last_minute_plan",
          kind: "pick",
          prompt: "Je hebt een rustige avond gepland, maar iemand stelt last-minute voor om nog iets te gaan drinken.",
          hint: "Wat doe je meestal spontaan?",
          options: [
            "Ik ga vaak gewoon mee",
            "Het hangt af van mijn energie op dat moment",
            "Ik blijf liever bij mijn oorspronkelijke plan",
          ],
        },
        {
          id: "chat_silence",
          kind: "pick",
          prompt: "Je stuurt iemand een bericht en het blijft een tijd stil.",
          options: [
            "Ik denk daar meestal niet veel bij",
            "Ik vraag me even af of alles oké is",
            "Ik begin sneller te twijfelen of ik iets verkeerd zei",
          ],
        },
        {
          id: "difference_of_opinion",
          kind: "pick",
          prompt: "Jij en iemand anders denken totaal anders over iets belangrijk.",
          options: [
            "Ik vind dat vaak net interessant",
            "Ik probeer eerst te begrijpen waarom",
            "Ik vermijd liever dat het discussie wordt",
          ],
        },
        {
          id: "change_of_plan",
          kind: "pick",
          prompt: "Een afspraak verandert op het laatste moment onverwacht.",
          options: [
            "Ik schakel meestal vlot mee",
            "Ik kan me aanpassen, maar ik moet even herpakken",
            "Dat haalt mij sneller uit balans dan ik toon",
          ],
        },
        {
          id: "self_reflection",
          kind: "free",
          prompt: `In welke situaties wordt jouw karakter het duidelijkst zichtbaar voor ${otherName}?`,
          hint: "Denk aan druk, enthousiasme, conflict, stilte of onverwachte wendingen.",
          placeholder: "Bijvoorbeeld: onder druk word ik stiller, maar niet afstandelijk.",
        },
      ],
      outro: `Vergelijk vooral niet alleen wat jullie kiezen, maar waarom. Het verschil tussen jou en ${otherName} zit vaak minder in de reactie zelf dan in wat eronder ligt: energie, interpretatie, gevoeligheid of behoefte aan grip.`,
    },
    {
      key: "SCENARIO_SPIEGEL",
      title: "Scenario Spiegel",
      subtitle: "Gedrag onder de oppervlakte",
      intro: `Sommige verschillen zie je niet in voorkeuren, maar wel in reacties. Deze situaties maken zichtbaar hoe jij en ${otherName} omgaan met onverwachtheid, onzekerheid en spanning.`,
      tip: "Kijk niet naar wat sociaal wenselijk is. Kies wat het dichtst bij je reflex ligt.",
      type: "scenario",
      steps: [
        {
          id: "last_minute_plan",
          kind: "pick",
          prompt: "Iemand verrast je met een spontaan voorstel terwijl jij al op rust stond.",
          options: [
            "Ik vind dat vaak verfrissend",
            "Ik beslis op basis van mijn batterij van dat moment",
            "Ik hou liever vast aan waar ik me op ingesteld had",
          ],
        },
        {
          id: "chat_silence",
          kind: "pick",
          prompt: "Een gesprek valt even stil zonder duidelijke reden.",
          options: [
            "Ik laat dat meestal gewoon even bestaan",
            "Ik merk dat ik begin te interpreteren",
            "Ik voel sneller onrust dan ik wil toegeven",
          ],
        },
        {
          id: "difference_of_opinion",
          kind: "pick",
          prompt: "Iemand die je graag hebt, botst inhoudelijk hard met jouw visie.",
          options: [
            "Ik blijf meestal nieuwsgierig",
            "Ik wil eerst snappen wat erachter zit",
            "Ik trek mij sneller terug uit zulke spanning",
          ],
        },
        {
          id: "change_of_plan",
          kind: "pick",
          prompt: "Een plan waar je je op had ingesteld verandert plots.",
          options: [
            "Ik beweeg vrij makkelijk mee",
            "Ik pas me aan, maar voel intern wel weerstand",
            "Ik verlies dan sneller mijn flow",
          ],
        },
        {
          id: "self_reflection",
          kind: "free",
          prompt: `Wat zou ${otherName} best begrijpen over jouw reactie op onzekerheid of verandering?`,
          hint: "Geef woorden aan je patroon, niet aan je ideale versie.",
          placeholder: "Bijvoorbeeld: als ik stil word, ben ik meestal aan het verwerken, niet aan het afhaken.",
        },
      ],
      outro: `Bespreek waar jullie reacties verschillen in tempo of gevoeligheid. Dat zegt vaak meer over verbinding dan een gedeelde hobby ooit zal doen.`,
    },
  ];

  return pickVariant(variants, seedBase);
}
