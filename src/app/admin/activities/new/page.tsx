import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActivityForm } from "../ActivityForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const supabase = await createClient();
  const [cats, locs, subcatsScoped] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("locations").select("id, name").order("sort_order"),
    supabase
      .from("subcategories")
      .select("id, name, category_id")
      .is("deleted_at", null)
      .order("sort_order"),
  ]);
  const subcats =
    subcatsScoped.error && subcatsScoped.error.message.includes("deleted_at")
      ? await supabase
          .from("subcategories")
          .select("id, name, category_id")
          .order("sort_order")
      : subcatsScoped;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/activities"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to activities
          </Link>
          <h1 className="font-display mt-3 text-4xl uppercase">New activity</h1>
        </div>
      </header>

      <ActivityForm
        categories={cats.data ?? []}
        subcategories={subcats.data ?? []}
        locations={locs.data ?? []}
      />
    </div>
  );
}
