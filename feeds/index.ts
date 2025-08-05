import type { Feed, CountryCode } from "@types";
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
