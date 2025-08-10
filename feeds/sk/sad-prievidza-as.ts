import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sad-prievidza-as",
  name: "SAD Prievidza, a.s.",
  license: {
    attribution: "© TransData s.r.o.",
    notes: "Data sourced from gtfs.transdata.sk, provided by TransData s.r.o.",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADPD/gtfs.zip",
  }),
} satisfies Feed;
