import { headers } from "next/headers";
import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminNewBookingEmailInput = {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  activityName: string;
  preferredDate: string;
  preferredTime: string | null;
  partySize: number;
  locationName: string | null;
  specialRequests: string | null;
  source?: "website" | "custom_request";
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function resolveAdminNotificationEmail(
  supabase: SupabaseClient,
): Promise<string | null> {
  const fromEnv = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (fromEnv) return fromEnv;

  const { data } = await supabase
    .from("site_settings")
    .select("contact_email")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contact = (data as { contact_email?: string } | null)?.contact_email?.trim();
  if (contact) return contact;

  return process.env.SMTP_USER?.trim() || null;
}

async function resolveAdminBookingsUrl(): Promise<string> {
  const envUrl = process.env.ADMIN_SITE_URL?.trim();
  if (envUrl) return `${envUrl.replace(/\/$/, "")}/admin/bookings`;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}/admin/bookings`;
  } catch {
    // headers() unavailable outside request (e.g. some scripts)
  }

  return "http://localhost:3000/admin/bookings";
}

export async function sendAdminNewBookingEmail(
  to: string,
  input: AdminNewBookingEmailInput,
) {
  const transporter = getTransporter();
  const from = process.env.BOOKING_EMAIL_FROM || process.env.SMTP_USER;

  if (!transporter || !from) {
    return { sent: false as const, reason: "email_not_configured" as const };
  }

  const adminUrl = await resolveAdminBookingsUrl();
  const sourceLabel =
    input.source === "custom_request"
      ? "Converted from custom request"
      : "New website booking";

  const subject = `New booking request — ${input.bookingReference}`;
  const html = `
    <p><strong>${sourceLabel}</strong></p>
    <p><strong>Reference:</strong> ${input.bookingReference}</p>
    <p><strong>Customer:</strong> ${input.customerName}</p>
    <p><strong>Email:</strong> ${input.customerEmail}</p>
    <p><strong>Phone:</strong> ${input.customerPhone}</p>
    <p><strong>Activity:</strong> ${input.activityName}</p>
    <p><strong>Date:</strong> ${input.preferredDate}</p>
    <p><strong>Time:</strong> ${input.preferredTime ?? "No preference"}</p>
    <p><strong>Party size:</strong> ${input.partySize}</p>
    ${input.locationName ? `<p><strong>Location:</strong> ${input.locationName}</p>` : ""}
    ${input.specialRequests ? `<p><strong>Notes:</strong> ${input.specialRequests}</p>` : ""}
    <p><a href="${adminUrl}">Open bookings in admin</a></p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `${sourceLabel}: ${input.bookingReference} — ${input.customerName}, ${input.activityName}, ${input.preferredDate}. Admin: ${adminUrl}`,
  });

  return { sent: true as const };
}

/** Email admin when a customer submits a new booking (non-blocking for caller). */
export async function notifyAdminNewBooking(
  supabase: SupabaseClient,
  input: AdminNewBookingEmailInput,
) {
  const to = await resolveAdminNotificationEmail(supabase);
  if (!to) {
    return { sent: false as const, reason: "no_admin_recipient" as const };
  }

  try {
    return await sendAdminNewBookingEmail(to, input);
  } catch (err) {
    console.error("Admin new booking notification failed", err);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
