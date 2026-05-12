import { cn } from "@/lib/utils";

interface ScrollCueProps {
  className?: string;
  label?: string;
}

export function ScrollCue({
  className,
  label = "Scroll to explore",
}: ScrollCueProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.32em]",
        className,
      )}
    >
      <span className="opacity-80">{label}</span>
      <span className="animate-scroll-cue">
        <svg width="1" height="36" viewBox="0 0 1 36" aria-hidden>
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="36"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </span>
    </div>
  );
}
