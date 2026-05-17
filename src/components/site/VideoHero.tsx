"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { TaglineChip } from "./TaglineChip";
import { ScrollCue } from "./ScrollCue";

interface VideoHeroProps {
  videoSrc?: string;
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
  const hasVideo = Boolean(videoSrc && videoSrc.trim());
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-base-300">
      {hasVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          aria-hidden
          key={videoSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-base-100/30 via-base-100/20 to-base-100/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.55)_100%)]" />

      <div className="absolute inset-0 z-10 mx-auto flex max-w-[1600px] flex-col px-5 pb-12 pt-[76px] md:px-10 md:pb-12 md:pt-[92px]">
        <div className="flex items-center justify-between">
          <TaglineChip>Operating in the Philippines · since 1986</TaglineChip>
          <TaglineChip className="hidden md:inline-flex">
            PADI · GUE · Apnea
          </TaglineChip>
        </div>

        <div className="flex-1" aria-hidden />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h-display mt-3 max-w-[16ch] text-[clamp(2.75rem,8vw,8.5rem)] leading-[0.95] md:mt-4">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-sm text-base-content/80 md:mt-6 md:text-lg">
            {subtitle}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
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

        <div className="mt-8 hidden items-end justify-between md:mt-10 md:flex">
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
