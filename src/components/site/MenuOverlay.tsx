"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
  closeIcon: ReactNode;
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    heroImage: string | null;
    subcategories: Array<{ slug: string; name: string; sort_order: number }>;
  }>;
}

const SECONDARY = [
  { label: "Locations", href: "/locations/mactan" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Admin", href: "/admin" },
];

export function MenuOverlay({
  open,
  onClose,
  closeIcon,
  categories,
}: MenuOverlayProps) {
  const pillars = categories.map((category) => ({
    label: category.name,
    slug: category.slug,
    href: `/${category.slug}`,
    image: category.heroImage ?? "/media/scuba.jpg",
    id: category.id,
    subcategories: category.subcategories,
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] bg-base-100/98 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto flex h-full max-w-[1600px] flex-col px-5 py-3 md:px-10">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/media/scotty-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 invert brightness-0"
                />
                <span className="font-display text-sm tracking-[0.32em] uppercase">
                  Explore our line
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-square btn-ghost"
                aria-label="Close menu"
              >
                {closeIcon}
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto no-scrollbar pb-12">
              <ul className="grid grid-cols-1 gap-px bg-base-content/10 md:grid-cols-2">
                {pillars.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    className="bg-base-100"
                  >
                    <Link
                      href={p.href}
                      onClick={onClose}
                      className="group relative flex aspect-[16/9] items-end overflow-hidden p-6 md:aspect-[16/8] md:p-10"
                    >
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover opacity-60 transition duration-700 group-hover:opacity-90 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/30 to-transparent" />
                      <div className="relative flex w-full items-end justify-between gap-4">
                        <span className="h-display text-4xl md:text-6xl">
                          {p.label}
                        </span>
                        <ArrowUpRight
                          className="h-7 w-7 transition group-hover:translate-x-1 group-hover:-translate-y-1"
                          strokeWidth={1.25}
                        />
                      </div>
                    </Link>
                    {p.subcategories.length > 0 && (
                      <div className="border-t border-base-content/10 px-5 py-4 md:px-8">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/50">
                          Browse
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-[0.22em]">
                          <li>
                            <Link
                              href={`/${p.slug}#category-activities`}
                              onClick={onClose}
                              className="text-base-content/70 hover:text-primary"
                            >
                              All trips
                            </Link>
                          </li>
                          {p.subcategories.map((sub) => (
                            <li key={sub.slug}>
                              <Link
                                href={`/${p.slug}#cat-sub-${sub.slug}`}
                                onClick={onClose}
                                className="text-base-content/70 hover:text-primary"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>

              <ul className="mt-12 grid grid-cols-2 gap-y-3 text-sm uppercase tracking-[0.28em] md:grid-cols-4">
                {SECONDARY.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      onClick={onClose}
                      className="hover:text-primary transition"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
