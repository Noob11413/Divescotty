"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { TaglineChip } from "./TaglineChip";
import { cn } from "@/lib/utils";

interface SpotlightSectionProps {
  index: number; // for the "01 / 04" counter
  total: number;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  ctaHref: string;
  ctaLabel?: string;
  reverse?: boolean;
  chip?: string;
}

export function SpotlightSection({
  index,
  total,
  eyebrow,
  title,
  description,
  image,
  ctaHref,
  ctaLabel = "Explore",
  reverse = false,
  chip,
}: SpotlightSectionProps) {
  return (
    <section className="relative border-t border-base-content/10 bg-base-100">
      <div
        className={cn(
          "mx-auto grid max-w-[1600px] grid-cols-1 gap-0 lg:grid-cols-2",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-auto lg:min-h-[760px]"
        >
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-100/30 to-transparent lg:hidden" />
          {chip && (
            <TaglineChip className="absolute left-5 top-5 md:left-8 md:top-8">
              {chip}
            </TaglineChip>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col justify-between gap-12 px-6 py-16 md:px-12 md:py-24 lg:min-h-[760px]"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-base-content/50">
            <span>
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span>{eyebrow}</span>
          </div>

          <div className="max-w-xl">
            <h2 className="h-display text-[clamp(3rem,7vw,6.5rem)]">{title}</h2>
            <p className="mt-8 text-base leading-relaxed text-base-content/75 md:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
            >
              {ctaLabel}
              <ArrowUpRight
                className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1"
                strokeWidth={1.5}
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
