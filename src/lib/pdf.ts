import { NextResponse } from "next/server";

/**
 * Minimal, dependency-free PDF writer.
 *
 * It produces text-only A4 documents using the two built-in Helvetica fonts, so
 * no font files or external packages are required. Content is written as
 * Latin-1, which keeps byte offsets stable for the cross-reference table.
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const USABLE = PAGE_WIDTH - MARGIN * 2;
const LINE_FACTOR = 1.35;

export type PdfColor = [number, number, number];

const INK: PdfColor = [0.13, 0.13, 0.13];
const MUTED: PdfColor = [0.45, 0.45, 0.45];

function sanitize(input: string): string {
  return input
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u20b9/g, "Rs.")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

function escapeText(text: string): string {
  return sanitize(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function approxWidth(text: string, size: number, bold: boolean): number {
  return text.length * size * (bold ? 0.55 : 0.5);
}

function wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const clean = sanitize(text).replace(/\s+/g, " ").trim();
  if (!clean) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of clean.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || approxWidth(candidate, size, bold) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export class PdfDocument {
  private pages: string[][] = [];
  private ops: string[] = [];
  private y = PAGE_HEIGHT - MARGIN;

  private newPageIfNeeded(height: number) {
    if (this.y - height < MARGIN) {
      this.pages.push(this.ops);
      this.ops = [];
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  private drawAt(
    text: string,
    x: number,
    y: number,
    size: number,
    bold: boolean,
    color: PdfColor,
  ) {
    this.ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${color[0]} ${color[1]} ${color[2]} rg ` +
        `${x.toFixed(2)} ${y.toFixed(2)} Td (${escapeText(text)}) Tj ET`,
    );
  }

  spacer(height = 8) {
    this.newPageIfNeeded(height);
    this.y -= height;
  }

  text(
    value: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: PdfColor;
      indent?: number;
      align?: "left" | "right";
    } = {},
  ) {
    const size = opts.size ?? 10;
    const bold = opts.bold ?? false;
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    const height = size * LINE_FACTOR;
    for (const line of wrap(value, size, bold, USABLE - indent)) {
      this.newPageIfNeeded(height);
      this.y -= height;
      const x =
        opts.align === "right"
          ? MARGIN + USABLE - indent - approxWidth(line, size, bold)
          : MARGIN + indent;
      this.drawAt(line, x, this.y, size, bold, color);
    }
  }

  heading(value: string) {
    this.spacer(10);
    this.text(value, { size: 13, bold: true });
    this.spacer(2);
  }

  muted(value: string, size = 9) {
    this.text(value, { size, color: MUTED });
  }

  rule(color: PdfColor = [0.85, 0.85, 0.85]) {
    this.newPageIfNeeded(8);
    this.y -= 8;
    this.ops.push(
      `${color[0]} ${color[1]} ${color[2]} RG 0.6 w ${MARGIN} ${this.y.toFixed(2)} m ` +
        `${(PAGE_WIDTH - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`,
    );
  }

  table(headers: string[], rows: string[][], widths: number[]) {
    const size = 9;
    const total = widths.reduce((a, b) => a + b, 0) || 1;
    const cols = widths.map((w) => (w / total) * USABLE);

    const drawRow = (cells: string[], bold: boolean) => {
      const wrapped = cols.map((colWidth, i) =>
        wrap(cells[i] ?? "", size, bold, colWidth - 8),
      );
      const maxLines = Math.max(1, ...wrapped.map((lines) => lines.length));
      const height = maxLines * size * LINE_FACTOR + 6;
      this.newPageIfNeeded(height);
      const top = this.y;
      this.y -= height;
      const firstBaseline = top - size * LINE_FACTOR - 2;
      wrapped.forEach((lines, i) => {
        const x = MARGIN + cols.slice(0, i).reduce((a, b) => a + b, 0) + 4;
        lines.forEach((line, li) => {
          this.drawAt(line, x, firstBaseline - li * size * LINE_FACTOR, size, bold, INK);
        });
      });
      this.ops.push(
        `0.86 0.86 0.86 RG 0.5 w ${MARGIN} ${this.y.toFixed(2)} m ` +
          `${(PAGE_WIDTH - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`,
      );
    };

    if (headers.length > 0) drawRow(headers, true);
    if (rows.length === 0) {
      this.text("No records available.", { size: 9, color: MUTED });
      return;
    }
    rows.forEach((row) => drawRow(row, false));
  }

  build(title: string): Buffer {
    this.pages.push(this.ops);
    const contents = this.pages.map((ops) => ops.join("\n"));
    const count = contents.length;
    const pageIds = contents.map((_, index) => 6 + index * 2);
    const contentIds = contents.map((_, index) => 7 + index * 2);

    const objects: string[] = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] =
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${count} >>`;
    objects[3] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objects[5] = `<< /Title (${escapeText(title)}) /Producer (CampusFlow) >>`;
    contents.forEach((content, index) => {
      objects[pageIds[index]] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
      objects[contentIds[index]] =
        `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`;
    });

    const highest = objects.length - 1;
    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let id = 1; id <= highest; id++) {
      offsets[id] = Buffer.byteLength(pdf, "latin1");
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${highest + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= highest; id++) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${highest + 1} /Root 1 0 R /Info 5 0 R >>\n`;
    pdf += `startxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf, "latin1");
  }
}

export function pdfResponse(filename: string, buffer: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
