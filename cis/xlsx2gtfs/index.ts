import { ensureDirectory } from "@helpers/util";
import { Glob } from "bun";
import { exists, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { convertToGtfsAgency } from "./converter";
import { objectToCsv } from "./gtfs/util";

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

  for await (const route of xlsxGlob.scan(agencyFolderPath)) {
    //console.log(route);
  }

  await Bun.write(
    join(gtfs, "agency.txt"),
    objectToCsv(convertToGtfsAgency(info)),
  );
}
