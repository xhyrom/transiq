import JSZip from "jszip";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import type { FeedFix } from "./types";

export function parseGtfsCsv(content: string): Record<string, string>[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

export function stringifyGtfsCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";

  return stringify(rows, {
    header: true,
    columns: Object.keys(rows[0]!),
  });
}

export function applyFeedFixes(
  content: string,
  fixes: {
    addRows?: Record<string, string>[];
    updateRows?: {
      where: Partial<Record<string, string>>;
      set: Partial<Record<string, string>>;
    }[];
    deleteRows?: {
      where: Partial<Record<string, string>>;
    }[];
  },
): string {
  if (!content.trim()) return content;

  let rows = parseGtfsCsv(content);

  if (fixes.deleteRows) {
    for (const deleteFix of fixes.deleteRows) {
      rows = rows.filter((row) => !matchesWhere(row, deleteFix.where));
    }
  }

  if (fixes.updateRows) {
    for (const updateFix of fixes.updateRows) {
      // @ts-expect-error works, fix types later :)
      rows = rows.map((row) => {
        if (matchesWhere(row, updateFix.where)) {
          return { ...row, ...updateFix.set };
        }

        return row;
      });
    }
  }

  if (fixes.addRows && fixes.addRows.length > 0) {
    rows = [...rows, ...fixes.addRows];
  }

  return stringifyGtfsCsv(rows);
}

function matchesWhere(
  row: Record<string, string>,
  where: Partial<Record<string, string>>,
): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

export async function applyFixesToZip(
  zipBuffer: ArrayBuffer,
  fixes: FeedFix,
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(zipBuffer);

  for (const [filename, fileFixes] of Object.entries(fixes)) {
    const file = zip.file(filename);
    if (file) {
      const content = await file.async("string");
      const fixedContent = applyFeedFixes(content, fileFixes);
      zip.file(filename, fixedContent);
    }
  }

  return await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });
}
