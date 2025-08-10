import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-lucenec-as",
  name: "SAD Lúčenec, a.s.",
  license: {
    attribution: "© TransData s.r.o.",
    notes: "Data sourced from gtfs.transdata.sk, provided by TransData s.r.o.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADLC/gtfs.zip",
  }),
} satisfies Feed;
