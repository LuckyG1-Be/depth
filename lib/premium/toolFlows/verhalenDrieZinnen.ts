import { pickVariant, type FlowContext, type ToolFlow } from "../toolFlowTypes";

export function buildVerhalenDrieZinnenFlow(ctx: FlowContext): ToolFlow {
  const otherName = String(ctx?.otherName || "je match").trim() || "je match";
  const seedBase = `VERHALEN_DRIE_ZINNEN:${ctx?.matchId || "nomatch"}`;

  const variants: ToolFlow[] = [
    {
      key: "VERHALEN_DRIE_ZINNEN",
      title: "Verhalen in 3 zinnen",
      subtitle: "Creatieve connectie",
      intro: `Jullie schrijven elk een mini-verhaal in 3 zinnen. Niet om literair te zijn, maar om te zien hoe jij en ${otherName} een ontmoeting spontaan inkleuren.`,
      tip: "Schrijf wat spontaan in je opkomt. De toon van je verhaal zegt vaak meer dan het verhaal zelf.",
      type: "mini_game",
      steps: [
        {
          id: "scene",
          kind: "free",
          prompt: `Stel dat jij en ${otherName} elkaar toevallig in het echte leven ontmoeten. Wat is de eerste scène?`,
          hint: "Beschrijf het begin alsof het de openingszin van een kort verhaal is.",
          placeholder: "Bijvoorbeeld: we botsen tegelijk naar hetzelfde boek in een kleine boekhandel.",
          multiline: true,
        },
        {
          id: "twist",
          kind: "free",
          prompt: "Halverwege gebeurt er iets onverwachts. Wat is de wending?",
          hint: "Maak het klein en menselijk, niet per se spectaculair.",
          placeholder: "Bijvoorbeeld: we ontdekken dat we allebei eigenlijk iemand anders kwamen zoeken.",
          multiline: true,
        },
        {
          id: "ending",
          kind: "free",
          prompt: "Hoe eindigt het verhaal?",
          hint: "Het einde zegt vaak veel over hoe jij naar verbinding kijkt.",
          placeholder: "Bijvoorbeeld: we lachen ermee en blijven toch nog een uur praten.",
          multiline: true,
        },
        {
          id: "meaning",
          kind: "free",
          prompt: `Wat zegt jouw verhaal volgens jou over hoe jij naar een connectie met ${otherName} kijkt?`,
          hint: "Eén eerlijke observatie is genoeg.",
          placeholder: "Bijvoorbeeld: ik merk dat ik zelfs in fantasie altijd zoek naar iets oprechts en toevalligs.",
          multiline: true,
        },
      ],
      outro: `Vergelijk vooral hoe jullie verhaal begint, welke wending erin zit en hoe het eindigt. Daarin zie je vaak snel verschil in humor, hoop, voorzichtigheid of verbeelding.`,
    },
    {
      key: "VERHALEN_DRIE_ZINNEN",
      title: "Verhalen in 3 zinnen",
      subtitle: "Mini-verhaal • veel tussen de regels",
      intro: `Soms zegt verbeelding meer dan een rechtstreekse vraag. Met deze tool toon je via een mini-verhaal hoe jij sfeer, toeval en verbinding aanvoelt met ${otherName}.`,
      tip: "Niet te hard nadenken. Een kort, levendig beeld werkt beter dan een perfect verhaal.",
      type: "mini_game",
      steps: [
        {
          id: "scene",
          kind: "free",
          prompt: `Jij en ${otherName} komen elkaar onverwacht tegen. Waar zijn jullie, en wat gebeurt er in de eerste seconden?`,
          hint: "Zet meteen een sfeer neer.",
          placeholder: "Bijvoorbeeld: op een perron, net wanneer het begint te regenen en niemand weet welke trein de juiste is.",
          multiline: true,
        },
        {
          id: "twist",
          kind: "free",
          prompt: "Wat verandert de sfeer of richting van het verhaal halverwege?",
          hint: "Een kleine verschuiving is vaak sterker dan een groot drama.",
          placeholder: "Bijvoorbeeld: één van ons zegt iets onverwacht eerlijks waardoor het gesprek meteen echter wordt.",
          multiline: true,
        },
        {
          id: "ending",
          kind: "free",
          prompt: "Wat is het einde van jullie mini-verhaal?",
          hint: "Laat intuïtief zien hoe jij afronding of toenadering ziet.",
          placeholder: "Bijvoorbeeld: we nemen afscheid, maar allebei met het gevoel dat het nog niet klaar is.",
          multiline: true,
        },
        {
          id: "meaning",
          kind: "free",
          prompt: `Welk stukje van jezelf zit verstopt in dit verhaal voor ${otherName}?`,
          hint: "Denk aan je toon, tempo, hoop of voorzichtige kant.",
          placeholder: "Bijvoorbeeld: ik merk dat ik verhalen vaak zacht laat eindigen, niet luid.",
          multiline: true,
        },
      ],
      outro: `Kijk niet alleen naar de inhoud, maar naar de sfeer die jullie elk creëren. Daar zit vaak veel persoonlijkheid in: speelsheid, romantiek, realisme of voorzichtigheid.`,
    },
  ];

  return pickVariant(variants, seedBase);
}
