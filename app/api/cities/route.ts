import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// “Forte uitbreiding” (NL/FR varianten + veel meer BE plaatsen)
// (autocomplete is forgiving: dit is vooral voor suggesties)
const SEED = [
  // Brussels (19)
  "Anderlecht","Oudergem","Sint-Agatha-Berchem","Brussel","Etterbeek","Evere","Vorst","Ganshoren","Elsene","Jette",
  "Koekelberg","Sint-Jans-Molenbeek","Sint-Gillis","Sint-Joost-ten-Node","Schaarbeek","Ukkel","Watermaal-Bosvoorde",
  "Sint-Lambrechts-Woluwe","Sint-Pieters-Woluwe",

  // Grote steden + veelgebruikte gemeenten
  "Antwerpen","Gent","Brugge","Leuven","Mechelen","Hasselt","Genk","Kortrijk","Aalst","Sint-Niklaas","Turnhout",
  "Oostende","Roeselare","Waregem","Tienen","Vilvoorde","Lier","Lokeren","Dendermonde","Diest","Geel","Herentals",
  "Mol","Heist-op-den-Berg","Aarschot","Schoten","Brasschaat","Kapellen","Edegem","Mortsel","Kontich","Boechout",
  "Beveren","Sint-Truiden","Tongeren","Bilzen","Maasmechelen","Dilsen-Stokkem","Lommel","Beringen","Heusden-Zolder",
  "Houthalen-Helchteren","Zonhoven","Peer","Pelt","Bree","Maaseik","Lanaken",

  // Vlaams-Brabant / rand
  "Zaventem","Machelen","Diegem","Kraainem","Wezembeek-Oppem","Tervuren","Overijse","Hoeilaart",
  "Dilbeek","Asse","Wemmel","Grimbergen","Meise","Vilvoorde","Steenokkerzeel","Kampenhout","Herent","Kortenberg",

  // Oost-Vlaanderen extra
  "Eeklo","Zelzate","Wetteren","Merelbeke","Melle","Destelbergen","Lochristi","Evergem","Maldegem","Kaprijke",
  "Geraardsbergen","Ninove","Zottegem","Ronse","Oudenaarde","Deinze","Lede","Erpe-Mere","Temse","Beveren-Kruibeke-Zwijndrecht",

  // West-Vlaanderen extra
  "Knokke-Heist","Blankenberge","De Haan","Bredene","Middelkerke","Nieuwpoort","Koksijde","De Panne",
  "Ieper","Poperinge","Diksmuide","Veurne","Tielt","Izegem","Menen","Wevelgem","Zwevegem","Harelbeke",

  // Wallonië (grote + vaak)
  "Charleroi","Luik","Liège","Namur","Namen","Mons","Bergen","Tournai","Doornik","La Louvière","Seraing",
  "Verviers","Mouscron","Moeskroen","Ath","Arlon","Aarlen","Bastogne","Bastenaken","Dinant","Durbuy","Spa",
  "Wavre","Waals-Waver","Ottignies-Louvain-la-Neuve","Nivelles","Nijvel","Waterloo","Braine-l'Alleud","Eigenbrakel",
  "Braine-le-Château","Kasteelbrakel","Tubize","Tubeke","Soignies","Zinnik","Lessines","Lessen","Binche","Binc(h)e",
  "Huy","Hoei","Herstal","Saint-Nicolas","Sint-Niklaas (Luik)","Sambreville","Jambes","Andenne",

  // Duitstalige regio / Oostkantons (selectie)
  "Eupen","Sankt Vith","Saint-Vith","Kelmis","La Calamine","Raeren","Büllingen","Burg-Reuland","Amel","Lontzen",

  // Extra populaire NL/FR grensplaatsen (handig voor users)
  "Maastricht","Roermond","Eindhoven","Breda","Tilburg","Goes","Vlissingen","Terneuzen",
  "Lille","Roubaix","Tourcoing","Valenciennes",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  let dbCities: Array<{ city: string }> = [];
  try {
    dbCities = await prisma.user.findMany({
      distinct: ["city"],
      select: { city: true },
      take: 500,
    });
  } catch {
    // Public autocomplete remains useful during first boot or a temporary DB outage.
  }

  const all = Array.from(new Set([...SEED, ...dbCities.map((x) => x.city).filter(Boolean)]));

  const filtered = q
    ? all
        .filter((c) => c.toLowerCase().includes(q))
        .slice(0, 16)
    : all.slice(0, 16);

  return NextResponse.json({ cities: filtered });
}
