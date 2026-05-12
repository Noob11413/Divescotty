import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Send } from "lucide-react";
import { NewsletterStrip } from "./NewsletterStrip";

const COLUMNS = [
  {
    title: "Activities",
    links: [
      { label: "Scuba Diving", href: "/scuba" },
      { label: "Freediving", href: "/freediving" },
      { label: "Watersports", href: "/watersports" },
      { label: "Island Tours", href: "/island-tours" },
    ],
  },
  {
    title: "Locations",
    links: [
      { label: "Cebu & Mactan", href: "/locations/mactan" },
      { label: "Bohol & Panglao", href: "/locations/panglao" },
      { label: "Boracay", href: "/locations/boracay" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Admin", href: "/admin" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-base-content/10 bg-base-100">
      <NewsletterStrip />

      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Image
                src="/media/scotty-logo.png"
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 invert brightness-0"
              />
              <div className="flex flex-col">
                <span className="font-display text-xl tracking-[0.32em] uppercase">
                  Scotty&apos;s
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                  Action Sports Network
                </span>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-base-content/70">
              Operating in the Philippines since 1986. PADI certified scuba
              dive center, GUE training, freediving and the most comprehensive
              watersports lineup across Cebu, Bohol and Boracay.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://instagram.com"
                className="btn btn-square btn-ghost"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href="https://facebook.com"
                className="btn btn-square btn-ghost"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href="https://wa.me/639176312960"
                className="btn btn-square btn-ghost"
                aria-label="WhatsApp"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-primary transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-3">
            <h4 className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              Headquarters
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-base-content/70">
              Punta Engaño Road, Mactan Island
              <br />
              Lapu-Lapu City 6015, Cebu, Philippines
            </p>
            <a
              href="tel:+639176312960"
              className="mt-3 inline-block text-sm hover:text-primary"
            >
              +63 917 631 2960
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-base-content/10 pt-6 text-xs text-base-content/50 md:flex-row md:items-center md:justify-between">
          <p>© 1986–{new Date().getFullYear()} Scotty&apos;s Action Sports Network. All rights reserved.</p>
          <p className="uppercase tracking-[0.32em]">Operating since 1986</p>
        </div>
      </div>
    </footer>
  );
}
