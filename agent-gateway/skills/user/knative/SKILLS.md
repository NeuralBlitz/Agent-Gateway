# Knative Skill

Serverless on Kubernetes.

## Commands

### List Services
```
/knative services
```
List services.

### Create Service
```
/knative service create <name> <image>
```
Create service.

### Update Service
```
/knative service update <name>
```
Update service.

### Delete Service
```
/knative service delete <name>
```
Delete service.

### Revisions
```
/knative revisions
```
List revisions.

### Traffic
```
/knative traffic <service>
```
Manage traffic.

### Routes
```
/knative routes
```
List routes.

### Event Sources
```
/knative sources
```
List event sources.

### Create Source
```
/knative source create <name>
```
Create source.

### Triggers
```
/knative triggers
```
List triggers.

### Create Trigger
```
/knative trigger create <name>
```
Create trigger.

### Broker
```
/knative broker
```
List brokers.

### Channel
```
/knative channel
```
List channels.

### Describe
```
/knative describe <service>
```
Describe service.

### Revision List
```
/knative revision list <service>
```
List revisions.

## Examples

```
/knative services
/knative service create myapp ghcr.io/org/app:latest
/knative service update myapp --image ghcr.io/org/app:v2
/knative service delete myapp
/knative revisions
/knative traffic myapp
/knative routes
/knative sources
/knative source create timer
/knative triggers
/knative trigger create mytrigger
/knative broker default
/knative channel
/knative describe myapp
/knative revision list myapp
```
