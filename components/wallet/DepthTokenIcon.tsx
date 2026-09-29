import { BookOpen, Brain, Clock3, Compass, MessageCircle, SlidersHorizontal } from "lucide-react";
import { GREEN } from "./utils";

export default function DepthTokenIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={GREEN} strokeWidth="1.8" opacity="0.95" />
      <path
        d="M12 5.2c1.7-1.55 4.45-1.35 5.9.38 1.34 1.6 1.2 4.02-.27 5.5L12 16.4l-5.63-5.3c-1.47-1.48-1.6-3.9-.27-5.5 1.45-1.73 4.2-1.93 5.9-.38Z"
        stroke={GREEN}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <circle cx="18.4" cy="7.3" r="1.1" fill={GREEN} opacity="0.9" />
      <circle cx="6.2" cy="16.8" r="0.9" fill={GREEN} opacity="0.55" />
    </svg>
  );
}

export function renderToolIcon(key: string) {
  switch (key) {
    case "RELATIE_KOMPAS":
      return <Compass className="h-5 w-5 text-white/85" />;
    case "SCENARIO_SPIEGEL":
      return <MessageCircle className="h-5 w-5 text-white/85" />;
    case "TEGENPOLEN_DUEL":
      return <Brain className="h-5 w-5 text-white/85" />;
    case "VERHALEN_DRIE_ZINNEN":
      return <BookOpen className="h-5 w-5 text-white/85" />;
    case "LIFESTYLE_FILTERS":
      return <SlidersHorizontal className="h-5 w-5 text-white/85" />;
    case "MATCH_SLOT_EXTENSION":
      return <Clock3 className="h-5 w-5 text-white/85" />;
    default:
      return <DepthTokenIcon className="h-5 w-5" />;
  }
}
