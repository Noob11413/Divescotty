import type { Metadata } from "next";
import { CategoryLanding } from "@/components/site/CategoryLanding";

export const metadata: Metadata = {
  title: "Watersports",
  description:
    "Parasailing, jet skis, banana boats, flyfish rides and more — every speedboat-towed thrill the islands allow.",
};

export const revalidate = 60;

export default function WatersportsPage() {
  return <CategoryLanding slug="watersports" />;
}
