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

export enum GtfsStopAccess {
  REGULAR = 0,
  NONE = 1,
  MUST_PHONE_AGENCY = 2,
  MUST_ASK_DRIVER = 3,
}

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

export enum GtfsTripAccessibility {
  NO_INFORMATION = 0,
  ACCESSIBLE = 1,
  NOT_ACCESSIBLE = 2,
}

export interface GtfsTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign: string;
  wheelchair_accessible?: GtfsTripAccessibility;
  bikes_allowed?: GtfsTripAccessibility;
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
  start_date: number; // YYYYMMDD
  end_date: number; // YYYYMMDD
}

export enum GtfsCalendarDateException {
  SERVICE_ADDED = 1,
  SERVICE_REMOVED = 2,
}

export interface GtfsCalendarDate {
  service_id: string;
  date: number; // YYYYMMDD format
  exception_type: GtfsCalendarDateException;
}

export interface GtfsStopTime {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string; // HH:MM:SS
  departure_time: string; // HH:MM:SS
  pickup_type: GtfsStopAccess;
  drop_off_type: GtfsStopAccess;
}
