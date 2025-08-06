import type { Feed, FileSource } from "@types";

export default {
  id: "sadlc",
  name: "SAD Lúčenec",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://gtfs.transdata.sk/SADLC/gtfs.zip",
  }),
} satisfies Feed;
