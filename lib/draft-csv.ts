import type { DraftProduct } from "./product-drafts";

export type DraftCsvUpdate = {
  sku: string;
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  colors: string[];
  types: string[];
  images: string[];
  verified: boolean;
};

const columns = [
  "sku", "category", "name", "description", "price", "stock",
  "colors", "types", "images", "verified",
] as const;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_DATA_ROWS = 100_000;
const formulaPrefix = /^\s*[=+\-@]/;

function csvCell(value: string, text = false): string {
  const safe = text && formulaPrefix.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Build a spreadsheet-friendly UTF-8 CSV, including a BOM for Excel. */
export function draftCsv(drafts: DraftProduct[]): string {
  const rows = [columns.join(",")];
  for (const draft of drafts) {
    rows.push([
      csvCell(draft.sku, true),
      csvCell(draft.category, true),
      csvCell(draft.name, true),
      csvCell(draft.description, true),
      draft.price === null ? "" : String(draft.price),
      draft.stock === null ? "" : String(draft.stock),
      csvCell(draft.colors.join("|"), true),
      csvCell(draft.types.join("|"), true),
      csvCell(draft.images.join("|"), true),
      String(draft.verified),
    ].join(","));
  }
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

type CsvRow = { cells: string[]; line: number };

function rowError(line: number, message: string): Error {
  return new Error(`CSV row starting on line ${line}: ${message}`);
}

function readRows(source: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  let line = 1;
  let rowLine = 1;

  function finishField() {
    cells.push(field);
    field = "";
    closedQuote = false;
  }

  function finishRow() {
    finishField();
    // Ignore empty spreadsheet lines; a populated row must still have a SKU.
    if (!(cells.length === 1 && cells[0].trim() === "")) {
      if (rows.length >= MAX_DATA_ROWS + 1) {
        throw rowError(rowLine, `the file exceeds ${MAX_DATA_ROWS.toLocaleString("en-US")} data rows.`);
      }
      rows.push({ cells, line: rowLine });
    }
    cells = [];
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else if (character === "\r" || character === "\n") {
        field += character;
        if (character === "\r" && source[index + 1] === "\n") {
          field += "\n";
          index++;
        }
        line++;
      } else {
        field += character;
      }
      continue;
    }

    if (character === ",") {
      finishField();
    } else if (character === "\r" || character === "\n") {
      finishRow();
      if (character === "\r" && source[index + 1] === "\n") index++;
      line++;
      rowLine = line;
    } else if (closedQuote) {
      throw rowError(rowLine, `unexpected character after a closing quote on line ${line}; use a comma or a line break.`);
    } else if (character === '"') {
      if (field.length !== 0) {
        throw rowError(rowLine, `a quote appears inside an unquoted field on line ${line}.`);
      }
      quoted = true;
    } else {
      field += character;
    }
  }

  if (quoted) throw rowError(rowLine, "a quoted field is missing its closing quote.");
  if (field.length > 0 || cells.length > 0 || closedQuote) finishRow();
  return rows;
}

function unprotect(value: string): string {
  return value.startsWith("'") && formulaPrefix.test(value.slice(1)) ? value.slice(1) : value;
}

function numberCell(value: string, column: "price" | "stock", line: number): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Decimal notation only; do not silently accept hex, currencies or formulas.
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const parsed = decimal.test(trimmed) ? Number(trimmed) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw rowError(line, `${column} must be a finite number of zero or more, or blank.`);
  }
  if (column === "stock" && !Number.isSafeInteger(parsed)) {
    throw rowError(line, "stock must be a whole number of zero or more within the safe integer range, or blank.");
  }
  return parsed;
}

/** Parse edits only. Category is immutable and is deliberately excluded. */
export function parseDraftCsv(text: string): DraftCsvUpdate[] {
  if (text.length > MAX_FILE_BYTES || new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) {
    throw new Error("The CSV file must be 15 MiB or smaller.");
  }
  const rows = readRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) throw new Error("The CSV file is empty. Include sku and name headers.");
  const [header, ...data] = rows;
  const headers = header.cells.map((cell) => cell.trim().toLowerCase());
  const indexes = new Map<string, number>();
  for (let index = 0; index < headers.length; index++) {
    const name = headers[index];
    if (!name) continue;
    if (indexes.has(name)) throw rowError(header.line, `the ${name} header appears more than once.`);
    indexes.set(name, index);
  }
  for (const name of ["sku", "name"]) {
    if (!indexes.has(name)) throw rowError(header.line, `the required ${name} header is missing.`);
  }

  const seen = new Set<string>();
  return data.map(({ cells, line }) => {
    if (cells.length !== headers.length) {
      throw rowError(line, `expected ${headers.length} columns but found ${cells.length}. Quote values containing commas.`);
    }
    const cell = (name: string) => {
      const index = indexes.get(name);
      return index === undefined ? "" : unprotect(cells[index]);
    };
    const sku = cell("sku").trim();
    if (!sku) throw rowError(line, "SKU is required.");
    if (seen.has(sku)) throw rowError(line, `SKU "${sku}" appears more than once. Keep one row per SKU.`);
    seen.add(sku);
    const name = cell("name").trim();
    if (!name) throw rowError(line, `name is required for SKU "${sku}".`);
    const list = (column: string) => cell(column).split("|").map((value) => value.trim()).filter(Boolean);
    const images = list("images");
    for (const image of images) {
      let valid = false;
      try {
        const url = new URL(image);
        valid = url.protocol === "https:" && Boolean(url.hostname);
      } catch { /* The row error below identifies the invalid field. */ }
      if (!valid) throw rowError(line, `images must contain HTTPS URLs separated by | for SKU "${sku}".`);
    }
    const verifiedText = indexes.has("verified") ? cell("verified").trim().toLowerCase() : "false";
    if (verifiedText !== "true" && verifiedText !== "false") {
      throw rowError(line, `verified must be true or false for SKU "${sku}".`);
    }
    return {
      sku,
      name,
      description: cell("description"),
      price: numberCell(cell("price"), "price", line),
      stock: numberCell(cell("stock"), "stock", line),
      colors: list("colors"),
      types: list("types"),
      images,
      verified: verifiedText === "true",
    };
  });
}
