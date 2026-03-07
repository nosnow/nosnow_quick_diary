import { getFieldLabels, getRecordsForDates, getTemplate, listRecordDates } from "@/lib/journal";
import { DiaryRecord, TemplateField } from "@/lib/types";
import { NextResponse } from "next/server";

type ExportField = {
  code: string;
  name: string;
  isBoolean: boolean;
  csvHeader: string;
};

function filterDates(dates: string[], year: string | null, month: string | null, days: string | null): string[] {
  if (month) {
    return dates.filter((date) => date.startsWith(`${month}-`));
  }

  if (year) {
    return dates.filter((date) => date.startsWith(`${year}-`));
  }

  if (days) {
    const n = Number(days);
    if (Number.isFinite(n) && n > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - n + 1);
      return dates.filter((date) => new Date(`${date}T00:00:00Z`) >= cutoff);
    }
  }

  return dates;
}

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildTemplateLabelMap(template: TemplateField[], archivedLabels: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>(Object.entries(archivedLabels));

  for (const item of template) {
    map.set(item.id, item.label);
  }

  return map;
}

function collectFieldCodes(rows: Array<{ date: string; data: DiaryRecord }>): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.data)) {
      set.add(key);
    }
  }

  return Array.from(set).sort();
}

function inferBooleanCodes(rows: Array<{ date: string; data: DiaryRecord }>, fieldCodes: string[]): Set<string> {
  const result = new Set<string>();

  for (const code of fieldCodes) {
    let hasBoolean = false;
    let hasOtherType = false;

    for (const row of rows) {
      const value = row.data[code];
      if (value == null) continue;
      if (typeof value === "boolean") {
        hasBoolean = true;
      } else {
        hasOtherType = true;
        break;
      }
    }

    if (hasBoolean && !hasOtherType) {
      result.add(code);
    }
  }

  return result;
}

function toExportFields(
  fieldCodes: string[],
  labelMap: Map<string, string>,
  booleanCodes: Set<string>
): ExportField[] {
  return fieldCodes.map((code) => {
    const name = labelMap.get(code) ?? code;
    return {
      code,
      name,
      isBoolean: booleanCodes.has(code),
      csvHeader: `${code}(${name})`
    };
  });
}

function normalizeRowData(fields: ExportField[], data: DiaryRecord): DiaryRecord {
  const normalized: DiaryRecord = {};

  for (const field of fields) {
    const value = data[field.code];
    if (field.isBoolean) {
      normalized[field.code] = value === true;
    } else {
      normalized[field.code] = value ?? null;
    }
  }

  return normalized;
}

function toCsv(fields: ExportField[], rows: Array<{ date: string; data: DiaryRecord }>): string {
  const header = ["date", ...fields.map((field) => field.csvHeader)].join(",");
  const lines = rows.map(({ date, data }) => {
    const values = fields.map((field) => csvEscape(data[field.code]));
    return [date, ...values].join(",");
  });
  return [header, ...lines].join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  const days = url.searchParams.get("days");
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const template = await getTemplate();
  const archivedLabels = await getFieldLabels();

  const dates = await listRecordDates();
  const filteredDates = filterDates(dates, year, month, days).sort();
  const records = await getRecordsForDates(filteredDates);
  const rows = filteredDates
    .map((date) => ({ date, data: records[date] }))
    .filter((row): row is { date: string; data: DiaryRecord } => Boolean(row.data));

  const labelMap = buildTemplateLabelMap(template, archivedLabels);
  const fieldCodes = collectFieldCodes(rows);
  const booleanCodes = inferBooleanCodes(rows, fieldCodes);
  const fields = toExportFields(fieldCodes, labelMap, booleanCodes);

  const normalizedRows = rows.map((row) => ({
    date: row.date,
    data: normalizeRowData(fields, row.data)
  }));

  if (format === "csv") {
    const csv = toCsv(fields, normalizedRows);
    const csvWithBom = `\uFEFF${csv}`;
    return new NextResponse(csvWithBom, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=journal-export.csv",
        "cache-control": "no-store"
      }
    });
  }

  return NextResponse.json({ template, fields, rows: normalizedRows });
}
