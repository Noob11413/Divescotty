import {
  type PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Shared design tokens and layout primitives for invoice-style PDFs
 * (booking confirmation, quotation slip). Kept locale-agnostic and ASCII-safe
 * since we embed only the standard Helvetica family.
 */

export const PDF_PAGE = {
  WIDTH: 595,
  HEIGHT: 842,
  MARGIN: 42,
} as const;

export const PDF_COLORS = {
  primary: rgb(0.06, 0.2, 0.39),
  primaryDark: rgb(0.03, 0.13, 0.25),
  primaryLight: rgb(0.92, 0.95, 0.98),
  ink: rgb(0.11, 0.13, 0.16),
  muted: rgb(0.42, 0.46, 0.52),
  mutedSoft: rgb(0.6, 0.64, 0.7),
  border: rgb(0.86, 0.89, 0.93),
  rule: rgb(0.92, 0.94, 0.96),
  paper: rgb(1, 1, 1),
  soft: rgb(0.96, 0.97, 0.98),
  success: rgb(0.1, 0.55, 0.34),
  warning: rgb(0.78, 0.5, 0.09),
  danger: rgb(0.82, 0.22, 0.27),
  accent: rgb(0.85, 0.2, 0.27),
};

export type PdfFonts = {
  body: PDFFont;
  bold: PDFFont;
};

/** Replace characters that Helvetica cannot encode (em dash, smart quotes, etc.). */
export function sanitize(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "");
}

export async function tryLoadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "media",
      "scotty-logo.png",
    );
    const bytes = await readFile(logoPath);
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

/** Draws the top-of-page brand band with logo, business name, contact, and doc title. */
export async function drawHeaderBand(args: {
  page: PDFPage;
  pdf: PDFDocument;
  fonts: PdfFonts;
  businessName: string;
  contactLine: string;
  /** Big label on the right e.g. "BOOKING CONFIRMATION". */
  docLabel: string;
  /** Small subtitle below docLabel e.g. "Issued 2026-05-18". */
  docSubLabel?: string;
}): Promise<number> {
  const { page, pdf, fonts } = args;
  const { WIDTH, HEIGHT } = PDF_PAGE;
  const bandHeight = 112;

  page.drawRectangle({
    x: 0,
    y: HEIGHT - bandHeight,
    width: WIDTH,
    height: bandHeight,
    color: PDF_COLORS.primary,
  });

  // accent rule along the bottom of the band
  page.drawRectangle({
    x: 0,
    y: HEIGHT - bandHeight - 3,
    width: WIDTH,
    height: 3,
    color: PDF_COLORS.accent,
  });

  const left = PDF_PAGE.MARGIN;
  let textX = left;
  const logo = await tryLoadLogo(pdf);
  if (logo) {
    const scaled = logo.scale(0.22);
    const logoY = HEIGHT - bandHeight + (bandHeight - scaled.height) / 2;
    page.drawImage(logo, {
      x: left,
      y: logoY,
      width: scaled.width,
      height: scaled.height,
    });
    textX = left + scaled.width + 16;
  }

  const businessName = sanitize(args.businessName);
  const contactLine = sanitize(args.contactLine);
  page.drawText(businessName, {
    x: textX,
    y: HEIGHT - 50,
    size: 18,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Action Sports - Diving - Watersports", {
    x: textX,
    y: HEIGHT - 68,
    size: 8,
    font: fonts.body,
    color: rgb(0.78, 0.84, 0.93),
  });
  page.drawText(contactLine, {
    x: textX,
    y: HEIGHT - 92,
    size: 9,
    font: fonts.body,
    color: rgb(0.85, 0.89, 0.95),
  });

  // Right side document label
  const docLabel = sanitize(args.docLabel).toUpperCase();
  const labelSize = 16;
  const labelWidth = fonts.bold.widthOfTextAtSize(docLabel, labelSize);
  const labelX = WIDTH - PDF_PAGE.MARGIN - labelWidth;
  page.drawText(docLabel, {
    x: labelX,
    y: HEIGHT - 50,
    size: labelSize,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  if (args.docSubLabel) {
    const sub = sanitize(args.docSubLabel);
    const subSize = 9;
    const subWidth = fonts.body.widthOfTextAtSize(sub, subSize);
    page.drawText(sub, {
      x: WIDTH - PDF_PAGE.MARGIN - subWidth,
      y: HEIGHT - 68,
      size: subSize,
      font: fonts.body,
      color: rgb(0.85, 0.89, 0.95),
    });
  }

  return HEIGHT - bandHeight - 22;
}

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "primary";

export function drawMetaRow(args: {
  page: PDFPage;
  fonts: PdfFonts;
  y: number;
  items: Array<{
    label: string;
    value: string;
    tone?: StatusTone;
  }>;
}): number {
  const { page, fonts, items } = args;
  const left = PDF_PAGE.MARGIN;
  const cellGap = 12;
  const cellHeight = 38;
  const totalGap = cellGap * (items.length - 1);
  const cellWidth =
    (PDF_PAGE.WIDTH - PDF_PAGE.MARGIN * 2 - totalGap) / items.length;

  items.forEach((item, idx) => {
    const x = left + idx * (cellWidth + cellGap);
    page.drawRectangle({
      x,
      y: args.y - cellHeight,
      width: cellWidth,
      height: cellHeight,
      color: PDF_COLORS.soft,
      borderColor: PDF_COLORS.border,
      borderWidth: 0.6,
    });
    page.drawText(sanitize(item.label).toUpperCase(), {
      x: x + 10,
      y: args.y - 14,
      size: 7,
      font: fonts.bold,
      color: PDF_COLORS.mutedSoft,
    });
    const value = sanitize(item.value);
    const valueColor = toneColor(item.tone);
    page.drawText(value, {
      x: x + 10,
      y: args.y - 30,
      size: 11,
      font: fonts.bold,
      color: valueColor,
      maxWidth: cellWidth - 20,
    });
  });

  return args.y - cellHeight - 16;
}

export function toneColor(tone: StatusTone | undefined) {
  switch (tone) {
    case "success":
      return PDF_COLORS.success;
    case "warning":
      return PDF_COLORS.warning;
    case "danger":
      return PDF_COLORS.danger;
    case "primary":
      return PDF_COLORS.primary;
    case "neutral":
    default:
      return PDF_COLORS.ink;
  }
}

export type CardRow = { label: string; value: string };

/** Two side-by-side cards (e.g. "Billed To" + "Trip Details"). Returns next Y. */
export function drawCardPair(args: {
  page: PDFPage;
  fonts: PdfFonts;
  y: number;
  left: { title: string; rows: CardRow[] };
  right: { title: string; rows: CardRow[] };
}): number {
  const { page, fonts, y } = args;
  const margin = PDF_PAGE.MARGIN;
  const gap = 14;
  const width = (PDF_PAGE.WIDTH - margin * 2 - gap) / 2;
  const padding = 14;
  const headerStripHeight = 22;
  const titleSize = 9;
  const labelSize = 7.5;
  const valueSize = 10.5;
  // Label baseline, value baseline (12pt below), next label 16pt below value
  // so total per-row height is 28pt -> safe for stacked label + value pairs.
  const labelToValue = 12;
  const rowGap = 28;

  const maxRows = Math.max(args.left.rows.length, args.right.rows.length);
  // headerStrip + paddingTop + (rows-1)*rowGap + labelToValue + paddingBottom
  const height =
    headerStripHeight + padding + (maxRows - 1) * rowGap + labelToValue + padding;

  const drawCard = (x: number, card: { title: string; rows: CardRow[] }) => {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: PDF_COLORS.paper,
      borderColor: PDF_COLORS.border,
      borderWidth: 0.6,
    });
    // header strip
    page.drawRectangle({
      x,
      y: y - headerStripHeight,
      width,
      height: headerStripHeight,
      color: PDF_COLORS.primaryLight,
    });
    page.drawText(sanitize(card.title).toUpperCase(), {
      x: x + padding,
      y: y - 15,
      size: titleSize,
      font: fonts.bold,
      color: PDF_COLORS.primary,
    });

    // First label baseline = below header + top padding
    let rowY = y - headerStripHeight - padding - labelSize;
    for (const row of card.rows) {
      page.drawText(sanitize(row.label).toUpperCase(), {
        x: x + padding,
        y: rowY,
        size: labelSize,
        font: fonts.body,
        color: PDF_COLORS.mutedSoft,
      });
      page.drawText(sanitize(row.value), {
        x: x + padding,
        y: rowY - labelToValue,
        size: valueSize,
        font: fonts.bold,
        color: PDF_COLORS.ink,
        maxWidth: width - padding * 2,
      });
      rowY -= rowGap;
    }
  };

  drawCard(margin, args.left);
  drawCard(margin + width + gap, args.right);

  return y - height - 20;
}

export type LineItem = {
  description: string;
  qty: number;
  unitLabel: string; // formatted money
  totalLabel: string; // formatted money
};

/** Itemized table. Returns next Y. */
export function drawLineItems(args: {
  page: PDFPage;
  fonts: PdfFonts;
  y: number;
  items: LineItem[];
}): number {
  const { page, fonts, items } = args;
  const margin = PDF_PAGE.MARGIN;
  const right = PDF_PAGE.WIDTH - margin;
  const width = PDF_PAGE.WIDTH - margin * 2;
  const headerHeight = 22;
  const rowHeight = 30;
  const padX = 14;

  // header strip
  page.drawRectangle({
    x: margin,
    y: args.y - headerHeight,
    width,
    height: headerHeight,
    color: PDF_COLORS.primary,
  });

  // Right edges for the three numeric columns; description fills the rest.
  const totalRightEdge = right - padX;
  const unitRightEdge = right - 130;
  const qtyRightEdge = unitRightEdge - 95;
  const descLeft = margin + padX;
  const descMaxWidth = qtyRightEdge - descLeft - 24;
  const headerSize = 8;
  const rowSize = 10;
  const headerY = args.y - 14;
  const rowTextOffset = 19;

  const drawHeaderCellRight = (label: string, rightEdge: number) => {
    const w = fonts.bold.widthOfTextAtSize(label, headerSize);
    page.drawText(label, {
      x: rightEdge - w,
      y: headerY,
      size: headerSize,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    });
  };

  page.drawText("DESCRIPTION", {
    x: descLeft,
    y: headerY,
    size: headerSize,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  drawHeaderCellRight("QTY", qtyRightEdge);
  drawHeaderCellRight("UNIT PRICE", unitRightEdge);
  drawHeaderCellRight("TOTAL", totalRightEdge);

  let rowY = args.y - headerHeight;
  items.forEach((item, idx) => {
    const top = rowY;
    const bottom = rowY - rowHeight;
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: bottom,
        width,
        height: rowHeight,
        color: PDF_COLORS.soft,
      });
    }
    page.drawText(sanitize(item.description), {
      x: descLeft,
      y: top - rowTextOffset,
      size: rowSize,
      font: fonts.bold,
      color: PDF_COLORS.ink,
      maxWidth: descMaxWidth,
    });

    const drawRight = (
      text: string,
      rightEdge: number,
      font: typeof fonts.body | typeof fonts.bold,
    ) => {
      const w = font.widthOfTextAtSize(text, rowSize);
      page.drawText(text, {
        x: rightEdge - w,
        y: top - rowTextOffset,
        size: rowSize,
        font,
        color: PDF_COLORS.ink,
      });
    };

    drawRight(String(item.qty), qtyRightEdge, fonts.body);
    drawRight(sanitize(item.unitLabel), unitRightEdge, fonts.body);
    drawRight(sanitize(item.totalLabel), totalRightEdge, fonts.bold);

    rowY = bottom;
  });

  // bottom border
  page.drawLine({
    start: { x: margin, y: rowY },
    end: { x: margin + width, y: rowY },
    thickness: 0.6,
    color: PDF_COLORS.border,
  });

  return rowY - 18;
}

/** Right-aligned totals card with payment status chip. Returns next Y. */
export function drawTotalsCard(args: {
  page: PDFPage;
  fonts: PdfFonts;
  y: number;
  rows: Array<{
    label: string;
    value: string;
    emphasize?: boolean;
  }>;
  paymentStatusLabel: string;
  paymentTone: StatusTone;
}): number {
  const { page, fonts, y, rows } = args;
  const right = PDF_PAGE.WIDTH - PDF_PAGE.MARGIN;
  const cardWidth = 260;
  const padding = 16;
  const rowGap = 26;
  const chipHeight = 26;
  const chipMarginTop = 12;
  const cardHeight =
    padding + rows.length * rowGap + chipMarginTop + chipHeight + padding;
  const cardX = right - cardWidth;
  const cardTop = y;

  page.drawRectangle({
    x: cardX,
    y: cardTop - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: PDF_COLORS.paper,
    borderColor: PDF_COLORS.border,
    borderWidth: 0.6,
  });

  // First label baseline = below top padding minus label height
  let rowY = cardTop - padding - 10;
  rows.forEach((row, idx) => {
    if (idx > 0) {
      page.drawLine({
        start: { x: cardX + padding, y: rowY + 14 },
        end: { x: cardX + cardWidth - padding, y: rowY + 14 },
        thickness: 0.5,
        color: PDF_COLORS.rule,
      });
    }
    const labelColor = row.emphasize ? PDF_COLORS.primary : PDF_COLORS.muted;
    const valueColor = row.emphasize ? PDF_COLORS.primary : PDF_COLORS.ink;
    const labelSize = row.emphasize ? 10 : 9;
    const valueSize = row.emphasize ? 13 : 11;
    page.drawText(sanitize(row.label).toUpperCase(), {
      x: cardX + padding,
      y: rowY,
      size: labelSize,
      font: fonts.bold,
      color: labelColor,
    });
    const valueText = sanitize(row.value);
    const valueWidth = fonts.bold.widthOfTextAtSize(valueText, valueSize);
    page.drawText(valueText, {
      x: cardX + cardWidth - padding - valueWidth,
      y: rowY - (valueSize - labelSize),
      size: valueSize,
      font: fonts.bold,
      color: valueColor,
    });
    rowY -= rowGap;
  });

  // payment status chip (anchored to bottom of card)
  const chipY = cardTop - cardHeight + padding;
  const tone = toneColor(args.paymentTone);
  page.drawRectangle({
    x: cardX + padding,
    y: chipY,
    width: cardWidth - padding * 2,
    height: chipHeight,
    color: PDF_COLORS.soft,
    borderColor: tone,
    borderWidth: 0.8,
  });
  // Vertically center text in the chip
  const chipTextY = chipY + chipHeight / 2 - 3;
  page.drawText("PAYMENT", {
    x: cardX + padding + 10,
    y: chipTextY,
    size: 8,
    font: fonts.bold,
    color: PDF_COLORS.muted,
  });
  const status = sanitize(args.paymentStatusLabel).toUpperCase();
  const statusWidth = fonts.bold.widthOfTextAtSize(status, 10);
  page.drawText(status, {
    x: cardX + cardWidth - padding - 10 - statusWidth,
    y: chipTextY - 1,
    size: 10,
    font: fonts.bold,
    color: tone,
  });

  return cardTop - cardHeight - 18;
}

/** Notes / special requests block. Returns next Y. */
export function drawNotesBox(args: {
  page: PDFPage;
  fonts: PdfFonts;
  y: number;
  title: string;
  body: string;
}): number {
  const { page, fonts, y } = args;
  const margin = PDF_PAGE.MARGIN;
  const width = PDF_PAGE.WIDTH - margin * 2;
  const padding = 14;
  const textLines = wrapText(args.body, fonts.body, 10, width - padding * 2);
  const lineHeight = 14;
  const height = padding * 2 + 18 + textLines.length * lineHeight;

  page.drawRectangle({
    x: margin,
    y: y - height,
    width,
    height,
    color: PDF_COLORS.paper,
    borderColor: PDF_COLORS.border,
    borderWidth: 0.6,
  });
  page.drawRectangle({
    x: margin,
    y: y - 22,
    width,
    height: 22,
    color: PDF_COLORS.primaryLight,
  });
  page.drawText(sanitize(args.title).toUpperCase(), {
    x: margin + padding,
    y: y - 16,
    size: 9,
    font: fonts.bold,
    color: PDF_COLORS.primary,
  });

  let textY = y - 22 - padding;
  for (const line of textLines) {
    page.drawText(sanitize(line), {
      x: margin + padding,
      y: textY,
      size: 10,
      font: fonts.body,
      color: PDF_COLORS.ink,
    });
    textY -= lineHeight;
  }

  return y - height - 18;
}

/** Footer: thin rule, then reference left + business right, then tiny disclaimer. */
export function drawFooter(args: {
  page: PDFPage;
  fonts: PdfFonts;
  reference: string;
  businessName: string;
  disclaimer?: string;
}): void {
  const { page, fonts } = args;
  const margin = PDF_PAGE.MARGIN;
  const baseY = 50;

  page.drawLine({
    start: { x: margin, y: baseY + 28 },
    end: { x: PDF_PAGE.WIDTH - margin, y: baseY + 28 },
    thickness: 0.6,
    color: PDF_COLORS.border,
  });

  page.drawText(`Ref ${sanitize(args.reference)}`, {
    x: margin,
    y: baseY + 14,
    size: 9,
    font: fonts.bold,
    color: PDF_COLORS.primary,
  });
  const business = sanitize(args.businessName);
  const businessWidth = fonts.body.widthOfTextAtSize(business, 9);
  page.drawText(business, {
    x: PDF_PAGE.WIDTH - margin - businessWidth,
    y: baseY + 14,
    size: 9,
    font: fonts.body,
    color: PDF_COLORS.muted,
  });

  if (args.disclaimer) {
    const disclaimer = sanitize(args.disclaimer);
    page.drawText(disclaimer, {
      x: margin,
      y: baseY,
      size: 8,
      font: fonts.body,
      color: PDF_COLORS.mutedSoft,
      maxWidth: PDF_PAGE.WIDTH - margin * 2,
    });
  }
}

/** Wrap plain text into lines that fit within a max width for the given font/size. */
export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const out: string[] = [];
  const paragraphs = sanitize(text).split(/\n/);
  for (const para of paragraphs) {
    if (para.length === 0) {
      out.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) out.push(line);
        // word longer than maxWidth: hard split
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            const c = chunk + ch;
            if (font.widthOfTextAtSize(c, size) <= maxWidth) {
              chunk = c;
            } else {
              out.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}
