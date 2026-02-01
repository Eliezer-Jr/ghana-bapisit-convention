import { startOfWeek, format, parseISO, isValid } from "date-fns";

export type GroupedByWeekAndDate<T> = {
  weekLabel: string;
  weekStart: Date;
  dates: {
    dateLabel: string;
    date: Date;
    items: T[];
  }[];
}[];

export function groupByWeekAndDate<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined
): GroupedByWeekAndDate<T> {
  const weekMap = new Map<string, Map<string, T[]>>();

  items.forEach((item) => {
    const dateStr = getDate(item);
    if (!dateStr) return;

    const date = parseISO(dateStr);
    if (!isValid(date)) return;

    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekKey = weekStart.toISOString();
    const dateKey = format(date, "yyyy-MM-dd");

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, new Map());
    }
    const dateMap = weekMap.get(weekKey)!;
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey)!.push(item);
  });

  // Convert to array and sort by week (most recent first)
  const result: GroupedByWeekAndDate<T> = [];

  const sortedWeeks = Array.from(weekMap.entries()).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  for (const [weekKey, dateMap] of sortedWeeks) {
    const weekStart = new Date(weekKey);
    const weekLabel = `Week of ${format(weekStart, "MMM d, yyyy")}`;

    const sortedDates = Array.from(dateMap.entries()).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );

    const dates = sortedDates.map(([dateKey, items]) => ({
      dateLabel: format(new Date(dateKey), "EEEE, MMM d"),
      date: new Date(dateKey),
      items,
    }));

    result.push({ weekLabel, weekStart, dates });
  }

  return result;
}
