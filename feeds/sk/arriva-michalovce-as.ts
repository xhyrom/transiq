import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "arriva-michalovce-as",
  name: "ARRIVA Michalovce, a.s.",
  getLatestSource: async (): Promise<FileSource> => ({
    type: "cis",
    id: "arriva-michalovce-as",
  }),
} satisfies Feed;
