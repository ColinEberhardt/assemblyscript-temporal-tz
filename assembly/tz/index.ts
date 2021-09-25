import { zones } from "./iana";
import { AtTimeZone } from "./rule";

// returns the offset in milliseconds for a time, defined in UTC as the number
// of milliseconds from epoch, for a given timezone
export function offsetForTimezone(tz: string, epochMillis: i64): i32 {
  const zone = zones.get(tz);
  const offset = zone.getOffset(epochMillis);
  // if this zone offset has no rules, apply the standard offset
  if (offset.rules.length == 0) {
    return offset.standardOffsetMillis;
  }

  const zoneRules = offset.rules;

  // iterate over the rules and apply those that match
  let currentRuleOffset = 0;
  for (let i = 0; i < zoneRules.length; i++) {
    const rule = zoneRules[i];
    let currentEpochMillis =
      epochMillis +
      offset.standardOffsetMillis +
      // some rules use local time for the daylight saving transition
      (rule.atTimeZone == AtTimeZone.Local ? currentRuleOffset : 0);
    if (rule.matches(currentEpochMillis)) {
      // if the rule matches, apply the offset
      currentRuleOffset = rule.offsetMillis;
    }
  }

  return offset.standardOffsetMillis + currentRuleOffset;
}

export function offsetForTimezoneNanos(tz: string, epochNanos: i64): i64 {
  return i64(offsetForTimezone(tz, epochNanos / 1_000_000)) * 1_000_000;
}
