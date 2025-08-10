import { Glob } from "bun";
import { exists, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { arrayToCsv, objectToCsv } from "./utils/csv";
import type {
  GtfsAgency,
  GtfsCalendar,
  GtfsCalendarDate,
  GtfsRoute,
  GtfsStop,
  GtfsStopTime,
  GtfsTrip,
  PartialGtfsStop,
} from "./gtfs/models";
import { resolvePartialGtfsStops } from "./resolver";
import {
  parseAgency,
  parseRouteTripsCalendarsAndStopTimes,
  parseStops,
} from "./parser";
import { resetIds } from "./utils/id";

const dir = join(".tmp", "cp-sk");
if (!(await exists(dir))) {
  throw new Error(`Directory ${dir} does not exist. Please run scraper first.`);
}

const xlsxGlob = new Glob("*.xlsx");

for (const agencyFolderName of (await readdir(dir)).sort()) {
  const agencyFolderPath = join(dir, agencyFolderName);
  const gtfs = join(agencyFolderPath, "gtfs");
  await mkdir(gtfs, { recursive: true });

  const info = JSON.parse(
    await readFile(join(agencyFolderPath, "info.json"), "utf-8"),
  );

  console.log(`Processing agency: ${info.agency_short} (${agencyFolderName})`);

  const agency: GtfsAgency = parseAgency(info);
  const partialStops: PartialGtfsStop[] = [];
  const routes: GtfsRoute[] = [];
  const trips: GtfsTrip[] = [];
  const calendars: GtfsCalendar[] = [];
  const calendarDates: GtfsCalendarDate[] = [];
  const stopTimes: GtfsStopTime[] = [];

  const xlsxFiles = (
    await Array.fromAsync(xlsxGlob.scan(agencyFolderPath))
  ).sort();
  for await (const route of xlsxFiles) {
    partialStops.push(
      ...parseStops(await readFile(join(agencyFolderPath, route))),
    );
  }

  const stops: GtfsStop[] = resolvePartialGtfsStops(partialStops);
  const stopsByCisName: Record<string, GtfsStop> = stops.reduce(
    (acc, stop) => {
      acc[stop.metadata.cis_name] = stop;
      return acc;
    },
    {} as Record<string, GtfsStop>,
  );

  for await (const route of xlsxFiles) {
    console.log(`Processing route: ${route}`);

    const data = parseRouteTripsCalendarsAndStopTimes(
      agency,
      route,
      stopsByCisName,
      await readFile(join(agencyFolderPath, route)),
    );

    routes.push(data.route);
    trips.push(...data.trips);
    calendars.push(...data.calendars);
    calendarDates.push(...data.calendarDates);
    stopTimes.push(...data.stopTimes);
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
      stops,
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

  await Bun.write(
    join(gtfs, "trips.txt"),
    arrayToCsv(
      [
        "trip_id",
        "route_id",
        "service_id",
        "trip_headsign",
        "direction_id",
        "wheelchair_accessible",
        "bikes_allowed",
      ],
      trips,
    ),
  );

  await Bun.write(
    join(gtfs, "calendar.txt"),
    arrayToCsv(
      [
        "service_id",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_date",
        "end_date",
      ],
      calendars,
    ),
  );

  await Bun.write(
    join(gtfs, "calendar_dates.txt"),
    arrayToCsv(["service_id", "date", "exception_type"], calendarDates),
  );

  await Bun.write(
    join(gtfs, "stop_times.txt"),
    arrayToCsv(
      [
        "trip_id",
        "stop_id",
        "stop_sequence",
        "arrival_time",
        "departure_time",
        "pickup_type",
        "drop_off_type",
      ],
      stopTimes,
    ),
  );

  await Bun.write(join(gtfs, "agency.txt"), objectToCsv(agency));

  resetIds();
  console.log(
    `Timetable conversion to GTFS format completed for ${agency.agency_name} (${agencyFolderName})`,
  );
}
