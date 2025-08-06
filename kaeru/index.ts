import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryGeocode } from "./query";
import { log } from "./logger";
import type { KaeruCsvItem } from "./types";

const csvPath = join(".transiq", "kaeru.csv");
if (!(await exists(csvPath))) {
  throw new Error(
    `File ${csvPath} does not exist. Please run dump-stations first.`,
  );
}

const content = await Bun.file(csvPath).text();
const data = parseCsv<KaeruCsvItem>(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  cast: true,
});

const headers = ["cis_name", "name", "lat", "lon"];
let processedCount = 0;

for (const station of data) {
  if (station.name && station.lat !== null && station.lon !== null) {
    log("INFO", `Skipping already processed station: ${station.cis_name}`);
    continue;
  }

  try {
    const res = await queryGeocode({
      query: station.cis_name,
    });

    const items = res.items.filter(
      (item) =>
        item.type === "poi" &&
        (item.label === "Zastávka autobusu" ||
          item.label.includes("Autobusová stanica") ||
          item.label.toLowerCase().includes("autobus")),
    );
    if (items.length === 0) {
      log("ERROR", `No type found for station: ${station.cis_name}`);
    } else {
      const bestMatch = items[0]!;

      station.name = bestMatch.name;
      station.lat = bestMatch.position.lat;
      station.lon = bestMatch.position.lon;

      log(
        "INFO",
        `Successfully geocoded: ${station.cis_name} → ${station.name} (${station.lat}, ${station.lon})`,
      );
    }
  } catch (error) {
    log(
      "ERROR",
      `Error processing station ${station.cis_name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const csvContent = stringifyCsv([
    headers,
    // @ts-expect-error it works :)
    ...data.map((item) => headers.map((key) => item[key])),
  ]);
  await Bun.write(csvPath, csvContent);

  processedCount++;
  if (processedCount % 10 === 0) {
    log(
      "INFO",
      `Progress: Processed ${processedCount}/${data.length} stations`,
    );
  }
}

log(
  "INFO",
  `Completed processing. Total stations processed: ${processedCount}`,
);
