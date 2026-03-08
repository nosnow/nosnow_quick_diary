import { getRecordsForDates, listRecordDates } from "@/lib/journal";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const dates = await listRecordDates();
  const url = new URL(req.url);
  const includeRecords = url.searchParams.get("includeRecords") === "1";

  if (!includeRecords) {
    return NextResponse.json({ dates });
  }

  const records = await getRecordsForDates(dates);
  return NextResponse.json({ dates, records });
}
