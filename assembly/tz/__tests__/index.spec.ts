import { offsetForTimezone } from "../index";

const testDate = (
  date: string,
  offset: i32,
  timezone: string = "Europe/London"
): void => {
  expect(
    offsetForTimezone(timezone, Date.parse(date).getTime())
  ).toBe(offset, date);
};

describe("offsetForTimezone", () => {
  it("returns standard offset when no rule refs present", () => {
    // UK times pre 1847 always have a -75 sec offset applied
    testDate("1830-3-1", -75000);
  });

  it("returns the offset defined by the rules", () => {
    // test the most recent BST transition based on EU rules
    testDate("2021-03-28T00:59:00", 0);
    testDate("2021-03-28T01:00:00", 3600000);
    testDate("2021-10-31T00:59:00", 3600000);
    testDate("2021-10-31T01:00:00", 0);

    // Within 1994, the GB-Eire rules are applied
    // the shift back to UTC occurs on "Oct	Sun>=22", which is different
    // to the EU rules which specify lastSun.
    
    testDate("1994-03-27T00:59:00", 0); 
    // TimeZone.from("Europe/London").getOffsetStringFor("1994-03-27T00:59:00Z") 
    // +00:00
    testDate("1994-03-27T01:00:00", 3600000);
    // TimeZone.from("Europe/London").getOffsetStringFor("1994-03-27T01:00:00Z") 
    // +01:00

    // under EU rules, this would Sun 30th Oct
    testDate("1994-10-23T00:59:00", 3600000);
    testDate("1994-10-23T01:00:00", 0);
  });

  it("handles rules with offsets based on standard time", () => {

    // Within 1972, the GB-Eire rules are applied within Europe/London
    // # The Summer Time Act, 1972
    // Rule	GB-Eire	1972	1980	-	Mar	Sun>=16	2:00s	1:00	BST
    // Rule	GB-Eire	1972	1980	-	Oct	Sun>=23	2:00s	0	GMT
    testDate("1975-03-16T01:59:00", 0);
    testDate("1975-03-16T02:00:00", 3600000);

    // TimeZone.from("Europe/London").getOffsetStringFor("1975-03-16T01:59:00Z") 
    // +00:00
    // TimeZone.from("Europe/London").getOffsetStringFor("1975-03-16T02:00:00Z") 
    // +01:00

    testDate("1975-10-26T01:59:00", 0);
    testDate("1975-10-26T02:00:00", 3600000);
  });
  
});
