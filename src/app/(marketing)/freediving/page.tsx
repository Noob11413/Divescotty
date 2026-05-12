import type { Metadata } from "next";
import { CategoryLanding } from "@/components/site/CategoryLanding";

export const metadata: Metadata = {
  title: "Freediving",
  description:
    "Freediving courses, monofin training and mermaid school in glass-clear water across Cebu and Bohol.",
};

export const revalidate = 60;

export default function FreedivingPage() {
  return <CategoryLanding slug="freediving" />;
}
