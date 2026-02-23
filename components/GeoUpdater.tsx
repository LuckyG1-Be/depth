"use client";

import { useEffect } from "react";

const KEY = "depth:lastGeoUpdateAt";
const UPDATE_EVERY_MS = 6 * 60 * 60 * 1000; // 6 uur

function canUseGeo() {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

async function reverseCity(lat: number, lng: number): Promise<string | null> {
  // Gratis reverse geocode via OpenStreetMap Nominatim
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");

    // ⚠️ In de browser mag je GEEN "user-agent" header zetten.
    // Dat maakte deze call onbetrouwbaar / failte vaak.
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;

    const data: any = await res.json().catch(() => null);
    const a = data?.address;

    const city =
      a?.city ||
      a?.town ||
      a?.village ||
      a?.municipality ||
      a?.county ||
      null;

    const country = a?.country || null;
    if (!city) return null;
    return country ? `${city}, ${country}` : String(city);
  } catch {
    return null;
  }
}

export default function GeoUpdater() {
  useEffect(() => {
    if (!canUseGeo()) return;

    const last = Number(localStorage.getItem(KEY) || "0");
    if (Date.now() - last < UPDATE_EVERY_MS) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const city = await reverseCity(lat, lng);

        await fetch("/api/location/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lat, lng, ...(city ? { city } : {}) }),
        }).catch(() => {});

        localStorage.setItem(KEY, String(Date.now()));
      },
      () => {
        // user denied / error -> niet blijven spammen
        localStorage.setItem(KEY, String(Date.now()));
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 8000 }
    );
  }, []);

  return null;
}