import type { GtfsStop, PartialGtfsStop } from "./gtfs/models";
import { stopId } from "./utils/id";
import { removeDuplicates } from "./utils/list";
import { queryStopByCisName } from "kaeru/client";

export function resolvePartialGtfsStops(stops: PartialGtfsStop[]): GtfsStop[] {
  return removeDuplicates(stops, (stop) => stop.cis_name).map(
    resolvePartialGtfsStop,
  );
}

export function resolvePartialGtfsStop(stop: PartialGtfsStop): GtfsStop {
  const kaeruStop = queryStopByCisName(stop.cis_name);
  if (!kaeruStop) {
    throw new Error(`Stop ${stop.cis_name} does not exist in Kaeru database`);
  }

  return {
    stop_id: stopId(),
    stop_name: kaeruStop.name,
    cis_name: stop.cis_name,
    stop_lat: kaeruStop.lat,
    stop_lon: kaeruStop.lon,
    zone_id: stop.zone_id,
    location_type: stop.location_type ?? 0,
  };
}
