import type { Metadata } from "next";
import { CategoryLanding } from "@/components/site/CategoryLanding";

export const metadata: Metadata = {
  title: "Island Tours",
  description:
    "Private island hopping, sunset cruises, deep-sea fishing and chartered boats around Cebu, Bohol and Boracay.",
};

export const revalidate = 60;

export default function IslandToursPage() {
  return <CategoryLanding slug="island-tours" />;
}
