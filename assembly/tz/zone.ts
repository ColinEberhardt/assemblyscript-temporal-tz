
// a zone is a named collection of zone offsets
export class Zone {
  constructor(public name: string, public offsets: ZoneOffset[]) {}

  getOffset(epochMillis: i64): ZoneOffset {
    let idx = 0;
    while (
      idx < (this.offsets.length - 1) &&
      this.offsets[idx].untilMillis < epochMillis
    ) {
      idx++;
    }
    return this.offsets[idx];
  }
}

// defines the offset applied up until a given date
export class ZoneOffset {
  constructor(
    // the standard offset applied for this period - e.g. 1:00 (UTC + 1 hour)
    public standardOffsetMillis: i32,
    // an optional reference to a set of rules (if "-" then no rules are referenced)
    public ruleRef: string,
    // a format string that identifies this zone, e..g BST
    public format: string,
    // this rule offset is applied until the given UTC millis
    public untilMillis: i64
  ) {}
}
