"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { MenuOverlay } from "./MenuOverlay";

type NavCategory = {
  id: string;
  slug: string;
  name: string;
  heroImage: string | null;
  subcategories: Array<{ slug: string; name: string; sort_order: number }>;
};

export function Navbar({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-base-100/85 backdrop-blur-md border-b border-base-content/10"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-3 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Scotty's Action Sports Network — Home"
          >
            <Image
              src="/media/scotty-logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-9 w-9 invert brightness-0 group-hover:brightness-100 group-hover:invert-0 transition"
            />
            <span className="font-display text-sm tracking-[0.32em] uppercase hidden sm:inline">
              Scotty&apos;s
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-[0.28em] font-medium">
            {categories.map((category) =>
              category.subcategories.length === 0 ? (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="hover:text-primary transition"
                >
                  {category.name}
                </Link>
              ) : (
                <div key={category.id} className="group relative">
                  <Link
                    href={`/${category.slug}`}
                    className="inline-flex items-center gap-1 hover:text-primary transition"
                  >
                    {category.name}
                    <ChevronDown
                      className="h-3.5 w-3.5 opacity-60 transition group-hover:rotate-180 group-focus-within:rotate-180"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                  <div
                    className="pointer-events-none invisible absolute left-0 top-full z-50 min-w-[12rem] pt-2 opacity-0 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
                    role="menu"
                  >
                    <ul className="border border-base-content/15 bg-base-100 py-2 shadow-lg">
                      <li>
                        <Link
                          href={`/${category.slug}#category-activities`}
                          className="block px-4 py-2 hover:bg-base-200/80"
                          role="menuitem"
                        >
                          All {category.name}
                        </Link>
                      </li>
                      {category.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            href={`/${category.slug}#cat-sub-${sub.slug}`}
                            className="block px-4 py-2 hover:bg-base-200/80"
                            role="menuitem"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden md:inline-flex btn btn-ghost btn-sm uppercase tracking-[0.28em] text-xs"
            >
              Contact
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn btn-square btn-ghost"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay
        open={open}
        onClose={() => setOpen(false)}
        closeIcon={<X className="h-5 w-5" strokeWidth={1.5} />}
        categories={categories}
      />
    </>
  );
}
