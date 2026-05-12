import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ActivityForm } from "../ActivityForm";
import { deleteActivity } from "@/app/actions/activities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  id: string;
}

export default async function EditActivityPage(
  { params }: { params: Promise<RouteParams> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const [activityRes, cats, locs, links, subcatsScoped] = await Promise.all([
    supabase.from("activities").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("locations").select("id, name").order("sort_order"),
    supabase
      .from("activity_locations")
      .select("location_id")
      .eq("activity_id", id),
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

  if (!activityRes.data) notFound();
  const activity = activityRes.data as {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  const linkRows = (links.data ?? []) as Array<{ location_id: string }>;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/activities"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to activities
          </Link>
          <h1 className="font-display mt-3 text-4xl uppercase">
            Edit · {activity.name}
          </h1>
        </div>

        <form action={deleteActivity}>
          <input type="hidden" name="id" value={activity.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 border border-error/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-error hover:bg-error hover:text-error-content"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </form>
      </header>

      <ActivityForm
        activity={{
          ...activity,
          location_ids: linkRows.map((l) => l.location_id),
        }}
        categories={cats.data ?? []}
        subcategories={subcats.data ?? []}
        locations={locs.data ?? []}
      />
    </div>
  );
}
