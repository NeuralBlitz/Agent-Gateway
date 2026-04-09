# Cert-Manager Skill

TLS certificate management.

## Commands

### Certificates
```
/certmanager certs
```
List certificates.

### Certificate Details
```
/certmanager cert <name>
```
Get certificate.

### Certificate Request
```
/certmanager cr
```
List certificate requests.

### Issuer
```
/certmanager issuer
```
List issuers.

### Cluster Issuer
```
/certmanager clusterissuer
```
List cluster issuers.

### Order
```
/certmanager order
```
List orders.

### Challenge
```
/certmanager challenge
```
List challenges.

### Approve
```
/certmanager approve <cr>
```
Approve certificate request.

### Deny
```
/certmanager deny <cr>
```
Deny certificate request.

### Create Certificate
```
/certmanager create cert <name>
```
Create certificate.

### Create Issuer
```
/certmanager create issuer <name>
```
Create issuer.

### Renew
```
/certmanager renew <cert>
```
Renew certificate.

### Debug
```
/certmanager debug <cert>
```
Debug certificate issues.

## Examples

```
/certmanager certs
/certmanager cert mycert
/certmanager cr
/certmanager issuer
/certmanager clusterissuer letsencrypt-prod
/certmanager order
/certmanager challenge
/certmanager approve my-cr
/certmanager deny my-cr
/certmanager create cert mycert
/certmanager create issuer myissuer
/certmanager renew mycert
/certmanager debug mycert
```
