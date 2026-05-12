interface MarqueeStripeProps {
  items?: string[];
}

const DEFAULTS = [
  "Operating since 1986",
  "PADI Certified",
  "GUE Training",
  "Cebu",
  "Bohol",
  "Boracay",
  "Apnea",
  "Wreck",
  "Reef",
  "Wall",
];

export function MarqueeStripe({ items = DEFAULTS }: MarqueeStripeProps) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-base-content/10 bg-base-200/50 py-4">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-8 inline-flex items-center text-xs uppercase tracking-[0.32em] text-base-content/60"
          >
            <span className="mr-8 inline-block h-1 w-1 rounded-full bg-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
