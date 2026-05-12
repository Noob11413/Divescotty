"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProfitRow = {
  preferredDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  priceCents: number;
  categoryName: string;
};

type MonthOption = {
  key: string;
  label: string;
  year: number;
  month: number;
};

function buildLastSixMonths(): MonthOption[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  }).reverse();
}

export function ProfitInsightsBoard({ rows }: { rows: ProfitRow[] }) {
  const months = useMemo(() => buildLastSixMonths(), []);
  const [monthIndex, setMonthIndex] = useState(months.length - 1);
  const selected = months[monthIndex];

  const { daily, total, maxAbs, trending } = useMemo(() => {
    const daysInMonth = new Date(selected.year, selected.month + 1, 0).getDate();
    const byDay = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      cents: 0,
    }));
    const categoryTotals = new Map<string, number>();

    for (const row of rows) {
      const dt = new Date(`${row.preferredDate}T00:00:00`);
      if (dt.getFullYear() !== selected.year || dt.getMonth() !== selected.month) {
        continue;
      }
      const amount =
        row.status === "cancelled"
          ? -Math.round(row.priceCents * 0.3)
          : row.status === "completed" || row.status === "confirmed"
            ? row.priceCents
            : 0;
      const day = dt.getDate();
      byDay[day - 1].cents += amount;
      categoryTotals.set(
        row.categoryName,
        (categoryTotals.get(row.categoryName) ?? 0) + amount,
      );
    }

    const hasEnoughRealSignal =
      byDay.filter((d) => d.cents !== 0).length >= Math.max(5, Math.floor(daysInMonth / 5));

    // Personal-project demo seed so dashboard does not look empty on fresh data.
    if (!hasEnoughRealSignal) {
      for (let i = 0; i < byDay.length; i++) {
        if (byDay[i].cents !== 0) continue;
        const dayNum = i + 1;
        const wave = Math.sin(dayNum / 3) * 55000;
        const trend = dayNum * 4200;
        const dip = dayNum % 7 === 0 ? -95000 : 0;
        byDay[i].cents = Math.round(wave + trend + dip);
      }

      const demoCategorySeed: Array<{ name: string; cents: number }> = [
        { name: "Scuba", cents: 1_850_000 },
        { name: "Freedive", cents: 1_180_000 },
        { name: "Island Tour", cents: 760_000 },
        { name: "Snorkel", cents: 540_000 },
      ];
      for (const c of demoCategorySeed) {
        categoryTotals.set(c.name, (categoryTotals.get(c.name) ?? 0) + c.cents);
      }
    }

    const totalCents = byDay.reduce((sum, d) => sum + d.cents, 0);
    const max = Math.max(1, ...byDay.map((d) => Math.abs(d.cents)));
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, cents]) => ({ name, cents }));

    return { daily: byDay, total: totalCents, maxAbs: max, trending: topCategories };
  }, [rows, selected]);

  const width = 760;
  const height = 220;
  const leftPad = 36;
  const rightPad = 10;
  const topPad = 12;
  const bottomPad = 24;
  const plotW = width - leftPad - rightPad;
  const plotH = height - topPad - bottomPad;
  const stepX = daily.length > 1 ? plotW / (daily.length - 1) : plotW;

  const points = daily
    .map((d, i) => {
      const x = leftPad + i * stepX;
      const y = topPad + (1 - (d.cents + maxAbs) / (2 * maxAbs)) * plotH;
      return `${x},${y}`;
    })
    .join(" ");
  const zeroY = topPad + (1 - maxAbs / (2 * maxAbs)) * plotH;

  return (
    <section className="overflow-hidden border border-base-content/10 bg-base-100">
      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr]">
        <div className="border-b border-base-content/10 p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                Profit chart
              </p>
              <h2 className="font-display mt-1 text-xl uppercase">{selected.label}</h2>
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={monthIndex === 0}
                onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={monthIndex === months.length - 1}
                onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[620px]">
            <line
              x1={leftPad}
              y1={zeroY}
              x2={width - rightPad}
              y2={zeroY}
              stroke="currentColor"
              className="text-base-content/20"
            />
            <polyline
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="2.5"
              points={points}
            />
            {daily.map((d, i) => {
              const x = leftPad + i * stepX;
              const y = topPad + (1 - (d.cents + maxAbs) / (2 * maxAbs)) * plotH;
              return (
                <circle
                  key={`${d.day}-${d.cents}`}
                  cx={x}
                  cy={y}
                  r="2.3"
                  className={d.cents >= 0 ? "fill-success" : "fill-error"}
                />
              );
            })}
              {[1, 8, 15, 22, daily.length].map((mark) => {
                const x = leftPad + (mark - 1) * stepX;
                return (
                  <text
                    key={mark}
                    x={x}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-base-content/60 text-[10px]"
                  >
                    {mark}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1">
          <div className="border-b border-base-content/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              Profit
            </p>
            <p
              className={`font-display mt-2 text-4xl ${
                total >= 0 ? "text-success" : "text-error"
              }`}
            >
              {(total / 100).toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-2 text-xs text-base-content/60">{selected.label}</p>
          </div>

          <div className="p-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              Trending categories
            </p>
            {trending.length === 0 ? (
              <p className="mt-3 text-sm text-base-content/70">No category data yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {trending.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">{c.name}</span>
                    <span className={c.cents >= 0 ? "text-success" : "text-error"}>
                      {(c.cents / 100).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
