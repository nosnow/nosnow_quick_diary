import { INDEX_KEY, TEMPLATE_KEY, DEFAULT_TEMPLATE, FIELD_LABELS_KEY } from "@/lib/constants";
import { redis } from "@/lib/redis";
import { DiaryRecord, TemplateField } from "@/lib/types";

type MemoryStore = Map<string, unknown>;

declare global {
  var __journalMemoryStore__: MemoryStore | undefined;
}

const memoryStore: MemoryStore = globalThis.__journalMemoryStore__ ?? new Map<string, unknown>();
globalThis.__journalMemoryStore__ = memoryStore;

async function kvGet<T>(key: string): Promise<T | null> {
  if (redis) {
    return redis.get<T>(key);
  }

  const value = memoryStore.get(key);
  return (value as T | undefined) ?? null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (redis) {
    await redis.set(key, value);
    return;
  }

  memoryStore.set(key, value);
}

async function kvDelete(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }

  memoryStore.delete(key);
}

export function getRecordKey(date: string): string {
  return `journal:${date}`;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeTemplateField(raw: unknown): TemplateField | null {
  if (!isObject(raw)) return null;

  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const type = raw.type;

  if (!id || !label || !["scale", "boolean", "text", "number"].includes(String(type))) {
    return null;
  }

  if (type === "scale") {
    const min = typeof raw.min === "number" ? raw.min : 1;
    const max = typeof raw.max === "number" ? raw.max : 5;
    return { id, label, type: "scale", min, max };
  }

  if (type === "boolean") return { id, label, type: "boolean" };
  if (type === "text") return { id, label, type: "text" };
  return { id, label, type: "number" };
}

export async function getTemplate(): Promise<TemplateField[]> {
  const template = await kvGet<unknown>(TEMPLATE_KEY);
  if (!Array.isArray(template)) {
    await kvSet(TEMPLATE_KEY, DEFAULT_TEMPLATE);
    await mergeFieldLabels(DEFAULT_TEMPLATE);
    return DEFAULT_TEMPLATE;
  }

  const cleaned = template
    .map((field) => sanitizeTemplateField(field))
    .filter((field): field is TemplateField => field !== null);

  if (cleaned.length === 0) {
    await kvSet(TEMPLATE_KEY, DEFAULT_TEMPLATE);
    await mergeFieldLabels(DEFAULT_TEMPLATE);
    return DEFAULT_TEMPLATE;
  }

  return cleaned;
}

function fieldsToLabelMap(fields: TemplateField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = field.label;
    return acc;
  }, {});
}

export async function getFieldLabels(): Promise<Record<string, string>> {
  const raw = await kvGet<unknown>(FIELD_LABELS_KEY);
  if (!isObject(raw)) {
    return {};
  }

  return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function mergeFieldLabels(fields: TemplateField[]): Promise<void> {
  const current = await getFieldLabels();
  const incoming = fieldsToLabelMap(fields);
  await kvSet(FIELD_LABELS_KEY, { ...current, ...incoming });
}

export async function setTemplate(template: TemplateField[]): Promise<void> {
  const currentTemplate = await getTemplate();
  await mergeFieldLabels(currentTemplate);
  await mergeFieldLabels(template);
  await kvSet(TEMPLATE_KEY, template);
}

export async function getRecord(date: string): Promise<DiaryRecord | null> {
  return kvGet<DiaryRecord>(getRecordKey(date));
}

export async function listRecordDates(): Promise<string[]> {
  const list = await kvGet<unknown>(INDEX_KEY);
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((value): value is string => typeof value === "string");
}

export async function saveRecord(date: string, data: DiaryRecord): Promise<void> {
  await kvSet(getRecordKey(date), data);

  const dates = await listRecordDates();
  if (!dates.includes(date)) {
    const next = [...dates, date].sort();
    await kvSet(INDEX_KEY, next);
  }
}

export async function deleteRecord(date: string): Promise<void> {
  await kvDelete(getRecordKey(date));

  const dates = await listRecordDates();
  if (dates.includes(date)) {
    const next = dates.filter((item) => item !== date);
    await kvSet(INDEX_KEY, next);
  }
}

export async function getRecordsForDates(dates: string[]): Promise<Record<string, DiaryRecord>> {
  const entries = await Promise.all(
    dates.map(async (date) => {
      const record = await getRecord(date);
      return [date, record] as const;
    })
  );

  return entries.reduce<Record<string, DiaryRecord>>((acc, [date, record]) => {
    if (record) acc[date] = record;
    return acc;
  }, {});
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
