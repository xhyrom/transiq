export interface GeocodeQuery {
  query: string;
  lang?: string;
  limit?: number;
  type?: string;
}

export interface GeocodeItemEntry {
  name: string;
  label: string;
  position: {
    lat: number;
    lon: number;
  };
  type: string;
  location: string;
}

export interface GeocodeResponse {
  items: GeocodeItemEntry[];
}

export async function queryGeocodeMapy(
  query: GeocodeQuery,
): Promise<GeocodeResponse> {
  const url = new URL(
    `geocode?query=${encodeURIComponent(query.query)}&lang=${encodeURIComponent(query.lang ?? "sk")}&limit=${encodeURIComponent(query.limit ?? 5)}&type=${query.type ?? "poi"}`,
    "https://api.mapy.com/v1/",
  );

  return await (
    await fetch(url, {
      headers: {
        "X-Mapy-Api-Key": process.env.MAPY_API_KEY!,
      },
    })
  ).json();
}

export async function queryGeocodeNominatim(
  query: GeocodeQuery,
): Promise<GeocodeResponse> {
  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("q", query.query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(query.limit ?? 5));
  url.searchParams.set("accept-language", query.lang ?? "en");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "kaeru/1.0 (contact@xhyrom.dev)",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  const data = await response.json();

  const items: GeocodeItemEntry[] = data.map((entry: any) => ({
    name: entry.alt_name
      ? entry.alt_name.split(";")[entry.alt_name.split(";").length - 1]
      : entry.name,
    label: entry.display_name,
    position: {
      lat: parseFloat(entry.lat),
      lon: parseFloat(entry.lon),
    },
    type: entry.type,
    location: entry.display_name,
  }));

  return { items };
}

export interface UbianStop {
  name: string;
  id: number;
  stopCity: string;
}

export async function queryUbian(
  query: string,
): Promise<{ items: UbianStop[] }> {
  const url = new URL(
    "https://ubian.azet.sk/navigation/autocomplete?lat=0&lng=0&filter=bus&cityID=",
  );

  url.searchParams.set("query", query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Ubian request failed with status ${response.status}`);
  }

  const data = await response.json();
  const items = data.results.map((item: any) => ({
    name: item.name,
    id: item.id,
    stopCity: item.stopCity,
  }));

  return { items };
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ district?: string; region?: string; country_code?: string }> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "sk");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "kaeru/1.0 (contact@xhyrom.dev)",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding request failed: ${response.status}`);
  }

  const data = await response.json();

  switch (data.address.country_code) {
    case "sk":
      return {
        district: data.address.county || data.address.city_district,
        region: data.address.state || data.address.region,
        country_code: data.address.country_code.toUpperCase(),
      };
    case "cz":
      return {
        district:
          data.address.city === "Hlavní mesto Praha"
            ? data.address.city
            : data.address.municipality,
        region:
          data.address.county || data.address.state || data.address.region,
        country_code: data.address.country_code.toUpperCase(),
      };
    case "de":
      return {
        district:
          data.address.borough ||
          data.address.city ||
          data.address.city_district ||
          data.address.municipality ||
          data.address.town,
        region:
          data.address.state ||
          data.address.county ||
          data.address.region ||
          data.address.city,
        country_code: data.address.country_code.toUpperCase(),
      };
    case "ua":
      return {
        district: data.address.district || data.address.borough,
        region:
          data.address.city === "Kyjev"
            ? data.address.city
            : data.address.state || data.address.region,
        country_code: data.address.country_code.toUpperCase(),
      };
    case "at":
      return {
        district:
          data.address.suburb ||
          data.address.county ||
          data.address.city_district ||
          data.address.municipality,
        region:
          data.address.city_district ||
          data.address.state ||
          data.address.region,
        country_code: data.address.country_code.toUpperCase(),
      };
    default:
      return {
        district:
          data.address.municipality ||
          data.address.county ||
          data.address.city_district ||
          data.address.district ||
          data.address.borough,
        region:
          data.address.state || data.address.county || data.address.region,
        country_code: data.address.country_code.toUpperCase(),
      };
  }
}
