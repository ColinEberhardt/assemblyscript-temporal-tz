//@ts-check

/**
 * @param offset {import("./parser.js").Offset}
 * @returns {string}
 */
function emitZoneOffset(offset) {
  return `
    // ${offset.line.replace("\t", "    ")}
    new ZoneOffset(${offset.standardOffset * 1000}, "${offset.rules}",
        "${offset.format}", ${offset.until ? offset.until.millis : -1})
  `;
}

/**
 * @param zone {import("./parser.js").Zone} 
 * @returns {string}
 */
function emitZone(zone) {
  return `
    zones.set("${zone.name}",
      new Zone("${zone.name}", [${zone.ruleRefs.map(emitZoneOffset)}]));`;
}

/**
 * @param zones {import("./parser.js").Zone[]}
 * @returns {string}
 */
function emitZones(zones) {
  return zones.map(emitZone).join("");
}

/**
 * @param day {import("./parser.js").Day}
 * @returns {string}
 */
function emitDay(day) {
  if (day.type == "day") {
    return `new DayOfMonth(${day.value})`;
  }
  if (day.type == "next-day-after") {
    return `new NextDayAfter(${day.dayOfWeek}, ${day.day})`;
  }
  if (day.type == "last-day") {
    return `new LastDay(${day.value})`;
  }
}

/**
 * @param rule {import("./parser.js").Rule}
 * @returns {string}
 */
function emitRule(rule) {
  return `
  // ${rule.line.replace("\t", "    ")}
  new Rule("${rule.name}", ${rule.startYear}, ${rule.endYear},
    ${rule.inMonth}, ${emitDay(rule.day)}, ${rule.time.totalMinutes},
    ${rule.time.zone === "local" ? "AtTimeZone.Local" : "AtTimeZone.UTC"},
    ${rule.offset * 1000})
`;
}

/**
 * @param rules {import("./parser.js").Rule[]}
 * @returns {string}
 */
function emitRules(rules) {
  return `
    const rules = [${rules.map(emitRule).join(",")}];
  `;
}

/**
 * @param {import("./parser.js").Database} tzdb
 * @returns {string}
 */
export function emit(tzdb) {
  return `
  import { Rule, DayOfMonth, NextDayAfter, LastDay, AtTimeZone } from "./rule";
  import { Zone, ZoneOffset } from "./zone";

  const zones = new Map<string, Zone>();
  ${emitZones(tzdb.zones)};

  ${emitRules(tzdb.rules)};

  export {
    zones, rules
  };
`;
}

