"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TemplateField, TemplateFieldType } from "@/lib/types";

type EditableField = TemplateField & { uid: string };

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function toEditable(fields: TemplateField[]): EditableField[] {
  return fields.map((field) => ({ ...field, uid: uid() }));
}

function toTemplate(fields: EditableField[]): TemplateField[] {
  return fields.map(({ uid: _uid, ...field }) => field);
}

function getScaleRange(field: EditableField): number[] {
  if (field.type !== "scale") return [];
  const rawMin = typeof field.min === "number" ? Math.floor(field.min) : 1;
  const rawMax = typeof field.max === "number" ? Math.floor(field.max) : 5;
  const min = Math.max(0, Math.min(rawMin, rawMax));
  const max = Math.max(rawMin, rawMax);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function TemplateEditor() {
  const router = useRouter();
  const [fields, setFields] = useState<EditableField[]>([]);
  const [status, setStatus] = useState("加载中...");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/template");
        if (!res.ok) {
          throw new Error("Template API failed");
        }

        const json = (await res.json()) as { template?: TemplateField[] };
        setFields(toEditable(Array.isArray(json.template) ? json.template : []));
        setStatus("已就绪");
      } catch {
        setStatus("加载模板失败");
      }
    }
    void load();
  }, []);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        uid: uid(),
        id: `field_${prev.length + 1}`,
        label: "新字段",
        type: "text"
      }
    ]);
  }

  function updateField(index: number, patch: Partial<EditableField>) {
    setFields((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateScaleDescription(index: number, score: number, text: string) {
    setFields((prev) =>
      prev.map((item, i) => {
        if (i !== index || item.type !== "scale") return item;

        const next = { ...(item.scoreDescriptions ?? {}) };
        const trimmed = text.trim();

        if (trimmed) {
          next[String(score)] = trimmed;
        } else {
          delete next[String(score)];
        }

        return {
          ...item,
          scoreDescriptions: Object.keys(next).length > 0 ? next : undefined
        };
      })
    );
  }

  function moveField(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= fields.length) return;
    setFields((prev) => {
      const list = [...prev];
      const [item] = list.splice(index, 1);
      list.splice(next, 0, item);
      return list;
    });
  }

  async function saveTemplate() {
    setStatus("保存中...");
    const res = await fetch("/api/template", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ template: toTemplate(fields) })
    });

    if (!res.ok) {
      setStatus("保存失败");
      return;
    }

    setStatus("已保存");
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <section className="card p-4 md:p-6 fade-in">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              模板编辑器
            </h1>
            <p className="text-sm text-[#4d5a72]">新增、编辑、删除并排序日记字段</p>
          </div>
          <Link href="/" className="text-[#ca552f] underline">
            返回日记
          </Link>
        </div>

        <div className="mb-4">
          <span className="text-xs text-[#4d5a72]">{status}</span>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.uid} className="rounded-lg border border-[#ddcfb6] p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_180px_120px]">
                <input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="h-10 rounded-lg border border-[#ddcfb6] px-3"
                  placeholder="字段名称"
                />
                <select
                  value={field.type}
                  onChange={(e) => {
                    const nextType = e.target.value as TemplateFieldType;
                    if (nextType === "scale") {
                      updateField(index, { type: nextType, min: 1, max: 5 });
                    } else {
                      updateField(index, { type: nextType });
                    }
                  }}
                  className="h-10 rounded-lg border border-[#ddcfb6] px-3"
                >
                  <option value="scale">评分</option>
                  <option value="boolean">是/否</option>
                  <option value="text">文本</option>
                  <option value="number">数字</option>
                </select>
                <input
                  value={field.id}
                  onChange={(e) => updateField(index, { id: e.target.value.replace(/\s+/g, "_") })}
                  className="h-10 rounded-lg border border-[#ddcfb6] px-3"
                  placeholder="字段ID"
                />
              </div>

              {field.type === "scale" && (
                <div className="mt-2 space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      type="number"
                      value={field.min ?? 1}
                      onChange={(e) => updateField(index, { min: Number(e.target.value || 1) })}
                      className="h-10 rounded-lg border border-[#ddcfb6] px-3"
                      placeholder="最小值"
                    />
                    <input
                      type="number"
                      value={field.max ?? 5}
                      onChange={(e) => updateField(index, { max: Number(e.target.value || 5) })}
                      className="h-10 rounded-lg border border-[#ddcfb6] px-3"
                      placeholder="最大值"
                    />
                  </div>

                  <div className="rounded-lg border border-[#efe4d2] bg-[#fcf8f0] p-3">
                    <p className="mb-2 text-xs text-[#5f6d86]">分数说明（可选）：在日记页点击图标可查看对应说明</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {getScaleRange(field).map((score) => (
                        <label key={`${field.uid}-score-${score}`} className="flex items-center gap-2 text-sm text-[#2b3854]">
                          <span className="inline-flex w-8 shrink-0 justify-center rounded border border-[#ddcfb6] bg-white py-1">{score}</span>
                          <input
                            value={field.scoreDescriptions?.[String(score)] ?? ""}
                            onChange={(e) => updateScaleDescription(index, score, e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#ddcfb6] bg-white px-3"
                            placeholder={`分数 ${score} 的说明`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="h-9 rounded-lg border border-[#ddcfb6] px-3" onClick={() => moveField(index, -1)}>
                  上移
                </button>
                <button type="button" className="h-9 rounded-lg border border-[#ddcfb6] px-3" onClick={() => moveField(index, 1)}>
                  下移
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-[#e8b9a8] bg-[#fff1eb] px-3 text-[#7f2f15]"
                  onClick={() => removeField(index)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={addField} className="h-10 rounded-lg border border-[#ddcfb6] bg-white px-4">
            新增字段
          </button>
          <button type="button" onClick={saveTemplate} className="h-10 rounded-lg bg-[#ca552f] px-4 text-white">
            保存模板
          </button>
        </div>
      </section>
    </main>
  );
}
