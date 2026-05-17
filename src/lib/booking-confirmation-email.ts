import nodemailer from "nodemailer";
import { buildBookingPdf } from "@/lib/booking-pdf";

type BookingEmailInput = {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  activityName: string;
  preferredDate: string;
  preferredTime: string | null;
  preferredTimeEnd: string | null;
  partySize: number;
  locationName: string | null;
  specialRequests: string | null;
  /** Shown in PDF meta; new requests are pending until staff confirms. */
  bookingStatusLabel?: string;
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
    auth: {
      user,
      pass,
    },
  });
}

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  const transporter = getTransporter();
  const from = process.env.BOOKING_EMAIL_FROM || process.env.SMTP_USER;

  if (!transporter || !from) {
    return { sent: false as const, reason: "email_not_configured" as const };
  }

  const pdfBuffer = await buildBookingPdf({
    ...input,
    assignedEmployeeName: null,
  });
  const subject = `Booking request received (${input.bookingReference})`;
  const html = `
    <p>Hi ${input.customerName},</p>
    <p>Thanks for your booking request. We received it and will contact you soon.</p>
    <p><strong>Reference:</strong> ${input.bookingReference}</p>
    <p><strong>Activity:</strong> ${input.activityName}</p>
    <p><strong>Date:</strong> ${input.preferredDate}</p>
    <p><strong>Time:</strong> ${input.preferredTime ?? "No preference"}${
      input.preferredTimeEnd ? ` to ${input.preferredTimeEnd}` : ""
    }</p>
    <p><strong>Party size:</strong> ${input.partySize}</p>
    <p>Please keep this email and PDF for your records.</p>
  `;

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    subject,
    html,
    text: `Hi ${input.customerName}, your booking request (${input.bookingReference}) was received.`,
    attachments: [
      {
        filename: `booking-${input.bookingReference}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return { sent: true as const };
}

export type BookingStatusEmailKind = "confirmed" | "cancelled";

export async function sendBookingStatusUpdateEmail(
  input: BookingEmailInput & { status: BookingStatusEmailKind },
) {
  const transporter = getTransporter();
  const from = process.env.BOOKING_EMAIL_FROM || process.env.SMTP_USER;

  if (!transporter || !from) {
    return { sent: false as const, reason: "email_not_configured" as const };
  }

  const isConfirmed = input.status === "confirmed";
  const statusLabel = isConfirmed ? "Confirmed" : "Cancelled";
  const pdfBuffer = await buildBookingPdf({
    ...input,
    assignedEmployeeName: null,
    bookingStatusLabel: statusLabel,
  });
  const subject = isConfirmed
    ? `Booking confirmed (${input.bookingReference})`
    : `Booking cancelled (${input.bookingReference})`;
  const lead = isConfirmed
    ? "Your booking is confirmed. See details below."
    : "Your booking has been cancelled. If this was unexpected, please contact us.";
  const html = `
    <p>Hi ${input.customerName},</p>
    <p>${lead}</p>
    <p><strong>Reference:</strong> ${input.bookingReference}</p>
    <p><strong>Status:</strong> ${statusLabel}</p>
    <p><strong>Activity:</strong> ${input.activityName}</p>
    <p><strong>Date:</strong> ${input.preferredDate}</p>
    <p><strong>Time:</strong> ${input.preferredTime ?? "No preference"}${
      input.preferredTimeEnd ? ` to ${input.preferredTimeEnd}` : ""
    }</p>
    <p><strong>Party size:</strong> ${input.partySize}</p>
    ${input.locationName ? `<p><strong>Location:</strong> ${input.locationName}</p>` : ""}
    <p>Please keep this email and PDF for your records.</p>
  `;

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    subject,
    html,
    text: `Hi ${input.customerName}, booking ${input.bookingReference} is now ${statusLabel.toLowerCase()}.`,
    attachments: [
      {
        filename: `booking-${input.bookingReference}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return { sent: true as const };
}
