export class S3Paths {
  static get GREMLIN_CSV(): string {
    return 'gremlin-csv';
  }
  static get RAW_EVENTS(): string {
    return 'raw-events';
  }
  static get RAW_EVENTS_FIREHOSE_ERROR(): string {
    return 'raw-events-firehose-error'
  }
}