import type { Feed, FileSource } from "@types";

export default {
  id: "dpb",
  name: "DPB Urban Transport",
  license: {
    type: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "© Dopravný podnik Bratislava, a.s. (DPB)",
    notes: "Data provided by DPB under CC BY 4.0 license.",
    from: "https://data.bratislava.sk/datasets/aba12fd2cbac4843bc7406151bc66106/about",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://www.arcgis.com/sharing/rest/content/items/aba12fd2cbac4843bc7406151bc66106/data",
  }),
} satisfies Feed;
