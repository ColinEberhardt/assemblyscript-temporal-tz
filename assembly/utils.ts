export class DT {
  year: i32;
  month: i32;
  day: i32;
  hour: i32;
  minute: i32;
  second: i32;
  millisecond: i32;
  microsecond: i32;
  nanosecond: i32;
}

export class YMD {
  year: i32;
  month: i32;
  day: i32;
}

export class YM {
  year: i32;
  month: i32;
}

export class BalancedTime {
  deltaDays: i32;
  hour: i32;
  minute: i32;
  second: i32;
  millisecond: i32;
  microsecond: i32;
  nanosecond: i32;
}


// Original: Disparate variation
// Modified: TomohikoSakamoto algorithm from https://en.wikipedia.org/wiki/Determination_of_the_day_of_the_week
// https://github.com/tc39/proposal-temporal/blob/49629f785eee61e9f6641452e01e995f846da3a1/polyfill/lib/ecmascript.mjs#L2171
// returns day of week in range [1,7], where 7 = Sunday
export function dayOfWeek(year: i32, month: i32, day: i32): i32 {
  const tab = memory.data<u8>([0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]);

  year -= i32(month < 3);
  year += year / 4 - year / 100 + year / 400;
  month = <i32>load<u8>(tab + month - 1);
  const w = (year + month + day) % 7;
  // Use ISO 8601 which has [1, 7] range to represent Monday-Sunday
  return w + (w <= 0 ? 7 : 0);
}

export function getPartsFromEpoch(epochNanoseconds: i64): DT {
  const quotient = epochNanoseconds / 1_000_000;
  const remainder = epochNanoseconds % 1_000_000;
  let epochMilliseconds = +quotient;
  let nanos = +remainder;
  if (nanos < 0) {
    nanos += 1_000_000;
    epochMilliseconds -= 1;
  }
  const microsecond = i32((nanos / 1_000) % 1_000);
  const nanosecond = i32(nanos % 1_000);

  const item = new Date(epochMilliseconds);
  const year = item.getUTCFullYear();
  const month = item.getUTCMonth() + 1;
  const day = item.getUTCDate();
  const hour = item.getUTCHours();
  const minute = item.getUTCMinutes();
  const second = item.getUTCSeconds();
  const millisecond = item.getUTCMilliseconds();

  return { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond };
}

export function formatTimeZoneOffsetString(offsetNanoseconds: i64): string {
  const sign = offsetNanoseconds < 0 ? '-' : '+';
  const balanced = balanceTime(0, 0, 0, 0, 0, abs(offsetNanoseconds));
  return sign + toPaddedString(balanced.hour) + ":" + toPaddedString(balanced.minute);
}

// @ts-ignore: decorator
@inline
export function toPaddedString(number: i32, length: i32 = 2): string {
  return number.toString().padStart(length, "0");
}


// modified of
// https://github.com/tc39/proposal-temporal/blob/49629f785eee61e9f6641452e01e995f846da3a1/polyfill/lib/ecmascript.mjs#L2157
// @ts-ignore: decorator
@inline
export function leapYear(year: i32): bool {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

// @ts-ignore: decorator
@inline
export function floorDiv<T extends number>(a: T, b: T): T {
  return (a >= 0 ? a : a - b + 1) / b as T;
}

// https://github.com/tc39/proposal-temporal/blob/49629f785eee61e9f6641452e01e995f846da3a1/polyfill/lib/ecmascript.mjs#L2164
function balanceYearMonth(year: i32, month: i32): YM {
  month -= 1;
  year  += floorDiv(month, 12);
  month %= 12;
  month += month < 0 ? 13 : 1;
  return { year, month };
}

// modified of
// https://github.com/tc39/proposal-temporal/blob/49629f785eee61e9f6641452e01e995f846da3a1/polyfill/lib/ecmascript.mjs#L2164
export function daysInMonth(year: i32, month: i32): i32 {
  return month == 2
    ? 28 + i32(leapYear(year))
    : 30 + ((month + i32(month >= 8)) & 1);
}

// @ts-ignore: decorator
@inline
export function daysInYear(year: i32): i32 {
  return 365 + i32(leapYear(year));
}

// https://github.com/tc39/proposal-temporal/blob/49629f785eee61e9f6641452e01e995f846da3a1/polyfill/lib/ecmascript.mjs#L2173
function balanceDate(year: i32, month: i32, day: i32): YMD {
  const yearMonth = balanceYearMonth(year, month);

  year  = yearMonth.year;
  month = yearMonth.month;

  let daysPerYear = 0;
  let testYear = month > 2 ? year : year - 1;

  while (((daysPerYear = daysInYear(testYear)), day < -daysPerYear)) {
    year -= 1;
    testYear -= 1;
    day += daysPerYear;
  }

  testYear += 1;

  while (((daysPerYear = daysInYear(testYear)), day > daysPerYear)) {
    year += 1;
    testYear += 1;
    day -= daysPerYear;
  }

  while (day < 1) {
    const yearMonth = balanceYearMonth(year, month - 1);
    year  = yearMonth.year;
    month = yearMonth.month;
    day  += daysInMonth(year, month);
  }

  let monthDays = 0;
  while (monthDays = daysInMonth(year, month), day > monthDays) {
    const yearMonth = balanceYearMonth(year, month + 1);
    year  = yearMonth.year;
    month = yearMonth.month;
    day  -= monthDays;
  }

  return { year, month, day };
}

export function balanceDateTime(year: i32, month: i32, day: i32, hour: i32,
  minute: i32,
  second: i32,
  millisecond: i32,
  microsecond: i32,
  nanosecond: i64): DT {

  const balancedTime = balanceTime(hour, minute, second, millisecond, microsecond, nanosecond);
  const balancedDate = balanceDate(year, month, day + balancedTime.deltaDays);

  return {
    year: balancedDate.year,
    month: balancedDate.month,
    day: balancedDate.day,
    hour: balancedTime.hour,
    minute: balancedTime.minute,
    second: balancedTime.second,
    millisecond: balancedTime.millisecond,
    microsecond: balancedTime.microsecond,
    nanosecond: balancedTime.nanosecond
  };
}

function balanceTime(
  hour: i64,
  minute: i64,
  second: i64,
  millisecond: i64,
  microsecond: i64,
  nanosecond: i64
): BalancedTime {

  let quotient = floorDiv(nanosecond, 1000);
  microsecond += quotient;
  nanosecond  -= quotient * 1000;

  quotient = floorDiv(microsecond, 1000);
  millisecond += quotient;
  microsecond -= quotient * 1000;

  quotient = floorDiv(millisecond, 1000);
  second      += quotient;
  millisecond -= quotient * 1000;

  quotient = floorDiv(second, 60);
  minute += quotient;
  second -= quotient * 60;

  quotient = floorDiv(minute, 60);
  hour   += quotient;
  minute -= quotient * 60;

  let deltaDays = floorDiv(hour, 24);
  hour -= deltaDays * 24;

  return {
    deltaDays: i32(deltaDays),
    hour: i32(hour),
    minute: i32(minute),
    second: i32(second),
    millisecond: i32(millisecond),
    microsecond: i32(microsecond),
    nanosecond: i32(nanosecond)
  };
}