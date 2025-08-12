import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-presov-sk",
  name: "SAD Prešov SK, s.r.o.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Prešov SK, s.r.o. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-presov-sk",
  }),
} satisfies Feed;
