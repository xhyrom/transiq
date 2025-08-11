import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-humenne-as",
  name: "SAD Humenné a.s.",
  license: {
    notes:
      "Data sourced from portal.cp.sk, provided by SAD Humenné a.s. Automatically converted from XLSX to GTFS format.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "sad-humenne-as",
  }),
} satisfies Feed;
