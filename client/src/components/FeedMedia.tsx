import { useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";

export function FeedMedia({ audioUrl, infographicUrl }: { audioUrl?: string; infographicUrl?: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!audioUrl && !infographicUrl) return null;

  return (
    <div className="flex-shrink-0">
      {audioUrl && <AudioPlayer src={audioUrl} />}
      {infographicUrl && (
        <div
          className="bg-[#E8FF00]/30 border-t border-black/5 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <img
              src={infographicUrl}
              alt="Daily infographic"
              className="w-full"
            />
          ) : (
            <div className="px-4 py-1.5 flex items-center justify-center gap-2">
              <span className="text-[11px] font-medium text-black/60">
                View infographic
              </span>
              <svg className="w-3 h-3 text-black/40" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
