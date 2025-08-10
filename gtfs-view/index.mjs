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
  if (gtf.endsWith(".lite.zip")) continue;

  const agencyKey = gtf
    .split("/")
    .pop()
    .replace(/\.zip$/, "");
  const tidyGtfPath = join(".tmp", "tidy-gtfs", agencyKey);

  console.log(`Tidy GTFS: ${gtf} -> ${tidyGtfPath}`);
  await exec(`gtfsclean -SCRmTcdsOeD ${gtf} -o ${tidyGtfPath}`);

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
    showStopCity: false,
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
      :root {
        --primary-color: #0066cc;
        --primary-hover: #004d99;
        --secondary-color: #34c759;
        --secondary-hover: #28a745;
        --text-color: #333;
        --text-light: #666;
        --border-color: #ddd;
      }

      :host,
      html {
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
        font-family:
          ui-sans-serif,
          system-ui,
          sans-serif,
          Apple Color Emoji,
          Segoe UI Emoji,
          Segoe UI Symbol,
          Noto Color Emoji;
        font-feature-settings: normal;
        font-variation-settings: normal;
        -moz-tab-size: 4;
        -o-tab-size: 4;
        tab-size: 4;
        -webkit-tap-highlight-color: transparent;
      }

      body {
        margin: 0;
        padding: 0;
        color: var(--text-color);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background-image: radial-gradient(#e6e6d1 1px, #f9f9f1 0);
        background-size: 15px 15px;
      }

      h1 {
        text-align: center;
        margin-bottom: 30px;
        color: var(--text-color);
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .agency-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .agency-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 10px;
        color: #222;
      }

      .agency-info {
        font-size: 0.9rem;
        color: var(--text-light);
        margin-bottom: 15px;
        flex-grow: 1;
      }

      .button-group {
        display: flex;
        gap: 10px;
        margin-top: auto;
      }

      .view-button,
      .download-button {
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
        background-color: var(--primary-color);
        color: white;
      }

      .download-button {
        background-color: var(--secondary-color);
        color: white;
      }

      .view-button:hover {
        background-color: var(--primary-hover);
      }

      .download-button:hover {
        background-color: var(--secondary-hover);
      }

      .agency-count {
        text-align: center;
        color: var(--text-light);
        margin-bottom: 20px;
        font-size: 1.1rem;
      }

      header {
        margin-bottom: 40px;
        text-align: center;
      }

      .subtitle {
        color: var(--text-light);
        font-size: 1.2rem;
        margin-top: -15px;
      }

      footer {
        display: flex;
        height: 6rem;
        width: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-image: radial-gradient(#d5d5b8 1px, #ecece2 0);
        background-size: 15px 15px;
        margin-top: auto;
      }

      p {
        margin: 0;
      }

      .text-primary {
        color: var(--text-light);
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .font-bold {
        font-weight: bold;
      }

      .text-primary a {
        color: #000;
        text-decoration: none;
        font-weight: bold;
      }

      .text-primary a:hover {
        text-decoration: none;
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
                        View Schedules
                    </a>
                    <a href="/gtfs/${agency.agency_lang}/${agency.agency_key}.zip" class="download-button" download>
                        Download GTFS
                    </a>
                </div>
            </div>
        `,
          )
          .join("")}
    </div>

    <footer>
        <p class="text-primary">
            Made with ❤️ by
            <a class="hover:text-primaryLight font-bold" href="https://xhyrom.dev" target="_blank" rel="noopener noreferrer">
                @xHyroM
            </a>
        </p>
        <p class="text-primary">
            <a class="hover:text-primaryLight font-bold" href="https://github.com/xhyrom/transiq" target="_blank" rel="noopener noreferrer">
                View Source
            </a>
        </p>
    </footer>
</body>
</html>
`;

await writeFile(
  join(".tmp", "build", "gtfs-view", "index.html"),
  indexHtmlContent,
);

console.log("Generated main index.html with agency list");
