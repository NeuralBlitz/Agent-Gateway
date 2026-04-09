---
name: Load Balancing
description: Load balancing strategies and implementation patterns
license: MIT
compatibility: Cross-platform (Hardware, Software, Cloud)
audience: DevOps engineers and system architects
category: Networking
---

# Load Balancing

## What I Do

I provide guidance for implementing load balancing solutions. I cover algorithms, health checks, session persistence, SSL termination, and deployment strategies.

## When to Use Me

- Deploying load balancers
- Choosing load balancing algorithms
- Implementing health checks
- Configuring SSL termination
- Scaling horizontally

## Core Concepts

- **Load Balancing Algorithms**: Round robin, least connections, IP hash
- **Health Checks**: Active and passive monitoring
- **Session Persistence**: Sticky sessions
- **SSL Termination**: Offloading encryption
- **Circuit Breakers**: Preventing cascade failures
- **Rate Limiting**: Controlling traffic
- **Connection Draining**: Graceful shutdown
- **Health Grading**: Weighted backends
- **Blue-Green Deployments**: Zero-downtime updates
- **Canary Releases**: Gradual traffic shifting

## Code Examples

### Load Balancer with Nginx

```nginx
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 10240;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;
    
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    upstream api_servers {
        least_conn;
        
        server 10.0.1.10:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.1.11:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.1.12:8080 weight=3 max_fails=3 fail_timeout=30s backup;
        
        keepalive 32;
    }
    
    upstream static_servers {
        ip_hash;
        
        server 10.0.2.10:8080;
        server 10.0.2.11:8080;
        server 10.0.2.12:8080;
    }
    
    server {
        listen 80;
        server_name api.example.com;
        
        location / {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-ID $request_id;
            
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
            proxy_next_upstream_tries 3;
            
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;
            
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
            proxy_busy_buffers_size 8k;
        }
        
        location /health {
            access_log off;
            return 200 'OK';
            add_header Content-Type text/plain;
        }
        
        location /ready {
            access_log off;
            
            health_check interval=5 fails=3 passes=2 type=http;
            health_check_http_send "GET /health HTTP/1.0";
            health_check_http_expect "200 OK";
        }
    }
    
    server {
        listen 443 ssl http2;
        server_name static.example.com;
        
        ssl_certificate /etc/ssl/certs/example.com.crt;
        ssl_certificate_key /etc/ssl/private/example.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        
        location / {
            proxy_pass http://static_servers;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Connection "";
            
            add_header X-Upstream $upstream_addr;
            
            proxy_cache_use_stale error timeout updating;
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;
        }
    }
}
```

### Go Load Balancer Implementation

```go
package main

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

type Backend struct {
	URL          string
	Alive        bool
	Weight       int
	Connections  int64
	ResponseTime time.Duration
	Failures     int32
}

type LoadBalancer struct {
	backends []*Backend
	current  uint32
	mu       sync.RWMutex
}

func NewLoadBalancer() *LoadBalancer {
	return &LoadBalancer{
		backends: make([]*Backend, 0),
	}
}

func (lb *LoadBalancer) AddBackend(url string, weight int) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	
	lb.backends = append(lb.backends, &Backend{
		URL:    url,
		Alive:  true,
		Weight: weight,
	})
}

func (lb *LoadBalancer) RemoveBackend(url string) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	
	for i, b := range lb.backends {
		if b.URL == url {
			lb.backends = append(lb.backends[:i], lb.backends[i+1:]...)
			break
		}
	}
}

func (lb *LoadBalancer) getNextBackend() *Backend {
	lb.mu.RLock()
	defer lb.mu.RUnlock()
	
	n := len(lb.backends)
	if n == 0 {
		return nil
	}
	
	start := atomic.LoadUint32(&lb.current)
	
	for i := 0; i < n; i++ {
		idx := (start + uint32(i)) % uint32(n)
		backend := lb.backends[idx]
		
		if backend.Alive && backend.Weight > 0 {
			atomic.CompareAndSwapUint32(&lb.current, start, idx+1)
			return backend
		}
	}
	
	return nil
}

func (lb *LoadBalancer) GetLeastConnectionsBackend() *Backend {
	lb.mu.RLock()
	defer lb.mu.RUnlock()
	
	var best *Backend
	minConnections := int64(1<<63 - 1)
	
	for _, b := range lb.backends {
		if b.Alive && b.Weight > 0 {
			connections := atomic.LoadInt64(&b.Connections)
			if connections < minConnections {
				minConnections = connections
				best = b
			}
		}
	}
	
	return best
}

func (lb *LoadBalancer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	backend := lb.getNextBackend()
	
	if backend == nil {
		http.Error(w, "No available backends", http.StatusServiceUnavailable)
		return
	}
	
	atomic.AddInt64(&backend.Connections, 1)
	defer atomic.AddInt64(&backend.Connections, -1)
	
	start := time.Now()
	
	req, err := http.NewRequestWithContext(r.Context(), r.Method, backend.URL+r.URL.Path, r.Body)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	
	for k, v := range r.Header {
		req.Header[k] = v
	}
	
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	
	resp, err := client.Do(req)
	if err != nil {
		atomic.AddInt32(&backend.Failures, 1)
		lb.markBackendDown(backend)
		http.Error(w, "Backend error", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	
	backend.ResponseTime = time.Since(start)
	
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func (lb *LoadBalancer) markBackendDown(b *Backend) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	
	if atomic.LoadInt32(&b.Failures) >= 3 {
		b.Alive = false
		go lb.tryRestoreBackend(b)
	}
}

func (lb *LoadBalancer) tryRestoreBackend(b *Backend) {
	time.Sleep(30 * time.Second)
	
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(b.URL + "/health")
	if err == nil && resp.StatusCode == http.StatusOK {
		resp.Body.Close()
		
		lb.mu.Lock()
		b.Alive = true
		b.Failures = 0
		lb.mu.Unlock()
	}
}

func (lb *LoadBalancer) HealthCheck(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	
	for range ticker.C {
		lb.mu.RLock()
		for _, b := range lb.backends {
			go func(backend *Backend) {
				client := &http.Client{Timeout: 5 * time.Second}
				resp, err := client.Get(backend.URL + "/health")
				if err != nil {
					atomic.AddInt32(&backend.Failures, 1)
					return
				}
				defer resp.Body.Close()
				
				if resp.StatusCode != http.StatusOK {
					atomic.AddInt32(&backend.Failures, 1)
				} else {
					atomic.StoreInt32(&backend.Failures, 0)
					backend.Alive = true
				}
			}(b)
		}
		lb.mu.RUnlock()
	}
}
```

### HAProxy Configuration

```bash
# /etc/haproxy/haproxy.cfg

global
    log /dev/log    local0
    log /dev/log    local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon
    nbproc 2
    cpu-map 1 0
    cpu-map 2 1

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    option  http-server-close
    option  forwardfor except 127.0.0.0/8
    option  redispatch
    retries 3
    timeout http-request    10s
    timeout queue           1m
    timeout connect         10s
    timeout client          1m
    timeout server          1m
    timeout http-keep-alive  10s
    timeout check           10s
    maxconn                 50000

frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/private/example.com.pem alpn h2,http/1.1
    
    acl is_api path_beg /api/
    acl is_static path_beg /static/ /images/ /js/ /css/
    acl is_health path /health /ready
    
    http-request add-header X-Forwarded-Proto https if { ssl_fc }
    http-request add-header X-Request-ID %[uuid,hex]
    
    use_backend api_back if is_api
    use_backend static_back if is_static
    use_backend health_back if is_health
    default_backend api_back

frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST

backend api_back
    balance roundrobin
    cookie SERVERID insert indirect nocache
    option httpchk GET /health HTTP/1.1\r\nHost:\ api.example.com
    
    server api1 10.0.1.10:8080 cookie api1 check inter 5s rise 2 fall 3
    server api2 10.0.1.11:8080 cookie api2 check inter 5s rise 2 fall 3
    server api3 10.0.1.12:8080 cookie api3 check inter 5s rise 2 fall 3
    
    server-template api-tmpl 10 10.0.1.{100-199}:8080 check inter 5s
    
    persist rdp-cookie
    rate-limit sessions 10000
    
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 503 /etc/haproxy/errors/503.http

backend static_back
    balance static-rr
    option httpchk HEAD /health
    
    server static1 10.0.2.10:8080 check
    server static2 10.0.2.11:8080 check backup
    
    compression algo gzip
    compression type text/html text/css application/json

backend health_back
    mode http
    balance roundrobin
    
    server health1 127.0.0.1:8080 check
```

## Best Practices

1. **Use Health Checks**: Active monitoring of backend health
2. **Implement Retry Logic**: Handle transient failures
3. **Enable SSL Termination**: Offload encryption at load balancer
4. **Configure Session Persistence**: For stateful applications
5. **Monitor Performance**: Track latency and error rates
6. **Implement Rate Limiting**: Protect backend services
7. **Use Connection Draining**: Graceful backend removal
8. **Deploy Multiple Zones**: Geographic redundancy
9. **Implement Circuit Breakers**: Prevent cascade failures
10. **Use Blue-Green or Canary**: Safe deployment strategies
