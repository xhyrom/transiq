import type { GtfsStop, PartialGtfsStop } from "./gtfs/models";
import { stopId } from "./utils/id";
import { removeDuplicates } from "./utils/list";

export function resolvePartialGtfsStops(stops: PartialGtfsStop[]): GtfsStop[] {
  return removeDuplicates(stops, (stop) => stop.stop_name).map(resolvePartialGtfsStop);
}

export function resolvePartialGtfsStop(
  stop: PartialGtfsStop
): GtfsStop {
  return {
    stop_id: stopId(),
    stop_name: stop.stop_name,
    stop_lat: null, // TODO: solve
    stop_lon: null, // TODO: solve
    zone_id: stop.zone_id,
    location_type: stop.location_type ?? 0,
  };
}
