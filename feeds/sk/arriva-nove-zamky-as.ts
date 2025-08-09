import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-nove-zamky-as",
  name: "ARRIVA Nové Zámky, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by ARRIVA Nové Zámky, a.s. Automatically converted from XLSX to GTFS format.",
  },
  fixes: {
    "agency.txt": {
      updateRows: [
        {
          where: {
            agency_name: "ARRIVA Nové Zámky, a.s.",
          },
          set: {
            agency_url: "https://www.arrivanitra.sk/",
          },
        },
      ],
    },
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-nove-zamky-as",
  }),
} satisfies Feed;
