import type { Feed, FeedFix, FileSource } from "@feeds/types";
import { getGftsZip } from "cis/client";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

import ora from "ora";
import { applyFixesToZip } from "./utils";

const gtfsDir = join(process.cwd(), "gtfs");
await mkdir(gtfsDir, { recursive: true });

const feeds = await loadFeeds();

for (const feed of feeds) {
  const countryCode = feed.country?.toUpperCase() || "unknown";
  const spinner = ora(`[${countryCode}] Downloading ${feed.name}`).start();

  try {
    await mkdir(join(gtfsDir, feed.country!), { recursive: true });

    const source = await feed.getLatestSource();
    const fileName = join(gtfsDir, feed.country!, `${feed.id}.zip`);

    let buffer = await downloadFile(source);
    if (feed.fixes) {
      buffer = await applyFixesToZip(buffer, feed.fixes);
    }

    await Bun.write(fileName, buffer);

    if (feed.license?.type) {
      await generateLicenseFile(feed, fileName);
      spinner.succeed(
        `[${countryCode}] Successfully downloaded ${feed.name} data with ${feed.license.type} license`,
      );
    } else {
      spinner.succeed(
        `[${countryCode}] Successfully downloaded ${feed.name} data (no license info)`,
      );
    }
  } catch (error) {
    spinner.fail(`[${countryCode}] Failed to download ${feed.name} data`);
    console.error(error);
  }
}

export async function loadFeeds(): Promise<Feed[]> {
  const feeds: Feed[] = [];
  const feedsDir = join(__dirname);

  const countries = await readdir(feedsDir);

  for (const country of countries) {
    if (country === "index.ts" || !country.match(/^[a-z]{2}$/)) continue;

    const countryDir = join(feedsDir, country);
    const files = await readdir(countryDir);

    for (const file of files) {
      if (!file.endsWith(".ts")) continue;

      const feed = (await import(`./${country}/${file}`)).default as Feed;
      feeds.push({
        ...feed,
        country,
      });
    }
  }

  return feeds;
}

export async function downloadFile(source: FileSource): Promise<ArrayBuffer> {
  let buffer: ArrayBuffer;

  switch (source.type) {
    case "google_drive":
      const driveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${source.fileId}?alt=media&key=${process.env.GOOGLE_API_KEY}`,
      );
      if (!driveResponse.ok) {
        throw new Error(`HTTP error! status: ${driveResponse.status}`);
      }
      buffer = await driveResponse.arrayBuffer();
      break;

    case "cis":
      buffer = await getGftsZip(source.id);
      break;

    case "url":
      const urlResponse = await fetch(source.url);
      if (!urlResponse.ok) {
        throw new Error(`HTTP error! status: ${urlResponse.status}`);
      }
      buffer = await urlResponse.arrayBuffer();
      break;

    default:
      throw new Error(`Unsupported source type: ${(source as any).type}`);
  }

  return buffer;
}

export async function generateLicenseFile(
  feed: Feed,
  filePath: string,
): Promise<void> {
  if (!feed.license) return;

  const currentDate = new Date().toISOString().split("T")[0];

  let licenseContent = "";
  licenseContent += `Data source: ${feed.name}\n`;

  if (feed.license.type) {
    licenseContent += `License: ${feed.license.type}\n`;
  }

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
