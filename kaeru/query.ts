export interface GeocodeQuery {
  query: string;
  lang?: string;
  limit?: number;
  locality?: string;
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

export async function queryGeocode(
  query: GeocodeQuery,
): Promise<GeocodeResponse> {
  const url = new URL(
    `geocode?query=${encodeURIComponent(query.query)}&lang=${encodeURIComponent(query.lang ?? "sk")}&limit=${encodeURIComponent(query.limit ?? 5)}&locality=${encodeURIComponent(query.locality ?? "sk")}&type=${query.type ?? "poi"}`,
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
