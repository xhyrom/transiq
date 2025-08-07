import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryGeocodeNominatim } from "../query";
import { log } from "../logger";
import type { KaeruCsvItem } from "../types";

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
    //console.log("INFO", `[step3] Skipping unprocessed station: ${station.cis_name}`);
    continue;
  }

  const cityName = station.cis_name.split(",,")[0];
  if (!cityName) {
    /*console.log(
      "ERROR",
      `[step3] No city name found for station: ${station.cis_name}`,
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
      `[step3] Skipping already correctly processed station: ${station.cis_name}`,
    );*/
    continue;
  }

  const res = await queryGeocodeNominatim({
    query: station.cis_name.replace("aut.st.", "aut.stanica"),
  });

  const items = res.items.filter((item) => item.type === "bus_stop");

  if (items.length === 0) {
    log("ERROR", `[step3] No type found for station: ${station.cis_name}`);
    continue;
  }

  const bestMatch = items[0]!;
  if (station.name === bestMatch.name) {
    log("ERROR", `[step3] Unable to fix station: ${station.cis_name}`);
    continue;
  }

  log(
    "INFO",
    `[step3] (${station.cis_name}) ${station.name} -> ${bestMatch.name} (${station.lat} -> ${bestMatch.position.lat}, ${station.lon} -> ${bestMatch.position.lon})`,
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
      `[step3] Progress: Processed ${processedCount}/${data.length} stations`,
    );
  }
}

log(
  "INFO",
  `[step3] Completed processing. Total stations processed: ${processedCount}`,
);
