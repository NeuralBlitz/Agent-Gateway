# SSL/TLS Skill

SSL certificate management.

## Commands

### Generate Cert
```
/ssl gen <domain>
```
Generate self-signed certificate.

### Generate CSR
```
/ssl csr <domain>
```
Generate CSR.

### Sign CSR
```
/ssl sign <csr>
```
Sign CSR.

### Verify Cert
```
/ssl verify <cert>
```
Verify certificate.

### Cert Info
```
/ssl info <cert>
```
Show certificate details.

### Expiry
```
/ssl expiry <cert>
```
Check certificate expiry.

### Convert Format
```
/ssl convert <cert> <format>
```
Convert certificate format.

### Combine
```
/ssl combine <cert> <key> <output>
```
Combine cert and key to PEM.

### Extract Key
```
/ssl extract-key <pem>
```
Extract private key.

### Extract Cert
```
/ssl extract-cert <pem>
```
Extract certificate.

### Check Chain
```
/ssl chain <cert>
```
Verify certificate chain.

### Test SSL
```
/ssl test <domain>
```
Test SSL configuration.

### Download Cert
```
/ssl download <domain>
```
Download certificate.

### Renew
```
/ssl renew <domain>
```
Renew certificate.

## Examples

```
/ssl gen mydomain.com
/ssl csr mydomain.com
/ssl sign request.csr
/ssl verify server.crt
/ssl info server.crt
/ssl expiry server.crt
/ssl convert server.crt der
/ssl combine server.crt server.key server.pem
/ssl extract-key bundle.pem
/ssl chain server.crt
/ssl test mydomain.com
/ssl download mydomain.com
```
