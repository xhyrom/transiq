export type CountryCode = string;

export type License = {
  type: string;
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
      type: "url";
      url: string;
    };

export type Feed = {
  id: string;
  name: string;
  license?: License;
  country?: CountryCode;
  getLatestSource: () => Promise<FileSource>;
};
