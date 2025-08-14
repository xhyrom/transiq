**kolaj** aims to improve and fix the [ZSSK](https://zssk.sk/) ([Železničná spoločnosť Slovensko](https://zsr.sk)) GTFS feed.

The official ZSSK GTFS feed does not visually separate train categories such as Os, REX, R, or EC, making it hard to distinguish different types of trains in journey planners or automated analyses.

Additionally, the feed mixes train numbers and train categories together in `trips.txt`, which does not follow GTFS best practices and can cause inconsistencies for routing and visualization tools.
