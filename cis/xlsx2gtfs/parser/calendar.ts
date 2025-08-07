import { FIRST_TWO_DIGITS_OF_YEAR, type DateRange } from "../utils/time";

export function parseCalendarRange(text: string): DateRange | null {
  if (!text) return null;

  // Match pattern "Platí od DD.MM.YYYY do DD.MM.YYYY"
  const match = text.match(
    /Platí od (\d{2}\.\d{2}\.(\d{4}|\d{2})) do (\d{2}\.\d{2}\.(\d{4}|\d{2}))/,
  );
  if (!match) return null;

  const fromDateStr = match[1]!;
  const toDateStr = match[3]!;

  const [fromDay, fromMonth, fromYear] = fromDateStr.split(".");
  const [toDay, toMonth, toYear] = toDateStr.split(".");

  const fullFromYear =
    fromYear!.length === 2
      ? `${FIRST_TWO_DIGITS_OF_YEAR}${fromYear}`
      : fromYear;
  const fullToYear =
    toYear!.length === 2 ? `${FIRST_TWO_DIGITS_OF_YEAR}${toYear}` : toYear;

  return {
    from: `${fullFromYear}${fromMonth!.padStart(2, "0")}${fromDay!.padStart(2, "0")}`,
    to: `${fullToYear}${toMonth!.padStart(2, "0")}${toDay!.padStart(2, "0")}`,
  };
}
