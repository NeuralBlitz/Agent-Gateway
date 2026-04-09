# Email Skill

Email operations and sending.

## Commands

### Send Email
```
/email send <to> <subject> <body>
```
Send email.

### Send HTML
```
/email send-html <to> <subject> <html>
```
Send HTML email.

### Send Template
```
/email send-template <to> <template> <data>
```
Send templated email.

### Verify Email
```
/email verify <email>
```
Verify email format.

### List Templates
```
/email templates
```
List available email templates.

## Examples

```
/email send "user@example.com" "Hello" "Message body"
/email send-html "user@example.com" "Welcome" "<h1>Welcome!</h1>"
/email verify "test@email.com"
/email templates
```
