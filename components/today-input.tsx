"use client";

import { TemplateField } from "@/lib/types";
import { todayDateStringUTC8 } from "@/lib/date";

type TodayInputProps = {
  date: string;
  template: TemplateField[];
  record: Record<string, string | number | boolean | null>;
  onChange: (fieldId: string, value: string | number | boolean) => void;
  onSaveNow: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  hasEntry: boolean;
  status: string;
};

function ScalePicker({
  field,
  value,
  onSelect
}: {
  field: TemplateField;
  value: number | null;
  onSelect: (next: number) => void;
}) {
  if (field.type !== "scale") return null;
  const min = field.min ?? 1;
  const max = field.max ?? 5;
  const items = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={`h-11 min-w-11 rounded-lg border px-3 text-base ${value === item ? "border-[#4f7d45] bg-[#e3f0df]" : "border-[#ddcfb6] bg-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ReadonlyValue({ field, value }: { field: TemplateField; value: string | number | boolean | null }) {
  if (field.type === "scale") {
    const max = field.max ?? 5;
    const numericValue = typeof value === "number" ? value : null;
    const current = numericValue !== null ? String(numericValue) : "-";
    const half = max / 2;
    const scoreColorClass =
      numericValue === null ? "text-[#2b3854]" : numericValue > half ? "text-[#4f7d45]" : numericValue < half ? "text-[#ca552f]" : "text-[#2b3854]";

    return (
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold leading-none ${scoreColorClass}`}>{current}</span>
        <span className="text-sm text-[#5f6d86]">/{max}</span>
      </div>
    );
  }

  if (field.type === "boolean") {
    const isTrue = value === true;
    return (
      <div className={`text-base font-medium ${isTrue ? "text-[#4f7d45]" : "text-[#ca552f]"}`}>
        {isTrue ? "是" : "否"}
      </div>
    );
  }

  if (field.type === "text") {
    const text = typeof value === "string" ? value : "";
    return (
      <div className="w-full text-[15px] leading-6 text-[#2b3854] whitespace-pre-wrap">
        {text || "（空）"}
      </div>
    );
  }

  return (
    <div className="text-base font-medium text-[#2b3854]">
      {typeof value === "number" ? value : "-"}
    </div>
  );
}

export function TodayInput({
  date,
  template,
  record,
  onChange,
  onSaveNow,
  onEdit,
  onDelete,
  isEditing,
  hasEntry,
  status
}: TodayInputProps) {
  const today = todayDateStringUTC8();
  const dateText = new Date(`${date}T00:00:00`).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

  return (
    <section className="card p-4 md:p-6 fade-in">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          {date === today ? `今天：${dateText}` : dateText}
        </h1>
        <p className="text-sm text-[#4d5a72]">{status}</p>
      </div>

      <p className="mb-4 text-xs text-[#5f6d86]">
        {hasEntry
          ? isEditing
            ? "当前为编辑模式，点击保存后返回只读。"
            : "当前为只读模式，点击编辑后可修改。"
          : "当前日期暂无日记，请填写并点击保存创建。"}
      </p>

      <div className="space-y-4">
        {template.map((field) => {
          const value = record[field.id] ?? null;
          return (
            <div key={field.id} className={isEditing ? "" : "flex items-start gap-4 rounded-xl bg-[#fbf6ee] px-4 py-3"}>
              <label
                className={`block text-sm font-medium ${isEditing ? "mb-2 text-[#2b3854]" : "w-24 shrink-0 pt-0.5 text-[#6a768d]"}`}
              >
                {field.label}
              </label>

              <div className={isEditing ? "" : "flex-1"}>

                {field.type === "scale" && (
                  (isEditing ? (
                    <ScalePicker
                      field={field}
                      value={typeof value === "number" ? value : null}
                      onSelect={(next) => {
                        onChange(field.id, next);
                      }}
                    />
                  ) : (
                    <ReadonlyValue field={field} value={value} />
                  ))
                )}

                {field.type === "boolean" && (
                  (isEditing ? (
                    <button
                      type="button"
                      onClick={() => onChange(field.id, !(value === true))}
                      className={`h-11 rounded-lg border px-4 text-base ${value === true ? "border-[#4f7d45] bg-[#e3f0df]" : "border-[#ddcfb6] bg-white"}`}
                    >
                      {value === true ? "是" : "否"}
                    </button>
                  ) : (
                    <ReadonlyValue field={field} value={value} />
                  ))
                )}

                {field.type === "text" && (
                  (isEditing ? (
                    <textarea
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      className="min-h-20 w-full rounded-lg border border-[#ddcfb6] bg-white p-3"
                      placeholder="快速记录"
                    />
                  ) : (
                    <ReadonlyValue field={field} value={value} />
                  ))
                )}

                {field.type === "number" && (
                  (isEditing ? (
                    <input
                      value={typeof value === "number" ? value : ""}
                      onChange={(e) => onChange(field.id, Number(e.target.value || 0))}
                      type="number"
                      className="h-11 w-full rounded-lg border border-[#ddcfb6] bg-white px-3"
                      placeholder="输入数字"
                    />
                  ) : (
                    <ReadonlyValue field={field} value={value} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        {isEditing ? (
          <button
            type="button"
            onClick={onSaveNow}
            className="h-10 rounded-lg bg-[#ca552f] px-4 text-white"
          >
            保存
          </button>
        ) : (
          hasEntry && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-4"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="h-10 rounded-lg border border-[#e8b9a8] bg-[#fff1eb] px-4 text-[#7f2f15]"
              >
                删除
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
}
