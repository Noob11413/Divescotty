import Link from "next/link";

const defaultPageSize = 25;

function buildHref(
  path: string,
  page: number,
  query: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export function AdminPagination({
  path,
  page,
  pageSize = defaultPageSize,
  total,
  query,
}: {
  path: string;
  page: number;
  pageSize?: number;
  total: number;
  /** Extra query keys to preserve (do not include `page`). */
  query: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-content/10 bg-base-200/30 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-base-content/60">
        Showing {start}–{end} of {total}
      </p>
      {totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center gap-1"
          aria-label="Pagination"
        >
          <PaginationLink
            href={buildHref(path, 1, query)}
            disabled={safePage <= 1}
            label="First"
          />
          <PaginationLink
            href={buildHref(path, safePage - 1, query)}
            disabled={safePage <= 1}
            label="Prev"
          />
          <span className="px-3 text-xs tabular-nums text-base-content/80">
            {safePage} / {totalPages}
          </span>
          <PaginationLink
            href={buildHref(path, safePage + 1, query)}
            disabled={safePage >= totalPages}
            label="Next"
          />
          <PaginationLink
            href={buildHref(path, totalPages, query)}
            disabled={safePage >= totalPages}
            label="Last"
          />
        </nav>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.2em] text-base-content/50">
          Single page
        </p>
      )}
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="border border-base-content/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-base-content/35">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="border border-base-content/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] hover:bg-base-content hover:text-base-100"
    >
      {label}
    </Link>
  );
}

/** Default page size for admin data tables (bookings, custom requests, etc.). */
export const ADMIN_LIST_PAGE_SIZE = defaultPageSize;
