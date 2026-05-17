"use client";

import { useCallback, useState, type ReactNode } from "react";
import { formatMoneyAmount, parseMoneyAmount } from "@/lib/utils";

function initialDisplay(amountPhp: number, emptyWhenZero: boolean): string {
  if (emptyWhenZero && amountPhp === 0) return "";
  return formatMoneyAmount(amountPhp);
}

export function PhpMoneyInput({
  name,
  label,
  defaultAmountPhp = 0,
  emptyWhenZero = false,
  className = "",
  inputClassName = "input input-bordered bg-base-100",
  icon,
  helper,
}: {
  name: string;
  label: string;
  defaultAmountPhp?: number;
  /** When true, zero shows as blank (e.g. optional amount paid). */
  emptyWhenZero?: boolean;
  className?: string;
  inputClassName?: string;
  /** Pre-rendered icon element (e.g. <Clock className="h-3.5 w-3.5" />) so this client component can be used from server components. */
  icon?: ReactNode;
  helper?: string;
}) {
  const [value, setValue] = useState(() =>
    initialDisplay(defaultAmountPhp, emptyWhenZero),
  );

  const formatOnBlur = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setValue(emptyWhenZero ? "" : formatMoneyAmount(0));
      return;
    }
    const parsed = parseMoneyAmount(trimmed);
    setValue(
      emptyWhenZero && parsed === 0 ? "" : formatMoneyAmount(parsed),
    );
  }, [value, emptyWhenZero]);

  const onFocus = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    const parsed = parseMoneyAmount(trimmed);
    setValue(parsed === 0 && emptyWhenZero ? "" : String(parsed));
  }, [value, emptyWhenZero]);

  return (
    <label className={`flex flex-col gap-2 ${className}`.trim()}>
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {icon ?? null}
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={formatOnBlur}
        onFocus={onFocus}
        className={inputClassName}
      />
      {helper ? (
        <span className="text-[11px] leading-relaxed text-base-content/55">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
