import { Suspense } from "react";
import { AdminFlashBanner } from "@/components/admin/AdminFlashBanner";
import { AdminToastProvider } from "@/components/admin/AdminToastProvider";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { getCategories, getSubcategoriesForNav } from "@/lib/queries";
import type { Category } from "@/lib/supabase/database.types";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categoriesRaw, subsRaw] = await Promise.all([
    getCategories().catch(() => []),
    getSubcategoriesForNav().catch(() => []),
  ]);
  const categories = categoriesRaw as Category[];
  const subsByCategory = new Map<
    string,
    Array<{ slug: string; name: string; sort_order: number }>
  >();
  for (const row of subsRaw) {
    const list = subsByCategory.get(row.category_id) ?? [];
    list.push({
      slug: row.slug,
      name: row.name,
      sort_order: row.sort_order,
    });
    subsByCategory.set(row.category_id, list);
  }
  for (const list of subsByCategory.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }

  return (
    <AdminToastProvider>
      <Navbar
        categories={categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          heroImage: category.hero_image ?? null,
          subcategories: subsByCategory.get(category.id) ?? [],
        }))}
      />
      <main className="min-h-screen">
        <Suspense fallback={null}>
          <AdminFlashBanner />
        </Suspense>
        {children}
      </main>
      <Footer />
    </AdminToastProvider>
  );
}
