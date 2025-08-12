import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-poprad-as",
  name: "SAD Poprad a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Poprad a.s. Automatically converted from XLSX to GTFS format.",
  },
  fixes: {
    "agency.txt": {
      updateRows: [
        {
          where: {
            agency_name: "SAD Poprad a.s.",
          },
          set: {
            agency_url: "https://sadpp.sk/",
          },
        },
      ],
    },
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-poprad-as",
  }),
} satisfies Feed;
