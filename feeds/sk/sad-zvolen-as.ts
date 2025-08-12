import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-zvolen-as",
  name: "SAD Zvolen, a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Zvolen, a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-zvolen-as",
  }),
} satisfies Feed;
