import type { Feed, CountryCode, FileSource } from "@feeds/types";
import { getGftsZip } from "cis/client";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

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

export async function loadFeedsByCountry(): Promise<
  Record<CountryCode, Feed[]>
> {
  const feeds = await loadFeeds();
  return feeds.reduce(
    (acc, feed) => {
      if (!acc[feed.country!]) {
        acc[feed.country!] = [];
      }

      acc[feed.country!]!.push(feed);
      return acc;
    },
    {} as Record<CountryCode, Feed[]>,
  );
}

export async function downloadFile(
  source: FileSource,
  fileName: string,
  options?: {
    errorTexts?: string[];
    checkContentType?: boolean;
  },
): Promise<void> {
  let response: Response;

  switch (source.type) {
    case "google_drive":
      response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${source.fileId}?alt=media&key=${process.env.GOOGLE_API_KEY}`,
      );
      break;

    case "cis":
      await Bun.write(fileName, await getGftsZip(source.id));
      return;

    case "url":
      response = await fetch(source.url);
      break;

    default:
      throw new Error(`Unsupported source type: ${(source as any).type}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (options?.checkContentType) {
    const responseClone = response.clone();
    const contentType = responseClone.headers.get("content-type");
    if (contentType?.includes("text/html")) {
      const text = await responseClone.text();
      if (options?.errorTexts) {
        for (const errorText of options.errorTexts) {
          if (text.includes(errorText)) {
            throw new Error(`Server returned error: "${errorText}"`);
          }
        }
      }
    }
  } else if (options?.errorTexts) {
    const responseClone = response.clone();
    const text = await responseClone.text();

    for (const errorText of options.errorTexts) {
      if (text.includes(errorText)) {
        throw new Error(`Server returned error: "${errorText}"`);
      }
    }
  }

  await Bun.write(fileName, await response.arrayBuffer());
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
