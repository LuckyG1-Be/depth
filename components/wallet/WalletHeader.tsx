import { RefreshCw } from "lucide-react";
import { Button } from "@/components/Button";
import { cls } from "./utils";

export default function WalletHeader({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/65 sm:text-xs sm:tracking-[0.18em]">Wallet</div>
        <h1 className="mt-0.5 text-[1.35rem] font-semibold tracking-tight text-white sm:mt-2 sm:text-3xl">Tokens & voordelen</h1>
        <p className="mt-0.5 max-w-xl text-[13px] leading-5 text-white/58 sm:mt-2 sm:text-sm sm:leading-6">Voor extra tools, filters en matchruimte.</p>
      </div>

      <Button variant="ghost" onClick={onRefresh} className="shrink-0 rounded-2xl px-2.5 py-2 text-xs sm:w-auto sm:px-3 sm:text-sm" disabled={loading}>
        <span className="inline-flex items-center gap-2">
          <RefreshCw className={cls("h-4 w-4", loading ? "animate-spin" : "")} />
          <span className="hidden sm:inline">{loading ? "Vernieuwen…" : "Vernieuw"}</span><span className="sm:hidden">{loading ? "..." : ""}</span>
        </span>
      </Button>
    </div>
  );
}
