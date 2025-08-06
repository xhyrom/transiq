export function objectToCsv(obj: Record<string, any>): string {
  const headers = Object.keys(obj).join(",") + "\n";
  const values =
    Object.values(obj)
      .map((value) => {
        if (typeof value === "string") {
          // Check if quoting is necessary
          if (
            value.includes(",") ||
            value.includes("\"") ||
            value.includes("\n") ||
            value.includes("\r") ||
            value.trim() !== value // Has leading/trailing whitespace
          ) {
            // Quote and escape any double quotes
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        return value;
      })
      .join(",") + "\n";

  return headers + values;
}
