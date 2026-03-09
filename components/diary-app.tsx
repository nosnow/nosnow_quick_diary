"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/calendar";
import { TodayInput } from "@/components/today-input";
import { todayDateStringUTC8 } from "@/lib/date";
import { DiaryRecord, TemplateField } from "@/lib/types";

const EMPTY_RECORD: DiaryRecord = {};
const DEFAULT_NOTEBOOK_DESCRIPTION = "每天仅一条日记，键格式：journal:YYYY-MM-DD（编辑会更新当天记录）。";

type ExportField = {
  code: string;
  name: string;
  isBoolean: boolean;
  csvHeader: string;
};

type ExportRow = {
  date: string;
  data: DiaryRecord;
};

function todayString(): string {
  return todayDateStringUTC8();
}

function buildStreakMap(dates: string[]): Record<string, number> {
  const sorted = [...dates].sort();
  const set = new Set(sorted);
  const streak: Record<string, number> = {};

  for (const date of sorted) {
    const prev = new Date(`${date}T00:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const prevKey = prev.toISOString().slice(0, 10);
    streak[date] = (set.has(prevKey) ? streak[prevKey] : 0) + 1;
  }

  return streak;
}

export function DiaryApp() {
  const [template, setTemplate] = useState<TemplateField[]>([]);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Record<string, DiaryRecord>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [viewDate, setViewDate] = useState<string>(todayString());
  const [status, setStatus] = useState<string>("加载中...");
  const [draftRecord, setDraftRecord] = useState<DiaryRecord>({});
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [showMonthEntries, setShowMonthEntries] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [monthExportFields, setMonthExportFields] = useState<ExportField[]>([]);
  const [monthExportRows, setMonthExportRows] = useState<ExportRow[]>([]);
  const [monthExportLoading, setMonthExportLoading] = useState<boolean>(false);
  const [monthExportError, setMonthExportError] = useState<string>("");
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());
  const [exportMonth, setExportMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [notebookDescription, setNotebookDescription] = useState<string>(DEFAULT_NOTEBOOK_DESCRIPTION);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string>("");
  const [isSavingDescription, setIsSavingDescription] = useState<boolean>(false);

  const streakMap = useMemo(() => buildStreakMap(dates), [dates]);

  useEffect(() => {
    async function load() {
      try {
        const initialDate = todayString();
        const bootstrapRes = await fetch(`/api/bootstrap?date=${initialDate}`, { cache: "no-store" });

        if (!bootstrapRes.ok) {
          throw new Error("API request failed");
        }

        const bootstrapJson = (await bootstrapRes.json()) as {
          template?: TemplateField[];
          fieldLabels?: Record<string, string>;
          dates?: string[];
          date?: string;
          record?: DiaryRecord | null;
          description?: string;
        };

        const nextDates = Array.isArray(bootstrapJson.dates) ? bootstrapJson.dates : [];
        let initialRecordMap: Record<string, DiaryRecord> = {};

        if (nextDates.includes(initialDate) && bootstrapJson.record && typeof bootstrapJson.record === "object") {
          initialRecordMap = { [initialDate]: bootstrapJson.record };
        }

        setTemplate(Array.isArray(bootstrapJson.template) ? bootstrapJson.template : []);
        setFieldLabels(bootstrapJson.fieldLabels ?? {});
        setDates(nextDates);
        setRecords(initialRecordMap);
        setNotebookDescription(
          typeof bootstrapJson.description === "string" ? bootstrapJson.description : DEFAULT_NOTEBOOK_DESCRIPTION
        );
        setStatus("已就绪");
        setDataLoaded(true);
      } catch {
        setStatus("加载数据失败");
      }
    }
    void load();
  }, []);

  const hasEntry = dates.includes(selectedDate);
  const selectedRecord = records[selectedDate];
  const savedRecord = selectedRecord ?? EMPTY_RECORD;

  const activeTemplate = useMemo<TemplateField[]>(() => {
    if (!hasEntry || isEditing) return template;

    const templateIds = new Set(template.map((item) => item.id));
    const legacyFields = Object.keys(savedRecord)
      .filter((key) => !templateIds.has(key))
      .map((key) => {
        const fallbackLabel = fieldLabels[key] ?? key;
        const value = savedRecord[key];

        if (typeof value === "boolean") {
          return { id: key, label: fallbackLabel, type: "boolean" } as const;
        }
        if (typeof value === "number") {
          return { id: key, label: fallbackLabel, type: "number" } as const;
        }

        return { id: key, label: fallbackLabel, type: "text" } as const;
      });

    return [...template, ...legacyFields];
  }, [hasEntry, isEditing, template, savedRecord, fieldLabels]);

  const monthPrefix = useMemo(() => viewDate.slice(0, 7), [viewDate]);

  useEffect(() => {
    if (!dataLoaded || !hasEntry || selectedRecord) return;

    let cancelled = false;

    async function loadSelectedRecord() {
      setStatus("加载日记中...");
      const res = await fetch(`/api/record/${selectedDate}`, { cache: "no-store" });
      if (!res.ok || cancelled) return;

      const json = (await res.json()) as { record?: DiaryRecord | null };
      if (cancelled) return;

      if (json.record && typeof json.record === "object") {
        setRecords((prev) => ({ ...prev, [selectedDate]: json.record as DiaryRecord }));
      }
    }

    void loadSelectedRecord();

    return () => {
      cancelled = true;
    };
  }, [dataLoaded, hasEntry, selectedDate, selectedRecord]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (hasEntry && !selectedRecord) return;

    setDraftRecord(savedRecord);
    if (hasEntry) {
      setIsEditing(false);
      setStatus("只读模式");
    } else {
      setIsEditing(true);
      setStatus("新建模式");
    }
  }, [selectedDate, hasEntry, savedRecord, dataLoaded, selectedRecord]);

  async function persist(nextDate: string, nextRecord: DiaryRecord) {
    setStatus("保存中...");
    const res = await fetch("/api/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: nextDate, data: nextRecord })
    });

    if (!res.ok) {
      setStatus("保存失败");
      return;
    }

    setRecords((prev) => ({ ...prev, [nextDate]: nextRecord }));
    setDates((prev) => (prev.includes(nextDate) ? prev : [...prev, nextDate]));
    setIsEditing(false);
    setStatus("已保存，当前为只读模式");
  }

  function saveNow() {
    void persist(selectedDate, draftRecord);
  }

  function updateField(fieldId: string, value: string | number | boolean) {
    setDraftRecord((prev) => ({ ...prev, [fieldId]: value }));
  }

  function enterEditMode() {
    setIsEditing(true);
    setStatus("编辑模式");
  }

  async function deleteCurrentRecord() {
    if (!hasEntry) return;

    const confirmed = window.confirm("确认删除这一天的日记吗？此操作不可撤销。");
    if (!confirmed) return;

    setStatus("删除中...");
    const res = await fetch(`/api/record/${selectedDate}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(`删除失败${json?.error ? `：${json.error}` : ""}`);
      return;
    }

    setRecords((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setDates((prev) => prev.filter((date) => date !== selectedDate));
    setDraftRecord({});
    setIsEditing(true);
    setStatus("已删除，当前为新建模式");
  }

  function onSelectDate(date: string) {
    setSelectedDate(date);
    setViewDate(date);
    setShowCalendar(false);
  }

  function changeMonth(delta: number) {
    const current = new Date(`${viewDate}T00:00:00`);
    const selectedDay = Number(selectedDate.slice(8, 10));

    current.setDate(1);
    current.setMonth(current.getMonth() + delta);

    const year = current.getFullYear();
    const month = current.getMonth();
    const maxDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(selectedDay, maxDay);
    const nextDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    setViewDate(nextDate);
    setSelectedDate(nextDate);
    setShowMonthEntries(false);
  }

  function toggleMonthEntries() {
    setShowMonthEntries((prev) => !prev);
  }

  useEffect(() => {
    if (!showMonthEntries) return;

    async function loadMonthExport() {
      setMonthExportLoading(true);
      setMonthExportError("");
      try {
        const res = await fetch(`/api/export?month=${monthPrefix}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("导出接口请求失败");
        }

        const json = (await res.json()) as {
          fields?: ExportField[];
          rows?: ExportRow[];
        };

        setMonthExportFields(Array.isArray(json.fields) ? json.fields : []);
        setMonthExportRows(Array.isArray(json.rows) ? json.rows : []);
      } catch {
        setMonthExportError("加载当月日记失败");
      } finally {
        setMonthExportLoading(false);
      }
    }

    void loadMonthExport();
  }, [showMonthEntries, monthPrefix]);

  function formatValue(value: string | number | boolean | null | undefined): string {
    if (value === true) return "是";
    if (value === false) return "否";
    if (value == null) return "";
    return String(value);
  }

  function exportCsv(params: string) {
    window.location.href = `/api/export?format=csv${params}`;
  }

  function startEditNotebookDescription() {
    setDescriptionDraft(notebookDescription);
    setIsEditingDescription(true);
  }

  function cancelEditNotebookDescription() {
    setDescriptionDraft("");
    setIsEditingDescription(false);
  }

  async function saveNotebookDescription() {
    if (descriptionDraft === notebookDescription) {
      setIsEditingDescription(false);
      return;
    }

    setIsSavingDescription(true);

    try {
      const res = await fetch("/api/description", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: descriptionDraft })
      });

      if (!res.ok) {
        setStatus("日记本描述保存失败");
        setIsSavingDescription(false);
        return;
      }

      setNotebookDescription(descriptionDraft);
      setIsEditingDescription(false);
      setIsSavingDescription(false);
      setStatus("日记本描述已保存");
    } catch {
      setStatus("日记本描述保存失败");
      setIsSavingDescription(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <section className="mb-4 card p-4 fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            日历
          </h2>
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm"
          >
            {showCalendar ? "收起" : "展开"}
          </button>
        </div>
      </section>

      {showCalendar && (
        <div className="mb-4">
          <Calendar
            viewDate={viewDate}
            selectedDate={selectedDate}
            recordedDates={dates}
            streakMap={streakMap}
            onSelect={onSelectDate}
            onChangeMonth={changeMonth}
            onViewAllInMonth={toggleMonthEntries}
          />
        </div>
      )}

      <div className="grid gap-4">
        <TodayInput
          date={selectedDate}
          template={activeTemplate}
          record={draftRecord}
          onChange={updateField}
          onSaveNow={saveNow}
          onEdit={enterEditMode}
          onDelete={deleteCurrentRecord}
          isEditing={isEditing}
          hasEntry={hasEntry}
          status={status}
        />
      </div>

      {showMonthEntries && (
        <section className="mt-4 card p-4 fade-in">
          <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            {monthPrefix} 月份全部日记
          </h2>

          {monthExportLoading ? (
            <p className="text-sm text-[#5f6d86]">加载中...</p>
          ) : monthExportError ? (
            <p className="text-sm text-[#7f2f15]">{monthExportError}</p>
          ) : monthExportRows.length === 0 ? (
            <p className="text-sm text-[#5f6d86]">该月份暂无日记。</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#ddcfb6] bg-white">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f5efe3] text-left">
                    <th className="border-b border-[#ddcfb6] px-3 py-2 font-semibold text-[#2b3854]">日期</th>
                    {monthExportFields.map((field) => (
                      <th
                        key={field.code}
                        className="border-b border-[#ddcfb6] px-3 py-2 font-semibold text-[#2b3854] whitespace-nowrap"
                      >
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthExportRows.map((entry) => (
                    <tr key={entry.date} className="odd:bg-white even:bg-[#fcf8f0]">
                      <td className="border-b border-[#efe4d2] px-3 py-2 text-[#22304f] whitespace-nowrap">{entry.date}</td>
                      {monthExportFields.map((field) => (
                        <td key={`${entry.date}-${field.code}`} className="border-b border-[#efe4d2] px-3 py-2 text-[#22304f]">
                          {formatValue(entry.data[field.code])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="mt-4 card p-4 fade-in">
        <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          导出 CSV
        </h2>
        <div className="mb-3 grid gap-2 md:grid-cols-[160px_160px]">
          <label className="flex flex-col gap-1 text-sm text-[#5f6d86]">
            年份
            <input
              type="number"
              min={2000}
              max={2100}
              value={exportYear}
              onChange={(e) => setExportYear(e.target.value)}
              className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-3 text-[#22304f]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#5f6d86]">
            月份
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-3 text-[#22304f]"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const value = String(i + 1).padStart(2, "0");
                return (
                  <option key={value} value={value}>
                    {Number(value)} 月
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-4"
            onClick={() => {
              const year = exportYear.trim() || String(new Date().getFullYear());
              const month = `${year}-${exportMonth}`;
              exportCsv(`&month=${month}`);
            }}
          >
            导出指定月份
          </button>
          <button
            type="button"
            className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-4"
            onClick={() => {
              const year = exportYear.trim() || String(new Date().getFullYear());
              exportCsv(`&year=${year}`);
            }}
          >
            导出指定年份
          </button>
          <button
            type="button"
            className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-4"
            onClick={() => exportCsv("")}
          >
            导出全部
          </button>
        </div>
      </section>

      <header className="mt-4 card p-4 md:p-5 fade-in">
        <div className="flex flex-col gap-3">
          <div className="w-full min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              在线日记本
            </h1>
            {isEditingDescription ? (
              <div className="mt-2 space-y-2 w-full">
                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-[#ddcfb6] bg-white p-3 text-sm text-[#22304f]"
                  placeholder="请输入日记本描述"
                />
              </div>
            ) : (
              <p className="text-sm text-[#4d5a72] whitespace-pre-wrap">{notebookDescription}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isEditingDescription ? (
              <>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-[#ca552f] px-3 text-sm text-white disabled:opacity-60"
                  onClick={saveNotebookDescription}
                  disabled={isSavingDescription}
                >
                  {isSavingDescription ? "保存中..." : "保存描述"}
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm"
                  onClick={cancelEditNotebookDescription}
                  disabled={isSavingDescription}
                >
                  取消
                </button>
              </>
            ) : (
              <button type="button" className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm" onClick={startEditNotebookDescription}>
                编辑日记本描述
              </button>
            )}
            <Link className="inline-flex h-9 items-center rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm text-[#2b3854]" href="/template">
              编辑模板
            </Link>
          </div>
        </div>
      </header>
    </main>
  );
}
