type CalendarCellProps = {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasEntry: boolean;
  intensity: number;
  onClick: () => void;
};

export function CalendarCell({ day, isToday, isSelected, hasEntry, intensity, onClick }: CalendarCellProps) {
  const heatClass = hasEntry ? `heat-${Math.max(1, Math.min(intensity, 4))}` : "heat-0";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 w-10 rounded-lg border text-sm transition ${heatClass} ${isSelected ? "border-[#1b2a44]" : "border-[#d9cfbd]"}`}
      aria-label={`选择第 ${day} 天`}
    >
      <span className={isToday ? "font-semibold text-[#ca552f]" : "text-[#22304f]"}>{day}</span>
    </button>
  );
}
