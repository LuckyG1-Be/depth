import { cls } from "./utils";

function SkeletonLine({ w = "w-full" }: { w?: string }) {
  return <div className={cls("h-3 animate-pulse rounded-full bg-white/10", w)} />;
}

export default function MessageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="w-[72%] rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3">
          <SkeletonLine w="w-4/5" />
          <div className="mt-2">
            <SkeletonLine w="w-2/3" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="w-[66%] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-3">
          <SkeletonLine w="w-3/4" />
          <div className="mt-2">
            <SkeletonLine w="w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
