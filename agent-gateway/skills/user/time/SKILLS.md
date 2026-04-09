# Time Skill

Time and date operations.

## Commands

### Current Time
```
/time now [timezone]
```
Show current time. Default: local.

### Unix Timestamp
```
/time timestamp
```
Show current Unix timestamp.

### From Timestamp
```
/time from-ts <timestamp>
```
Convert timestamp to date.

### Parse Date
```
/time parse <date>
```
Parse date string.

### Add Time
```
/time add <duration> [unit]
```
Add time. Units: seconds, minutes, hours, days.

### Subtract Time
```
/time sub <duration> [unit]
```
Subtract time.

### Time Diff
```
/time diff <date1> <date2>
```
Calculate time difference.

### Format
```
/time format <date> <format>
```
Format date (Y-m-d, H:i:s, etc).

### ISO Format
```
/time iso <date>
```
Convert to ISO 8601.

### Relative
```
/time relative <date>
```
Show relative time (2 hours ago).

### Unix to Date
```
/time unix <timestamp>
```
Convert Unix to date.

## Examples

```
/time now
/time now UTC
/time timestamp
/time from-ts 1700000000
/time add 30 minutes
/time sub 2 hours
/time diff "2024-01-01" "2024-01-02"
/time format now "Y-m-d H:i:s"
/time iso now
/time relative "2024-01-01"
/time unix 1700000000
```
