import { getRecordsForDates, listRecordDates } from "@/lib/journal";
import { NextResponse } from "next/server";

export async function GET() {
  const dates = await listRecordDates();
  const records = await getRecordsForDates(dates);
  return NextResponse.json({ dates, records });
}
