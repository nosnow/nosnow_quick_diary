import { deleteRecord, getRecord, isValidDateString } from "@/lib/journal";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{
    date: string;
  }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { date } = await params;

  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const record = await getRecord(date);
  return NextResponse.json({ date, record });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { date } = await params;

  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  await deleteRecord(date);
  return NextResponse.json({ ok: true });
}
