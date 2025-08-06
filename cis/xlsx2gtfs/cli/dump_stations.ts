// dump stations to .transiq/kaeru.tsv

import { ensureDirectory } from "@helpers/util";
import { Glob } from "bun";
import { exists, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { convertXlsxToGtfs } from "../converter";
import { arrayToCsv } from "../utils/csv";
import { parse as parseCsv } from "csv-parse/sync";
import type { PartialGtfsStop } from "../gtfs/models";
import { resolvePartialGtfsStops } from "../resolver";
import { removeDuplicates } from "../utils/list";

const dir = join(".tmp", "cp-sk");
if (!(await exists(dir))) {
  throw new Error(`Directory ${dir} does not exist. Please run scraper first.`);
}

const xlsxGlob = new Glob("*.xlsx");
const outputFile = join(".transiq", "kaeru.csv");
const stops: PartialGtfsStop[] = [];

for (const agencyFolderName of await readdir(dir)) {
  const agencyFolderPath = join(dir, agencyFolderName);
  const gtfs = join(agencyFolderPath, "gtfs");
  await ensureDirectory(gtfs);

  for await (const route of xlsxGlob.scan(agencyFolderPath)) {
    const data = convertXlsxToGtfs(
      await readFile(join(agencyFolderPath, route)),
    );
    stops.push(...data.stops);
  }
}

const newStopData = resolvePartialGtfsStops(stops).map((stop) => ({
  name: stop.stop_name,
  lat: stop.stop_lat ?? null,
  lon: stop.stop_lon ?? null,
}));

let combinedData = [...newStopData];
let existingDataCount = 0;

if (await exists(outputFile)) {
  const content = await Bun.file(outputFile).text();

  const existingData = parseCsv(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
  });

  console.log(`Found ${existingData.length} existing stops in the CSV file`);

  // @ts-expect-error it works :)
  combinedData = [...existingData, ...newStopData];

  existingDataCount = existingData.length;
}

const uniqueData = removeDuplicates(combinedData, (item) =>
  item.name.toLowerCase().trim(),
);

console.log(
  `Writing ${uniqueData.length} unique stops, ${uniqueData.length - existingDataCount} new stops to ${outputFile}`,
);

await Bun.write(outputFile, arrayToCsv(["name", "lat", "lon"], uniqueData));
