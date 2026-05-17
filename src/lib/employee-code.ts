export type EmployeeRoleCode =
  | "employee"
  | "tourguide"
  | "scubaguide"
  | "instructor";

const PREFIX_BY_ROLE: Record<EmployeeRoleCode, string> = {
  employee: "EMP-",
  tourguide: "TG-",
  scubaguide: "SG-",
  instructor: "IN-",
};

export function getEmployeeCodePrefix(role: string): string {
  if (role in PREFIX_BY_ROLE) {
    return PREFIX_BY_ROLE[role as EmployeeRoleCode];
  }
  return PREFIX_BY_ROLE.employee;
}

export function employeeCodePreviewLabel(role: string): string {
  return `${getEmployeeCodePrefix(role)}### (assigned on save)`;
}

/** Pick the next code for a prefix from existing codes (e.g. SG-001 → SG-002). */
export function nextEmployeeCodeForPrefix(
  prefix: string,
  existingCodes: string[],
): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}(\\d+)$`, "i");
  let max = 0;
  for (const code of existingCodes) {
    const match = code.trim().match(pattern);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10) || 0);
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function parseEmployeeRole(role: string): EmployeeRoleCode {
  if (
    role === "tourguide" ||
    role === "scubaguide" ||
    role === "instructor" ||
    role === "employee"
  ) {
    return role;
  }
  return "employee";
}
