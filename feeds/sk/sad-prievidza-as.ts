import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-prievidza-as",
  name: "SAD Prievidza, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Prievidza, a.s. Automatically converted from XLSX to GTFS format.",
  },
  fixes: {
    "agency.txt": {
      updateRows: [
        {
          where: {
            agency_name: "SAD Prievidza a.s.",
          },
          set: {
            agency_url: "https://sadpd.sk/",
          },
        },
      ],
    },
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-prievidza-as",
  }),
} satisfies Feed;
