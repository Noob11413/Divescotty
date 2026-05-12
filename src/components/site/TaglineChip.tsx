import { cn } from "@/lib/utils";

interface TaglineChipProps {
  children: React.ReactNode;
  className?: string;
}

export function TaglineChip({ children, className }: TaglineChipProps) {
  return (
    <span className={cn("tagline-chip inline-flex items-center", className)}>
      <span className="mr-2 inline-block h-1 w-1 rounded-full bg-primary" />
      {children}
    </span>
  );
}
