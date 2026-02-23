import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlaceSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

function isPlace(x: PlaceSuggestion | null): x is PlaceSuggestion {
  return x !== null;
}

function cleanLabel(parts: Array<string | null | undefined>) {
  return parts
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0)
    .join(", ");
}

function labelFromPhotonProps(p: any) {
  const city = p.city || p.town || p.village || p.municipality || p.name || "";
  const state = p.state || p.county || "";
  const country = p.country || "";
  return cleanLabel([city, state, country]);
}

function labelFromNominatim(item: any) {
  const a = item?.address || {};
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    a.state_district ||
    "";
  const state = a.state || a.county || "";
  const country = a.country || "";
  const label = cleanLabel([city || item?.name || "", state, country]);
  return label || String(item?.display_name || "").split(",").slice(0, 3).join(",").trim();
}

function dedupeByLabel(list: PlaceSuggestion[]): PlaceSuggestion[] {
  return list.filter((x: PlaceSuggestion, idx: number, arr: PlaceSuggestion[]) => {
    return arr.findIndex((y: PlaceSuggestion) => y.label === x.label) === idx;
  });
}

async function fetchPhoton(q: string): Promise<PlaceSuggestion[] | null> {
  const photonUrl = new URL("https://photon.komoot.io/api/");
  photonUrl.searchParams.set("q", q);
  photonUrl.searchParams.set("limit", "8");
  photonUrl.searchParams.set("lang", "nl");

  const res = await fetch(photonUrl.toString(), {
    headers: {
      accept: "application/json",
      "user-agent": "Depth/1.0 (places autocomplete)",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return null;

  const data: any = await res.json().catch(() => null);
  const features = Array.isArray(data?.features) ? data.features : [];

  const results: PlaceSuggestion[] = features
    .map((f: any): PlaceSuggestion | null => {
      const props = f?.properties || {};
      const coords = f?.geometry?.coordinates; // [lng, lat]
      const lng = typeof coords?.[0] === "number" ? coords[0] : null;
      const lat = typeof coords?.[1] === "number" ? coords[1] : null;
      if (lat == null || lng == null) return null;

      const label = labelFromPhotonProps(props);
      if (!label) return null;

      const osmId = props?.osm_id != null ? String(props.osm_id) : "";
      const id = osmId ? `photon:${osmId}` : `photon:${lat},${lng}`;

      return { id, label, lat, lng };
    })
    .filter(isPlace);

  return dedupeByLabel(results);
}

async function fetchNominatim(q: string): Promise<PlaceSuggestion[] | null> {
  const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
  nomUrl.searchParams.set("format", "jsonv2");
  nomUrl.searchParams.set("q", q);
  nomUrl.searchParams.set("addressdetails", "1");
  nomUrl.searchParams.set("limit", "8");
  nomUrl.searchParams.set("accept-language", "nl");

  const res = await fetch(nomUrl.toString(), {
    headers: {
      accept: "application/json",
      "user-agent": "Depth/1.0 (places autocomplete)",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return null;

  const data: any = await res.json().catch(() => null);
  const items = Array.isArray(data) ? data : [];

  const results: PlaceSuggestion[] = items
    .map((it: any): PlaceSuggestion | null => {
      const lat = Number(it?.lat);
      const lng = Number(it?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const label = labelFromNominatim(it);
      if (!label) return null;

      const osmType = it?.osm_type ? String(it.osm_type) : "osm";
      const osmId = it?.osm_id != null ? String(it.osm_id) : "";
      const id = osmId ? `nominatim:${osmType}:${osmId}` : `nominatim:${lat},${lng}`;

      return { id, label, lat, lng };
    })
    .filter(isPlace);

  return dedupeByLabel(results);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) return NextResponse.json({ ok: true, results: [] as PlaceSuggestion[] });

    const photon = await fetchPhoton(q);
    if (photon && photon.length) return NextResponse.json({ ok: true, results: photon });

    const nom = await fetchNominatim(q);
    if (nom && nom.length) return NextResponse.json({ ok: true, results: nom });

    return NextResponse.json({ ok: true, results: [] as PlaceSuggestion[] });
  } catch {
    return NextResponse.json({ ok: false, error: "PLACES_ERROR" }, { status: 500 });
  }
}