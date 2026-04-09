---
name: high-availability
description: High availability architecture and implementation
category: systems-administration
difficulty: advanced
tags: [ha, clustering, failover, redundancy]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# High Availability

## What I Do

I am High Availability, the discipline of designing systems to remain operational despite component failures. I implement redundancy at every level: hardware, network, storage, and application. I use clustering technologies, load balancers, and failover mechanisms to eliminate single points of failure. I help organizations meet strict uptime requirements through careful architecture, health monitoring, and automated recovery. I support various topologies: active-passive, active-active, multi-region, and hybrid configurations. I work with databases, web servers, application servers, and microservices to provide continuous service availability.

## When to Use Me

- Mission-critical application infrastructure
- Financial services and trading platforms
- Healthcare and emergency services
- E-commerce platforms
- Telecommunications systems
- Manufacturing control systems
- Cloud-native applications
- Disaster recovery sites

## Core Concepts

**Nines of Availability**: 99.9% (three nines), 99.99% (four nines), 99.999% (five nines).

**Active-Passive**: Secondary nodes standby, take over during failover.

**Active-Active**: Multiple nodes serve traffic simultaneously.

**Health Checks**: Monitoring services for automatic failover.

**Failover**: Automatic or manual transition to backup systems.

**Data Replication**: Synchronous vs asynchronous data sync.

**Load Balancing**: Distributing traffic across multiple nodes.

**Geographic Redundancy**: Multi-region deployments for disaster recovery.

## Code Examples

### Example 1: HAProxy Configuration
```bash
# HAProxy Configuration for High Availability

global
    log /dev/log    local0
    log /dev/log    local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon
    nbproc 4
    cpu-map auto:1/1-4 0-3

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms
    timeout http-request 10s
    timeout http-keep-alive 10s

# Frontend configuration
frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/
    
    mode http
    option httpclose
    option forwardfor
    option http-server-close
    
    # ACL for HTTPS redirect
    acl is_http hdr(host) -i example.com
    redirect scheme https if !{ ssl_fc } is_http
    
    # Custom headers
    reqadd X-Forwarded-Proto:\ https
    reqadd X-Real-IP:\hdr(x-forwarded-for)
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request deny deny_status 429 if { src,http_req_rate gt 100 }
    
    # Backend routing
    use_backend api if { path_beg /api }
    use_backend web if { path_beg / }
    
    # Default backend
    default_backend web

frontend stats
    bind *:8404
    mode http
    stats enable
    stats hide-version
    stats uri /stats
    stats auth admin:securepassword
    stats show-desc Production HAProxy

# API Backend with health checks
backend api
    mode http
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server api1 10.0.1.10:8080 check inter 5s rise 2 fall 3
    server api2 10.0.1.11:8080 check inter 5s rise 2 fall 3
    server api3 10.0.1.12:8080 check inter 5s rise 2 fall 3
    
    # Sticky sessions for authenticated users
    stick on src
    stick-table type ip size 200k expire 30m
    
    # Circuit breaker
    default-server inter 5s rise 2 fall 3 on-marked-down shutdown-sessions

# Web Backend
backend web
    mode http
    balance leastconn
    cookie SESSIONID insert indirect nocache
    
    option httpchk GET /health
    http-check expect status 200
    
    server web1 10.0.2.10:80 check
    server web2 10.0.2.11:80 check
    
    # Enable compression
    compression algo gzip
    compression type text/html text/css application/json

# Database backend with connection pooling
backend database
    mode tcp
    balance roundrobin
    option tcplog
    
    server db1 10.0.3.10:5432 check port 5432
    server db2 10.0.3.11:5432 check port 5432 backup
    
    # Connection limits
    maxconn 1000
    
    # Health check using pg_isready
    default-server inter 10s rise 3 fall 5

# Failover configuration
listen failover-vip
    bind 10.0.0.100:443
    mode tcp
    balance roundrobin
    
    server primary 10.0.1.100:443 check weight 100
    server secondary 10.0.2.100:443 check weight 50 backup
    
    # Automatic failover
    on-marked-down shutdown-sessions
```

### Example 2: Keepalived Configuration
```bash
# Keepalived Configuration for VRRP failover

global_defs {
    router_id LVS_DEVEL
    script_user root
    enable_script_security
    vrrp_skip_check_adv_addr
    vrrp_strict
}

# Health check script
vrrp_script chk_haproxy {
    script "/etc/keepalived/check-haproxy.sh"
    interval 2
    weight 50
    fall 2
    rise 2
}

# VRRP Instance for Virtual IP
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass securepassword123
    }
    
    virtual_ipaddress {
        10.0.0.100/24 dev eth0 label eth0:vip
    }
    
    # Track health check script
    track_script {
        chk_haproxy
    }
    
    # Track interface
    track_interface {
        eth0 weight -100
    }
    
    # Notify scripts
    notify_master "/etc/keepalived/notify-master.sh"
    notify_backup "/etc/keepalived/notify-backup.sh"
    notify_fault  "/etc/keepalived/notify-fault.sh"
}

# LVS configuration for load balancing
virtual_server 10.0.0.100 443 {
    delay_loop 6
    lb_algo wlc
    lb_kind NAT
    protocol TCP
    
    real_server 10.0.1.10 443 {
        weight 100
        TCP_CHECK {
            connect_port 443
            connect_timeout 3
        }
    }
    
    real_server 10.0.1.11 443 {
        weight 100
        TCP_CHECK {
            connect_port 443
            connect_timeout 3
        }
    }
}
```

### Example 3: Pacemaker Cluster Configuration
```bash
# Pacemaker Cluster Configuration (crm)
# Run with: crm configure < cluster.conf

# Cluster properties
property stonith-enabled="true"
property no-quorum-policy="ignore"
property default-resource-stickiness="100"
property cluster-recheck-interval="60"

# STONITH device (IPMI)
primitive stonith-ipmi-node1 stonith:external/ipmi \
    params hostname="node1" ipaddr="10.0.1.1" userid="admin" passwd="secret" \
    op monitor interval="30s"

primitive stonith-ipmi-node2 stonith:external/ipmi \
    params hostname="node2" ipaddr="10.0.2.1" userid="admin" passwd="secret" \
    op monitor interval="30s"

primitive stonith-ipmi-node3 stonith:external/ipmi \
    params hostname="node3" ipaddr="10.0.3.1" userid="admin" passwd="secret" \
    op monitor interval="30s"

location stonith-loc-node1 stonith-ipmi-node1 -inf: node1
location stonith-loc-node2 stonith-ipmi-node2 -inf: node2
location stonith-loc-node3 stonith-ipmi-node3 -inf: node3

# IP Address for cluster (Virtual IP)
primitive cluster-vip IPaddr2 \
    params ip="10.0.0.100" cidr_netmask="24" \
    op monitor interval="10s"

# Web server resource (Apache)
primitive web-lsb lsb:apache2 \
    params config="/etc/apache2/apache2.conf" \
    op monitor interval="30s" timeout="60s"

# MySQL resource
primitive mysql-db mysql \
    params binary="/usr/bin/mysqld" config="/etc/mysql/my.cnf" \
    op start timeout="120s" interval="0" \
    op stop timeout="120s" interval="0" \
    op monitor interval="30s" timeout="60s" \
    meta resource-stickiness="100"

# Filesystem resource
primitive fs-data Filesystem \
    params device="/dev/mapper/data-vg/data-lv" directory="/data" fstype="ext4" \
    op monitor interval="30s" timeout="60s"

# Group resources
group cluster-services \
    cluster-vip fs-data mysql-db web-lsb \
    meta ordered="true" colocation="cluster-vip-with-fs-data"

# Clone resources for multi-node
clone clone-vip cluster-vip \
    meta interleave="true"

# Colocation constraints
colocation vip-with-db -100: cluster-vip mysql-db
colocation fs-with-db -100: fs-data mysql-db
colocation web-with-db -50: web-lsb mysql-db

# Ordering constraints
order start-db-before-vip 50: mysql-db cluster-vip
order start-fs-before-db 50: fs-data mysql-db
order start-web-before-db 50: web-lsb mysql-db

# Location preferences
location prefer-node1 cluster-vip 100: node1
location prefer-node2 cluster-vip 50: node2
location prefer-node3 cluster-vip 50: node3
```

### Example 4: Health Monitoring Script
```bash
#!/bin/bash
# Comprehensive Health Monitoring Script

set -euo pipefail

readonly ALERT_THRESHOLD=3
readonly CHECK_INTERVAL=30
readonly LOG_FILE="/var/log/health-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[ERROR] $*" | tee -a "$LOG_FILE"
}

# Check service health
check_service() {
    local service="$1"
    local max_attempts="${2:-3}"
    
    if ! systemctl is-active --quiet "$service"; then
        log "$service is not running"
        return 1
    fi
    
    # Check process count
    local pcount=$(pgrep -c "$service" 2>/dev/null || echo 0)
    if [[ "$pcount" -eq 0 ]]; then
        error "$service has no running processes"
        return 1
    fi
    
    return 0
}

# Check endpoint health
check_endpoint() {
    local endpoint="$1"
    local timeout="${2:-5}"
    local method="${3:-GET}"
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout "$timeout" \
        -X "$method" \
        "$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$response" =~ ^2[0-9][0-9]$ ]]; then
        return 0
    else
        error "Endpoint $endpoint returned HTTP $response"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local host="$1"
    local port="$2"
    local user="${3:-root}"
    local timeout="${4:-5}"
    
    if ! nc -z -w "$timeout" "$host" "$port" 2>/dev/null; then
        error "Cannot connect to database at $host:$port"
        return 1
    fi
    
    return 0
}

# Check disk space
check_disk_usage() {
    local mount="$1"
    local threshold="${2:-80}"
    
    local usage=$(df "$mount" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$usage" -gt "$threshold" ]]; then
        error "Disk usage at $mount is ${usage}%"
        return 1
    fi
    
    return 0
}

# Check memory pressure
check_memory() {
    local threshold="${1:-90}"
    
    local usage=$(free | awk '/^Mem: {print $3/$2 * 100}')
    usage=${usage%.*}
    
    if [[ "$usage" -gt "$threshold" ]]; then
        error "Memory usage is ${usage}%"
        return 1
    fi
    
    return 0
}

# Check replication lag
check_replication_lag() {
    local max_lag="${1:-5}"
    
    # MySQL replication lag
    local lag=$(mysql -e "SHOW SLAVE STATUS\G" 2>/dev/null | \
        grep "Seconds_Behind_Master:" | awk '{print $4}')
    
    if [[ -n "$lag" ]] && [[ "$lag" -gt "$max_lag" ]]; then
        error "MySQL replication lag is ${lag}s"
        return 1
    fi
    
    return 0
}

# Health check aggregator
run_health_check() {
    local failed_checks=()
    local passed_checks=()
    
    log "Starting health check..."
    
    # Check critical services
    for service in haproxy keepalived mysql apache2 nginx; do
        if check_service "$service"; then
            passed_checks+=("$service")
        else
            failed_checks+=("$service")
        fi
    done
    
    # Check endpoints
    for endpoint in "http://localhost:80/health" "https://api.example.com/health"; do
        if check_endpoint "$endpoint"; then
            passed_checks+=("$endpoint")
        else
            failed_checks+=("$endpoint")
        fi
    done
    
    # Check disk
    for mount in "/" "/data" "/var/lib/mysql"; do
        if [[ -d "$mount" ]]; then
            if check_disk_usage "$mount" 80; then
                passed_checks+=("${mount}")
            else
                failed_checks+=("${mount}")
            fi
        fi
    done
    
    # Report results
    log "Health check completed"
    log "Passed: ${#passed_checks[@]}"
    log "Failed: ${#failed_checks[@]}"
    
    if [[ ${#failed_checks[@]} -gt 0 ]]; then
        error "Failed checks: ${failed_checks[*]}"
        
        # Trigger alert
        send_alert "Health check failed: ${failed_checks[*]}"
        
        return 1
    fi
    
    return 0
}

# Alert notification
send_alert() {
    local message="$1"
    local severity="${2:-WARNING}"
    
    log "ALERT [$severity]: $message"
    
    # Send email alert
    if command -v mail &>/dev/null; then
        echo "$message" | mail -s "[$severity] Health Check Alert" admin@example.com
    fi
    
    # Send Slack notification (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[$severity] $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Automatic failover trigger
trigger_failover() {
    log "Initiating failover procedure..."
    
    # Check if standby is available
    if ! check_service "keepalived"; then
        error "Keepalived not running, cannot failover"
        return 1
    fi
    
    # Move virtual IP
    ip addr add 10.0.0.100/24 dev eth0:backup 2>/dev/null || true
    ip route del default via 10.0.0.1 2>/dev/null || true
    
    # Notify cluster
    systemctl restart keepalived
    
    log "Failover completed"
    send_alert "Failover executed successfully"
}

# Main monitoring loop
main() {
    log "Starting health monitor..."
    
    while true; do
        run_health_check
        sleep "$CHECK_INTERVAL"
    done
}

# Run main function
main "$@"
```

## Best Practices

- Design for failure; assume components will fail
- Use active-active for maximum availability
- Implement proper health checks at multiple levels
- Test failover procedures regularly
- Use geographic redundancy for disaster recovery
- Monitor everything with alerting and dashboards
- Implement circuit breakers for resilience
- Keep systems simple to reduce failure modes
- Document recovery procedures
- Automate recovery where possible

## Core Competencies

- Clustering technologies (Pacemaker, Corosync)
- Load balancing (HAProxy, Nginx, F5)
- VRRP and heartbeat protocols
- Database replication and failover
- Health monitoring and alerting
- Virtual IP management
- STONITH configuration
- Quorum and split-brain prevention
- Multi-region deployment
- Disaster recovery planning
