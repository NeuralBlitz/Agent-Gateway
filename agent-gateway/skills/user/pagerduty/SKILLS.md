# PagerDuty Skill

Incident management and on-call.

## Commands

### List Incidents
```
/pd incidents
```
List incidents.

### Incident Details
```
/pd incident <id>
```
Show incident details.

### Acknowledge
```
/pd ack <incident>
```
Acknowledge incident.

### Resolve
```
/pd resolve <incident>
```
Resolve incident.

### Reassign
```
/pd reassign <incident> <user>
```
Reassign incident.

### Escalate
```
/pd escalate <incident>
```
Escalate incident.

### Create Incident
```
/pd create <title> <service>
```
Create new incident.

### On-Call
```
/pd oncall
```
Show who's on-call.

### Schedule List
```
/pd schedules
```
List schedules.

### Override
```
/pd override <schedule> <user> <time>
```
Create override.

### Add Note
```
/pd note <incident> <text>
```
Add note to incident.

### Teams
```
/pd teams
```
List teams.

### Services
```
/pd services
```
List services.

## Examples

```
/pd incidents
/pd incident P12345
/pd ack P12345
/pd resolve P12345
/pd reassign P12345 alice
/pd escalate P12345
/pd create "Production down" prod-service
/pd oncall
/pd schedules
/pd override schedule1 bob "2024-01-01 09:00-17:00"
/pd note P12345 "Investigating"
/pd teams
/pd services
```
