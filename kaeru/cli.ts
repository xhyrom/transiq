import { join } from "node:path";
import { exists } from "node:fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { queryGeocodeMapy, queryGeocodeNominatim } from "./query";
import { log } from "./logger";
import type { KaeruCsvItem } from "./types";

const csvPath = join(".transiq", "kaeru.csv");

async function main() {
  const args = process.argv.slice(2);

  let provider = "mapycz";
  let cisName = "";
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--help":
      case "-h":
        showHelp = true;
        break;
      case "--provider":
      case "-p":
        provider = args[++i]?.toLowerCase();
        if (provider !== "mapycz" && provider !== "osm") {
          console.error("Error: Provider must be 'mapycz' or 'osm'");
          return 1;
        }
        break;
      default:
        if (!cisName) {
          cisName = args[i];
        } else {
          console.error(`Unknown argument: ${args[i]}`);
          showHelp = true;
        }
    }
  }

  if (showHelp || !cisName) {
    console.log(`
Kaeru Stop Fix CLI - Fix bus stop coordinates

USAGE:
  bun run cli.ts <CIS_NAME> [OPTIONS]

ARGUMENTS:
  <CIS_NAME>       The CIS name of the bus stop to fix (e.g. "Plzeň,,CAN;H WC MHD")

OPTIONS:
  -p, --provider   Data provider to use [mapycz, osm] (default: mapycz)
  -h, --help       Show this help message

EXAMPLES:
  bun run cli.ts "Plzeň,,CAN;H WC MHD"
  bun run cli.ts "Praha,,Hlavní nádraží;U" --provider osm
    `);
    return !cisName ? 1 : 0;
  }

  if (!(await exists(csvPath))) {
    console.error(
      `Error: File ${csvPath} does not exist. Please run dump-stations first.`,
    );
    return 1;
  }

  const content = await Bun.file(csvPath).text();
  const data = parseCsv<KaeruCsvItem>(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: true,
  });

  const stationIndex = data.findIndex((s) => s.cis_name === cisName);
  if (stationIndex === -1) {
    console.error(`Error: Station "${cisName}" not found in the database`);
    return 1;
  }

  const station = data[stationIndex]!;
  console.log(`Found station: ${station.cis_name}`);
  console.log(
    `Current data: name=${station.name || "null"}, lat=${station.lat || "null"}, lon=${station.lon || "null"}`,
  );

  try {
    let items;
    if (provider === "osm") {
      console.log("Querying OpenStreetMap...");
      const res = await queryGeocodeNominatim({
        query: cisName
          .replace("aut.st.", "aut.stanica")
          .replace("žel.st.", "žel.stanica"),
      });
      items = res.items.filter((item) => item.type === "bus_stop");
    } else {
      console.log("Querying Mapy.cz...");
      const res = await queryGeocodeMapy({
        query: `zastávka ${cisName.replace("aut.st.", "aut.stanica").replace("žel.st.", "žel.stanica")}`,
      });

      items = res.items.filter(
        (item) =>
          item.type === "poi" &&
          (item.label === "Zastávka autobusu" ||
            item.label.includes("Autobusová stanica") ||
            item.label.toLowerCase().includes("autobus")),
      );
    }

    if (items.length === 0) {
      console.error(`Error: No matching bus stops found for "${cisName}"`);
      return 1;
    }

    console.log("\nFound matches:");
    items.forEach((item, idx) => {
      console.log(
        `[${idx + 1}] ${item.name} (${item.position.lat}, ${item.position.lon}) - ${item.label || item.location}`,
      );
    });

    process.stdout.write(
      "\nSelect option (1-" + items.length + ") or 0 to cancel: ",
    );
    const answer = await new Promise<string>((resolve) => {
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim());
      });
    });

    const selection = parseInt(answer, 10);
    if (isNaN(selection) || selection < 0 || selection > items.length) {
      console.error("Invalid selection");
      return 1;
    }

    if (selection === 0) {
      console.log("Operation cancelled");
      return 0;
    }

    const selected = items[selection - 1]!;

    station.name = selected.name;
    station.lat = selected.position.lat;
    station.lon = selected.position.lon;

    const headers = ["cis_name", "name", "lat", "lon"];
    const csvContent = stringifyCsv([
      headers,
      ...data.map((item) =>
        headers.map((key) => item[key as keyof KaeruCsvItem]),
      ),
    ]);

    await Bun.write(csvPath, csvContent);

    console.log(`\nSuccess! Station "${cisName}" updated:`);
    console.log(
      `New data: name=${station.name}, lat=${station.lat}, lon=${station.lon}`,
    );

    log(
      "INFO",
      `[CLI] Updated stop: ${station.cis_name} → ${station.name} (${station.lat}, ${station.lon})`,
    );

    return 0;
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

process.exit(await main());
