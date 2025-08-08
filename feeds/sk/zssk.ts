import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "zssk",
  name: "Železničná spoločnosť Slovensko, a.s.",
  license: {
    type: "CC0-1.0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    attribution: "© Železnice Slovenskej republiky (ŽSR)",
    notes: "Data provided by Železnice Slovenskej republiky",
    from: "https://data.slovensko.sk/datasety/ca4cb74c-7192-4198-b074-34acd9d295e7",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://www.zsr.sk/files/pre-cestujucich/cestovny-poriadok/gtfs/gtfs.zip",
  }),
} satisfies Feed;
