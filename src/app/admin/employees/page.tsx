import { deleteEmployee, upsertEmployee } from "@/app/actions/employees";
import { createClient } from "@/lib/supabase/server";
import type { InputHTMLAttributes } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS = [
  "employee",
  "tourguide",
  "scubaguide",
  "instructor",
] as const;

const EXPERTISE_OPTIONS = [
  "beginner",
  "intermediate",
  "advanced",
  "technical",
] as const;

type EmployeeAdminRow = {
  id: string;
  employee_code: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: "employee" | "tourguide" | "scubaguide" | "instructor";
  expertise_level: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  credentials_url: string | null;
  certifications: string | null;
  is_active: boolean;
  payout_mode: "percent" | "hourly";
  payout_percent: number;
  hourly_rate_cents: number | null;
  overtime_hourly_rate_cents: number | null;
};

type SearchParams = {
  edit?: string;
};

export default async function AdminEmployeesPage(
  { searchParams }: { searchParams: Promise<SearchParams> },
) {
  const sp = await searchParams;
  const editingId = sp.edit ?? "";
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("employees")
    .select("*")
    .order("name");
  const employeeRows = (rows ?? []) as EmployeeAdminRow[];
  const editingEmployee = employeeRows.find((row) => row.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Team
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Employees</h1>
      </header>

      <div className="overflow-hidden border border-base-content/10">
        <table className="table">
          <thead className="bg-base-200">
            <tr className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
              <th>Photo</th>
              <th>Code</th>
              <th>Full name</th>
              <th>Role</th>
              <th>Credentials</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employeeRows.map((row) => (
              <tr key={row.id} className="border-t border-base-content/10">
                <td>
                  {row.photo_url ? (
                    <img
                      src={row.photo_url}
                      alt={row.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-base-200" />
                  )}
                </td>
                <td className="font-mono text-xs">{row.employee_code}</td>
                <td>{getFullName(row)}</td>
                <td className="uppercase">{row.role}</td>
                <td>
                  {row.credentials_url ? (
                    <a
                      href={row.credentials_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.22em] text-primary hover:underline"
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/60">None</span>
                  )}
                </td>
                <td>
                  <span
                    className={`inline-flex border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                      row.is_active
                        ? "border-success/40 bg-success/15 text-success"
                        : "border-warning/40 bg-warning/15 text-warning"
                    }`}
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-right">
                  <Link
                    href={`/admin/employees?edit=${row.id}`}
                    className="border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {employeeRows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-base-content/60">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingEmployee ? (
        <EditEmployeeForm row={editingEmployee} />
      ) : (
        <NewEmployeeForm />
      )}
    </div>
  );
}

function EditEmployeeForm({ row }: { row: EmployeeAdminRow }) {
  return (
    <div className="border border-base-content/10 bg-base-200/40 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">
          Edit employee: {getFullName(row)}
        </h2>
        <Link
          href="/admin/employees"
          className="border border-base-content/30 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
        >
          Close editor
        </Link>
      </div>

      <form
        action={upsertEmployee}
        id={`employee-edit-${row.id}`}
        className="grid grid-cols-1 gap-3 lg:grid-cols-12"
      >
        <input type="hidden" name="id" value={row.id} />
        <Field
          label="Employee code"
          name="employee_code"
          defaultValue={row.employee_code}
          className="lg:col-span-2"
          required
        />
        <Field
          label="First name"
          name="first_name"
          defaultValue={row.first_name ?? ""}
          className="lg:col-span-2"
          required
        />
        <Field
          label="Surname"
          name="last_name"
          defaultValue={row.last_name ?? ""}
          className="lg:col-span-2"
          required
        />
        <SelectField
          label="Role"
          name="role"
          defaultValue={row.role}
          options={ROLE_OPTIONS}
          className="lg:col-span-2"
        />
        <SelectField
          label="Expertise"
          name="expertise_level"
          defaultValue={row.expertise_level ?? ""}
          options={EXPERTISE_OPTIONS}
          className="lg:col-span-2"
        />
        <Field
          label="Phone"
          name="phone"
          defaultValue={row.phone ?? ""}
          className="lg:col-span-2"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={row.email ?? ""}
          className="lg:col-span-3"
        />
        <SelectField
          label="Payout mode"
          name="payout_mode"
          defaultValue={row.payout_mode ?? "percent"}
          options={["percent", "hourly"]}
          className="lg:col-span-3"
        />
        <Field
          label="Payout percent"
          name="payout_percent"
          type="number"
          step="0.1"
          min={0}
          max={100}
          defaultValue={String(row.payout_percent ?? 30)}
          className="lg:col-span-3"
        />
        <Field
          label="Hourly rate (PHP)"
          name="hourly_rate_php"
          type="number"
          step="0.01"
          min={0}
          defaultValue={
            row.hourly_rate_cents != null ? (row.hourly_rate_cents / 100).toString() : ""
          }
          className="lg:col-span-3"
        />
        <Field
          label="Overtime hourly rate (PHP)"
          name="overtime_hourly_rate_php"
          type="number"
          step="0.01"
          min={0}
          defaultValue={
            row.overtime_hourly_rate_cents != null
              ? (row.overtime_hourly_rate_cents / 100).toString()
              : ""
          }
          className="lg:col-span-3"
        />
        <PhotoField className="lg:col-span-3" currentValue={row.photo_url ?? null} />
        <CredentialsField
          className="lg:col-span-3"
          currentValue={row.credentials_url ?? null}
        />
        <label className="flex flex-col gap-2 lg:col-span-3">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Certifications
          </span>
          <textarea
            name="certifications"
            rows={3}
            defaultValue={row.certifications ?? ""}
            className="textarea textarea-bordered bg-base-100"
          />
        </label>
        <label className="flex items-center gap-2 lg:col-span-12 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={row.is_active}
            className="checkbox"
          />
          Active (available for assignment)
        </label>
      </form>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-base-content/10 pt-4">
        <div className="flex items-center gap-2">
          {!row.is_active ? (
            <form action={deleteEmployee}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="mode" value="restore" />
              <button
                type="submit"
                className="border border-success/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-success hover:bg-success hover:text-success-content"
              >
                Restore
              </button>
            </form>
          ) : (
            <form action={deleteEmployee}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="mode" value="soft" />
              <button
                type="submit"
                className="border border-warning/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-warning hover:bg-warning hover:text-warning-content"
              >
                Deactivate
              </button>
            </form>
          )}
          <form action={deleteEmployee}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="mode" value="hard" />
            <button
              type="submit"
              className="border border-error/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-error hover:bg-error hover:text-error-content"
            >
              Hard delete
            </button>
          </form>
        </div>
        <button
          type="submit"
          form={`employee-edit-${row.id}`}
          className="bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
        >
          Save employee
        </button>
      </div>
    </div>
  );
}

function NewEmployeeForm() {
  return (
    <form
      action={upsertEmployee}
      className="grid grid-cols-1 gap-3 border border-dashed border-base-content/20 bg-base-100 p-6 lg:grid-cols-12"
    >
      <p className="lg:col-span-12 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        New employee
      </p>
      <Field
        label="Employee code"
        name="employee_code"
        className="lg:col-span-2"
        required
      />
      <Field label="First name" name="first_name" className="lg:col-span-2" required />
      <Field label="Surname" name="last_name" className="lg:col-span-2" required />
      <SelectField
        label="Role"
        name="role"
        defaultValue="employee"
        options={ROLE_OPTIONS}
        className="lg:col-span-2"
      />
      <SelectField
        label="Expertise"
        name="expertise_level"
        defaultValue=""
        options={EXPERTISE_OPTIONS}
        className="lg:col-span-2"
      />
      <Field label="Phone" name="phone" className="lg:col-span-2" />
      <Field label="Email" name="email" type="email" className="lg:col-span-3" />
      <SelectField
        label="Payout mode"
        name="payout_mode"
        defaultValue="percent"
        options={["percent", "hourly"]}
        className="lg:col-span-3"
      />
      <Field
        label="Payout percent"
        name="payout_percent"
        type="number"
        min={0}
        max={100}
        step="0.1"
        defaultValue="30"
        className="lg:col-span-3"
      />
      <Field
        label="Hourly rate (PHP)"
        name="hourly_rate_php"
        type="number"
        min={0}
        step="0.01"
        className="lg:col-span-3"
      />
      <Field
        label="Overtime hourly rate (PHP)"
        name="overtime_hourly_rate_php"
        type="number"
        min={0}
        step="0.01"
        className="lg:col-span-3"
      />
      <PhotoField className="lg:col-span-3" currentValue={null} />
      <CredentialsField className="lg:col-span-3" currentValue={null} />
      <label className="flex flex-col gap-2 lg:col-span-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Certifications
        </span>
        <textarea
          name="certifications"
          rows={3}
          className="textarea textarea-bordered bg-base-100"
        />
      </label>
      <label className="flex items-center gap-2 lg:col-span-12 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked
          className="checkbox"
        />
        Active (available for assignment)
      </label>
      <div className="lg:col-span-12 flex justify-end">
        <button
          type="submit"
          className="bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
        >
          Create employee
        </button>
      </div>
    </form>
  );
}

function getFullName(row: EmployeeAdminRow) {
  const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return full || row.name;
}

function Field({
  label,
  className = "",
  ...rest
}: { label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input className="input input-bordered bg-base-100" {...rest} />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: readonly string[];
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="select select-bordered bg-base-100"
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PhotoField({
  className,
  currentValue,
}: {
  className?: string;
  currentValue: string | null;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        Photo (PNG/JPEG)
      </span>
      <input type="hidden" name="photo_current" value={currentValue ?? ""} />
      <input
        type="file"
        name="photo_file"
        accept="image/png,image/jpeg"
        className="file-input file-input-bordered bg-base-100"
      />
    </label>
  );
}

function CredentialsField({
  className,
  currentValue,
}: {
  className?: string;
  currentValue: string | null;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        Credentials (PDF)
      </span>
      <input
        type="hidden"
        name="credentials_current"
        value={currentValue ?? ""}
      />
      <input
        type="file"
        name="credentials_file"
        accept="application/pdf"
        className="file-input file-input-bordered bg-base-100"
      />
    </label>
  );
}
