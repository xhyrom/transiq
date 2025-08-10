import { read, type WorkSheet } from "xlsx";
import type { PartialGtfsStop } from "../gtfs/models";
import { cellColumn, filterCells, groupCells } from "../xlsx_helper";
import { Sheet, STOP_COLUMN } from ".";

export function parseStops(data: Buffer<ArrayBufferLike>): PartialGtfsStop[] {
  const workbook = read(data, { type: "buffer" });

  const inboundSheet = workbook.Sheets[Sheet.INBOUND]! ?? [];
  const outboundSheet = workbook.Sheets[Sheet.OUTBOUND]! ?? [];

  return [...parseStop(inboundSheet), ...parseStop(outboundSheet)];
}

export function parseStop(sheet: WorkSheet): PartialGtfsStop[] {
  let tpzColumn: string | undefined;
  const tpzCellKey = Object.entries(sheet).find(
    ([, cell]) => cell.t === "s" && cell.v === "TPZ",
  )?.[0];

  if (tpzCellKey) {
    tpzColumn = cellColumn(tpzCellKey);

    const dataCells = filterCells(sheet, (key, cell) => {
      const col = cellColumn(key);
      return (
        (col === STOP_COLUMN || col === tpzColumn) &&
        cell.v !== "TPZ" &&
        cell.v !== "Zastávka"
      );
    });

    const groupedCells = groupCells(dataCells);

    return groupedCells
      .filter((row) => row[STOP_COLUMN] && row[STOP_COLUMN].v)
      .map((row) => ({
        metadata: {
          cis_name: (row[STOP_COLUMN]!.v as string).split(";")[0]!,
        },
        zone_id:
          tpzColumn && row[tpzColumn]?.v
            ? String(row[tpzColumn]!.v).split(",")[0]
            : undefined,
        location_type: 0,
      }));
  } else {
    const stopCells = filterCells(sheet, (key, cell) => {
      return (
        cellColumn(key) === STOP_COLUMN &&
        cell.v !== "Zastávka" &&
        Boolean(cell.v)
      );
    });

    return Object.values(stopCells)
      .filter((cell) => Boolean(cell.v))
      .map((cell) => ({
        metadata: {
          cis_name: (cell.v as string).split(";")[0]!,
        },
        location_type: 0,
      }));
  }
}
