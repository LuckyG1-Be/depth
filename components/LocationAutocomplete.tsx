"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LocationValue = {
  label: string;
  lat: number;
  lng: number;
  placeId: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Typ en kies uit de lijst… (bv. Gent, Brussel, Antwerpen)",
}: {
  value: LocationValue | null;
  onChange: (v: LocationValue | null) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<LocationValue[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const debounceRef = useRef<any>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setText(value?.label ?? "");
  }, [value?.label]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const canSearch = useMemo(() => text.trim().length >= 2, [text]);

  useEffect(() => {
    setErr(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!canSearch) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(text.trim())}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.ok !== true) {
          setErr("Kan locaties even niet ophalen.");
          setResults([]);
          return;
        }

        const items = Array.isArray(data?.results) ? data.results : [];
        setResults(
          items.map((r: any) => ({
            label: String(r.label),
            lat: Number(r.lat),
            lng: Number(r.lng),
            placeId: String(r.id),
          }))
        );
      } catch {
        setErr("Netwerkfout bij locaties.");
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, canSearch]);

  function choose(v: LocationValue) {
    onChange(v);
    setText(v.label);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          setOpen(true);
          // Zodra er manueel getypt wordt: selectie is niet meer geldig
          onChange(null);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-emerald-300/30"
      />

      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">
        {busy ? "zoeken…" : null}
      </div>

      {open ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#141220] shadow-xl">
          {err ? <div className="px-3 py-2 text-sm text-white/70">{err}</div> : null}

          {!err && results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/60">
              {canSearch ? "Geen resultaten. Probeer bv. “Gent”." : "Typ minstens 2 letters…"}
            </div>
          ) : null}

          {!err && results.length > 0 ? (
            <ul className="max-h-72 overflow-auto">
              {results.map((r) => (
                <li key={r.placeId}>
                  <button
                    type="button"
                    onClick={() => choose(r)}
                    className={cls(
                      "w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 transition",
                      value?.placeId === r.placeId && "bg-white/5"
                    )}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {value ? (
            <div className="border-t border-white/10 px-3 py-2">
              <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-white/70 hover:text-white">
                Locatie wissen
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
