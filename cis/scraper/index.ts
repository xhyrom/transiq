import {
  downloadFile,
  ensureDirectory,
  sanitizeFolderName,
} from "@helpers/util";
import { processNestedPages } from "@helpers/pager";
import { parseHTML } from "linkedom";
import { exists, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

await ensureDirectory(".tmp");

const dir = join(".tmp", "cp-sk");
await mkdir(dir, { recursive: true });

await processNestedPages({
  baseUrl: "http://portal.cp.sk/Search.aspx?c=7&mi=7&sv=",
  outerParam: "io",
  outerStartPage: 0,
  // outerEndPage: 0, (development)
  innerParam: "p",
  innerStartPage: 0,
  // innerEndPage: 0, (development)
  fetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  },
  shouldStopInner: (_, body) =>
    body.includes(
      "Žiadny záznam nevyhovuje aktuálne nastavenej kombinácii typov liniek.",
    ),
  shouldStopOuter: (_, body) => body.includes("Chyba spracovania dotazu"),
  encodings: ["windows-1252"],

  // Process the first inner page to get agency information
  processOuterPage: async (page) => {
    const { document } = parseHTML(page.body);

    const agencyFull = document
      .querySelector("td.SectionTitle b")
      ?.textContent.trim()!;
    let agency = agencyFull;
    if (agency?.includes(", a.s.,") || agency?.includes(", spol. s r.o.,"))
      agency = agency.split(",").slice(0, 2).join(",");
    else agency = agency?.split(",")[0]!;

    const folderName = sanitizeFolderName(agency);
    console.log(`Processing agency: ${agency} (folder: ${folderName})`);

    await mkdir(join(dir, folderName), { recursive: true });

    let info = {
      agency_short: agency,
      agency_full: [agencyFull],
      folder_name: folderName,
    };

    if (await exists(join(dir, folderName, "info.json"))) {
      const oldInfo = JSON.parse(
        await readFile(join(dir, folderName, "info.json"), "utf-8"),
      );
      info.agency_full.push(...oldInfo.agency_full);
    }

    await writeFile(
      join(dir, folderName, "info.json"),
      JSON.stringify(info, null, 2),
    );

    return { agency, folderName };
  },

  // Process each inner page with the agency context
  processInnerPage: async (page, { agency, folderName }) => {
    console.log(`Processing inner page ${page.innerPage} for agency ${agency}`);
    const { document } = parseHTML(page.body);

    const links = document.querySelectorAll('a[href^="Down.aspx?f=xls/"]');

    // @ts-expect-error it's possible to iterate over NodeList
    for (const link of links) {
      const href = link.getAttribute("href")!;
      const fileName = href.slice(16);

      await downloadFile(
        { type: "url", url: `http://portal.cp.sk/${href}` },
        join(dir, folderName, fileName),
      );
    }
  },
});
