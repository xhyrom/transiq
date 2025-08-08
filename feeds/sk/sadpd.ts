import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "sadpd",
  name: "SAD Prievidza",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADPD/gtfs.zip",
  }),
} satisfies Feed;
