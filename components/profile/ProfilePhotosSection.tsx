import type { RefObject } from "react";
import ProfilePhotoManager, { type ProfilePhoto } from "@/components/ProfilePhotoManager";
import { MIN_PHOTOS } from "./constants";
import type { ProfileErrors } from "./types";

export default function ProfilePhotosSection({
  sectionRef,
  photos,
  errors,
  refreshMe,
}: {
  sectionRef: RefObject<HTMLElement>;
  photos: ProfilePhoto[];
  errors: ProfileErrors;
  refreshMe: () => Promise<void>;
}) {
  return (
    <section ref={sectionRef} className="depth-card scroll-mt-24 p-3.5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="depth-eyebrow">Stap 5</div>
          <h2 className="mt-1 text-lg font-semibold text-white">Foto’s</h2>
          <p className="mt-1 text-sm text-white/62">Min. {MIN_PHOTOS}, max. 9. Je hoofdfoto is slot 1.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/65">
          {photos.length}/9
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-white/60 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">✓ Heldere foto van jezelf</div>
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">✓ Eerste foto = hoofdfoto</div>
        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">✓ Rustige, recente foto’s</div>
      </div>

      <div className="mt-5">
        <ProfilePhotoManager
          photos={photos}
          onRefresh={async () => {
            try {
              await refreshMe();
            } catch {
              // ignore
            }
          }}
        />
        {errors.photos && <div className="mt-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-200">{errors.photos}</div>}
      </div>
    </section>
  );
}
