"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UnlockConfetti } from "@/components/UnlockConfetti";

export function UnlockMoment() {
  const sp = useSearchParams();
  const fire = sp.get("unlocked") === "1";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!fire) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [fire]);

  return (
    <>
      <UnlockConfetti fire={fire} />
      {show && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100">
          🎉 Foto’s ontgrendeld — jullie hebben 5 beurten bereikt.
        </div>
      )}
    </>
  );
}
