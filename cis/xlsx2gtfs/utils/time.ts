import type { GtfsStopTime } from "../gtfs/models";

export interface DateRange {
  from: string;
  to: string;
}

export function formatTimeToGtfs(timeStr: string | number): string {
  const timeString = String(timeStr);

  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    console.warn(`Unexpected time format: ${timeString}`);
    return "00:00:00";
  }

  const hours = timeMatch[1]!.trim();
  const minutes = timeMatch[2]!.trim();

  const paddedHours = hours.padStart(2, "0");
  const paddedMinutes = minutes.padStart(2, "0");

  return `${paddedHours}:${paddedMinutes}:00`;
}

export const FIRST_TWO_DIGITS_OF_YEAR = new Date()
  .getFullYear()
  .toString()
  .slice(0, 2);

export function parseDateToGtfs(dateStr: string): string {
  const [day, month, year] = dateStr.split(".");
  const fullYear = `${FIRST_TWO_DIGITS_OF_YEAR}${year}`;
  return `${fullYear}${month!.padStart(2, "0")}${day!.padStart(2, "0")}`;
}

export function extractDateRanges(explanation: string): DateRange[] {
  const dateRanges: DateRange[] = [];

  const rangeRegex =
    /od\s+(\d{1,2}\.\d{1,2}\.\d{1,2})\s+do\s+(\d{1,2}\.\d{1,2}\.\d{1,2})/g;
  let rangeMatch;

  while ((rangeMatch = rangeRegex.exec(explanation)) !== null) {
    dateRanges.push({
      from: parseDateToGtfs(rangeMatch[1]!),
      to: parseDateToGtfs(rangeMatch[2]!),
    });
  }

  let tempExplanation = explanation.replace(rangeRegex, "");

  const singleDateRegex = /(\d{1,2}\.\d{1,2}\.\d{2,4})/g;
  let dateMatch;

  while ((dateMatch = singleDateRegex.exec(tempExplanation)) !== null) {
    const date = parseDateToGtfs(dateMatch[1]!);
    dateRanges.push({
      from: date,
      to: date,
    });
  }

  return dateRanges;
}

export function adjustTimesForOvernight(
  stopTimes: GtfsStopTime[],
): GtfsStopTime[] {
  if (stopTimes.length === 0) return stopTimes;

  const tripGroups: Record<string, GtfsStopTime[]> = {};
  for (const stopTime of stopTimes) {
    if (!tripGroups[stopTime.trip_id]) {
      tripGroups[stopTime.trip_id] = [];
    }

    tripGroups[stopTime.trip_id]!.push(stopTime);
  }

  for (const tripStopTimes of Object.values(tripGroups)) {
    tripStopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);

    let lastTimeMinutes = -1;
    let dayOffset = 0;

    for (const stopTime of tripStopTimes) {
      if (stopTime.arrival_time) {
        const arrivalMinutes = timeToMinutes(stopTime.arrival_time);

        if (
          arrivalMinutes < lastTimeMinutes &&
          lastTimeMinutes - arrivalMinutes > 60
        ) {
          dayOffset += 24;
        }

        if (dayOffset > 0) {
          stopTime.arrival_time = minutesToTime(
            arrivalMinutes + dayOffset * 60,
          );
        }

        lastTimeMinutes = arrivalMinutes;
      }

      if (stopTime.departure_time) {
        const departureMinutes = timeToMinutes(stopTime.departure_time);

        if (
          departureMinutes < lastTimeMinutes &&
          lastTimeMinutes - departureMinutes > 60
        ) {
          dayOffset += 24;
        }

        if (dayOffset > 0) {
          stopTime.departure_time = minutesToTime(
            departureMinutes + dayOffset * 60,
          );
        }

        lastTimeMinutes = departureMinutes;
      }
    }
  }

  return stopTimes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes, _] = time.split(":").map(Number);
  return hours! * 60 + minutes!;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
}
