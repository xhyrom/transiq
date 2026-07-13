import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "dpmp",
  name: "DPMP Urban Transport",
  license: {
    type: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "© Dopravný podnik mesta Prešov, a.s. (DPMP)",
    notes: "Data provided by DPMP under CC BY 4.0 license.",
    from: "https://datapresov-mestopresov.hub.arcgis.com/datasets/f1033ca6c2f4461d9aba285e1c7cb079/about",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://www.arcgis.com/sharing/rest/content/items/f1033ca6c2f4461d9aba285e1c7cb079/data",
  }),
} satisfies Feed;
