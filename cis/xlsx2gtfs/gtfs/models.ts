export interface GtfsAgency {
  agency_id: string;
  agency_name: string;
  agency_url?: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
  agency_fare_url?: string;
}

export type PartialGtfsStop = Omit<
  GtfsStop,
  "stop_name" | "stop_id" | "stop_lat" | "stop_lon"
>;

export interface GtfsStop {
  stop_id: string;
  stop_name: string;
  cis_name: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  location_type: number;
}

export interface GtfsRoute {
  route_id: string;
  agency_id: string;
  route_short_name: number;
  route_long_name: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
}

export interface GtfsTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  wheelchair_accessible?: number;
  bikes_allowed?: number;
}

export interface GtfsCalendar {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string; // YYYYMMDD
  end_date: string; // YYYYMMDD
}

export interface GtfsStopTime {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string; // HH:MM:SS
  departure_time: string; // HH:MM:SS
}
