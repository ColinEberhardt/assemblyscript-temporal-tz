import "assemblyscript/std/portable/index";

const globalAny: any = global;
globalAny.log = console.log;

import { offsetForTimezone } from "../assembly/tz/index";

console.log(offsetForTimezone("Europe/London", 1000));