"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = {
  label: string;
  href: string;
  badge?: number;
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="order-3 flex w-full gap-6 overflow-x-auto text-xs uppercase tracking-[0.28em] md:order-2 md:w-auto">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        const badgeCount = item.badge ?? 0;
        const showBadge = badgeCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 whitespace-nowrap hover:text-primary ${
              active ? "text-primary" : ""
            }`}
          >
            {item.label}
            {showBadge ? (
              <span className="badge badge-primary badge-sm min-w-5 font-sans normal-case tracking-normal">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
