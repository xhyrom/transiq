import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-zilina-as",
  name: "SAD Žilina a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Žilina a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-zilina-as",
  }),
} satisfies Feed;
