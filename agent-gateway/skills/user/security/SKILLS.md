# Security Skill

Security scanning and auditing.

## Commands

### Scan Ports
```
/security scan <host>
```
Scan open ports on host.

### Check SSL
```
/security ssl <domain>
```
Check SSL certificate.

### Find Secrets
```
/security secrets [path]
```
Scan for exposed secrets.

### Check Headers
```
/security headers <url>
```
Check security headers.

### SQL Injection Test
```
/security sql-test <url>
```
Test for SQL injection.

### XSS Test
```
/security xss-test <url>
```
Test for XSS vulnerabilities.

### Permissions
```
/security perms <path>
```
Check file permissions.

### Check Password
```
/security password <hash>
```
Check password against breaches.

### Generate Report
```
/security report
```
Generate security report.

## Examples

```
/security scan 192.168.1.1
/security ssl example.com
/security secrets src/
/security headers https://myapp.com
/security sql-test https://test.com/login
/security xss-test https://test.com/search
/security perms /var/www
/security password 5f4dcc3b5aa765d61d8327deb882cf99
/security report
```
