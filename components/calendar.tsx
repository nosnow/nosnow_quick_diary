"use client";

import { CalendarCell } from "@/components/calendar-cell";

type CalendarProps = {
  viewDate: string;
  selectedDate: string;
  recordedDates: string[];
  streakMap: Record<string, number>;
  onSelect: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onViewAllInMonth: () => void;
};

export function Calendar({
  viewDate,
  selectedDate,
  recordedDates,
  streakMap,
  onSelect,
  onChangeMonth,
  onViewAllInMonth
}: CalendarProps) {
  const viewing = new Date(`${viewDate}T00:00:00`);
  const year = viewing.getFullYear();
  const month = viewing.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntryCount = recordedDates.filter((d) => d.startsWith(`${monthPrefix}-`)).length;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="card p-4 md:p-6 fade-in">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm"
        >
          上月
        </button>
        <div className="text-center">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            {firstDay.toLocaleDateString("zh-CN", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs text-[#5f6d86]">本月日记：{monthEntryCount} 条</p>
        </div>
        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm"
        >
          下月
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-xs font-medium text-[#5b667b]">
        {["日", "一", "二", "三", "四", "五", "六"].map((d, index) => (
          <div key={`${d}-${index}`} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`blank-${i}`} className="h-10 w-10" />
        ))}

        {Array.from({ length: dayCount }, (_, i) => {
          const day = i + 1;
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEntry = recordedDates.includes(date);

          return (
            <CalendarCell
              key={date}
              day={day}
              isToday={date === today}
              isSelected={date === selectedDate}
              hasEntry={hasEntry}
              intensity={streakMap[date] ?? 0}
              onClick={() => onSelect(date)}
            />
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onViewAllInMonth}
          className="h-9 rounded-lg border border-[#ddcfb6] bg-white px-3 text-sm"
        >
          查看所有日记
        </button>
      </div>
    </section>
  );
}
