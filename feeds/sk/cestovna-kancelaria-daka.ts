import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "cestovna-kancelaria-daka",
  name: "Cestovná kancelária DAKA, s.r.o.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by Cestovná kancelária DAKA, s.r.o.Automatically converted from XLSX to GTFS format.",
  },
  fixes: {
    "agency.txt": {
      updateRows: [
        {
          where: {
            agency_name: "Cestovná kancelária DAKA",
          },
          set: {
            agency_url: "https://bus.daka.sk/",
          },
        },
      ],
    },
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "cestovna-kancelaria-daka",
  }),
} satisfies Feed;
