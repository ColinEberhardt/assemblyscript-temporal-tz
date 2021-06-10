## assemblyscript-temporal-tz

Time-zone aware classes as a complement to https://github.com/ColinEberhardt/assemblyscript-temporal

This is very much a work-in-progress!

## Development progress

### ZonedDateTime

 Constructor
 - [ ] new Temporal.ZonedDateTime

 Static methods
 - [ ] from
 - [ ] compare
 
 Properties
 - [x] year
 - [x] month
 - [x] day
 - [x] hour
 - [x] minute
 - [x] second
 - [x] millisecond
 - [x] microsecond
 - [x] nanosecond
 - [x] epochSeconds
 - [x] epochMilliseconds
 - [x] epochMicroseconds
 - [x] epochNanoseconds
 - [ ] calendar
 - [x] timeZone
 - [ ] era
 - [ ] eraYear
 - [x] dayOfWeek
 - [x] dayOfYear
 - [x] weekOfYear
 - [x] daysInWeek
 - [x] daysInMonth
 - [x] daysInYear
 - [x] monthsInYear
 - [x] inLeapYear
 - [x] hoursInDay
 - [x] startOfDay
 - [x] offsetNanoseconds
 - [x] offset

Methods
 - [x] with
 - [ ] withPlainTime
 - [ ] withPlainDate
 - [ ] withTimeZone
 - [ ] withCalendar
 - [x] add
 - [x] subtract
 - [ ] until
 - [ ] since
 - [ ] round
 - [ ] equals
 - [ ] toString
 - [ ] toLocaleString
 - [ ] toJSON
 - [ ] valueOf
 - [ ] toInstant
 - [ ] toPlainTime
 - [ ] toPlainDateTime
 - [ ] toPlainYearMonth
 - [ ] toPlainMonthDay
 - [ ] getISOFields

### Timezone

Constructor
 - [ ] new Temporal.TimeZone

Static methods
 - [ ] from

Properties
 - [ ] id

Methods
 - [x] getOffsetNanosecondsFor
 - [x] getOffsetStringFor
 - [x] getPlainDateTimeFor
 - [x] getInstantFor
 - [x] getPossibleInstantsFor
 - [ ] getNextTransition
 - [ ] getPreviousTransition
 - [ ] toString
 - [ ] toJSON

Features
 - [x] regional / zoned timezones
 - [ ] fixed UTC offsets