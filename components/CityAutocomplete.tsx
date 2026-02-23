"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function CityAutocomplete({
  name,
  required,
  defaultValue,
  placeholder,
  value: controlledValue,
  onChange,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(controlledValue ?? defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof controlledValue === "string") setValue(controlledValue);
  }, [controlledValue]);

  const query = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const run = async () => {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal: ac.signal });
      const data = await res.json();
      setItems(Array.isArray(data?.cities) ? data.cities : []);
    };

    run().catch(() => {});
    return () => ac.abort();
  }, [query]);

  return (
    <div className="relative">
      <input
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder || "Begin te typen…"}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        autoComplete="off"
      />

      {open && items.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg">
          {items.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setValue(c);
                onChange?.(c);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
