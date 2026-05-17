import { createClient } from "@/lib/supabase/server";
import {
  EmployeesAdminClient,
  type EmployeeAdminRow,
} from "./EmployeesAdminClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  edit?: string;
};

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("employees")
    .select("*")
    .order("name");
  const employeeRows = (rows ?? []) as EmployeeAdminRow[];

  return (
    <EmployeesAdminClient
      employees={employeeRows}
      initialEditId={sp.edit?.trim() || undefined}
    />
  );
}
