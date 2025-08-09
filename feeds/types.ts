export type CountryCode = string;

export type License = {
  type?: string;
  url?: string;
  attribution?: string;
  notes?: string;
  from?: string;
};

export type FileSource =
  | {
      type: "google_drive";
      fileId: string;
    }
  | {
      type: "cis";
      id: string;
    }
  | {
      type: "url";
      url: string;
    };

export type FeedCsvRow = Record<string, string>;

export type FeedFix = {
  [filename: string]: {
    addRows?: FeedCsvRow[];
    updateRows?: {
      where: Partial<FeedCsvRow>;
      set: Partial<FeedCsvRow>;
    }[];
    deleteRows?: {
      where: Partial<FeedCsvRow>;
    }[];
  };
};

export type Feed = {
  id: string;
  name: string;
  license?: License;
  country?: CountryCode;
  fixes?: FeedFix;
  getLatestSource: () => Promise<FileSource>;
};
