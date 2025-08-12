import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-trencin-as",
  name: "SAD Trenčín, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Trenčín, a.s., a.s. Automatically converted from XLSX to GTFS format.",
  },
  fixes: {
    "agency.txt": {
      updateRows: [
        {
          where: {
            agency_name: "SAD Trenčín a.s.",
          },
          set: {
            agency_url: "https://sadtn.sk/",
          },
        },
      ],
    },
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-trencin-as",
  }),
} satisfies Feed;
