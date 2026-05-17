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

/** Matches booking confirmation PDF branding; no booking reference on the slip. */
export type QuotationPdfInput = {
  customerName: string;
  customerEmail: string;
  activityName: string;
  partySize: number;
  quotedTotalCents: number;
  quotedCurrency: string;
  amountPaidCents: number;
  paymentStatus: string;
  businessName?: string;
  pricePerPersonCents?: number | null;
  /** Optional reference shown on the footer for traceability (still labeled as quote). */
  reference?: string;
  /** ISO date string YYYY-MM-DD. Defaults to today. */
  issuedOn?: string;
  /** Days the quote is valid for. Defaults to 14. */
  validForDays?: number;
};

function paymentTone(label: string): StatusTone {
  const v = (label || "").toLowerCase();
  if (v === "paid") return "success";
  if (v === "partial") return "warning";
  if (v === "refunded") return "danger";
  return "warning";
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function buildQuotationPdf(input: QuotationPdfInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PDF_PAGE.WIDTH, PDF_PAGE.HEIGHT]);
  const fonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const businessName = input.businessName ?? "Scotty's Action Sports Network";
  const issuedOn = input.issuedOn ?? new Date().toISOString().slice(0, 10);
  const validForDays = input.validForDays ?? 14;
  const validUntil = addDays(issuedOn, validForDays);
  const currency = input.quotedCurrency?.trim() || "PHP";
  const reference = input.reference ?? `QT-${issuedOn.replace(/-/g, "")}`;

  // 1. Header band
  let y = await drawHeaderBand({
    page,
    pdf,
    fonts,
    businessName,
    contactLine:
      "Punta Engano, Mactan  |  +63 917 631 2960  |  bookings@divescotty.com",
    docLabel: "Quotation",
    docSubLabel: `Issued ${issuedOn}`,
  });

  // 2. Meta strip
  y = drawMetaRow({
    page,
    fonts,
    y,
    items: [
      { label: "Quote reference", value: reference, tone: "primary" },
      { label: "Issued", value: issuedOn },
      { label: "Valid until", value: validUntil, tone: "warning" },
    ],
  });

  // 3. Billed To + Quote subject
  y = drawCardPair({
    page,
    fonts,
    y,
    left: {
      title: "Prepared for",
      rows: [
        { label: "Name", value: input.customerName },
        { label: "Email", value: input.customerEmail },
      ],
    },
    right: {
      title: "Quote summary",
      rows: [
        { label: "Activity", value: input.activityName },
        { label: "Party size", value: `${input.partySize} pax` },
        { label: "Currency", value: currency },
      ],
    },
  });

  // 4. Line items
  const unit =
    input.pricePerPersonCents != null && input.pricePerPersonCents > 0
      ? formatMoneyCents(input.pricePerPersonCents, currency)
      : "-";
  const total = input.pricePerPersonCents
    ? formatMoneyCents(input.pricePerPersonCents * input.partySize, currency)
    : formatMoneyCents(input.quotedTotalCents, currency);

  y = drawLineItems({
    page,
    fonts,
    y,
    items: [
      {
        description: input.activityName,
        qty: input.partySize,
        unitLabel: unit,
        totalLabel: total,
      },
    ],
  });

  // 5. Totals card
  const balance = Math.max(0, input.quotedTotalCents - input.amountPaidCents);
  y = drawTotalsCard({
    page,
    fonts,
    y,
    rows: [
      {
        label: "Subtotal",
        value: formatMoneyCents(input.quotedTotalCents, currency),
      },
      {
        label: "Amount paid",
        value: formatMoneyCents(input.amountPaidCents, currency),
      },
      {
        label: "Estimated total",
        value: formatMoneyCents(balance, currency),
        emphasize: true,
      },
    ],
    paymentStatusLabel: input.paymentStatus,
    paymentTone: paymentTone(input.paymentStatus),
  });

  // 6. Notes / terms
  drawNotesBox({
    page,
    fonts,
    y,
    title: "Terms",
    body: `This quotation is valid for ${validForDays} days from the issued date (until ${validUntil}). Prices are inclusive of standard equipment and guide fees. Final totals may vary based on confirmed dates, transfers, and additional services. This document is a price estimate, not a tax invoice.`,
  });

  // 7. Footer
  drawFooter({
    page,
    fonts,
    reference,
    businessName,
    disclaimer:
      "To confirm this quotation, reply to bookings@divescotty.com or message us on WhatsApp at +63 917 631 2960. Quoted prices honored until the validity date above.",
  });

  return Buffer.from(await pdf.save());
}
