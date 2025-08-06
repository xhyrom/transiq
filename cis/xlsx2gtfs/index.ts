import { ensureDirectory } from "@helpers/util";
import { Glob } from "bun";
import { exists, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { convertToGtfsAgency, convertXlsxToGtfs } from "./converter";
import { arrayToCsv, objectToCsv } from "./utils/csv";
import type { PartialGtfsStop } from "./gtfs/models";
import { resolvePartialGtfsStops } from "./resolver";

const dir = join(".tmp", "cp-sk");
if (!(await exists(dir))) {
  throw new Error(`Directory ${dir} does not exist. Please run scraper first.`);
}

const xlsxGlob = new Glob("*.xlsx");

for (const agencyFolderName of await readdir(dir)) {
  const agencyFolderPath = join(dir, agencyFolderName);

  if (!(await exists(agencyFolderPath))) {
    console.warn(`Agency folder ${agencyFolderPath} does not exist. Skipping.`);
    continue;
  }

  const gtfs = join(agencyFolderPath, "gtfs");
  await ensureDirectory(gtfs);

  const info = JSON.parse(
    await readFile(join(agencyFolderPath, "info.json"), "utf-8"),
  );

  console.log(`Processing agency: ${info.agency_short} (${agencyFolderName})`);

  const stops: PartialGtfsStop[] = [];

  for await (const route of xlsxGlob.scan(agencyFolderPath)) {
    const data = convertXlsxToGtfs(await readFile(join(agencyFolderPath, route)));

    stops.push(...data.stops);
    break;
  }

  await Bun.write(
    join(gtfs, "stops.txt"),
    arrayToCsv(["stop_id", "stop_name", "stop_lat", "stop_lon", "zone_id", "location_type"], resolvePartialGtfsStops(stops)),
  )

  await Bun.write(
    join(gtfs, "agency.txt"),
    objectToCsv(convertToGtfsAgency(info)),
  );

  break;
}
