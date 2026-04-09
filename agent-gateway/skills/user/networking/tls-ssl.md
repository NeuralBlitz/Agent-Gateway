---
name: TLS/SSL
description: TLS/SSL certificate management and encryption
license: MIT
compatibility: Cross-platform (All major languages and frameworks)
audience: Security engineers and backend developers
category: Networking
---

# TLS/SSL Configuration

## What I Do

I provide guidance for implementing and managing TLS/SSL certificates. I cover certificate generation, renewal, cipher suite configuration, and certificate transparency monitoring.

## When to Use Me

- Configuring HTTPS for web servers
- Setting up TLS termination
- Managing certificate lifecycles
- Implementing certificate pinning
- Troubleshooting TLS errors

## Core Concepts

- **TLS Protocol Versions**: TLS 1.2, TLS 1.3
- **Certificate Types**: DV, OV, EV certificates
- **Certificate Chains**: Root, intermediate, leaf
- **Cipher Suites**: Encryption algorithms
- **Handshake Process**: Client-server negotiation
- **Certificate Pinning**: Hardcoding certificate hashes
- **OCSP Stapling**: Certificate revocation checking
- **HSTS**: HTTP Strict Transport Security
- **Certificate Transparency**: Public logging
- **Private Key Protection**: Key storage and access

## Code Examples

### Go TLS Server with Modern Configuration

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
	"math/big"
	"net/http"
	"os"
	"time"
)

func generateSelfSignedCert() (tls.Certificate, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return tls.Certificate{}, fmt.Errorf("failed to generate key: %w", err)
	}
	
	template := x509.Certificate{
		SerialNumber: big.NewInt(time.Now().UnixNano()),
		Subject: pkix.Name{
			Organization:  []string{"Example Corp"},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{"San Francisco"},
			StreetAddress: []string{""},
			CommonName:    "localhost",
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
		return tls.Certificate{}, fmt.Errorf("failed to create certificate: %w", err)
	}
	
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(privateKey)})
	
	return tls.X509KeyPair(certPEM, keyPEM)
}

func getTLSConfig(cert tls.Certificate) *tls.Config {
	return &tls.Config{
		Certificates: []tls.Certificate{cert},
		NextProtos:   []string{"h2", "http/1.1"},
		
		MinVersion:               tls.VersionTLS12,
		MaxVersion:               tls.VersionTLS13,
		CurvePreferences:         []tls.CurveID{tls.X25519, tls.CurveP256, tls.X25519},
		
		CipherSuites: []uint16{
			tls.TLS_AES_256_GCM_SHA384,
			tls.TLS_AES_128_GCM_SHA256,
			tls.TLS_CHACHA20_POLY1305_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
		},
		
		SessionTicketsDisabled: false,
		SessionTicketKey:      generateSessionTicketKey(),
		
		PreferServerCipherSuites: true,
		
		ClientAuth: tls.NoClientCert,
		
		ClientCAs: nil,
		
		ALPNProtocols: []string{"h2", "http/1.1"},
		
		SessionCache: tls.NewSessionCache(128),
	}
}

func generateSessionTicketKey() [32]byte {
	var key [32]byte
	rand.Read(key[:])
	return key
}

func setupHTTPServer() *http.Server {
	mux := http.NewServeMux()
	
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "healthy"}`))
	})
	
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		w.Write([]byte("Hello, TLS!"))
	})
	
	return &http.Server{
		Addr:         ":8443",
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

func main() {
	cert, err := generateSelfSignedCert()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to generate certificate: %v\n", err)
		os.Exit(1)
	}
	
	server := setupHTTPServer()
	server.TLSConfig = getTLSConfig(cert)
	
	fmt.Println("Starting HTTPS server on :8443")
	err = server.ListenAndServeTLS("", "")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
	}
}
```

### Python TLS with certbot

```python
import ssl
import http.server
import socketserver
import os
import subprocess
from datetime import datetime

class TLSHTTPServer(socketserver.TCPServer):
    allow_reuse_address = True
    
    def __init__(self, server_address, handler_class, cert_path: str, key_path: str):
        self.cert_path = cert_path
        self.key_path = key_path
        
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_path, key_path)
        
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        context.set_ciphers("ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20")
        context.set_ecdh_curve("X25519")
        
        context.honor_channel_order = True
        context.session_tickets = True
        context.session_cache_mode = ssl.SSLSessionCache.MODE_SERVER
        
        self.ssl_context = context
        
        super().__init__(server_address, handler_class)
    
    def get_request(self):
        newsocket, fromaddr = self.socket.accept()
        try:
            connstream = self.ssl_context.wrap_socket(newsocket, server_side=True)
            return connstream, fromaddr
        except ssl.SSLError:
            newsocket.close()
            raise

class HTTPHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/.well-known/acme-challenge/":
            self.serve_challenge()
        else:
            self.send_response(200)
            self.send_header("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
            self.end_headers()
            self.wfile.write(b"Hello, HTTPS!")
    
    def serve_challenge(self):
        challenge_path = f"/var/www/acme-challenge/{self.path.split('/')[-1]}"
        if os.path.exists(challenge_path):
            with open(challenge_path, 'r') as f:
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(f.read().encode())
        else:
            self.send_response(404)
            self.end_headers()

def run_certbot(domain: str, email: str, staging: bool = False):
    """Obtain certificate using certbot."""
    base_cmd = [
        "certbot", "certonly",
        "--standalone",
        "--non-interactive",
        "--agree-tos",
        f"--email {email}",
        f"--domains {domain}",
    ]
    
    if staging:
        base_cmd.append("--staging")
    
    if os.geteuid() != 0:
        base_cmd.insert(0, "sudo")
    
    result = subprocess.run(
        " ".join(base_cmd),
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        return True, result.stdout
    return False, result.stderr

def check_certificate_expiry(cert_path: str) -> dict:
    """Check certificate expiry date."""
    try:
        with open(cert_path, 'r') as f:
            cert_data = f.read()
        
        from cryptography import x509
        from cryptography.hazmat.backends import default_backend
        
        cert = x509.load_pem_x509_certificate(cert_data.encode(), default_backend())
        
        now = datetime.utcnow()
        expires = cert.not_valid_after_utc
        remaining = expires - now
        
        return {
            "valid": remaining.total_seconds() > 0,
            "days_remaining": remaining.days,
            "expires_at": expires.isoformat(),
            "renewable": remaining.days < 30
        }
    except Exception as e:
        return {"error": str(e)}
```

### Nginx TLS Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com;
    
    # Certificate configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL session settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self';" always;
    
    # Root location
    location / {
        root /var/www/html;
        index index.html;
    }
    
    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        allow all;
    }
}
```

## Best Practices

1. **Use TLS 1.2+ Only**: Disable SSL and TLS 1.0/1.1
2. **Enable TLS 1.3**: Reduced latency and improved security
3. **Use Strong Cipher Suites**: AES-GCM, ChaCha20
4. **Enable HSTS**: Prevent protocol downgrade attacks
5. **Implement OCSP Stapling**: Reduce certificate latency
6. **Use Certificate Transparency Logs**: Monitor for misuse
7. **Automate Certificate Renewal**: Use certbot or similar
8. **Rotate Keys Regularly**: Periodic key regeneration
9. **Use Hardware Security Modules**: For key protection
10. **Monitor Certificate Expiry**: Proactive renewal alerts
