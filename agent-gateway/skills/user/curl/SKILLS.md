# cURL Skill

HTTP client operations.

## Commands

### GET
```
/curl get <url>
```
Send GET request.

### POST
```
/curl post <url> <data>
```
Send POST request.

### PUT
```
/curl put <url> <data>
```
Send PUT request.

### DELETE
```
/curl delete <url>
```
Send DELETE request.

### PATCH
```
/curl patch <url> <data>
```
Send PATCH request.

### HEAD
```
/curl head <url>
```
Send HEAD request.

### Options
```
/curl options <url>
```
Send OPTIONS request.

### Download
```
/curl download <url> <file>
```
Download file.

### Upload
```
/curl upload <file> <url>
```
Upload file.

### Auth
```
/curl auth <url> <user> <pass>
```
Basic auth.

### Bearer
```
/curl bearer <url> <token>
```
Bearer token auth.

### JSON
```
/curl json <url> <data>
```
POST JSON.

### Headers
```
/curl headers <url>
```
Show headers.

### Follow Redirects
```
/curl follow <url>
```
Follow redirects.

### Verbose
```
/curl verbose <url>
```
Verbose output.

## Examples

```
/curl get https://api.example.com/users
/curl post https://api.example.com/users '{"name": "John"}'
/curl put https://api.example.com/users/1 '{"name": "Jane"}'
/curl delete https://api.example.com/users/1
/curl patch https://api.example.com/users/1 '{"age": 30}'
/curl head https://example.com
/curl options https://example.com
/curl download https://example.com/file.zip
/curl upload file.txt https://upload.example.com
/curl auth https://api.example.com admin password
/curl bearer https://api.example.com eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
/curl json https://api.example.com/users '{"name": "Test"}'
/curl headers https://example.com
/curl follow https://example.com
/curl verbose https://example.com
```
