# Webhook Skill

Webhook management and testing.

## Commands

### Send Webhook
```
/webhook send <url> <method> <payload>
```
Send webhook request.

### POST
```
/webhook post <url> <json>
```
Send POST request.

### GET
```
/webhook get <url>
```
Send GET request.

### PUT
```
/webhook put <url> <json>
```
Send PUT request.

### DELETE
```
/webhook delete <url>
```
Send DELETE request.

### Headers
```
/webhook headers <url>
```
Show response headers.

### Status
```
/webhook status <url>
```
Check URL HTTP status.

### Test Webhook
```
/webhook test <url> <event>
```
Send test webhook event.

### Monitor
```
/webhook monitor <url>
```
Monitor webhook endpoint.

## Examples

```
/webhook post https://api.example.com/webhook '{"event": "user.created"}'
/webhook get https://api.example.com/status
/webhook status https://myapp.com
/webhook test https://hooks.example.com/test deployment
```
