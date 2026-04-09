# Cron Skill

Cron job management.

## Commands

### List Crons
```
/cron list
```
List all cron jobs.

### Add Cron
```
/cron add <schedule> <command>
```
Add cron job.

### Remove Cron
```
/cron remove <id>
```
Remove cron job.

### Enable Cron
```
/cron enable <id>
```
Enable cron job.

### Disable Cron
```
/cron disable <id>
```
Disable cron job.

### Next Run
```
/cron next <schedule>
```
Show next run time for schedule.

### Validate
```
/cron validate <schedule>
```
Validate cron schedule.

### Cron Logs
```
/cron logs
```
Show cron execution logs.

## Examples

```
/cron list
/cron add "0 * * * *" "backup.sh"
/cron remove 1
/cron disable 2
/cron next "*/5 * * * *"
/ron validate "0 0 * * *"
/cron logs
```
