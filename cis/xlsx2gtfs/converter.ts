import type { GtfsAgency, PartialGtfsStop } from "./gtfs/models";
import { agencyId } from "./utils/id";
import * as XLSX from "xlsx";
import { cellColumn, filterCells, groupCells } from "./xlsx_helper";

enum Sheet {
  INBOUND = "Smer tam",
  OUTBOUND = "Smer späť",
  NOTES = "Poznámky",
}

export function convertXlsxToGtfs(data: Buffer<ArrayBufferLike>): {
  stops: PartialGtfsStop[];
} {
  const workbook = XLSX.read(data, { type: "buffer" });

  const inboundSheet = workbook.Sheets[Sheet.INBOUND]!;
  const outboundSheet = workbook.Sheets[Sheet.OUTBOUND]!;

  return {
    stops: [...convertToGtfsStop(inboundSheet), ...convertToGtfsStop(outboundSheet)],
  };
}

export function convertToGtfsStop(sheet: XLSX.WorkSheet): PartialGtfsStop[] {
  const stopColumn = "B";

  let tpzColumn: string | undefined;
  const tpzCellKey = Object.entries(sheet).find(
    ([, cell]) => cell.t === "s" && cell.v === "TPZ"
  )?.[0];

  if (tpzCellKey) {
    tpzColumn = cellColumn(tpzCellKey);

    const dataCells = filterCells(sheet, (key, cell) => {
      const col = cellColumn(key);
      return (col === stopColumn || col === tpzColumn) &&
             cell.v !== "TPZ" &&
             cell.v !== "Zastávka";
    });

    const groupedCells = groupCells(dataCells);

    return groupedCells
      .filter(row => row[stopColumn] && row[stopColumn].v)
      .map((row) => ({
        stop_name: (row[stopColumn]!.v as string).split(";")[0]!,
        zone_id: tpzColumn && row[tpzColumn]?.v ? String(row[tpzColumn]!.v).split(",")[0] : undefined,
        location_type: 0,
      }));
  } else {
    const stopCells = filterCells(sheet, (key, cell) => {
      return cellColumn(key) === stopColumn &&
             cell.v !== "Zastávka" &&
             Boolean(cell.v);
    });

    return Object.values(stopCells)
      .filter(cell => Boolean(cell.v))
      .map((cell) => ({
        stop_name: (cell.v as string).split(";")[0]!,
        location_type: 0,
      }));
  }
}

export function convertToGtfsAgency(info: {
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

  // URL patterns
  const urlPatterns = [/www\.[^\s,]+/, /https?:\/\/[^\s]+/];

  for (const pattern of urlPatterns) {
    const match = agencyFull.match(pattern);
    if (match) {
      data.agency_url =
        pattern === urlPatterns[0] ? `https://${match[0]}` : match[0];
      break;
    }
  }

  // Phone number patterns
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
