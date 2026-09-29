import { cls } from "./utils";

export default function UnlockPipsSmall({ total, remaining, isUnlocked }: { total: number; remaining: number; isUnlocked: boolean }) {
  const done = Math.max(0, Math.min(total, total - (remaining || 0)));
  return (
    <div className="flex items-center gap-1" title={isUnlocked ? "Foto’s zichtbaar" : "Foto’s verborgen"}>
      {Array.from({ length: total }).map((_, i) => {
        const on = isUnlocked ? true : i < done;
        return (
          <div
            key={i}
            className={cls(
              "h-3 w-[3px] rounded-full transition-all",
              on ? "bg-emerald-400 shadow-[0_0_10px_rgba(110,231,183,0.25)]" : "bg-current/20"
            )}
          />
        );
      })}
    </div>
  );
}
