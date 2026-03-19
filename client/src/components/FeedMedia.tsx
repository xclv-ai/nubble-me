import { AudioPlayer } from "@/components/AudioPlayer";

export function FeedMedia({ audioUrl, infographicUrl }: { audioUrl?: string; infographicUrl?: string }) {
  if (!audioUrl && !infographicUrl) return null;

  return (
    <div className="flex-shrink-0">
      {audioUrl && (
        <div className="max-w-[660px] mx-auto px-4 sm:px-6">
          <AudioPlayer src={audioUrl} />
        </div>
      )}
      {infographicUrl && (
        <div className="max-w-[660px] mx-auto px-4 sm:px-6 pt-2 pb-1">
          <img
            src={infographicUrl}
            alt="Daily infographic"
            className="w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
