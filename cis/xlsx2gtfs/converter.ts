import type {
  GtfsAgency,
  GtfsCalendar,
  GtfsRoute,
  GtfsStop,
  GtfsStopTime,
  GtfsTrip,
  PartialGtfsStop,
} from "./gtfs/models";
import { agencyId, serviceId, tripId } from "./utils/id";
import * as XLSX from "xlsx";
import { cellColumn, filterCells, groupCells } from "./xlsx_helper";
import { formatTimeToGtfs } from "./utils/time";

enum Sheet {
  INBOUND = "Smer tam",
  OUTBOUND = "Smer späť",
  SIGN_EXPLANATION = "Vysvetlenie značiek",
  NOTES = "Poznámky",
}

enum StaticSign {
  WEEKDAYS_ONLY = "X",
  SATURDAY_ONLY = "6",
  SUNDAYS_AND_HOLIDAYS = "+",
  REROUTED = "~",
}

const STOP_COLUMN = "B";

export function collectStops(data: Buffer<ArrayBufferLike>): {
  stops: PartialGtfsStop[];
} {
  const workbook = XLSX.read(data, { type: "buffer" });

  const inboundSheet = workbook.Sheets[Sheet.INBOUND]! ?? [];
  const outboundSheet = workbook.Sheets[Sheet.OUTBOUND]! ?? [];

  return {
    stops: [
      ...convertToGtfsStop(inboundSheet),
      ...convertToGtfsStop(outboundSheet),
    ],
  };
}

export function collectRouteTripsCalenddarsAndStopTimes(
  agency: GtfsAgency,
  routeFileName: string,
  stops: Record<string, GtfsStop>,
  data: Buffer<ArrayBufferLike>,
): {
  route: GtfsRoute;
  trips: GtfsTrip[];
  calendars: GtfsCalendar[];
  stopTimes: GtfsStopTime[];
} {
  const workbook = XLSX.read(data, { type: "buffer" });

  const inboundSheet = workbook.Sheets[Sheet.INBOUND]! ?? [];
  const outboundSheet = workbook.Sheets[Sheet.OUTBOUND]! ?? [];
  const signExplanationSheet = workbook.Sheets[Sheet.SIGN_EXPLANATION]! ?? [];
  const notesSheet = workbook.Sheets[Sheet.NOTES]! ?? [];

  const route = convertToGtfsRoute(
    agency,
    routeFileName,
    signExplanationSheet || notesSheet || inboundSheet || outboundSheet,
  );

  const trips: GtfsTrip[] = [];
  const calendars: GtfsCalendar[] = [];
  const stopTimes: GtfsStopTime[] = [];

  for (const sheet of [inboundSheet, outboundSheet]) {
    const tripCells = filterCells(sheet, (key, cell) => {
      return (
        cell.t === "s" &&
        cell.v?.toString()?.startsWith("Spoj") === true &&
        Boolean(cell.v.toString().match(/^\s*Spoj\s+\d+/))
      );
    });

    for (const tripCellAddress of Object.keys(tripCells)) {
      const calendar: GtfsCalendar = {
        service_id: serviceId(),
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
        start_date: "",
        end_date: "",
      };

      const trip: GtfsTrip = {
        trip_id: tripId(),
        route_id: route.route_id,
        service_id: calendar.service_id,
      };

      const tripCellColumn = cellColumn(tripCellAddress);
      const signs = sheet[`${tripCellColumn}4`].v.trim().split(" ");

      console.log(signs);

      let rowIndex = 5;
      let stopSequence = 0;

      while (true) {
        const timeCell = sheet[`${tripCellColumn}${rowIndex}`];
        const stopCell = sheet[`${STOP_COLUMN}${rowIndex}`];
        const noteCell = sheet[`C${rowIndex}`];

        if (!timeCell || !timeCell.v) {
          break;
        }

        if (!stopCell || !stopCell.v) {
          rowIndex++;
          continue;
        }

        const stopName = String(stopCell.v).split(";")[0]!;
        const timeValue = timeCell.v;

        if (timeValue === StaticSign.REROUTED) {
          rowIndex++;
          continue;
        }

        const note = noteCell?.v ? String(noteCell.v).trim() : "";

        const stopId = Object.keys(stops).find(
          (id) =>
            stops[id]!.stop_name === stopName ||
            stops[id]!.cis_name === stopName,
        );

        if (!stopId) {
          console.warn(`Stop not found: ${stopName}`);
          rowIndex++;
          continue;
        }

        const isArrival = note.toLowerCase().includes("príjazd") || !note;
        const isDeparture = note.toLowerCase().includes("odjazd") || !note;

        const stopTime: Partial<GtfsStopTime> = {
          trip_id: trip.trip_id,
          stop_id: stopId,
          stop_sequence: stopSequence++,
        };

        if (isArrival) {
          stopTime.arrival_time = formatTimeToGtfs(timeValue);
        }

        if (isDeparture) {
          stopTime.departure_time = formatTimeToGtfs(timeValue);
        }

        stopTimes.push(stopTime as GtfsStopTime);
        rowIndex++;
      }

      trips.push(trip);
      calendars.push(calendar);
    }

    break;
  }

  return {
    route,
    trips,
    calendars,
    stopTimes,
  };
}

function convertToGtfsRoute(
  agency: GtfsAgency,
  route: string,
  sheet: XLSX.WorkSheet,
): GtfsRoute {
  const routeId = route.split("_")[0]!;
  const routeShortName = routeId.startsWith("L010")
    ? parseInt(routeId.slice(4))
    : parseInt(routeId.slice(1));

  return {
    route_id: routeId,
    agency_id: agency.agency_id,
    route_short_name: routeShortName,
    route_long_name: sheet.C1.v.trim().replace(/\s*\(.*?\)\s*/g, ""),
    route_type: 3,
  } satisfies GtfsRoute;
}

function convertToGtfsStop(sheet: XLSX.WorkSheet): PartialGtfsStop[] {
  let tpzColumn: string | undefined;
  const tpzCellKey = Object.entries(sheet).find(
    ([, cell]) => cell.t === "s" && cell.v === "TPZ",
  )?.[0];

  if (tpzCellKey) {
    tpzColumn = cellColumn(tpzCellKey);

    const dataCells = filterCells(sheet, (key, cell) => {
      const col = cellColumn(key);
      return (
        (col === STOP_COLUMN || col === tpzColumn) &&
        cell.v !== "TPZ" &&
        cell.v !== "Zastávka"
      );
    });

    const groupedCells = groupCells(dataCells);

    return groupedCells
      .filter((row) => row[STOP_COLUMN] && row[STOP_COLUMN].v)
      .map((row) => ({
        cis_name: (row[STOP_COLUMN]!.v as string).split(";")[0]!,
        zone_id:
          tpzColumn && row[tpzColumn]?.v
            ? String(row[tpzColumn]!.v).split(",")[0]
            : undefined,
        location_type: 0,
      }));
  } else {
    const stopCells = filterCells(sheet, (key, cell) => {
      return (
        cellColumn(key) === STOP_COLUMN &&
        cell.v !== "Zastávka" &&
        Boolean(cell.v)
      );
    });

    return Object.values(stopCells)
      .filter((cell) => Boolean(cell.v))
      .map((cell) => ({
        cis_name: (cell.v as string).split(";")[0]!,
        location_type: 0,
      }));
  }
}

export function convertToGtfsAgency(info: {
  agency_short: string;
  agency_full: string[];
}): GtfsAgency {
  const data: GtfsAgency = {
    agency_id: agencyId(),
    agency_name: info.agency_short,
    agency_timezone: "Europe/Bratislava",
    agency_lang: "sk",
  };

  const agencyFull = info.agency_full[0]!;

  // URL patterns
  const urlPatterns = [/www\.[^\s,]+/, /https?:\/\/[^\s]+/];

  for (const pattern of urlPatterns) {
    const match = agencyFull.match(pattern);
    if (match) {
      data.agency_url =
        pattern === urlPatterns[0] ? `https://${match[0]}` : match[0];
      break;
    }
  }

  // Phone number patterns
  const phonePatterns = [
    // Format: tel. 046/542 4433
    { regex: /tel\.\s+(\d+\/\d+\s*\d+)/i, group: 1 },

    // Format: tel. +420 606 619 913
    { regex: /tel\.\s+(\+?\d+(?:\s+\d+)*)/i, group: 1 },

    // Format: tel:+1234567890
    { regex: /tel:\+?(\d[\d\s-]*)/i, group: 1 },

    // Format: (+123 456 789)
    { regex: /\(\+\d{3}\s\d{3}\s\d{3}\)/i, group: 0 },

    // Additional pattern for area codes and other formats
    { regex: /tel\.\s+([0-9+\/\s-]+)/i, group: 1 },
  ];

  for (const { regex, group } of phonePatterns) {
    const match = agencyFull.match(regex);
    if (match) {
      data.agency_phone = match[group];
      break;
    }
  }

  return data;
}
