import { isValidDateString, saveRecord } from "@/lib/journal";
import { DiaryRecord } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json()) as { date?: string; data?: DiaryRecord };

  if (!body.date || !isValidDateString(body.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Invalid record data" }, { status: 400 });
  }

  await saveRecord(body.date, body.data);
  return NextResponse.json({ ok: true });
}
