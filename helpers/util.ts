import { mkdir } from "node:fs/promises";
import type { Feed, FileSource } from "@types";

export async function downloadFile(
  source: FileSource,
  fileName: string,
): Promise<void> {
  let response: Response;

  switch (source.type) {
    case "google_drive":
      response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${source.fileId}?alt=media&key=${process.env.GOOGLE_API_KEY}`,
      );
      break;

    case "url":
      response = await fetch(source.url);
      break;

    default:
      throw new Error(`Unsupported source type: ${(source as any).type}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  await Bun.write(fileName, response);
}

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function generateLicenseFile(
  feed: Feed,
  filePath: string,
): Promise<void> {
  if (!feed.license) return;

  const currentDate = new Date().toISOString().split("T")[0];

  let licenseContent = "";
  licenseContent += `Data source: ${feed.name}\n`;
  licenseContent += `License: ${feed.license.type}\n`;

  if (feed.license.url) {
    licenseContent += `License URL: ${feed.license.url}\n`;
  }

  if (feed.license.attribution) {
    licenseContent += `Attribution: ${feed.license.attribution}\n`;
  }

  if (feed.license.notes) {
    licenseContent += `Notes: ${feed.license.notes}\n`;
  }

  if (feed.license.from) {
    licenseContent += `Retrieved from: ${feed.license.from}\n`;
  }

  licenseContent += `Retrieved: ${currentDate}\n`;

  await Bun.write(`${filePath}.LICENSE`, licenseContent);
}
