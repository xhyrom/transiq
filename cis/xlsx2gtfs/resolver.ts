import type { GtfsStop, PartialGtfsStop } from "./gtfs/models";
import { stopId } from "./utils/id";
import { removeDuplicates } from "./utils/list";
import {
  distanceKm,
  findNearestDistricts,
  queryAllStopsByCisName,
} from "@transiq/kaeru/client";

const routeContextCache = {
  lastResolvedStops: [] as GtfsStop[],
};

/**
 * How far from everything else on the route a lone match may be.
 *
 * Only applied together with the district test below, so this is not "how long a
 * leg may be" — an express coach can run two hundred kilometres between stops and
 * is unaffected, because the district it arrives in is one of the route's own.
 * It is "how far a stop may be from the rest of its route *while also* being in a
 * district the route has never touched", and in Slovakia neighbouring districts
 * are tens of kilometres apart, so a route genuinely entering a new one does it
 * from close by.
 */
const LONE_MATCH_MAX_KM = 50;

/**
 * At least this many stops of the route must be placed before the test applies.
 *
 * One resolved stop is not a route context — if that one is itself wrong, every
 * stop after it looks wrong too, and the converter would refuse a whole route on
 * the strength of a single bad guess.
 */
const LONE_MATCH_MIN_CONTEXT = 2;

/**
 * Does this lone match belong to the route being converted?
 *
 * `queryAllStopsByCisName` matches on the name alone, and the disambiguation
 * below only runs when a name has several matches. A name with exactly **one**
 * match was taken unconditionally — and that is the case that goes wrong, because
 * the one match can be a namesake in another country.
 *
 * SAD Trenčín's route 306402 runs Považská Bystrica – Domaniža – Rajec. Its second
 * stop is `Bystřice, žel.st.`, which has one match in the database: the Czech
 * Bystřice near Benešov, 285 kilometres away. There is no Slovak entry under that
 * name, so there was nothing to disambiguate against and the Czech town was
 * written into a Slovak route — with its Czech spelling and its coordinates. Any
 * planner reading the feed then offers a bus covering those 285 kilometres in the
 * three minutes the timetable allows between the two stops.
 *
 * Measured across the nineteen Slovak feeds this converter produces: 34 stops
 * placed in a district the route never visits, the worst feed being SAD Prešov
 * with eleven of them across 339 trips.
 *
 * The test is deliberately two-handed. Distance alone would refuse the long legs
 * an express coach really runs; an unexpected district alone would refuse every
 * route that crosses a district boundary, which is most of them. Together they
 * describe one thing: a stop that is both somewhere the route has not been and
 * far from anywhere it has.
 */
function belongsToRoute(match: {
  lat?: number;
  lon?: number;
  district?: string;
}): boolean {
  const placed = routeContextCache.lastResolvedStops.filter(
    (stop) => stop.stop_lat !== -1 && stop.stop_lon !== -1,
  );
  if (placed.length < LONE_MATCH_MIN_CONTEXT) return true;
  if (!match.lat || !match.lon || match.lat === -1 || match.lon === -1) {
    return true;
  }

  const districts = contextualDistricts();
  if (match.district && districts.includes(match.district)) return true;

  const nearest = Math.min(
    ...placed.map((stop) =>
      distanceKm(match.lat!, match.lon!, stop.stop_lat, stop.stop_lon),
    ),
  );
  return nearest <= LONE_MATCH_MAX_KM;
}

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
    const kaeruStop = matches[0]!;

    if (!belongsToRoute(kaeruStop)) {
      console.warn(
        `Only match for stop ${stop.metadata.cis_name} is in district ` +
          `${kaeruStop.district} and far from the rest of the route — ` +
          `treating it as unresolved rather than placing the route there.`,
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

    console.log(`One match found for stop ${stop.metadata.cis_name}`);

    if (!kaeruStop.name || !kaeruStop.lat || !kaeruStop.lon) {
      console.warn(`Stop ${kaeruStop.cis_name} doesn't have name/lat/lon.`);
    }

    const resolved: GtfsStop = {
      stop_id: stopId(
        stop.metadata.cis_name,
        kaeruStop.country_code,
        kaeruStop.district,
      ),
      stop_name: kaeruStop.name || stop.metadata.cis_name,
      stop_lat: kaeruStop.lat || -1,
      stop_lon: kaeruStop.lon || -1,
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
        stop_id: stopId(
          stop.metadata.cis_name,
          match.country_code,
          match.district,
        ),
        stop_name: match.name || stop.metadata.cis_name,
        stop_lat: match.lat || -1,
        stop_lon: match.lon || -1,
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
          stop_id: stopId(
            stop.metadata.cis_name,
            match.country_code,
            match.district,
          ),
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
