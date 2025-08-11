import { exists } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryUbian } from "../query";
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

  const res = await queryUbian(station.cis_name);

  const items = res.items.filter((item) =>
    item.stopCity.startsWith(
      cityName.split(" ")[0]!.split(",")[0]!.split(".")[0]!,
    ),
  );

  if (items.length === 0) {
    log("ERROR", `[ubian] No type found for station: ${station.cis_name}`);
    continue;
  }

  const bestMatch = items[0]!;
  if (station.name === bestMatch.name) {
    log("ERROR", `[ubian] Unable to fix station: ${station.cis_name}`);
    continue;
  }

  const confirmed = await confirmChange(
    `(${station.cis_name}) ${station.name}`,
    bestMatch.name,
  );
  if (!confirmed) {
    log("INFO", `[ubian] Change skipped by user for: ${station.cis_name}`);
    continue;
  }

  log(
    "INFO",
    `[ubian] (${station.cis_name}) ${station.name} -> ${bestMatch.name}`,
  );

  station.name = bestMatch.name;

  const csvContent = stringifyCsv([
    HEADERS,
    // @ts-expect-error it works :)
    ...data.map((item) => headers.map((key) => item[key])),
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
