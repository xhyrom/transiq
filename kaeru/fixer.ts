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
  if (!station.name) {
    //console.log("INFO", `Skipping unprocessed station: ${station.cis_name}`);
    continue;
  }

  const cityName = station.cis_name.split(",,")[0];
  if (!cityName) {
    /*console.log(
      "ERROR",
      `[fixer] No city name found for station: ${station.cis_name}`,
    );*/
    continue;
  }

  if (
    station.name.startsWith(
      cityName.split(" ")[0]!.split(",")[0]!.split(".")[0]!,
    )
  ) {
    /*console.log(
      "INFO",
      `Skipping already correctly processed station: ${station.cis_name}`,
    );*/
    continue;
  }

  const res = await queryGeocode({
    query: station.cis_name,
  });

  const items = res.items.filter(
    (item) =>
      item.type === "poi" &&
      item.name.startsWith(
        cityName.split(" ")[0]!.split(",")[0]!.split(".")[0]!,
      ) &&
      (item.label === "Zastávka autobusu" ||
        item.label.includes("Autobusová stanica") ||
        item.label.toLowerCase().includes("autobus")),
  );

  if (items.length === 0) {
    log("ERROR", `[fixer] No type found for station: ${station.cis_name}`);
    continue;
  }

  const bestMatch = items[0]!;

  log(
    "INFO",
    `[fixer] (${station.cis_name}) ${station.name} -> ${bestMatch.name} (${station.lat} -> ${bestMatch.position.lat}, ${station.lon} -> ${bestMatch.position.lon})`,
  );

  station.name = bestMatch.name;
  station.lat = bestMatch.position.lat;
  station.lon = bestMatch.position.lon;

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
      `[fixer] Progress: Processed ${processedCount}/${data.length} stations`,
    );
  }
}

log(
  "INFO",
  `[fixer] Completed processing. Total stations processed: ${processedCount}`,
);
