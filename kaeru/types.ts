export const HEADERS = [
  "cis_name",
  "name",
  "lat",
  "lon",
  "country_code",
  "region",
  "district",
];

export interface KaeruCsvItem {
  cis_name: string;
  name: string;
  lat: number;
  lon: number;
  country_code?: string;
  region?: string;
  district?: string;
}
