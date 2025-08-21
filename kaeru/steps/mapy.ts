import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryGeocodeMapy, reverseGeocode } from "../query";
import { log } from "../logger";
import { HEADERS, type KaeruCsvItem } from "../types";

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

let processedCount = 0;

for (const stop of data) {
  if (stop.name && stop.lat !== null && stop.lon !== null) {
    log("INFO", `Skipping already processed stop: ${stop.cis_name}`);
    continue;
  }

  try {
    const res = await queryGeocodeMapy({
      query: `zastávka ${stop.cis_name.replace("Dubnica n.V.", "Dubnica nad Váhom").replace("Bzince p.Javor", "Bzince pod Javorinou").replace("aut.st.", "aut.stanica").replace("žel.st.", "žel.stanica")}`,
    });

    const items = res.items.filter(
      (item) =>
        item.type === "poi" &&
        (item.label === "Zastávka autobusu" ||
          item.label.includes("Autobusová stanica") ||
          item.label.toLowerCase().includes("autobus")),
    );
    if (items.length === 0) {
      log("ERROR", `No type found for stop: ${stop.cis_name}`);
    } else {
      const bestMatch = items[0]!;

      stop.name = bestMatch.name;
      stop.lat = bestMatch.position.lat;
      stop.lon = bestMatch.position.lon;

      const boundaries = await reverseGeocode(stop.lat, stop.lon);
      stop.district = boundaries.district?.replace("okres", "")?.trim() || "";
      stop.region =
        boundaries.region?.replace("kraj", "")?.replace("oblasť", "")?.trim() ||
        "";
      stop.country_code = boundaries.country_code;

      log(
        "INFO",
        `Successfully geocoded: ${stop.cis_name} → ${stop.name} (${stop.lat}, ${stop.lon})`,
      );
    }
  } catch (error) {
    log(
      "ERROR",
      `Error processing stop ${stop.cis_name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const csvContent = stringifyCsv([
    HEADERS,
    // @ts-expect-error it works :)
    ...data.map((item) => HEADERS.map((key) => item[key])),
  ]);
  await Bun.write(csvPath, csvContent);

  processedCount++;
  if (processedCount % 10 === 0) {
    log("INFO", `Progress: Processed ${processedCount}/${data.length} stops`);
  }
}

log("INFO", `Completed processing. Total stops processed: ${processedCount}`);
