import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminCreateBookingForm } from "../AdminCreateBookingForm";

export const dynamic = "force-dynamic";

export default async function AdminNewBookingPage() {
  const supabase = await createClient();
  const [activitiesRes, locationsRes, employeesRes, activityLocationsRes] =
    await Promise.all([
      supabase
        .from("activities")
        .select("id, name, min_party, max_party")
        .eq("is_published", true)
        .order("name"),
      supabase.from("locations").select("id, name").order("name"),
      supabase
        .from("employees")
        .select("id, name, employee_code, role")
        .eq("is_active", true)
        .order("name"),
      supabase.from("activity_locations").select("activity_id, location_id"),
    ]);

  const locationIdsByActivity = new Map<string, string[]>();
  for (const row of activityLocationsRes.data ?? []) {
    const r = row as { activity_id: string; location_id: string };
    const list = locationIdsByActivity.get(r.activity_id) ?? [];
    list.push(r.location_id);
    locationIdsByActivity.set(r.activity_id, list);
  }

  const activities = (activitiesRes.data ?? []).map((a) => {
    const row = a as {
      id: string;
      name: string;
      min_party: number;
      max_party: number;
    };
    return {
      ...row,
      location_ids: locationIdsByActivity.get(row.id) ?? [],
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.28em] hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Walk-in / phone
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">New booking</h1>
          <p className="mt-2 max-w-xl text-sm text-base-content/70">
            Create a booking on behalf of a customer. Confirmation email sends if SMTP is
            configured in <code className="text-xs">.env.local</code>.
          </p>
        </div>
      </header>

      <AdminCreateBookingForm
        activities={activities}
        locations={(locationsRes.data ?? []) as Array<{ id: string; name: string }>}
        employees={
          (employeesRes.data ?? []) as Array<{
            id: string;
            name: string;
            employee_code: string;
            role: string;
          }>
        }
      />
    </div>
  );
}
