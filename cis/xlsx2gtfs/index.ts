import { ensureDirectory } from "@helpers/util";
import { Glob } from "bun";
import { exists, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { convertToGtfsAgency, convertXlsxToGtfs } from "./converter";
import { arrayToCsv, objectToCsv } from "./utils/csv";
import type { GtfsAgency, GtfsRoute, PartialGtfsStop } from "./gtfs/models";
import { resolvePartialGtfsStops } from "./resolver";

const dir = join(".tmp", "cp-sk");
if (!(await exists(dir))) {
  throw new Error(`Directory ${dir} does not exist. Please run scraper first.`);
}

const xlsxGlob = new Glob("*.xlsx");

for (const agencyFolderName of await readdir(dir)) {
  const agencyFolderPath = join(dir, agencyFolderName);
  const gtfs = join(agencyFolderPath, "gtfs");
  await ensureDirectory(gtfs);

  const info = JSON.parse(
    await readFile(join(agencyFolderPath, "info.json"), "utf-8"),
  );

  console.log(`Processing agency: ${info.agency_short} (${agencyFolderName})`);

  const agency: GtfsAgency = convertToGtfsAgency(info);
  const stops: PartialGtfsStop[] = [];
  const routes: GtfsRoute[] = [];

  for await (const route of xlsxGlob.scan(agencyFolderPath)) {
    const data = convertXlsxToGtfs(
      agency,
      route,
      await readFile(join(agencyFolderPath, route)),
    );

    stops.push(...data.stops);
    routes.push(data.route);
  }

  await Bun.write(
    join(gtfs, "stops.txt"),
    arrayToCsv(
      [
        "stop_id",
        "stop_name",
        "stop_lat",
        "stop_lon",
        "zone_id",
        "location_type",
      ],
      resolvePartialGtfsStops(stops),
    ),
  );

  await Bun.write(
    join(gtfs, "routes.txt"),
    arrayToCsv(
      [
        "route_id",
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_type",
        "route_color",
        "route_text_color",
      ],
      routes,
    ),
  );

  await Bun.write(join(gtfs, "agency.txt"), objectToCsv(agency));

  break;
}
