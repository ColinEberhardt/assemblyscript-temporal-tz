// @ts-check

/**
 * @param name {string}
 * @returns number
 */
function dayNameToNumber(name) {
  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(
    name.toLowerCase()
  ) + 1;
}

/**
 * @typedef {{type:'day',value:number}|{type:'last-day',value:number}|{type:'next-day-after',day:number,dayOfWeek:number}|{type:'parse-error'}} Day
 */

/**
 * @param day {string}
 * @returns {Day}
 */
function parseDay(day) {
  if (day.match(/^[0-9]+$/)) {
    return {
      type: "day",
      value: parseInt(day),
    };
  }
  if (day.match(/^last[A-Za-z]{3}$/)) {
    return {
      type: "last-day",
      value: dayNameToNumber(day.substr(4)),
    };
  }
  let parts = day.match(/^([A-Za-z]{3})>=([0-9]+)$/);
  if (parts) {
    return {
      type: "next-day-after",
      day: parseInt(parts[2]),
      dayOfWeek: dayNameToNumber(parts[1]),
    };
  }

  return {
    type: "parse-error",
  };
}

/**
 * @param zone {string}
 * @returns {"local"|"utc"|"undefined"}
 */
function parseTimeZone(zone) {
  if (zone == "" || zone == "w") {
    return "local";
  }
  if (zone == "g" || zone == "u" || zone == "z" || zone == "s") {
    return "utc";
  }
  return "undefined";
}

/**
 * @typedef {object} Time
 * @property {number} hour
 * @property {number} minute
 * @property {number} totalMinutes
 * @property {"undefined" | "local" | "utc"} zone
 */

const timeRE = /([0-9]{1,2}):([0-9]{1,2})([a-z])?/;

/**
 * @param time {string}
 * @returns {Time}
 */
function parseTime(time) {
  try {
    const parts = time.match(timeRE);
    const hour = parseInt(parts[1]);
    const minute = parseInt(parts[2]);
    return {
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
      zone: parts[3] ? parseTimeZone(parts[3]) : "local",
    };
  } catch {
    throw new Error(`Unable to parse time [${time}]`);
  }
}

/**
 * @param offset {string}
 * @returns {number}
 */
function parseOffset(offset) {
  let sign = 1;
  if (offset.startsWith("-")) {
    sign = -1;
    offset = offset.substr(1);
  }

  const parts = offset.split(":");
  if (parts.length == 3) {
    return (
      sign *
      (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]))
    );
  }
  if (parts.length == 2) {
    return sign * (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60);
  }
  if (parts.length == 1) {
    return sign * parseInt(offset);
  }
}

/**
 * @param endYear {"only"|"max"|string}
 * @param startYear {string}
 * @returns {string}
 */
function parseEndYear(endYear, startYear) {
  if (endYear == "only")
    return startYear;
  if (endYear == "max")
    return "-1";
  return endYear;
}

/**
 * @param month {string}
 * @returns {number}
 */
function monthIndex(month) {
  return [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ].indexOf(month.toLowerCase()) + 1;
}

/**
 * @typedef {object} Until
 * @property {number} year
 * @property {number} month
 * @property {number} day
 * @property {number} hour
 * @property {number} minute
 * @property {number} millis
 * @property {string} zone
 */

const untilRE = /([0-9]{1,4})\s*(\w{3})?\s*([0-9]{1,2})?\s*([0-9]{1,2})?:?([0-9]{1,2})?(u|s)?/;

/**
 * @param until {string}
 * @returns {Until|undefined}
 */
function parseUntil(until) {
  const match = until.match(untilRE);
  if (!match) {
    return;
  }
  /**
   * @type {Until}
   */
  const untilObj = {
    year: parseInt(match[1]),
    month: monthIndex(match[2] ?? "Jan"),
    day: parseInt(match[3] ?? "1"),
    hour: parseInt(match[4] ?? "00"),
    minute: parseInt(match[5] ?? "00"),
    zone: match[6] ?? "u",
    millis: -1,
  };
  // TODO - consider utc / standard time offsets
  untilObj.millis = Date.UTC(
    untilObj.year,
    untilObj.month,
    untilObj.day,
    untilObj.hour,
    untilObj.minute
  );
  return untilObj;
}

/**
 * @typedef {object} Rule
 * @property {string} name
 * @property {number} startYear
 * @property {number} endYear
 * @property {number} inMonth
 * @property {Day} day
 * @property {Time} time
 * @property {number} offset
 * @property {string} letter
 * @property {string} line
 */

/**
 * @param line {string}
 * @returns {Rule}
 */
function parseRule(line) {
  const cols = line.split(/[\t ]+/);
  return {
    name: cols[1],
    startYear: parseInt(cols[2]),
    endYear: parseInt(parseEndYear(cols[3], cols[2])),
    inMonth: monthIndex(cols[5]),
    day: parseDay(cols[6]),
    time: parseTime(cols[7]),
    offset: parseOffset(cols[8]),
    letter: cols[9],
    line,
  };
}

/**
 * @typedef {object} Offset
 * @property {number} standardOffset
 * @property {string} rules
 * @property {string} format
 * @property {Until} until
 * @property {string} line
 */

const zoneRE = /^(Zone)?\s+(?<name>[0-9a-zA-Z_+\-\/]*)?\s+(?<offset>-?[0-9]{1,2}(:[0-9]{1,2}(:[0-9]{1,2})?)?)\s+(?<rules>[A-Za-z_\-]+|-?[0-9]{1,2}:[0-9]{1,2})\s+(?<format>[A-Za-z0-9+\-%\/]+)(\s+(?<until>.*))?(\s*#(?<comment>.*))?$/

/**
 * @param line {string} 
 * @returns {Offset}
 */
function parseZone(line) {
  try {
    const match = line.match(zoneRE);

    return {
      standardOffset: parseOffset(match.groups.offset),
      rules: match.groups.rules,
      format: match.groups.format,
      until: parseUntil(match.groups.until ?? ''),
      line,
    };
  } catch {
    throw new Error(`Unable to parse zone [${line}]`);
  }
}

/**
 * @typedef {object} Zone
 * @property {string} name
 * @property {Offset[]} ruleRefs
 */

/**
 * @typedef {object} Database
 * @property {Zone[]} zones
 * @property {Rule[]} rules 
 */

/**
 * parse the IANA database
 * @param tzDatabase {string}
 * @returns {Database}
 */
export function parseDatabase(tzDatabase) {
  const lines = tzDatabase.split("\n");

  /**@type {Rule[]} */
  const rules = [];
  /**@type {Zone[]} */
  const zones = [];

  /**@type Zone */
  let zone;
  lines.forEach((line, index) => {
    try {
      if (line.startsWith("#"))
        return;

      if (zone) {
        if (line.trim() == "") {
          zones.push(zone);
          zone = undefined;
          return;
        }
        const nextZone = parseZone(line);
        zone.ruleRefs.push(nextZone);
        if (!nextZone.until) {
          zones.push(zone);
          zone = undefined;
          return;
        }
      } else if (line.startsWith("Rule")) {
        rules.push(parseRule(line));
      } else if (line.startsWith("Zone")) {
        const cols = line.split(/[\t ]+/);
        zone = {
          name: cols[1],
          ruleRefs: [parseZone(line)],
        };
      }
    } catch (e) {
      console.log(`line ${index}: ${e.message}`);
    }
  });
  return { zones, rules };
}
