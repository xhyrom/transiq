**transiq** (pronounced "transique") is a toolset for accessing, processing, and publishing public transport data in [GTFS](https://gtfs.org) format.

This project was originally created to handle IDS BK regional buses GTFS data from Slovakia 🇸🇰 (https://www.idsbk.sk/en/about/open-data/), which is hosted on Google Drive and can't be easily accessed. However, transiq is designed to be generic, so if you want to add another feed, your contributions are appreciated :)

### Accessing GTFS Files

All mirrored GTFS files are accessible at: [https://transiq.xhyrom.dev/](https://transiq.xhyrom.dev/)

Files follow this pattern:
`https://transiq.xhyrom.dev/gtfs/{country_code}/{feed_id}.zip`

For example, to access the IDS BK regional buses data:
`https://transiq.xhyrom.dev/gtfs/sk/ids-bk_regional.zip`

### Adding New Feeds

To add a new GTFS feed:

1. Create a new file in the appropriate country directory (e.g., `feed/sk/new-feed.ts`)
2. Implement the feed definition following this structure:

```typescript
import type { Feed, FileSource } from "@feeds/types";

export default {
  id: "unique-id",
  name: "Human Readable Name",
  license: {
    // License information (optional)
    type: "License Type",
    url: "https://license-url.example",
    attribution: "Attribution information",
    notes: "Additional notes about the license",
    from: "https://source-website.example",
  },
  getLatestSource: async (): Promise<FileSource> => {
    // Logic to get the latest source URL or Google Drive file ID
    return {
      type: "url", // or "google_drive"
      url: "https://example.com/gtfs.zip", // or fileId: "google_drive_file_id"
    };
  },
} satisfies Feed;
```

### Automated Updates

The repository uses GitHub Actions to automatically download and update the GTFS files daily. The updated files are stored in the [`gtfs`](https://github.com/xhyrom/transiq/tree/gtfs) branch.

### Related Projects

If you're interested in transit data, consider also contributing to these popular projects:

- [transitous](https://github.com/public-transport/transitous) - A community-run provider-neutral international public transport routing service.
- [transitland-atlas](https://github.com/transitland/transitland-atlas) - An open catalog of transit/mobility data feeds and operators.
