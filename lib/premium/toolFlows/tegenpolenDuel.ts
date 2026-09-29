import { pickVariant, type FlowContext, type ToolFlow } from "../toolFlowTypes";

export function buildTegenpolenDuelFlow(ctx: FlowContext): ToolFlow {
  const otherName = String(ctx?.otherName || "je match").trim() || "je match";
  const seedBase = `TEGENPOLEN_DUEL:${ctx?.matchId || "nomatch"}`;

  const variants: ToolFlow[] = [
    {
      key: "TEGENPOLEN_DUEL",
      title: "Tegenpolen Duel",
      subtitle: "Psychologisch scherper • instinctief kiezen",
      intro: `Jullie krijgen een reeks scherpe tegenpolen. Kies telkens wat het meest bij jou past en vergelijk daarna waar jij en ${otherName} elkaar vanzelf vinden, en waar net verschil zit.`,
      tip: "Kies je eerste reflex. Het gaat niet om het ideale antwoord, maar om je natuurlijke stijl.",
      type: "mini_game",
      steps: [
        {
          id: "structure",
          kind: "pick",
          prompt: "Je ideale weekend ontstaat meestal…",
          hint: "Kies wat spontaan het meest waar voelt.",
          options: ["Ik plan graag vooraf wat we gaan doen", "Ik zie liever wel waar de dag ons brengt"],
        },
        {
          id: "conflict",
          kind: "pick",
          prompt: "Als er spanning is tussen twee mensen, dan…",
          options: ["Praat ik het liefst vrij snel uit", "Heb ik eerst tijd nodig om na te denken"],
        },
        {
          id: "recharge",
          kind: "pick",
          prompt: "Na een drukke week laad ik het meest op door…",
          options: ["Tijd met mensen", "Tijd alleen"],
        },
        {
          id: "openness",
          kind: "pick",
          prompt: "Als iets mij echt raakt, dan…",
          options: ["Deel ik dat meestal vrij snel", "Hou ik dat eerst liever voor mezelf"],
        },
        {
          id: "decision",
          kind: "pick",
          prompt: "Grote beslissingen neem ik meestal meer op basis van…",
          options: ["Gevoel", "Analyse"],
        },
        {
          id: "connection_pace",
          kind: "pick",
          prompt: "In een nieuwe connectie ga ik meestal…",
          options: ["Vrij snel de diepte in", "Eerder stap voor stap"],
        },
        {
          id: "risk",
          kind: "pick",
          prompt: "Als ik twijfel over iets nieuws, dan…",
          options: ["Probeer ik het sneller gewoon uit", "Weeg ik het liever eerst goed af"],
        },
        {
          id: "appreciation",
          kind: "pick",
          prompt: "Ik voel me het meest gewaardeerd wanneer iemand…",
          options: ["Bewust tijd met mij maakt", "Op kleine manieren laat merken dat ik in hun hoofd zit"],
        },
        {
          id: "self_insight",
          kind: "free",
          prompt: `Welk verschil met ${otherName} zou voor jou interessant kunnen zijn, zolang er wederzijds begrip is?`,
          hint: "Hou het concreet. Eén eerlijke zin is sterker dan een mooi antwoord.",
          placeholder: "Bijvoorbeeld: iemand die rustiger reageert dan ik, zolang we elkaar niet verkeerd lezen.",
        },
      ],
      outro: `Vergelijk nu niet alleen waar jij en ${otherName} verschillen, maar vooral wat dat verschil in de praktijk betekent: tempo, verwerking, nabijheid, vrijheid of communicatie.`,
    },
    {
      key: "TEGENPOLEN_DUEL",
      title: "Tegenpolen Duel",
      subtitle: "Dynamiek zichtbaar maken • zonder oppervlakkigheid",
      intro: `Deze versie focust minder op smaak en meer op hoe jij in verbinding staat. Zo zie je sneller of jij en ${otherName} vooral gelijk lopen, of elkaar net aanvullen.`,
      tip: "Twijfel je tussen twee antwoorden? Kies dan degene die in stress of spontaniteit het vaakst waar is.",
      type: "mini_game",
      steps: [
        {
          id: "structure",
          kind: "pick",
          prompt: "Wat geeft jou meestal meer rust?",
          options: ["Duidelijkheid en een plan", "Vrijheid en ruimte om te bewegen"],
        },
        {
          id: "conflict",
          kind: "pick",
          prompt: "Bij onduidelijkheid in contact doe ik meestal eerder dit:",
          options: ["Het meteen benoemen", "Eerst observeren en voelen"],
        },
        {
          id: "recharge",
          kind: "pick",
          prompt: "Mijn batterij herstelt meestal sneller via…",
          options: ["Verbondenheid", "Terugtrekking"],
        },
        {
          id: "openness",
          kind: "pick",
          prompt: "Mijn emoties zijn vaker…",
          options: ["Vrij zichtbaar", "Eerder intern"],
        },
        {
          id: "decision",
          kind: "pick",
          prompt: "Wanneer iets belangrijk is, vertrouw ik vaker op…",
          options: ["Mijn intuïtie", "Mijn afweging"],
        },
        {
          id: "connection_pace",
          kind: "pick",
          prompt: "Als iemand mij boeit, dan ben ik meestal eerder…",
          options: ["Open en snel echt", "Voorzichtig en geleidelijk"],
        },
        {
          id: "risk",
          kind: "pick",
          prompt: "Bij iets nieuws dat spannend voelt, ben ik vaker iemand die…",
          options: ["Springt en onderweg bijstuurt", "Pas beweegt na voldoende zekerheid"],
        },
        {
          id: "appreciation",
          kind: "pick",
          prompt: "Waardering voel ik sterker via…",
          options: ["Echte aanwezigheid", "Doordachte aandacht"],
        },
        {
          id: "self_insight",
          kind: "free",
          prompt: `Waar hoop je dat ${otherName} jouw stijl niet verkeerd zou lezen?`,
          hint: "Geef woorden aan iets wat vaak verkeerd geïnterpreteerd wordt.",
          placeholder: "Bijvoorbeeld: mijn stilte betekent niet dat ik afstand voel.",
        },
      ],
      outro: `De interessantste verschillen zijn meestal niet de luidste. Kijk waar jullie tempo, openheid of verwerking anders lopen, en of daar net spanning of aanvulling in zit.`,
    },
  ];

  return pickVariant(variants, seedBase);
}
