import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "eurobus-as",
  name: "eurobus, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by eurobus, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "eurobus-as",
  }),
} satisfies Feed;
