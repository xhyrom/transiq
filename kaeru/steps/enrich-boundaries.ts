import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { reverseGeocode } from "../query";
import { log } from "../logger";
import { HEADERS, type KaeruCsvItem } from "../types";

const csvPath = join(".transiq", "kaeru.csv");
if (!(await exists(csvPath))) {
  throw new Error("File doesn't exist");
}

const content = await Bun.file(csvPath).text();
const data = parseCsv<KaeruCsvItem>(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  cast: true,
});

for (const station of data) {
  if (
    station.lat &&
    station.lon &&
    (!station.country_code || !station.region || !station.district) &&
    (station.lat != -1 || station.lon != -1)
  ) {
    try {
      const boundaries = await reverseGeocode(station.lat, station.lon);
      station.district =
        boundaries.district?.replace("okres", "")?.trim() || "";
      station.region =
        boundaries.region?.replace("kraj", "")?.replace("oblasť", "")?.trim() ||
        "";
      station.country_code = boundaries.country_code;

      log(
        "INFO",
        `Added boundaries for ${station.cis_name}: cc: ${station.country_code}, r: ${station.region}, d: ${station.district}`,
      );

      const csvContent = stringifyCsv([
        HEADERS,
        ...data.map((item) =>
          HEADERS.map((key) => item[key as keyof KaeruCsvItem] || ""),
        ),
      ]);

      await Bun.write(csvPath, csvContent);
    } catch (error) {
      log(
        "ERROR",
        `Failed to get boundaries for ${station.cis_name}: ${error}`,
      );
    }
  }
}
