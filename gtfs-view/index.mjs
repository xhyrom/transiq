import gtfsToHtml from "gtfs-to-html";
import { join } from "node:path";
import { glob, mkdir, readFile, writeFile } from "node:fs/promises";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import { parse } from "csv-parse/sync";

const exec = promisify(_exec);

const gtfs = await Array.fromAsync(glob(join("gtfs", "**/*.zip")));

await mkdir(join(".tmp", "tidy-gtfs"), { recursive: true });

const agencies = [];

for (const gtf of gtfs) {
  if (gtf.includes("dpb")) continue;

  const agencyKey = gtf
    .split("/")
    .pop()
    .replace(/\.zip$/, "");
  const tidyGtfPath = join(".tmp", "tidy-gtfs", agencyKey);

  console.log(`Tidy GTFS: ${gtf} -> ${tidyGtfPath}`);
  await exec(`gtfstidy -SCRmTcdsOeD ${gtf} -o ${tidyGtfPath}`);

  const agencyCsv = parse(
    await readFile(join(tidyGtfPath, "agency.txt"), "utf8"),
    {
      columns: true,
      skip_empty_lines: true,
    },
  );

  agencies.push({
    agency_key: agencyKey,
    ...agencyCsv[0],
  });

  await gtfsToHtml({
    agencies: [
      {
        agencyKey: agencyKey,
        path: tidyGtfPath,
      },
    ],
    allowEmptyTimetables: false,
    beautify: false,
    coordinatePrecision: 5,
    dateFormat: "MMM D, YYYY",
    daysShortStrings: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    daysStrings: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    defaultOrientation: "vertical",
    interpolatedStopSymbol: "•",
    interpolatedStopText: "Estimated time of arrival",
    linkStopUrls: false,
    mapStyleUrl: "https://tiles.openfreemap.org/styles/liberty",
    menuType: "jump",
    noDropoffSymbol: "‡",
    noDropoffText: "No drop off available",
    noHead: false,
    noPickupSymbol: "**",
    noPickupText: "No pickup available",
    noServiceSymbol: "—",
    noServiceText: "No service at this stop",
    outputFormat: "html",
    overwriteExistingFiles: true,
    outputPath: `.tmp/build/gtfs-view/${agencyKey}`,
    requestDropoffSymbol: "†",
    requestDropoffText: "Must request drop off",
    requestPickupSymbol: "***",
    requestPickupText: "Request stop - call for pickup",
    serviceNotProvidedOnText: "Service not provided on",
    serviceProvidedOnText: "Service provided on",
    showArrivalOnDifference: 0.2,
    showCalendarExceptions: true,
    showDuplicateTrips: false,
    showMap: true,
    showOnlyTimepoint: true,
    showRouteTitle: true,
    showStopCity: true,
    showStopDescription: true,
    showStoptimesForRequestStops: true,
    skipImport: false,
    sortingAlgorithm: "common",
    timeFormat: "h:mma",
    useParentStation: true,
    ignoreDuplicates: true,
    verbose: true,
    zipOutput: false,
  });
}

const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transit GTFS Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f7;
            color: #333;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
            font-size: 2.5rem;
        }
        .agencies-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 10px;
        }
        .agency-card {
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .agency-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .agency-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #222;
        }
        .agency-info {
            font-size: 0.9rem;
            color: #555;
            margin-bottom: 15px;
            flex-grow: 1;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: auto;
        }
        .view-button, .download-button {
            padding: 10px 16px;
            border-radius: 6px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 0.9rem;
            text-align: center;
            flex: 1;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .view-button {
            background-color: #0066cc;
            color: white;
        }
        .download-button {
            background-color: #34c759;
            color: white;
        }
        .view-button:hover {
            background-color: #004d99;
        }
        .download-button:hover {
            background-color: #28a745;
        }
        .agency-count {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }
        header {
            margin-bottom: 40px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            font-size: 1.2rem;
            margin-top: -15px;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9rem;
        }
        .icon {
            margin-right: 6px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Transit GTFS Viewer</h1>
        <p class="subtitle">Interactive transit schedule and map viewer</p>
    </header>

    <p class="agency-count">${agencies.length} transit ${agencies.length === 1 ? "agency" : "agencies"} available</p>

    <div class="agencies-container">
        ${agencies
          .map(
            (agency) => `
            <div class="agency-card">
                <div class="agency-name">${agency.agency_name || agency.agency_key}</div>
                <div class="agency-info">
                    ${agency.agency_url ? `<div>Website: <a href="${agency.agency_url}" target="_blank">${agency.agency_url}</a></div>` : ""}
                    ${agency.agency_phone ? `<div>Phone: ${agency.agency_phone}</div>` : ""}
                    ${agency.agency_timezone ? `<div>Timezone: ${agency.agency_timezone}</div>` : ""}
                </div>
                <div class="button-group">
                    <a href="./${agency.agency_key}/" class="view-button">
                        <span class="icon">📊</span> View Schedules
                    </a>
                    <a href="/gtfs/${agency.agency_lang}/${agency.agency_key}.zip" class="download-button" download>
                        <span class="icon">💾</span> Download GTFS
                    </a>
                </div>
            </div>
        `,
          )
          .join("")}
    </div>

    <footer>
        <p>GTFS data visualized with gtfs-to-html | Data updates automatically at midnight UTC</p>
    </footer>
</body>
</html>
`;

await writeFile(
  join(".tmp", "build", "gtfs-view", "index.html"),
  indexHtmlContent,
);

console.log("Generated main index.html with agency list");
