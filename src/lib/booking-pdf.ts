import { PDFDocument, StandardFonts } from "pdf-lib";
import { formatMoneyCents } from "@/lib/utils";
import {
  drawCardPair,
  drawFooter,
  drawHeaderBand,
  drawLineItems,
  drawMetaRow,
  drawNotesBox,
  drawTotalsCard,
  PDF_PAGE,
  type StatusTone,
} from "@/lib/pdf-design";

/** Customer-facing totals only (no internal cost breakdown on the PDF). */
export type BookingPdfFinancial = {
  partySize: number;
  pricePerPersonCents: number | null;
  quotedTotalCents: number;
  quotedCurrency: string;
  amountPaidCents: number;
  paymentStatus: string;
};

export type BookingPdfInput = {
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
  assignedEmployeeName?: string | null;
  specialRequests: string | null;
  businessName?: string;
  /** Booking status label for the meta column (e.g. Confirmed). */
  bookingStatusLabel?: string;
  financial?: BookingPdfFinancial | null;
};

function statusTone(label: string): StatusTone {
  const v = label.toLowerCase();
  if (v.includes("confirm") || v.includes("complete")) return "success";
  if (v.includes("pending")) return "warning";
  if (v.includes("cancel")) return "danger";
  return "primary";
}

export async function buildBookingPdf(input: BookingPdfInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PDF_PAGE.WIDTH, PDF_PAGE.HEIGHT]);
  const fonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const businessName = input.businessName ?? "Scotty's Action Sports Network";
  const issuedOn = new Date().toISOString().slice(0, 10);
  const statusLabel = input.bookingStatusLabel ?? "Confirmed";
  const fin = input.financial;
  const currency = fin?.quotedCurrency?.trim() || "PHP";
  const payStatus = (fin?.paymentStatus ?? "unpaid").toLowerCase();
  const payTone: StatusTone =
    payStatus === "paid"
      ? "success"
      : payStatus === "partial"
        ? "warning"
        : payStatus === "refunded"
          ? "danger"
          : "warning";

  // 1. Header band
  let y = await drawHeaderBand({
    page,
    pdf,
    fonts,
    businessName,
    contactLine:
      "Punta Engano, Mactan  |  +63 917 631 2960  |  bookings@divescotty.com",
    docLabel: "Booking Confirmation",
    docSubLabel: `Issued ${issuedOn}`,
  });

  // 2. Meta strip (Booking ref + Issued + Status)
  y = drawMetaRow({
    page,
    fonts,
    y,
    items: [
      { label: "Booking reference", value: input.bookingReference, tone: "primary" },
      { label: "Issued", value: issuedOn },
      { label: "Status", value: statusLabel, tone: statusTone(statusLabel) },
    ],
  });

  // 3. Customer + Trip cards
  const timeWindow =
    input.preferredTime && input.preferredTimeEnd
      ? `${input.preferredTime} - ${input.preferredTimeEnd}`
      : input.preferredTime
        ? input.preferredTime
        : "No preference";

  y = drawCardPair({
    page,
    fonts,
    y,
    left: {
      title: "Billed to",
      rows: [
        { label: "Name", value: input.customerName },
        { label: "Email", value: input.customerEmail },
        { label: "Phone", value: input.customerPhone },
      ],
    },
    right: {
      title: "Trip details",
      rows: [
        { label: "Date", value: input.preferredDate },
        { label: "Time window", value: timeWindow },
        { label: "Location", value: input.locationName ?? "No preference" },
        {
          label: "Assigned",
          value: input.assignedEmployeeName ?? "Unassigned",
        },
      ],
    },
  });

  // 4. Line items
  if (fin) {
    const unit =
      fin.pricePerPersonCents != null && fin.pricePerPersonCents > 0
        ? formatMoneyCents(fin.pricePerPersonCents, currency)
        : "-";
    const totalForActivity = fin.pricePerPersonCents
      ? formatMoneyCents(fin.pricePerPersonCents * fin.partySize, currency)
      : formatMoneyCents(fin.quotedTotalCents, currency);
    y = drawLineItems({
      page,
      fonts,
      y,
      items: [
        {
          description: input.activityName,
          qty: fin.partySize,
          unitLabel: unit,
          totalLabel: totalForActivity,
        },
      ],
    });

    // 5. Totals card (right-aligned)
    const balance = Math.max(0, fin.quotedTotalCents - fin.amountPaidCents);
    y = drawTotalsCard({
      page,
      fonts,
      y,
      rows: [
        {
          label: "Subtotal",
          value: formatMoneyCents(fin.quotedTotalCents, currency),
        },
        {
          label: "Amount paid",
          value: formatMoneyCents(fin.amountPaidCents, currency),
        },
        {
          label: "Balance due",
          value: formatMoneyCents(balance, currency),
          emphasize: true,
        },
      ],
      paymentStatusLabel: fin.paymentStatus,
      paymentTone: payTone,
    });
  } else {
    y = drawLineItems({
      page,
      fonts,
      y,
      items: [
        {
          description: input.activityName,
          qty: input.partySize,
          unitLabel: "-",
          totalLabel: "-",
        },
      ],
    });
  }

  // 6. Notes box
  drawNotesBox({
    page,
    fonts,
    y,
    title: "Notes & special requests",
    body:
      (input.specialRequests && input.specialRequests.trim()) ||
      "No special requests. Please arrive 15 minutes before your start time.",
  });

  // 7. Footer
  drawFooter({
    page,
    fonts,
    reference: input.bookingReference,
    businessName,
    disclaimer:
      "Please keep this PDF for your booking records. Present your booking reference on arrival. This document is computer-generated and does not require a signature.",
  });

  return Buffer.from(await pdf.save());
}
