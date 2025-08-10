import { join } from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import type { KaeruCsvItem } from "kaeru/types";

const csvPath = join(".transiq", "kaeru.csv");
const content = await Bun.file(csvPath).text();
const data = parseCsv<KaeruCsvItem>(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  cast: true,
});

export function queryAllStopsByCisName(cisName: string): KaeruCsvItem[] {
  return data.filter((item) => item.cis_name === cisName);
}

export function findNearestDistricts(
  lat: number,
  lon: number,
  limit: number = 1,
): string[] {
  if (!lat || !lon || lat === -1 || lon === -1) return [];

  return data
    .filter((item) => item.district && item.lat !== -1 && item.lon !== -1)
    .sort((a, b) => {
      const distA = getDistance(lat, lon, a.lat, a.lon);
      const distB = getDistance(lat, lon, b.lat, b.lon);
      return distA - distB;
    })
    .slice(0, limit)
    .map((item) => item.district!)
    .filter((district, index, self) => self.indexOf(district) === index); // Remove duplicates
}

// Haversine formula
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
