import { getFieldLabels, getRecord, getTemplate, listRecordDates } from "@/lib/journal";
import { DiaryRecord, TemplateField } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const start = performance.now();
  const url = new URL(req.url);
  const date = url.searchParams.get("date")?.trim() ?? "";

  const [template, fieldLabels, dates] = await Promise.all([
    getTemplate(),
    getFieldLabels(),
    listRecordDates()
  ]);

  let record: DiaryRecord | null = null;
  if (date && dates.includes(date)) {
    record = await getRecord(date);
  }

  const res = NextResponse.json({
    template: (Array.isArray(template) ? template : []) as TemplateField[],
    fieldLabels,
    dates,
    date,
    record
  });

  const durationMs = Math.round(performance.now() - start);
  res.headers.set("x-bootstrap-ms", String(durationMs));
  res.headers.set("Server-Timing", `bootstrap;dur=${durationMs}`);
  return res;
}
