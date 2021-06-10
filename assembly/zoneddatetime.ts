import {
  DateTimeLike,
  DurationLike,
  Instant,
  Overflow,
  PlainDateTime,
} from "assemblyscript-temporal";
import { RegExp } from "assemblyscript-regex";

import { TimeZone } from "./timezone";

export class ZonedDateTime {
  @inline
  static from<T = DateTimeLike>(date: T): ZonedDateTime {
    if (isString<T>()) {
      // @ts-ignore: cast
      return this.fromString(<string>date);
    } else {
      throw new TypeError("invalid date type");
    }
  }

  static toZonedDateTime(
    pdt: PlainDateTime,
    timezoneString: string
  ): ZonedDateTime {
    const timezone = new TimeZone(timezoneString);
    const epochNanos = pdt.epochNanoseconds;
    return new ZonedDateTime(
      epochNanos - timezone.getOffsetNanosecondsFor(new Instant(epochNanos)),
      timezone
    );
  }

  private static fromPlainDateTime(
    pdt: PlainDateTime,
    timezone: TimeZone
  ): ZonedDateTime {
    const epochNanos = pdt.epochNanoseconds;
    // The zdt constructor applies the timezone offset to the epoch nanos - here we apply the
    // reverse offset. Yes, that's ugly.
    return new ZonedDateTime(
      epochNanos - timezone.getOffsetNanosecondsFor(new Instant(epochNanos)),
      timezone
    );
  }

  private static fromString(date: string): ZonedDateTime {
    // parse the date / time components
    const parsed = PlainDateTime.from(date);

    // parse the timezone
    const tzRegex = new RegExp("\\[(.*)\\]$", "i");
    const match = tzRegex.exec(date);
    if (match == null) {
      throw new RangeError("time zone ID required in brackets");
    }
    const timezoneString = match.matches[1];

    const epochMillis = Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hour,
      parsed.minute,
      parsed.second,
      parsed.millisecond
    );
    const epochNanos =
      i64(epochMillis) * 1_000_000 +
      i64(parsed.microsecond) * 1_000 +
      i64(parsed.nanosecond);
    const timezone = new TimeZone(timezoneString);
    return new ZonedDateTime(
      epochNanos - timezone.getOffsetNanosecondsFor(new Instant(epochNanos)),
      timezone
    );
  }

  private plainDateTime: PlainDateTime;
  readonly timezone: TimeZone;

  constructor(public epochNanos: i64, public tz: TimeZone) {
    this.plainDateTime = tz.getPlainDateTimeFor(new Instant(epochNanos));
    this.timezone = tz;
  }

  toInstant(): Instant {
    return new Instant(this.epochNanos);
  }

  toPlainDateTime(): PlainDateTime {
    return this.plainDateTime;
  }

  get year(): i32 {
    return this.plainDateTime.year;
  }

  get month(): i32 {
    return this.plainDateTime.month;
  }

  get day(): i32 {
    return this.plainDateTime.day;
  }

  get hour(): i32 {
    return this.plainDateTime.hour;
  }

  get minute(): i32 {
    return this.plainDateTime.minute;
  }

  get second(): i32 {
    return this.plainDateTime.second;
  }

  get millisecond(): i32 {
    return this.plainDateTime.millisecond;
  }

  get microsecond(): i32 {
    return this.plainDateTime.microsecond;
  }

  get nanosecond(): i32 {
    return this.plainDateTime.nanosecond;
  }

  get offset(): string {
    return this.tz.getOffsetStringFor(this.toInstant());
  }

  get epochSeconds(): i32 {
    return i32(this.epochNanos / 1_000_000_000);
  }

  get epochMilliseconds(): i32 {
    return i32(this.epochNanos / 1_000_000);
  }

  get epochMicroseconds(): i64 {
    return this.epochNanos / 1_000;
  }

  get epochNanoseconds(): i64 {
    return this.epochNanos;
  }

  @inline
  get dayOfWeek(): i32 {
    return this.plainDateTime.dayOfWeek;
  }

  @inline
  get dayOfYear(): i32 {
    return this.plainDateTime.dayOfYear;
  }

  @inline
  get weekOfYear(): i32 {
    return this.plainDateTime.weekOfYear;
  }

  @inline
  get daysInWeek(): i32 {
    return 7;
  }

  @inline
  get daysInMonth(): i32 {
    return this.plainDateTime.daysInMonth;
  }

  @inline
  get daysInYear(): i32 {
    return this.plainDateTime.daysInYear;
  }

  @inline
  get monthsInYear(): i32 {
    return this.plainDateTime.monthsInYear;
  }

  @inline
  get inLeapYear(): bool {
    return this.plainDateTime.inLeapYear;
  }

  @inline
  get offsetNanoseconds(): i64 {
    return this.tz.getOffsetNanosecondsFor(this.toInstant());
  }

  toString(): string {
    return (
      this.toPlainDateTime().toString() + this.offset + "[" + this.tz.id + "]"
    );
  }

  with(dateTimeLike: DateTimeLike): ZonedDateTime {
    return ZonedDateTime.fromPlainDateTime(
      this.plainDateTime.with(dateTimeLike),
      this.timezone
    );
  }

  add<T = DurationLike>(
    durationToAdd: T,
    overflow: Overflow = Overflow.Constrain
  ): ZonedDateTime {
    return ZonedDateTime.fromPlainDateTime(
      this.plainDateTime.add(durationToAdd, overflow),
      this.timezone
    );
  }

  subtract<T = DurationLike>(
    durationToAdd: T,
    overflow: Overflow = Overflow.Constrain
  ): ZonedDateTime {
    return ZonedDateTime.fromPlainDateTime(
      this.plainDateTime.subtract(durationToAdd, overflow),
      this.timezone
    );
  }
}
