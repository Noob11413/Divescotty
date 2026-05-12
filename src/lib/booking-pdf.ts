import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

function moneyLine(cents: number, currency: string): string {
  const n = Math.max(0, cents) / 100;
  const formatted = n.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export async function buildBookingPdf(input: BookingPdfInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.05, 0.28, 0.52);
  const softBlue = rgb(0.72, 0.79, 0.86);
  const muted = rgb(0.35, 0.38, 0.42);
  const ink = rgb(0.1, 0.12, 0.14);

  const left = 50;
  const right = width - 50;
  let y = height - 66;
  const logoPadding = 14;
  let headerTextX = 178;

  try {
    const logoPath = path.join(process.cwd(), "public", "media", "scotty-logo.png");
    const logoBytes = await readFile(logoPath);
    const logo = await pdf.embedPng(logoBytes);
    const scaled = logo.scale(0.24);
    const logoX = left + logoPadding;
    const logoY = height - 120;
    page.drawImage(logo, {
      x: logoX,
      y: logoY,
      width: scaled.width,
      height: scaled.height,
    });
    headerTextX = logoX + scaled.width + 20;
  } catch {
    // Keep PDF generation resilient if logo file is missing.
  }

  page.drawText(input.businessName ?? "Scotty's Action Sports Network", {
    x: headerTextX,
    y,
    size: 20,
    font: bold,
    color: blue,
  });
  y -= 24;
  page.drawText("Punta Engano, Mactan  |  +63 917 631 2960  |  bookings@divescotty.com", {
    x: headerTextX,
    y,
    size: 9.5,
    font,
    color: rgb(0.35, 0.38, 0.42),
  });

  const lineY = y - 26;
  page.drawLine({
    start: { x: left, y: lineY },
    end: { x: right, y: lineY },
    thickness: 2,
    color: softBlue,
  });

  const sectionTop = lineY - 40;
  page.drawText("Booking Details", {
    x: left,
    y: sectionTop,
    size: 13,
    font: bold,
    color: blue,
  });
  page.drawText("BOOKING", {
    x: right - 140,
    y: sectionTop - 2,
    size: 20,
    font: bold,
    color: blue,
  });

  const labelX = left;
  const valueX = left + 132;
  let detailY = sectionTop - 28;
  const detailRow = (label: string, value: string) => {
    page.drawText(label, {
      x: labelX,
      y: detailY,
      size: 10.5,
      font,
      color: rgb(0.24, 0.28, 0.33),
    });
    page.drawText(value, {
      x: valueX,
      y: detailY,
      size: 10.5,
      font: bold,
      color: ink,
      maxWidth: 220,
    });
    detailY -= 22;
  };

  detailRow("Preferred date", input.preferredDate);
  detailRow(
    "Time window",
    `${input.preferredTime ?? "No preference"} - ${input.preferredTimeEnd ?? "No preference"}`,
  );
  detailRow("Guests", `${input.partySize} pax`);
  detailRow("Activity", input.activityName);
  detailRow("Location", input.locationName ?? "No preference");

  let metaY = sectionTop - 28;
  const metaLabelX = 360;
  const metaValueX = 470;
  const metaRow = (label: string, value: string) => {
    page.drawText(label, {
      x: metaLabelX,
      y: metaY,
      size: 10.5,
      font: bold,
      color: blue,
    });
    page.drawText(value, {
      x: metaValueX,
      y: metaY,
      size: 10.5,
      font,
      color: ink,
      maxWidth: 80,
    });
    metaY -= 22;
  };
  metaRow("Booking #", input.bookingReference);
  metaRow("Status", input.bookingStatusLabel ?? "Confirmed");
  metaRow("Assigned", input.assignedEmployeeName ?? "Unassigned");
  metaRow("Booked by", input.customerName);
  metaRow("Email", input.customerEmail);

  let blockBottom = Math.min(detailY, metaY) - 8;

  const fin = input.financial;
  if (fin) {
    const cur = fin.quotedCurrency?.trim() || "PHP";
    const price =
      fin.pricePerPersonCents != null && fin.pricePerPersonCents > 0
        ? moneyLine(fin.pricePerPersonCents, cur)
        : "—";
    const formula = `Party (${fin.partySize}) x price per person (${price})`;

    blockBottom -= 10;
    page.drawText("Pricing summary", {
      x: left,
      y: blockBottom,
      size: 12,
      font: bold,
      color: blue,
    });
    blockBottom -= 18;
    page.drawText(formula, {
      x: left,
      y: blockBottom,
      size: 9,
      font,
      color: muted,
      maxWidth: right - left,
    });
    blockBottom -= 22;

    page.drawText("Total (quotation)", {
      x: left,
      y: blockBottom,
      size: 9,
      font: bold,
      color: blue,
    });
    page.drawText(moneyLine(fin.quotedTotalCents, cur), {
      x: left + 200,
      y: blockBottom,
      size: 11,
      font: bold,
      color: ink,
    });
    blockBottom -= 26;

    page.drawText("Payment", {
      x: left,
      y: blockBottom,
      size: 9,
      font: bold,
      color: blue,
    });
    blockBottom -= 14;
    page.drawText(`Status: ${fin.paymentStatus}`, {
      x: left + 8,
      y: blockBottom,
      size: 9,
      font,
      color: ink,
    });
    blockBottom -= 14;
    page.drawText(`Amount paid: ${moneyLine(fin.amountPaidCents, cur)}`, {
      x: left + 8,
      y: blockBottom,
      size: 9,
      font,
      color: ink,
    });
    blockBottom -= 20;
  }

  const infoTop = blockBottom - 12;
  const infoX = left;
  const infoW = right - left;
  page.drawRectangle({
    x: infoX,
    y: infoTop - 26,
    width: infoW,
    height: 26,
    color: blue,
  });
  page.drawText("Booking Information", {
    x: infoX + 12,
    y: infoTop - 17,
    size: 10.5,
    font: bold,
    color: rgb(1, 1, 1),
  });

  const infoRows = [
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Phone: ${input.customerPhone}`,
    `Assigned employee: ${input.assignedEmployeeName ?? "Unassigned"}`,
    `Booking reference: ${input.bookingReference}`,
    `Special requests: ${input.specialRequests || "None"}`,
  ];

  let infoLineY = infoTop - 44;
  infoRows.forEach((line, i) => {
    if (i > 0) {
      page.drawLine({
        start: { x: infoX, y: infoLineY + 13 },
        end: { x: infoX + infoW, y: infoLineY + 13 },
        thickness: 0.5,
        color: rgb(0.83, 0.86, 0.9),
      });
    }
    page.drawText(line, {
      x: infoX + 14,
      y: infoLineY,
      size: 11,
      font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: infoW - 24,
    });
    infoLineY -= 32;
  });

  page.drawRectangle({
    x: infoX,
    y: infoLineY + 16,
    width: infoW,
    height: infoTop - (infoLineY + 16) - 26,
    borderColor: rgb(0.78, 0.82, 0.87),
    borderWidth: 0.8,
    color: rgb(1, 1, 1),
    opacity: 0,
  });

  const infoY = infoLineY - 20;
  page.drawText("Additional Information", {
    x: left,
    y: infoY,
    size: 13,
    font: bold,
    color: blue,
  });
  page.drawText("Please keep this PDF for your booking records.", {
    x: left,
    y: infoY - 24,
    size: 10,
    font,
    color: rgb(0.25, 0.25, 0.25),
    maxWidth: width - left * 2,
  });

  return Buffer.from(await pdf.save());
}
