import type { WorkSheet } from "xlsx";
import type { GtfsAgency, GtfsRoute } from "../gtfs/models";

export function parseRoute(
  agency: GtfsAgency,
  route: string,
  sheet: WorkSheet,
): GtfsRoute {
  const routeId = route.split("_")[0]!;
  const routeShortName = routeId.startsWith("L010")
    ? parseInt(routeId.slice(4))
    : parseInt(routeId.slice(1));

  return {
    route_id: routeId,
    agency_id: agency.agency_id,
    route_short_name: routeShortName,
    route_long_name: sheet.C1.v
      .trim()
      .replace(/^\/\d+\s*/, "")
      .replace(/\s*\(.*?\)\s*/g, "")
      .replaceAll(" - ", "-")
      .replaceAll("-", " - "),
    route_type: 3,
  } satisfies GtfsRoute;
}
