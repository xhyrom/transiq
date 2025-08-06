import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import type { KaeruCsvItem } from "kaeru/types";

const csvPath = join(".transiq", "kaeru.csv");
const content = await Bun.file(csvPath).text();
const data = parseCsv<KaeruCsvItem>(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  cast: true,
});

export function queryStopByCisName(cisName: string): KaeruCsvItem | undefined {
  return data.find((item) => item.cis_name === cisName);
}
