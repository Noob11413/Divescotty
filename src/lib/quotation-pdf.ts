import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

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
};

function moneyLine(cents: number, currency: string): string {
  const n = Math.max(0, cents) / 100;
  const formatted = n.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export async function buildQuotationPdf(input: QuotationPdfInput) {
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
    // resilient without logo
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
  page.drawText("Quotation details", {
    x: left,
    y: sectionTop,
    size: 13,
    font: bold,
    color: blue,
  });
  page.drawText("QUOTATION", {
    x: right - 160,
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

  detailRow("Customer", input.customerName);
  detailRow("Email", input.customerEmail);
  detailRow("Activity", input.activityName);
  detailRow("Party size", `${input.partySize} pax`);

  let blockBottom = detailY - 16;
  const cur = input.quotedCurrency?.trim() || "PHP";
  const price =
    input.pricePerPersonCents != null && input.pricePerPersonCents > 0
      ? moneyLine(input.pricePerPersonCents, cur)
      : "—";
  const formula = `Party (${input.partySize}) x price per person (${price})`;

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
  page.drawText(moneyLine(input.quotedTotalCents, cur), {
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
  page.drawText(`Status: ${input.paymentStatus}`, {
    x: left + 8,
    y: blockBottom,
    size: 9,
    font,
    color: ink,
  });
  blockBottom -= 14;
  page.drawText(`Amount paid: ${moneyLine(input.amountPaidCents, cur)}`, {
    x: left + 8,
    y: blockBottom,
    size: 9,
    font,
    color: ink,
  });
  blockBottom -= 28;

  page.drawText("This slip summarizes the quoted price for your trip. It is not a tax invoice.", {
    x: left,
    y: blockBottom,
    size: 10,
    font,
    color: rgb(0.25, 0.25, 0.25),
    maxWidth: right - left,
  });

  return Buffer.from(await pdf.save());
}
