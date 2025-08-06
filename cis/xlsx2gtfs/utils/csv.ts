function formatCsvValue(value: any): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    if (
      value.includes(",") ||
      value.includes("\"") ||
      value.includes("\n") ||
      value.includes("\r") ||
      value.trim() !== value
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    if (/^\d+$/.test(value)) {
      return `"${value}"`;
    }

    return value;
  }

  return String(value);
}

export function objectToCsv(obj: Record<string, any>): string {
  const headers = Object.keys(obj).join(",") + "\n";
  const values = Object.values(obj).map(formatCsvValue).join(",") + "\n";

  return headers + values;
}

export function arrayToCsv(header: string[], data: any[]): string {
  const headerRow = header.join(",") + "\n";

  if (data.length === 0) {
    return headerRow;
  }

  const rows = data.map(item => {
    return header.map(key => formatCsvValue(item[key])).join(",");
  }).join("\n") + "\n";

  return headerRow + rows;
}
