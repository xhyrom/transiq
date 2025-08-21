import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryUbian, reverseGeocode } from "../query";
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

async function confirmChange(
  oldName: string,
  newName: string,
): Promise<boolean> {
  process.stdout.write(`Apply change: ${oldName} -> ${newName}? (y/n): `);
  const answer = await new Promise<string>((resolve) => {
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim().toLowerCase());
    });
  });
  return answer === "y";
}

for (const stop of data) {
  if (stop.lat || stop.lon) continue;

  const res = await queryUbian(stop.cis_name);

  const items = res.items.filter((item) =>
    item.stopCity.startsWith(
      stop.cis_name.split(" ")[0]!.split(",")[0]!.split(".")[0]!,
    ),
  );

  if (items.length === 0) {
    log("ERROR", `[ubian] No type found for station: ${stop.cis_name}`);
    continue;
  }

  const bestMatch = items[0]!;
  const confirmed = await confirmChange(
    `(${stop.cis_name}) ${stop.name}`,
    bestMatch.name,
  );
  if (!confirmed) {
    log("INFO", `[ubian] Change skipped by user for: ${stop.cis_name}`);
    continue;
  }

  log(
    "INFO",
    `[ubian] (${stop.cis_name}) ${stop.name} → ${bestMatch.name} (${bestMatch.position.lat}, ${bestMatch.position.lon})`,
  );

  stop.name = bestMatch.name;
  stop.lat = bestMatch.position.lat;
  stop.lon = bestMatch.position.lon;

  const boundaries = await reverseGeocode(stop.lat, stop.lon);
  stop.district = boundaries.district?.replace("okres", "")?.trim() || "";
  stop.region =
    boundaries.region?.replace("kraj", "")?.replace("oblasť", "")?.trim() || "";
  stop.country_code = boundaries.country_code;

  log(
    "INFO",
    `Added boundaries for ${stop.cis_name}: cc: ${stop.country_code}, r: ${stop.region}, d: ${stop.district}`,
  );

  const csvContent = stringifyCsv([
    HEADERS,
    // @ts-expect-error it works :)
    ...data.map((item) => HEADERS.map((key) => item[key])),
  ]);
  await Bun.write(csvPath, csvContent);

  processedCount++;
  if (processedCount % 10 === 0) {
    log(
      "INFO",
      `[ubian] Progress: Processed ${processedCount}/${data.length} stations`,
    );
  }
}

log(
  "INFO",
  `[ubian] Completed processing. Total stations processed: ${processedCount}`,
);
