import { getDescription, setDescription } from "@/lib/journal";
import { NextResponse } from "next/server";

export async function GET() {
  const description = await getDescription();
  return NextResponse.json({ description });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { description?: string };
  if (typeof body.description !== "string") {
    return NextResponse.json({ error: "Invalid description" }, { status: 400 });
  }

  await setDescription(body.description);
  return NextResponse.json({ ok: true, description: body.description });
}
