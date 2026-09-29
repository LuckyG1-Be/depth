import { Button } from "@/components/Button";
import DepthTokenIcon from "./DepthTokenIcon";
import type { Pack } from "./types";
import { cls, moneyEUR } from "./utils";

function pricePerToken(pack: Pack) {
  if (!pack.tokens) return "—";
  return moneyEUR(Math.round(pack.amountCents / pack.tokens));
}

export default function TokenPacksSection({
  packs,
  buying,
  startPurchase,
}: {
  packs: Pack[];
  buying: string | null;
  startPurchase: (packKey: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white/85">Tokenpakketten</div>
          <div className="mt-1 text-sm leading-6 text-white/55">Voor extra tools en voordelen.</div>
        </div>
        <div className="text-xs text-white/42">Mollie checkout</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {packs.map((p) => (
          <div
            key={p.key}
            className={cls("relative rounded-3xl border p-4", p.highlight ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-black/20")}
          >
            {p.highlight ? <div className="absolute right-4 top-4 rounded-full border border-emerald-300/20 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-50">Populair</div> : null}

            <div className="pr-20 text-base font-semibold text-white/90">{p.title}</div>
            <div className="mt-1 text-xs text-white/50">{p.subtitle}</div>

            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
                <DepthTokenIcon className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <div className="text-4xl font-semibold tracking-tight text-white">{p.tokens}</div>
                <div className="text-xs text-white/55">tokens</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/55">Prijs</span>
                <span className="font-semibold text-white/85">{p.priceLabel}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <span className="text-white/42">Per token</span>
                <span className="text-white/55">{pricePerToken(p)}</span>
              </div>
            </div>

            <Button onClick={() => void startPurchase(p.key)} disabled={!!buying} className="mt-4 w-full rounded-2xl">
              {buying === p.key ? "Checkout…" : "Koop"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
