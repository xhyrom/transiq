import type { GtfsStop, PartialGtfsStop } from "./gtfs/models";
import { stopId } from "./utils/id";
import { removeDuplicates } from "./utils/list";
import {
  findNearestDistricts,
  queryAllStopsByCisName,
} from "@transiq/kaeru/client";

const routeContextCache = {
  lastResolvedStops: [] as GtfsStop[],
};

export function resolvePartialGtfsStops(stops: PartialGtfsStop[]): GtfsStop[] {
  routeContextCache.lastResolvedStops = [];

  return removeDuplicates(stops, (stop) => stop.metadata.cis_name).map(
    resolvePartialGtfsStop,
  );
}

export function resolvePartialGtfsStop(stop: PartialGtfsStop): GtfsStop {
  const matches = queryAllStopsByCisName(stop.metadata.cis_name);

  if (matches.length === 0) {
    console.warn(
      `Stop ${stop.metadata.cis_name} not found in Kaeru database, falling back to cis_name and -1 for coordinates.`,
    );

    return {
      stop_id: stopId(stop.metadata.cis_name),
      stop_name: stop.metadata.cis_name,
      stop_lat: -1,
      stop_lon: -1,
      zone_id: stop.zone_id,
      location_type: stop.location_type ?? 0,
      metadata: {
        cis_name: stop.metadata.cis_name,
      },
    };
  }

  if (matches.length === 1) {
    console.log(`One match found for stop ${stop.metadata.cis_name}`);

    const kaeruStop = matches[0]!;
    const resolved: GtfsStop = {
      stop_id: stopId(stop.metadata.cis_name),
      stop_name: kaeruStop?.name || stop.metadata.cis_name,
      stop_lat: kaeruStop?.lat || -1,
      stop_lon: kaeruStop?.lon || -1,
      zone_id: stop.zone_id,
      location_type: stop.location_type ?? 0,
      metadata: {
        cis_name: stop.metadata.cis_name,
        district: kaeruStop?.district,
      },
    };

    routeContextCache.lastResolvedStops.push(resolved);
    return resolved;
  }

  for (const district of contextualDistricts()) {
    const match = matches.find((m) => m.district === district);
    if (match) {
      console.log(
        `Disambiguated ${stop.metadata.cis_name} to district ${district} based on route context`,
      );

      const resolved: GtfsStop = {
        stop_id: stopId(stop.metadata.cis_name),
        stop_name: match?.name || stop.metadata.cis_name,
        stop_lat: match?.lat || -1,
        stop_lon: match?.lon || -1,
        zone_id: stop.zone_id,
        location_type: stop.location_type ?? 0,
        metadata: {
          cis_name: stop.metadata.cis_name,
          district: match?.district,
        },
      };

      routeContextCache.lastResolvedStops.push(resolved);
      return resolved;
    }
  }

  const centroid = calculateCentroid(routeContextCache.lastResolvedStops);
  if (centroid) {
    const nearbyDistricts = findNearestDistricts(centroid.lat, centroid.lon, 3);
    for (const district of nearbyDistricts) {
      const match = matches.find((m) => m.district === district);
      if (match) {
        console.log(
          `Disambiguated ${stop.metadata.cis_name} to district ${district} based on geographic proximity`,
        );

        const resolved: GtfsStop = {
          stop_id: stopId(`${stop.metadata.cis_name}_${district}`),
          stop_name: match.name || stop.metadata.cis_name,
          stop_lat: match.lat || -1,
          stop_lon: match.lon || -1,
          zone_id: stop.zone_id,
          location_type: stop.location_type ?? 0,
          metadata: {
            cis_name: stop.metadata.cis_name,
            district: match.district,
          },
        };

        routeContextCache.lastResolvedStops.push(resolved);
        return resolved;
      }
    }
  }

  console.warn(
    `Could not disambiguate stop ${stop.metadata.cis_name} with ${matches.length} matches. Falling back to cis_name and -1 for coordinates.`,
  );

  return {
    stop_id: stopId(stop.metadata.cis_name),
    stop_name: stop.metadata.cis_name,
    stop_lat: -1,
    stop_lon: -1,
    zone_id: stop.zone_id,
    location_type: stop.location_type ?? 0,
    metadata: {
      cis_name: stop.metadata.cis_name,
    },
  };
}

function contextualDistricts(): string[] {
  if (routeContextCache.lastResolvedStops.length === 0) {
    return [];
  }

  const districtCounts = new Map<string, number>();

  for (const stop of routeContextCache.lastResolvedStops) {
    const district = stop.metadata?.district;
    if (district) {
      districtCounts.set(district, (districtCounts.get(district) || 0) + 1);
    }
  }

  return Array.from(districtCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);
}

function calculateCentroid(
  stops: GtfsStop[],
): { lat: number; lon: number } | null {
  const validStops = stops.filter(
    (s) => s.stop_lat !== -1 && s.stop_lon !== -1,
  );

  if (validStops.length === 0) return null;

  const sumLat = validStops.reduce((sum, stop) => sum + stop.stop_lat, 0);
  const sumLon = validStops.reduce((sum, stop) => sum + stop.stop_lon, 0);

  return {
    lat: sumLat / validStops.length,
    lon: sumLon / validStops.length,
  };
}
