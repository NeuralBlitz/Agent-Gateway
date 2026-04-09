---
name: tls-ssl
description: TLS/SSL certificate management and encryption
category: networking
difficulty: intermediate
tags: [tls, ssl, encryption, certificate, https]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# TLS/SSL Certificates

## What I Do

I am TLS (Transport Layer Security), the cryptographic protocol providing secure communications over networks. I evolved from SSL to provide encryption, authentication, and integrity for data in transit. I use X.509 certificates to authenticate servers and optionally clients. I support various cipher suites for encryption, with modern best practices favoring AEAD ciphers like AES-GCM and ChaCha20-Poly1305. I implement perfect forward secrecy through ephemeral key exchanges. I enable HTTPS, secure APIs, and encrypted microservices communication. I help organizations meet compliance requirements and protect sensitive data during transmission.

## When to Use Me

- HTTPS web server configuration
- API security and authentication
- Service-to-service encryption
- Email server security (SMTPS, IMAPS)
- Database connection encryption
- VPN and secure tunnel establishment
- IoT device communication security
- Legacy system security upgrades

## Core Concepts

**X.509 Certificates**: Digital documents binding public keys to identities, signed by certificate authorities.

**Certificate Chain**: Hierarchy from root CA to intermediate to leaf certificates.

**TLS Handshake**: Protocol negotiation, key exchange, and authentication process.

**Cipher Suites**: Combinations of algorithms for key exchange, encryption, and integrity.

**Perfect Forward Secrecy**: Ephemeral keys ensuring past communications remain secure.

**OCSP Stapling**: Real-time certificate validity checking.

**Certificate Pinning**: Hardcoding expected certificates for additional security.

## Code Examples

### Example 1: TLS Server Implementation (Go)
```go
package main

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/tls"
    "crypto/x509"
    "crypto/x509/pkix"
    "encoding/pem"
    "fmt"
    "log"
    "math/big"
    "net"
    "os"
    "time"
)

type TLSServer struct {
    addr         string
    port         int
    certFile     string
    keyFile      string
    minTLSVersion uint16
    cipherSuites []uint16
}

func NewTLSServer(addr string, port int, certFile, keyFile string) *TLSServer {
    return &TLSServer{
        addr:         addr,
        port:         port,
        certFile:     certFile,
        keyFile:      keyFile,
        minTLSVersion: tls.VersionTLS13,
        cipherSuites: []uint16{
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
        },
    }
}

func (s *TLSServer) generateSelfSignedCert() error {
    privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
    if err != nil {
        return fmt.Errorf("failed to generate private key: %w", err)
    }
    
    serialNumber, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
    
    template := x509.Certificate{
        SerialNumber: serialNumber,
        Subject: pkix.Name{
            Organization: []string{"Example Corp"},
            Country:      []string{"US"},
            Province:     []string{""},
            Locality:     []string{"San Francisco"},
            StreetAddress: []string{""},
            CommonName:   "localhost",
        },
        NotBefore:             time.Now(),
        NotAfter:              time.Now().Add(365 * 24 * time.Hour),
        KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
        ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
        BasicConstraintsValid: true,
        DNSNames:              []string{"localhost", "*.localhost"},
        IPAddresses:           []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")},
    }
    
    certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
    if err != nil {
        return fmt.Errorf("failed to create certificate: %w", err)
    }
    
    certFile, err := os.Create(s.certFile)
    if err != nil {
        return fmt.Errorf("failed to create cert file: %w", err)
    }
    defer certFile.Close()
    
    pem.Encode(certFile, &pem.Block{Type: "CERTIFICATE", Bytes: certDER})
    
    keyFile, err := os.OpenFile(s.keyFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
    if err != nil {
        return fmt.Errorf("failed to create key file: %w", err)
    }
    defer keyFile.Close()
    
    pem.Encode(keyFile, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(privateKey)})
    
    return nil
}

func (s *TLSServer) createTLSConfig() *tls.Config {
    cert, err := tls.LoadX509KeyPair(s.certFile, s.keyFile)
    if err != nil {
        log.Printf("Warning: Failed to load certificates: %v", err)
        if err := s.generateSelfSignedCert(); err != nil {
            log.Fatalf("Failed to generate self-signed certificate: %v", err)
        }
        cert, _ = tls.LoadX509KeyPair(s.certFile, s.keyFile)
    }
    
    return &tls.Config{
        Certificates: []tls.Certificate{cert},
        MinVersion:   s.minTLSVersion,
        CipherSuites: s.cipherSuites,
        CurvePreferences: []tls.CurveID{
            tls.X25519,
            tls.CurveP256,
        },
        NextProtos: []string{"h2", "http/1.1"},
        SessionTicketsDisabled: false,
        ClientAuth:             tls.NoClientCert,
    }
}

func (s *TLSServer) Start() error {
    config := s.createTLSConfig()
    
    listener, err := tls.Listen("tcp", fmt.Sprintf("%s:%d", s.addr, s.port), config)
    if err != nil {
        return fmt.Errorf("failed to start TLS listener: %w", err)
    }
    defer listener.Close()
    
    log.Printf("TLS server listening on %s:%d", s.addr, s.port)
    
    for {
        conn, err := listener.Accept()
        if err != nil {
            log.Printf("Failed to accept connection: %v", err)
            continue
        }
        
        go s.handleConnection(conn)
    }
}

func (s *TLSServer) handleConnection(conn net.Conn) {
    defer conn.Close()
    
    state := conn.(*tls.Conn).State()
    log.Printf("Connection from %s", conn.RemoteAddr())
    log.Printf("TLS Version: %x", state.Version)
    log.Printf("Cipher Suite: %x", state.CipherSuite)
    
    buffer := make([]byte, 4096)
    for {
        n, err := conn.Read(buffer)
        if err != nil {
            log.Printf("Connection closed: %v", err)
            return
        }
        
        log.Printf("Received %d bytes", n)
        
        response := []byte(fmt.Sprintf("TLS Server Response. Secure connection established.\n"))
        conn.Write(response)
    }
}

// Certificate chain validation
func validateCertificateChain(chain []*x509.Certificate) error {
    if len(chain) == 0 {
        return fmt.Errorf("empty certificate chain")
    }
    
    for i, cert := range chain {
        if cert.NotAfter.Before(time.Now()) {
            return fmt.Errorf("certificate expired at index %d", i)
        }
        
        if !cert.NotBefore.Before(time.Now()) {
            return fmt.Errorf("certificate not yet valid at index %d", i)
        }
        
        if cert.KeyUsage&x509.KeyUsageDigitalSignature == 0 {
            return fmt.Errorf("certificate at index %d lacks digital signature capability", i)
        }
    }
    
    return nil
}
```

### Example 2: Certificate Management (Python)
```python
import subprocess
import datetime
import os
from typing import Optional, Dict, List
from dataclasses import dataclass
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID

@dataclass
class CertificateInfo:
    subject: str
    issuer: str
    serial_number: str
    not_before: datetime.datetime
    not_after: datetime.datetime
    days_remaining: int
    is_valid: bool
    public_key_size: int
    signature_algorithm: str

class CertificateManager:
    def __init__(self, ca_cert_path: str = None, ca_key_path: str = None):
        self.ca_cert_path = ca_cert_path
        self.ca_key_path = ca_key_path
    
    def generate_private_key(self, key_size: int = 4096, output_path: str = None) -> rsa.RSAPrivateKey:
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption()
                ))
        
        return private_key
    
    def generate_ca_certificate(
        self,
        private_key: rsa.RSAPrivateKey,
        common_name: str,
        organization: str,
        country: str = "US",
        validity_days: int = 3650
    ) -> x509.Certificate:
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, country),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ])
        
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.utcnow())
            .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=validity_days))
            .add_extension(
                x509.BasicConstraints(ca=True, path_length=0),
                critical=True,
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_encipherment=False,
                    content_commitment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=True,
                    crl_sign=True,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .sign(private_key, hashes.SHA256(), default_backend())
        )
        
        return cert
    
    def generate_server_certificate(
        self,
        private_key: rsa.RSAPrivateKey,
        ca_private_key: rsa.RSAPrivateKey,
        ca_certificate: x509.Certificate,
        common_name: str,
        sans: List[str] = None,
        validity_days: int = 365
    ) -> x509.Certificate:
        subject = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ])
        
        builder = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(ca_certificate.subject)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.utcnow())
            .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=validity_days))
        )
        
        if sans:
            san_list = []
            for san in sans:
                if san.replace('.', '').isdigit():
                    san_list.append(x509.IPAddress(x509.ip_address_bytes(san.encode())))
                else:
                    san_list.append(x509.DNSName(san))
            
            builder = builder.add_extension(
                x509.SubjectAlternativeName(san_list),
                critical=False,
            )
        
        cert = (
            builder
            .add_extension(
                x509.BasicConstraints(ca=False, path_length=None),
                critical=True,
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_encipherment=True,
                    content_commitment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=False,
                    crl_sign=False,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .add_extension(
                x509.ExtendedKeyUsage([
                    x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
                ]),
                critical=False,
            )
            .sign(ca_private_key, hashes.SHA256(), default_backend())
        )
        
        return cert
    
    def save_certificate(self, cert: x509.Certificate, output_path: str):
        with open(output_path, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
    
    def load_certificate(self, cert_path: str) -> x509.Certificate:
        with open(cert_path, 'rb') as f:
            return x509.load_pem_x509_certificate(f.read(), default_backend())
    
    def get_certificate_info(self, cert_path: str) -> CertificateInfo:
        cert = self.load_certificate(cert_path)
        
        now = datetime.datetime.utcnow()
        days_remaining = (cert.not_valid_after - now).days
        
        try:
            common_name = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        except IndexError:
            common_name = "Unknown"
        
        return CertificateInfo(
            subject=cert.subject.rfc4514_string(),
            issuer=cert.issuer.rfc4514_string(),
            serial_number=str(cert.serial_number),
            not_before=cert.not_valid_before_utc,
            not_after=cert.not_valid_after_utc,
            days_remaining=days_remaining,
            is_valid=days_remaining > 0,
            public_key_size=cert.public_key().key_size,
            signature_algorithm=cert.signature_hash_algorithm.name
        )
    
    def check_certificate_expiry(self, cert_path: str, warning_days: int = 30) -> Dict:
        info = self.get_certificate_info(cert_path)
        
        status = {
            "path": cert_path,
            "subject": info.subject,
            "expiry": info.not_after.isoformat(),
            "days_remaining": info.days_remaining,
            "status": "valid"
        }
        
        if info.days_remaining <= 0:
            status["status"] = "expired"
        elif info.days_remaining <= warning_days:
            status["status"] = "warning"
        
        return status
    
    def verify_certificate_chain(self, cert_path: str, ca_cert_path: str) -> bool:
        cert = self.load_certificate(cert_path)
        ca_cert = self.load_certificate(ca_cert_path)
        
        try:
            ca_cert.public_key().verify(
                cert.signature,
                cert.tbs_certificate_bytes,
                padding=PKCS1v15(),
                algorithm=cert.signature_hash_algorithm
            )
            return True
        except Exception:
            return False
    
    def convert_cert_to_der(self, cert_path: str, output_path: str):
        cert = self.load_certificate(cert_path)
        with open(output_path, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.DER))
    
    def extract_public_key(self, cert_path: str, output_path: str):
        cert = self.load_certificate(cert_path)
        public_key = cert.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        with open(output_path, 'wb') as f:
            f.write(public_key)
```

### Example 3: ACME/Let's Encrypt Client (Python)
```python
import json
import os
import base64
import hashlib
import time
from typing import Dict, Optional
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import requests

class ACMEClient:
    def __init__(self, email: str = None, directory_url: str = "https://acme-v02.api.letsencrypt.org/directory"):
        self.email = email
        self.directory_url = directory_url
        self.directory: Dict = {}
        self.account_key = None
        self.account_url: Optional[str] = None
        self.nonce: Optional[str] = None
    
    def _load_or_create_account_key(self, key_path: str = "account.key"):
        if os.path.exists(key_path):
            with open(key_path, 'rb') as f:
                self.account_key = f.read()
        else:
            from cryptography.hazmat.primitives.asymmetric import rsa
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=4096,
                backend=default_backend()
            )
            self.account_key = private_key.private_bytes(
                encoding=open
            )
            with open(key_path, 'wb') as f:
                f.write(self.account_key)
    
    def _jose(self, payload: Dict, url: str) -> Dict:
        """Create JWS payload for ACME protocol"""
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import serialization
        
        header = {
            "alg": "RS256",
            "jwk": self._get_jwk(),
            "nonce": self.nonce,
            "url": url
        }
        
        protected = base64.urlsafe_b64encode(json.dumps(header).encode()).rstrip(b'=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=')
        
        signing_input = protected + b'.' + payload_b64
        
        private_key = serialization.load_pem_private_key(
            self.account_key, password=None, backend=default_backend()
        )
        
        signature = private_key.sign(
            signing_input,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        
        return {
            "protected": protected.decode(),
            "payload": payload_b64.decode(),
            "signature": base64.urlsafe_b64encode(signature).rstrip(b'=').decode()
        }
    
    def _get_jwk(self) -> Dict:
        """Get JSON Web Key from account key"""
        private_key = serialization.load_pem_private_key(
            self.account_key, password=None, backend=default_backend()
        )
        public_numbers = private_key.public_key().public_numbers()
        
        n_bytes = public_numbers.n.to_bytes((public_numbers.n.bit_length() + 7) // 8, 'big')
        e_bytes = public_numbers.e.to_bytes((public_numbers.e.bit_length() + 7) // 8, 'big')
        
        return {
            "kty": "RSA",
            "n": base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode(),
            "e": base64.urlsafe_b64encode(e_bytes).rstrip(b'=').decode(),
        }
    
    def _get_nonce(self):
        """Get fresh nonce from ACME server"""
        resp = requests.head(self.directory['newNonce'])
        self.nonce = resp.headers['Replay-Nonce']
    
    def _post(self, url: str, payload: Dict = None) -> Dict:
        """Make POST request to ACME server"""
        if payload is None:
            payload = {}
        
        resp = requests.post(
            url,
            json=self._jose(payload, url),
            headers={'Content-Type': 'application/jose+json'}
        )
        
        self.nonce = resp.headers.get('Replay-Nonce', self.nonce)
        
        if resp.status_code >= 400:
            error = resp.json()
            raise Exception(f"ACME error: {error.get('type')}: {error.get('detail')}")
        
        return resp.json()
    
    def _get(self, url: str) -> Dict:
        """Make GET request to ACME server"""
        resp = requests.get(url)
        return resp.json()
    
    def fetch_directory(self):
        """Fetch ACME directory"""
        self.directory = self._get(self.directory_url)
    
    def create_account(self, terms_of_service_agreed: bool = False) -> str:
        """Create or retrieve ACME account"""
        payload = {
            "termsOfServiceAgreed": terms_of_service_agreed,
        }
        if self.email:
            payload["contact"] = [f"mailto:{self.email}"]
        
        response = self._post(self.directory['newAccount'], payload)
        self.account_url = response
        return response
    
    def create_order(self, identifiers: List[str]) -> Dict:
        """Create new order for certificates"""
        payload = {"identifiers": [{"type": "dns", "value": id} for id in identifiers]}
        return self._post(self.directory['newOrder'], payload)
    
    def get_authorization(self, auth_url: str) -> Dict:
        """Get authorization details for challenge"""
        return self._get(auth_url)
    
    def complete_challenge(self, challenge_url: str, challenge_type: str = "http-01") -> Dict:
        """Complete DNS-01 or HTTP-01 challenge"""
        payload = {}
        return self._post(challenge_url, payload)
    
    def download_certificate(self, order_url: str) -> str:
        """Download signed certificate"""
        order = self._get(order_url)
        
        if order['status'] != 'valid':
            raise Exception(f"Order not valid: {order['status']}")
        
        cert_url = order['certificate']
        cert_response = requests.get(cert_url)
        return cert_response.text
    
    def obtain_certificate(
        self,
        domains: List[str],
        cert_path: str,
        key_path: str,
        key_size: int = 4096
    ) -> bool:
        """Obtain and save certificate for domains"""
        self.fetch_directory()
        
        try:
            self.create_account(terms_of_service_agreed=True)
        except Exception as e:
            if "Account already exists" not in str(e):
                raise
        
        order = self.create_order(domains)
        
        # Complete authorizations
        for auth_url in order['authorizations']:
            auth = self.get_authorization(auth_url)
            
            for challenge in auth['challenges']:
                if challenge['type'] == 'http-01':
                    self._setup_http_challenge(auth, challenge)
                    break
        
        # Poll for order status
        while True:
            order_status = self._get(order_url)
            if order_status['status'] == 'ready':
                break
            elif order_status['status'] == 'processing':
                time.sleep(5)
            else:
                raise Exception(f"Order status: {order_status['status']}")
        
        # Finalize order
        key = self.generate_private_key(key_size)
        self._finalize_order(order['finalize'], key)
        
        # Download certificate
        cert_pem = self.download_certificate(order_url)
        
        with open(cert_path, 'w') as f:
            f.write(cert_pem)
        
        private_key_pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(key_path, 'wb') as f:
            f.write(private_key_pem)
        
        return True
    
    def _setup_http_challenge(self, auth: Dict, challenge: Dict):
        """Setup HTTP-01 challenge response"""
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.backends import default_backend
        
        challenge_token = challenge['token']
        key_auth = f"{challenge_token}.{self._get_thumbprint()}"
        
        with open(f"/var/www/challenges/{challenge_token}", 'w') as f:
            f.write(key_auth)
        
        self.complete_challenge(challenge['url'])
    
    def _get_thumbprint(self) -> str:
        """Calculate JWK thumbprint"""
        jwk = self._get_jwk()
        jwk_json = json.dumps(jwk, sort_keys=True, separators=(',', ':'))
        digest = hashlib.sha256(jwk_json.encode()).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
```

## Best Practices

- Use TLS 1.2+; disable TLS 1.0 and 1.1
- Prefer TLS 1.3 for reduced latency and improved security
- Use strong cipher suites with AEAD encryption
- Implement certificate pinning for critical applications
- Use OCSP stapling for certificate revocation checking
- Configure proper certificate chains
- Set reasonable session ticket lifetimes
- Monitor certificate expiration proactively
- Use HSTS headers to enforce HTTPS
- Implement certificate transparency monitoring

## Core Competencies

- X.509 certificate generation and management
- TLS protocol implementation
- Cipher suite configuration
- Certificate chain validation
- ACME protocol for automated certificates
- Perfect forward secrecy
- OCSP and CRL management
- Certificate pinning
- TLS termination configuration
- Mutual TLS (mTLS) implementation
- Security headers (HSTS, CSP)
- Performance optimization
