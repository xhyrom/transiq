import { parse } from "csv-parse/sync";

const currentYear = new Date().getFullYear();
const relevantYears = [currentYear - 1, currentYear, currentYear + 1];

const res = await (
  await fetch(
    "https://raw.githubusercontent.com/openpotato/openholidaysapi.data/refs/heads/develop/src/sk/holidays/holidays.public.csv",
  )
).text();

export const HOLIDAYS: string[] = parse(res, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: ";",
})
  .filter((item: any) => {
    const year = parseInt(item.StartDate.substring(0, 4), 10);
    return relevantYears.includes(year);
  })
  .map((item) => (item as any).StartDate.replace(/-/g, ""));
