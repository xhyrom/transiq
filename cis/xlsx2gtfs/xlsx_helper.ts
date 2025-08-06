import type { CellObject, WorkSheet } from "xlsx";

export function filterCells(
  sheet: WorkSheet,
  filter: (key: string, cell: CellObject) => boolean,
): Record<string, CellObject> {
  const cells: Record<string, CellObject> = {};
  for (const cellKey in sheet) {
    if (cellKey[0] === "!") continue;

    const cell = sheet[cellKey];
    if (cell && filter(cellKey, cell)) {
      cells[cellKey] = cell;
    }
  }

  return cells;
}

export function groupCells(
  cells: Record<string, CellObject>,
): Record<string, CellObject>[] {
  const rowMap: Map<number, Record<string, CellObject>> = new Map();

  for (const cellKey in cells) {
    const rowNum = cellRow(cellKey);
    if (rowNum !== -1) {
      if (!rowMap.has(rowNum)) {
        rowMap.set(rowNum, {});
      }

      const colName = cellColumn(cellKey);
      rowMap.get(rowNum)![colName] = cells[cellKey]!;
    }
  }

  return Array.from(rowMap.values());
}

export function cellRow(cellKey: string): number {
  const match = cellKey.match(/[0-9]+/);
  return match ? parseInt(match[0], 10) : -1;
}

export function cellColumn(cellKey: string): string {
  return cellKey.replace(/[0-9]/g, "");
}
