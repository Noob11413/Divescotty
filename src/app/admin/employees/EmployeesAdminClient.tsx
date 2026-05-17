"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { deleteEmployee, upsertEmployee } from "@/app/actions/employees";
import { PhpMoneyInput } from "@/components/ui/PhpMoneyInput";
import { employeeCodePreviewLabel } from "@/lib/employee-code";

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

export type EmployeeAdminRow = {
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

function getFullName(row: EmployeeAdminRow) {
  const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return full || row.name;
}

function getInitials(row: EmployeeAdminRow) {
  const first = (row.first_name ?? row.name).trim().charAt(0);
  const last = (row.last_name ?? "").trim().charAt(0);
  return (first + last).toUpperCase() || "?";
}

function emptyEmployee(): EmployeeAdminRow {
  return {
    id: "",
    employee_code: "",
    name: "",
    first_name: "",
    last_name: "",
    role: "employee",
    expertise_level: null,
    phone: null,
    email: null,
    photo_url: null,
    credentials_url: null,
    certifications: null,
    is_active: true,
    payout_mode: "percent",
    payout_percent: 30,
    hourly_rate_cents: null,
    overtime_hourly_rate_cents: null,
  };
}

type EmployeeModal =
  | { mode: "create" }
  | { mode: "edit"; row: EmployeeAdminRow };

export function EmployeesAdminClient({
  employees,
  initialEditId,
}: {
  employees: EmployeeAdminRow[];
  initialEditId?: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<EmployeeModal | null>(null);

  const closeModal = useCallback(() => {
    setModal(null);
    router.replace("/admin/employees", { scroll: false });
  }, [router]);

  const openCreate = useCallback(() => {
    setModal({ mode: "create" });
  }, []);

  const openEdit = useCallback((row: EmployeeAdminRow) => {
    setModal({ mode: "edit", row });
  }, []);

  useEffect(() => {
    if (!initialEditId) return;
    const row = employees.find((e) => e.id === initialEditId);
    if (row) setModal({ mode: "edit", row });
  }, [initialEditId, employees]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modal, closeModal]);

  const modalRow =
    modal?.mode === "create"
      ? emptyEmployee()
      : modal?.mode === "edit"
        ? modal.row
        : null;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Team
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Employees</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="border border-primary bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
        >
          New employee
        </button>
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
            {employees.map((row) => (
              <tr key={row.id} className="border-t border-base-content/10">
                <td>
                  <EmployeeAvatar row={row} size="sm" />
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
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-base-content/60">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && modalRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-base-content/30 backdrop-blur-[1px]"
            onClick={closeModal}
            aria-label="Close employee form"
          />
          <div
            className="relative z-10 w-full max-w-4xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-profile-title"
          >
            <EmployeeFormModalContent
              key={modal.mode === "create" ? "create" : modal.row.id}
              mode={modal.mode}
              row={modalRow}
              onClose={closeModal}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeFormModalContent({
  mode,
  row,
  onClose,
}: {
  mode: "create" | "edit";
  row: EmployeeAdminRow;
  onClose: () => void;
}) {
  const isCreate = mode === "create";
  const [role, setRole] = useState(row.role);
  const [payoutMode, setPayoutMode] = useState<"percent" | "hourly">(
    row.payout_mode ?? "percent",
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(row.photo_url);
  const filePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    setPhotoPreview(row.photo_url);
    return () => {
      if (filePreviewRef.current) {
        URL.revokeObjectURL(filePreviewRef.current);
        filePreviewRef.current = null;
      }
    };
  }, [row.id, row.photo_url]);

  const onPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (filePreviewRef.current) {
      URL.revokeObjectURL(filePreviewRef.current);
      filePreviewRef.current = null;
    }
    if (!file) {
      setPhotoPreview(isCreate ? null : row.photo_url);
      return;
    }
    const url = URL.createObjectURL(file);
    filePreviewRef.current = url;
    setPhotoPreview(url);
  };

  const displayName = isCreate ? "New employee" : getFullName(row);
  const formId = isCreate ? "employee-create" : `employee-edit-${row.id}`;

  return (
    <div
      className="max-h-[90vh] overflow-y-auto border border-base-content/15 bg-base-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-base-content/10 bg-base-200/50 px-6 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            {isCreate ? "Add team member" : "Employee profile"}
          </p>
          <h2
            id="employee-profile-title"
            className="font-display mt-1 text-2xl uppercase"
          >
            {displayName}
          </h2>
          {!isCreate ? (
            <p className="mt-1 font-mono text-xs text-base-content/60">
              {row.employee_code}
            </p>
          ) : (
            <p className="mt-1 text-xs text-base-content/60">
              Code: {employeeCodePreviewLabel(role)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form id={formId} action={upsertEmployee} className="p-6 pb-0">
        {!isCreate ? <input type="hidden" name="id" value={row.id} /> : null}
        <input type="hidden" name="photo_current" value={row.photo_url ?? ""} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-base-content/15 bg-base-200 shadow-md">
              {photoPreview ? (
                photoPreview.startsWith("data:") || photoPreview.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={photoPreview}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-4xl text-base-content/40">
                  {getInitials(row)}
                </span>
              )}
            </div>
            <label className="flex w-full flex-col gap-2">
              <span className="text-center text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                {isCreate ? "Add photo" : "Change photo"}
              </span>
              <input
                type="file"
                name="photo_file"
                accept="image/png,image/jpeg"
                onChange={onPhotoFileChange}
                className="file-input file-input-bordered file-input-sm w-full bg-base-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="First name"
              name="first_name"
              defaultValue={row.first_name ?? ""}
              required
            />
            <Field
              label="Surname"
              name="last_name"
              defaultValue={row.last_name ?? ""}
              required
            />
            <SelectField
              label="Role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as EmployeeAdminRow["role"])}
              options={ROLE_OPTIONS}
            />
            <SelectField
              label="Expertise"
              name="expertise_level"
              defaultValue={row.expertise_level ?? ""}
              options={EXPERTISE_OPTIONS}
            />
            <Field label="Phone" name="phone" defaultValue={row.phone ?? ""} />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={row.email ?? ""}
            />
            <PayoutFields
              payoutMode={payoutMode}
              onPayoutModeChange={setPayoutMode}
              row={row}
            />
            <CredentialsField currentValue={row.credentials_url ?? null} />
            <label className="flex flex-col gap-2 sm:col-span-2">
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
            <label className="flex items-center gap-2 sm:col-span-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={row.is_active}
                className="checkbox"
              />
              Active (available for assignment)
            </label>
          </div>
        </div>

      </form>

      <div
        className={`flex flex-wrap items-center gap-3 border-t border-base-content/10 px-6 py-6 ${
          isCreate ? "justify-end" : "justify-between"
        }`}
      >
          {!isCreate ? (
          <div className="flex flex-wrap items-center gap-2">
            {!row.is_active ? (
              <form action={deleteEmployee}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="mode" value="restore" />
                <button
                  type="submit"
                  className="border border-success/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-success hover:bg-success hover:text-success-content"
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
                  className="border border-warning/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-warning hover:bg-warning hover:text-warning-content"
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
                className="border border-error/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-error hover:bg-error hover:text-error-content"
              >
                Hard delete
              </button>
            </form>
          </div>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-base-content/30 px-5 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className="bg-primary px-6 py-2 text-xs uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
            >
              {isCreate ? "Create employee" : "Save employee"}
            </button>
          </div>
        </div>
    </div>
  );
}

function EmployeeAvatar({
  row,
  size,
}: {
  row: EmployeeAdminRow;
  size: "sm";
}) {
  if (row.photo_url) {
    if (row.photo_url.startsWith("data:")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.photo_url}
          alt={getFullName(row)}
          className="h-12 w-12 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full">
        <Image
          src={row.photo_url}
          alt={getFullName(row)}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 font-display text-sm text-base-content/40"
      aria-hidden
    >
      {getInitials(row)}
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input className="input input-bordered input-sm bg-base-100" {...rest} />
    </label>
  );
}

function PayoutFields({
  payoutMode,
  onPayoutModeChange,
  row,
}: {
  payoutMode: "percent" | "hourly";
  onPayoutModeChange: (mode: "percent" | "hourly") => void;
  row: EmployeeAdminRow;
}) {
  const isHourly = payoutMode === "hourly";

  return (
    <>
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Payout mode
        </span>
        <select
          name="payout_mode"
          value={payoutMode}
          onChange={(e) =>
            onPayoutModeChange(e.target.value === "hourly" ? "hourly" : "percent")
          }
          className="select select-bordered select-sm bg-base-100"
        >
          <option value="percent">Revenue share (%)</option>
          <option value="hourly">Hourly rate</option>
        </select>
      </label>

      {isHourly ? (
        <>
          <PhpMoneyInput
            label="Hourly rate (PHP)"
            name="hourly_rate_php"
            defaultAmountPhp={
              row.hourly_rate_cents != null ? row.hourly_rate_cents / 100 : 0
            }
            emptyWhenZero
          />
          <PhpMoneyInput
            label="Overtime hourly (PHP)"
            name="overtime_hourly_rate_php"
            defaultAmountPhp={
              row.overtime_hourly_rate_cents != null
                ? row.overtime_hourly_rate_cents / 100
                : 0
            }
            emptyWhenZero
          />
          <p className="text-xs text-base-content/60 sm:col-span-2">
            Payout on bookings uses instructor hours × these rates (overtime after 4h
            uses the overtime rate when set).
          </p>
        </>
      ) : (
        <>
          <Field
            label="Payout percent"
            name="payout_percent"
            type="number"
            step="0.1"
            min={0.1}
            max={100}
            required
            defaultValue={String(row.payout_percent ?? 30)}
          />
          <p className="text-xs text-base-content/60 sm:col-span-2">
            Share of the booking quoted total paid to this employee (e.g. 30 = 30%).
          </p>
        </>
      )}
    </>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        className="select select-bordered select-sm bg-base-100"
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

function CredentialsField({ currentValue }: { currentValue: string | null }) {
  return (
    <label className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        Credentials (PDF)
      </span>
      <input type="hidden" name="credentials_current" value={currentValue ?? ""} />
      <input
        type="file"
        name="credentials_file"
        accept="application/pdf"
        className="file-input file-input-bordered file-input-sm w-full bg-base-100"
      />
      {currentValue ? (
        <a
          href={currentValue}
          target="_blank"
          rel="noreferrer"
          className="text-xs uppercase tracking-[0.22em] text-primary hover:underline"
        >
          View current credentials PDF
        </a>
      ) : null}
    </label>
  );
}

