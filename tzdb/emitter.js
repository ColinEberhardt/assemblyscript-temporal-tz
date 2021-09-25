//@ts-check

/**
 * @param name {string}
 * @returns string
 */
function validIdentifier(name) {
  return name.replace(/[^\w_]/, '_');
}

const ruleNameRE = /^[\w_\-]+$/;
const timeRE = /^(?<sign>-?)(?<hours>\d?\d)(:(?<minutes>\d\d))?$/

/**
 * @param name {string} 
 * @returns string
 */
function emitRuleSetReference(name) {
  if (!name || name == '-') {
    return '[]';
  }
  if (ruleNameRE.test(name)) {
    return `RuleSets.${validIdentifier(name)}`;
  }

  const time = timeRE.exec(name);
  if (time) {
    const sign = time.groups.sign == '-' ? -1 : 1;
    const hours = parseInt(time.groups.hours);
    const minutes = parseInt(time.groups.minutes ?? "0");

    const millis = sign * (hours * 60 * 60 * 1000 + minutes * 60 * 1000);
    return `[new SimpleRule(${millis}, "${name}")]`;
  }
  throw new Error(`Invalid rule name: ${name}`);
}

/**
 * @param offset {import("./parser.js").Offset}
 * @returns {string}
 */
function emitZoneOffset(offset) {
  return `
    // ${offset.line.replace("\t", "    ")}
    new ZoneOffset(${offset.standardOffset * 1000}, ${emitRuleSetReference(offset.rules)},
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
 * @param ruleSet {[string, import("./parser.js").Rule[]]}
 * @returns string
 */
function emitRuleSet([name, ruleSet]) {
  return `export const ${validIdentifier(name)} = [${ruleSet.map(emitRule).join(",")}];`;
}

/**
 * @param rules {import("./parser.js").Rule[]}
 * @returns {string}
 */
function emitRules(rules) {
  const ruleSets = new Map();
  rules.forEach(rule => {
    const ruleSet = ruleSets.get(rule.name) ?? [];
    ruleSet.push(rule);
    ruleSets.set(rule.name, ruleSet);
  });

  const ruleSetEntries = [...ruleSets.entries()];

  return `
    export namespace RuleSets {
      ${ruleSetEntries.map(emitRuleSet).join("\n")}
    }
  `;
}

/**
 * @param {import("./parser.js").Database} tzdb
 * @returns {string}
 */
export function emit(tzdb) {
  return `
  import { Rule, DayOfMonth, NextDayAfter, LastDay, AtTimeZone, SimpleRule } from "./rule";
  import { Zone, ZoneOffset } from "./zone";

  export const zones = new Map<string, Zone>();
  ${emitZones(tzdb.zones)};

  ${emitRules(tzdb.rules)};
`;
}

