import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "slovak-lines-express-as",
  name: "Slovak Lines Express, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by Slovak Lines Express, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "slovak-lines-express-as",
  }),
} satisfies Feed;
