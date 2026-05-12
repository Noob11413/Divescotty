export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-base-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-24 overflow-hidden bg-base-300">
          <div className="h-full w-1/3 animate-marquee bg-primary" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Loading
        </p>
      </div>
    </div>
  );
}
