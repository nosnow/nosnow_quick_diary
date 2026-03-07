import { getFieldLabels, getTemplate, setTemplate } from "@/lib/journal";
import { TemplateField } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const template = await getTemplate();
  const fieldLabels = await getFieldLabels();
  return NextResponse.json({ template, fieldLabels });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { template?: TemplateField[] };

  if (!Array.isArray(body.template) || body.template.length === 0) {
    return NextResponse.json({ error: "Template must be a non-empty array" }, { status: 400 });
  }

  await setTemplate(body.template);
  return NextResponse.json({ ok: true });
}
