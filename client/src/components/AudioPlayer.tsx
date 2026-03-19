import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, className }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-[#E8FF00] ${className || ""}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="w-3.5 h-3.5 text-black" fill="currentColor" />
        ) : (
          <Play className="w-3.5 h-3.5 text-black ml-0.5" fill="currentColor" />
        )}
      </button>

      <span className="text-[11px] font-mono text-black/70 tabular-nums w-[90px] text-center flex-shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div
        ref={progressRef}
        onClick={seek}
        className="flex-1 h-1.5 bg-black/15 rounded-full cursor-pointer relative overflow-hidden"
      >
        <div
          className="absolute inset-y-0 left-0 bg-black/50 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
