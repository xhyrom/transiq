import { mkdir } from "node:fs/promises";
import { downloadFile, generateLicenseFile, loadFeeds } from "./index";
import { join } from "node:path";
import ora from "ora";

const gtfsDir = join(process.cwd(), "gtfs");
await mkdir(gtfsDir, { recursive: true });

const feeds = await loadFeeds();

for (const feed of feeds) {
  const countryCode = feed.country?.toUpperCase() || "unknown";
  const spinner = ora(`[${countryCode}] Downloading ${feed.name}`).start();

  try {
    await ensureDirectory(join(gtfsDir, feed.country!));

    const source = await feed.getLatestSource();
    const fileName = join(gtfsDir, feed.country!, `${feed.id}.zip`);

    await downloadFile(source, fileName);

    if (feed.license) {
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
