// dump stations to .transiq/kaeru.tsv

import { Glob } from "bun";
import { exists, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseStops } from "@cis/xlsx2gtfs/parser";
import { arrayToCsv } from "@cis/xlsx2gtfs/utils/csv";
import { parse as parseCsv } from "csv-parse/sync";
import type { PartialGtfsStop } from "@cis/xlsx2gtfs/gtfs/models";
import { resolvePartialGtfsStops } from "@cis/xlsx2gtfs/resolver";
import { removeDuplicates } from "@cis/xlsx2gtfs/utils/list";

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
  await mkdir(gtfs, { recursive: true });

  for await (const route of xlsxGlob.scan(agencyFolderPath)) {
    stops.push(...parseStops(await readFile(join(agencyFolderPath, route))));
  }
}

const newStopData = resolvePartialGtfsStops(stops).map((stop) => ({
  cis_name: stop.stop_name,
  name: null,
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
  item.cis_name.toLowerCase().trim(),
);

console.log(
  `Writing ${uniqueData.length} unique stops, ${uniqueData.length - existingDataCount} new stops to ${outputFile}`,
);

await Bun.write(
  outputFile,
  arrayToCsv(["cis_name", "name", "lat", "lon"], uniqueData),
);
