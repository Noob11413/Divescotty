import { CategoryLanding } from "@/components/site/CategoryLanding";
import { getCategories } from "@/lib/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function DynamicCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryLanding slug={slug} />;
}
