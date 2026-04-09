# API Skill

API design, testing, and documentation.

## Commands

### Test Endpoint
```
/api test <method> <url>
```
Test API endpoint.

### POST Request
```
/api post <url> <json>
```
Send POST request.

### GET Request
```
/api get <url>
```
Send GET request.

### PUT Request
```
/api put <url> <json>
```
Send PUT request.

### DELETE Request
```
/api delete <url>
```
Send DELETE request.

### Headers
```
/api headers <url>
```
Show response headers.

### Status Code
```
/api status <url>
```
Check HTTP status.

### Auth Header
```
/api auth <token>
```
Set authorization header.

### JSON Format
```
/api format <json>
```
Format/pretty print JSON.

### Validate JSON
```
/api validate <json>
```
Validate JSON syntax.

### Generate Token
```
/api token <type>
```
Generate token. Types: jwt, api-key, bearer.

### Curl
```
/api curl <curl-command>
```
Execute curl command.

### Mock Server
```
/api mock <endpoint> <response>
```
Create mock endpoint.

### Rate Limit
```
/api rate <url>
```
Check rate limits.

## Examples

```
/api get https://api.example.com/users
/api post https://api.example.com/users '{"name": "John"}'
/api put https://api.example.com/users/1 '{"name": "Jane"}'
/api delete https://api.example.com/users/1
/api headers https://api.example.com
/api status https://api.example.com
/api auth eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
/api format '{"name": "test"}'
/api validate '{"valid": true}'
/api token jwt
```
