"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { TaglineChip } from "./TaglineChip";
import { ScrollCue } from "./ScrollCue";

interface VideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function VideoHero({
  videoSrc,
  posterSrc,
  eyebrow = "Scotty's Action Sports Network",
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: VideoHeroProps) {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-base-300">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        aria-hidden
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-base-100/30 via-base-100/20 to-base-100/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.55)_100%)]" />

      <div className="absolute left-5 right-5 top-24 z-10 flex items-center justify-between md:left-10 md:right-10 md:top-28">
        <TaglineChip>Operating in the Philippines · since 1986</TaglineChip>
        <TaglineChip className="hidden md:inline-flex">
          PADI · GUE · Apnea
        </TaglineChip>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1600px] flex-col gap-10 px-5 pb-16 md:px-10 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h-display mt-4 max-w-[14ch] text-[clamp(3.5rem,11vw,11rem)]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-base text-base-content/80 md:text-lg">
            {subtitle}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="btn btn-primary btn-lg uppercase tracking-[0.28em] text-xs"
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="btn btn-outline btn-lg uppercase tracking-[0.28em] text-xs"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </motion.div>

        <div className="hidden items-end justify-between md:flex">
          <ScrollCue />
          <Link
            href="/scuba"
            className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.32em] hover:text-primary"
          >
            See all activities
            <ArrowDown className="h-4 w-4 -rotate-45 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
