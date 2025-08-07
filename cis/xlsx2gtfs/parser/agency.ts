import type { GtfsAgency } from "../gtfs/models";
import { agencyId } from "../utils/id";

export function parseAgency(info: {
  agency_short: string;
  agency_full: string[];
}): GtfsAgency {
  const data: GtfsAgency = {
    agency_id: agencyId(),
    agency_name: info.agency_short,
    agency_timezone: "Europe/Bratislava",
    agency_lang: "sk",
  };

  const agencyFull = info.agency_full[0]!;

  const urlPatterns = [/www\.[^\s,]+/, /https?:\/\/[^\s]+/];

  for (const pattern of urlPatterns) {
    const match = agencyFull.match(pattern);
    if (match) {
      data.agency_url =
        pattern === urlPatterns[0] ? `https://${match[0]}` : match[0];
      break;
    }
  }

  const phonePatterns = [
    // Format: tel. 046/542 4433
    { regex: /tel\.\s+(\d+\/\d+\s*\d+)/i, group: 1 },

    // Format: tel. +420 606 619 913
    { regex: /tel\.\s+(\+?\d+(?:\s+\d+)*)/i, group: 1 },

    // Format: tel:+1234567890
    { regex: /tel:\+?(\d[\d\s-]*)/i, group: 1 },

    // Format: (+123 456 789)
    { regex: /\(\+\d{3}\s\d{3}\s\d{3}\)/i, group: 0 },

    // Additional pattern for area codes and other formats
    { regex: /tel\.\s+([0-9+\/\s-]+)/i, group: 1 },
  ];

  for (const { regex, group } of phonePatterns) {
    const match = agencyFull.match(regex);
    if (match) {
      data.agency_phone = match[group];
      break;
    }
  }

  return data;
}
