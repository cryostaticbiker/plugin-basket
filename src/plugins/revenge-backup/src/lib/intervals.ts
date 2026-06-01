export const AUTO_COMPILE_INTERVALS = [
  { label: "5 minutes", value: 5 * 60 * 1000 },
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "15 minutes", value: 15 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "2 hours", value: 2 * 60 * 60 * 1000 },
  { label: "5 hours", value: 5 * 60 * 60 * 1000 },
  { label: "10 hours", value: 10 * 60 * 60 * 1000 },
  { label: "24 hours", value: 24 * 60 * 60 * 1000 },
] as const;

export const DEFAULT_AUTO_COMPILE_INTERVAL_MS = AUTO_COMPILE_INTERVALS[2].value;

export function getIntervalLabel(value: number) {
  return AUTO_COMPILE_INTERVALS.find(interval => interval.value === value)?.label ?? "15 minutes";
}
