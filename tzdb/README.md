## Timezone support

In order to provide support for timezones, without relying on the JavaScript host or any other time-zone aware environment, this library makes use of the IANA Timezone Database directly:

https://www.iana.org/time-zones

The database files are parsed by the scripts in this folder, which emit AssemblyScript code which is used to process the various rules at runtime.

The following page gives a very good overview of how these files are interpreted:

https://data.iana.org/time-zones/tz-how-to.html

