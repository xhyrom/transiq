import gtfsToHtml from "gtfs-to-html";
import { join } from "node:path";
import { glob, mkdir } from "node:fs/promises";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec);

const gtfs = await Array.fromAsync(glob(join("gtfs", "**/*.zip")));

await mkdir(join(".tmp", "tidy-gtfs"), { recursive: true });

for (const gtf of gtfs) {
  if (gtf.includes("dpb")) continue;
  
  const agencyKey = gtf
    .split("/")
    .pop()
    .replace(/\.zip$/, "");
  const tidyGtfPath = join(".tmp", "tidy-gtfs", gtf.split("/").pop());

  console.log(`Tidy GTFS: ${gtf} -> ${tidyGtfPath}`);
  await exec(`gtfstidy -SCRmTcdsOeD ${gtf} -o ${tidyGtfPath}`);

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
