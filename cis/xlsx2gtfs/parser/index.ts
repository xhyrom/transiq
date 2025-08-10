import { read } from "xlsx";
import {
  GtfsCalendarDateException,
  GtfsStopAccess,
  GtfsTripAccessibility,
  GtfsTripDirection,
  type GtfsAgency,
  type GtfsCalendar,
  type GtfsCalendarDate,
  type GtfsRoute,
  type GtfsStop,
  type GtfsStopTime,
  type GtfsTrip,
} from "../gtfs/models";
import { parseRoute } from "./route";
import { serviceId, tripId } from "../utils/id";
import { cellColumn, filterCells } from "../xlsx_helper";
import {
  adjustTimesForOvernight,
  formatTimeToGtfs,
  type DateRange,
} from "../utils/time";
import {
  parseSignExplanations,
  SignType,
  StaticSign,
  type SignExplanation,
} from "./sign";
import { parseCalendarRange } from "./calendar";
import { HOLIDAYS } from "../utils/holidays";

export const STOP_COLUMN = "B";

export enum Sheet {
  INBOUND = "Smer tam",
  OUTBOUND = "Smer späť",
  SIGN_EXPLANATION = "Vysvetlenie značiek",
  NOTES = "Poznámky",
}

export * from "./agency";
export * from "./calendar";
export * from "./route";
export * from "./sign";
export * from "./stop";

export function parseRouteTripsCalendarsAndStopTimes(
  agency: GtfsAgency,
  routeFileName: string,
  stops: Record<string, GtfsStop>,
  data: Buffer<ArrayBufferLike>,
): {
  route: GtfsRoute;
  trips: GtfsTrip[];
  calendars: GtfsCalendar[];
  calendarDates: GtfsCalendarDate[];
  stopTimes: GtfsStopTime[];
} {
  const workbook = read(data, { type: "buffer" });

  const inboundSheet = workbook.Sheets[Sheet.INBOUND];
  const outboundSheet = workbook.Sheets[Sheet.OUTBOUND];
  const signExplanationSheet = workbook.Sheets[Sheet.SIGN_EXPLANATION]!;
  const notesSheet = workbook.Sheets[Sheet.NOTES];

  const signExplanations = parseSignExplanations(signExplanationSheet).reduce(
    (map, item) => {
      map[item.sign] = item;
      return map;
    },
    {} as Record<string, SignExplanation>,
  );

  const route = parseRoute(
    agency,
    routeFileName,
    signExplanationSheet || notesSheet || inboundSheet || outboundSheet,
  );

  const trips: GtfsTrip[] = [];
  const calendars: GtfsCalendar[] = [];
  const calendarDates: GtfsCalendarDate[] = [];
  const stopTimes: GtfsStopTime[] = [];

  for (const [sheet, tripDirection] of [
    [inboundSheet, GtfsTripDirection.INBOUND],
    [outboundSheet, GtfsTripDirection.OUTBOUND],
  ] as const) {
    if (!sheet) continue;

    const tripCells = filterCells(sheet, (key, cell) => {
      return (
        cell.t === "s" &&
        cell.v?.toString()?.startsWith("Spoj") === true &&
        Boolean(cell.v.toString().match(/^\s*Spoj\s+\d+/))
      );
    });

    const calendarRange = parseCalendarRange(sheet.A2.v)!;

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
        start_date: Number(calendarRange.from),
        end_date: Number(calendarRange.to),
      };

      const tripCellColumn = cellColumn(tripCellAddress);
      const signs: string[] = sheet[`${tripCellColumn}4`].v.trim().split(" ");

      const directions = route.route_long_name.split("-").map((s) => s.trim());
      const headSign =
        tripDirection === GtfsTripDirection.INBOUND
          ? directions[directions.length - 1]!
          : directions[0]!;

      const trip: GtfsTrip = {
        trip_id: tripId(),
        route_id: route.route_id,
        service_id: calendar.service_id,
        trip_headsign: headSign,
        direction_id: tripDirection,
        wheelchair_accessible: signs.includes(StaticSign.WHEELCHAIR_ACCESSIBLE)
          ? GtfsTripAccessibility.ACCESSIBLE
          : GtfsTripAccessibility.NOT_ACCESSIBLE,
        bikes_allowed: GtfsTripAccessibility.NO_INFORMATION,
      };

      if (signs.includes(StaticSign.WEEKDAYS_ONLY)) {
        calendar.monday = 1;
        calendar.tuesday = 1;
        calendar.wednesday = 1;
        calendar.thursday = 1;
        calendar.friday = 1;
      }

      if (signs.includes(StaticSign.MONDAY_ONLY)) calendar.monday = 1;
      if (signs.includes(StaticSign.TUESDAY_ONLY)) calendar.tuesday = 1;
      if (signs.includes(StaticSign.WEDNESDAY_ONLY)) calendar.wednesday = 1;
      if (signs.includes(StaticSign.THURSDAY_ONLY)) calendar.thursday = 1;
      if (signs.includes(StaticSign.FRIDAY_ONLY)) calendar.friday = 1;
      if (signs.includes(StaticSign.SATURDAY_ONLY)) calendar.saturday = 1;
      if (signs.includes(StaticSign.SUNDAY_ONLY)) calendar.sunday = 1;

      if (signs.includes(StaticSign.SUNDAYS_AND_HOLIDAYS)) {
        calendar.sunday = 1;

        for (const holiday of HOLIDAYS) {
          if (holiday >= calendarRange.from && holiday <= calendarRange.to) {
            calendarDates.push({
              service_id: calendar.service_id,
              date: Number(holiday),
              exception_type: GtfsCalendarDateException.SERVICE_ADDED,
            });
          }
        }
      } else {
        for (const holiday of HOLIDAYS) {
          if (holiday >= calendarRange.from && holiday <= calendarRange.to) {
            calendarDates.push({
              service_id: calendar.service_id,
              date: Number(holiday),
              exception_type: GtfsCalendarDateException.SERVICE_REMOVED,
            });
          }
        }
      }

      for (const sign of signs) {
        const explanation = signExplanations[sign];
        if (!explanation) continue;

        if (
          explanation.type === SignType.NOT_OPERATES_ON &&
          explanation.dateRanges
        ) {
          for (const range of explanation.dateRanges) {
            addCalendarDatesForRange(
              calendarDates,
              calendar.service_id,
              range,
              GtfsCalendarDateException.SERVICE_REMOVED,
            );
          }
        } else if (
          explanation.type === SignType.OPERATES_ON &&
          explanation.dateRanges
        ) {
          calendar.monday = 0;
          calendar.tuesday = 0;
          calendar.wednesday = 0;
          calendar.thursday = 0;
          calendar.friday = 0;
          calendar.saturday = 0;
          calendar.sunday = 0;

          for (const range of explanation.dateRanges) {
            addCalendarDatesForRange(
              calendarDates,
              calendar.service_id,
              range,
              GtfsCalendarDateException.SERVICE_ADDED,
            );
          }
        }
      }

      let rowIndex = 5;
      let stopSequence = 1;

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

        const stopName = stopCell.v.split(";")[0]!;
        const stopSigns = stopCell.v.split(";")?.[1]?.split(" ") || [];
        const timeValue = timeCell.v;

        if (
          timeValue === StaticSign.REROUTED ||
          timeValue === StaticSign.PASSED_STOP ||
          !timeValue.includes(":")
        ) {
          rowIndex++;
          continue;
        }

        const note = noteCell?.v ? String(noteCell.v).trim() : "";

        const stopId = Object.values(stops).find(
          (stop) => stop.metadata.cis_name === stopName,
        )?.stop_id;

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
          pickup_type: stopSigns.includes(StaticSign.BORDER_CONTROL_ONLY)
            ? GtfsStopAccess.NONE
            : timeValue.includes(StaticSign.EXIT_ONLY_STOP)
              ? GtfsStopAccess.NONE
              : GtfsStopAccess.REGULAR,
          drop_off_type: stopSigns.includes(StaticSign.BORDER_CONTROL_ONLY)
            ? GtfsStopAccess.NONE
            : timeValue.includes(StaticSign.ENTRY_ONLY_STOP)
              ? GtfsStopAccess.NONE
              : GtfsStopAccess.REGULAR,
        };

        if (isArrival) {
          stopTime.arrival_time = formatTimeToGtfs(timeValue);
        }

        if (isDeparture) {
          stopTime.departure_time = formatTimeToGtfs(timeValue);
        }

        if (!isArrival && isDeparture) {
          stopTime.arrival_time = stopTime.departure_time;
        }

        if (!isDeparture && isArrival) {
          stopTime.departure_time = stopTime.arrival_time;
        }

        stopTimes.push(stopTime as GtfsStopTime);
        rowIndex++;
      }

      trips.push(trip);
      calendars.push(calendar);
    }
  }

  return {
    route,
    trips,
    calendars,
    calendarDates,
    stopTimes: adjustTimesForOvernight(stopTimes),
  };
}

function addCalendarDatesForRange(
  calendarDates: GtfsCalendarDate[],
  serviceId: string,
  range: DateRange,
  exceptionType: GtfsCalendarDateException,
) {
  const fromDate = new Date(
    parseInt(range.from.substring(0, 4)),
    parseInt(range.from.substring(4, 6)) - 1,
    parseInt(range.from.substring(6, 8)),
  );

  const toDate = new Date(
    parseInt(range.to.substring(0, 4)),
    parseInt(range.to.substring(4, 6)) - 1,
    parseInt(range.to.substring(6, 8)),
  );

  for (
    let date = new Date(fromDate);
    date <= toDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dateString =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");

    calendarDates.push({
      service_id: serviceId,
      date: Number(dateString),
      exception_type: exceptionType,
    });
  }
}
