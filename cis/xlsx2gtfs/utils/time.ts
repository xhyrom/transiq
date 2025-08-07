export interface DateRange {
  from: string;
  to: string;
}

export function formatTimeToGtfs(timeStr: string | number): string {
  const timeString = String(timeStr);

  if (!timeString.includes(":")) {
    console.warn(`Unexpected time format: ${timeString}`);
    return "00:00:00";
  }

  const [hours, minutes] = timeString.split(":");

  const paddedHours = hours!.trim().padStart(2, "0");
  const paddedMinutes = minutes ? minutes.trim().padStart(2, "0") : "00";

  return `${paddedHours}:${paddedMinutes}:00`;
}

export const FIRST_TWO_DIGITS_OF_YEAR = new Date()
  .getFullYear()
  .toString()
  .slice(0, 2);

export function parseDateToGtfs(dateStr: string): string {
  const [day, month, year] = dateStr.split(".");
  const fullYear = `${FIRST_TWO_DIGITS_OF_YEAR}${year}`;
  return `${fullYear}${month!.padStart(2, "0")}${day!.padStart(2, "0")}`;
}

export function extractDateRanges(explanation: string): DateRange[] {
  const dateRanges: DateRange[] = [];

  const dateRangeRegex =
    /od\s+(\d{1,2}\.\d{1,2}\.\d{1,2})\s+do\s+(\d{1,2}\.\d{1,2}\.\d{1,2})/g;
  let match;

  while ((match = dateRangeRegex.exec(explanation)) !== null) {
    dateRanges.push({
      from: parseDateToGtfs(match[1]!),
      to: parseDateToGtfs(match[2]!),
    });
  }

  return dateRanges;
}
