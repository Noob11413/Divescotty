import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPricePHP } from "@/lib/utils";

export const dynamic = "force-dynamic";

function categoryLabel(category: unknown): string {
  if (category == null) return "—";
  if (Array.isArray(category)) {
    const first = category[0] as { name?: string } | undefined;
    return first?.name ?? "—";
  }
  return (category as { name?: string }).name ?? "—";
}

export default async function AdminActivitiesPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("activities")
    .select(
      "id, slug, name, price_cents, is_published, is_featured, sort_order, category:categories(name, slug)",
    )
    .order("sort_order");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Catalog
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Activities</h1>
        </div>
        <Link
          href="/admin/activities/new"
          className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New activity
        </Link>
      </header>

      <div className="overflow-hidden border border-base-content/10">
        <table className="table">
          <thead className="bg-base-200">
            <tr className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Published</th>
              <th>Featured</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-t border-base-content/10">
                <td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-base-content/60">/{row.slug}</div>
                </td>
                <td>{categoryLabel(row.category)}</td>
                <td>{formatPricePHP(row.price_cents)}</td>
                <td>{row.is_published ? "Yes" : "No"}</td>
                <td>{row.is_featured ? "Yes" : "No"}</td>
                <td>{row.sort_order}</td>
                <td>
                  <Link
                    href={`/admin/activities/${row.id}`}
                    className="text-xs uppercase tracking-[0.28em] hover:text-primary"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-base-content/60">
                  No activities yet.{" "}
                  <Link
                    href="/admin/activities/new"
                    className="text-primary hover:underline"
                  >
                    Create the first one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
