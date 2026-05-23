import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "zsr",
  name: "Železničná spoločnosť Slovensko, a.s. ; RegioJet, a.s. ; Leo Express s.r.o. ; Leo Express Slovensko s.r.o. ; LTE Logistik a Transport Slovakia, s.r.o. ; Trenčianska elektrická železnica, n.o.",
  license: {
    type: "CC0-1.0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
    attribution: "© Železnice Slovenskej republiky (ŽSR)",
    notes: "Data provided by Železnice Slovenskej republiky",
    from: "https://data.slovensko.sk/datasety/ebeeedf1-aca2-451a-bdc0-35d536714888",
  },
  getLatestSource: async (): Promise<FileSource> => ({
    type: "url",
    url: "https://data.slovensko.sk/download?id=c5a63281-3c44-4dba-82c9-7b7ad603db5d",
  }),
} satisfies Feed;
