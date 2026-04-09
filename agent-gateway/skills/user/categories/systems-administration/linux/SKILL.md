---
name: linux
description: Linux operating system administration and scripting
category: systems-administration
difficulty: intermediate
tags: [linux, unix, shell, administration, server]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Linux Administration

## What I Do

I am Linux, the open-source Unix-like operating system powering servers, cloud infrastructure, and embedded devices worldwide. I provide a robust, secure, and efficient platform for running applications and services. I offer multiple distributions (Ubuntu, RHEL, Debian, CentOS, Alpine) with different package managers and configurations. My command-line interface provides powerful tools for system administration, automation, and troubleshooting. I support multi-user environments, advanced permissions, and enterprise-grade security features. I integrate seamlessly with cloud platforms and container runtimes like Docker and Kubernetes.

## When to Use Me

- Web server and application hosting
- Database server management
- Container orchestration platforms
- CI/CD pipeline infrastructure
- Network services (DNS, DHCP, VPN)
- File and print services
- Security and monitoring systems
- Embedded and IoT devices

## Core Concepts

**Processes and Services**: Managing background tasks with systemd, process signals, and scheduling.

**File System Hierarchy**: Understanding /bin, /etc, /var, /home, /tmp, /proc directories.

**User Management**: Users, groups, sudo privileges, and access control.

**Package Management**: apt, yum/dnf, zypper for software installation.

** systemd**: Service management, journalctl logging, and timers.

**Permissions**: chmod, chown, ACLs, and SELinux/AppArmor.

**Networking**: ip, netstat, ss, firewall-cmd for network configuration.

## Code Examples

### Example 1: System Administration Script (Bash)
```bash
#!/bin/bash
set -euo pipefail

# Linux System Administration Toolkit
readonly LOG_FILE="/var/log/admin-toolkit.log"
readonly BACKUP_DIR="/var/backups"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[ERROR] $*" | tee -a "$LOG_FILE"
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# System Information
get_system_info() {
    log "Gathering system information..."
    
    cat << EOF
=== System Information Report ===
Generated: $(date)
Hostname: $(hostname)
Kernel: $(uname -r)
Uptime: $(uptime -p 2>/dev/null || uptime)
CPU: $(nproc) cores
Memory: $(free -h | awk '/^Mem:/ {print $2}')
Disk Usage:
$(df -h | grep -vE '^Filesystem|tmpfs|devtmpfs')
Load Average: $(awk '{print $1, $2, $3}' /proc/loadavg)
EOF
}

# User Management
list_users() {
    echo "=== System Users ==="
    awk -F: '($3 >= 1000) && ($3 != 65534) {print $1 ":" $5}' /etc/passwd
}

create_user() {
    local username="$1"
    local password="${2:-}"
    
    if id "$username" &>/dev/null; then
        log "User $username already exists"
        return 1
    fi
    
    useradd -m -s /bin/bash -c "Created by admin toolkit" "$username"
    
    if [[ -n "$password" ]]; then
        echo "$username:$password" | chpasswd
    fi
    
    log "Created user: $username"
}

manage_groups() {
    local action="$1"
    local group="$2"
    local users="${3:-}"
    
    case "$action" in
        create)
            groupadd "$group" 2>/dev/null || log "Group $group already exists"
            ;;
        add)
            for user in $users; do
                usermod -aG "$group" "$user"
                log "Added $user to group $group"
            done
            ;;
        list)
            getent group "$group"
            ;;
    esac
}

# Service Management
manage_service() {
    local service="$1"
    local action="$2"
    
    if ! systemctl is-active "$service" &>/dev/null && [[ "$action" == "stop" ]]; then
        log "Service $service not active, skipping"
        return 0
    fi
    
    case "$action" in
        start|stop|restart|reload|status)
            systemctl "$action" "$service"
            log "Service $service: $action"
            ;;
        enable|disable)
            systemctl "$action" "$service"
            log "Service $service: $action (boot)"
            ;;
        *)
            error "Unknown action: $action"
            ;;
    esac
}

# Firewall Management (ufw)
configure_firewall() {
    local action="$1"
    local port="$2"
    local protocol="${3:-tcp}"
    
    case "$action" in
        allow)
            ufw allow "$port/$protocol"
            log "Allowed port $port/$protocol"
            ;;
        deny)
            ufw deny "$port/$protocol"
            log "Denied port $port/$protocol"
            ;;
        status)
            ufw status numbered
            ;;
    esac
}

# Disk Management
check_disk_usage() {
    echo "=== Disk Usage Report ==="
    df -h | awk '
    NR==1 {print; next}
    /^\/dev/ {
        usage = $5 + 0
        if (usage >= 80) print "\033[31m" $0 "\033[0m"
        else if (usage >= 70) print "\033[33m" $0 "\033[0m"
        else print
    }'
}

analyze_inodes() {
    echo "=== Inode Usage ==="
    df -i | awk '
    NR==1 {print; next}
    /^\/dev/ {
        usage = $5 + 0
        if (usage >= 80) print "\033[31m" $0 "\033[0m"
        else print
    }'
}

# Process Management
find_top_processes() {
    echo "=== Top CPU Processes ==="
    ps aux --sort=-%cpu | head -11
    
    echo ""
    echo "=== Top Memory Processes ==="
    ps aux --sort=-%mem | head -6
}

kill_process_by_name() {
    local name="$1"
    local pids=$(pgrep -x "$name" 2>/dev/null)
    
    if [[ -z "$pids" ]]; then
        log "No process found: $name"
        return 1
    fi
    
    echo "Killing processes: $pids"
    kill $pids 2>/dev/null
    log "Sent kill signal to $name"
}

# Network Tools
network_diagnostics() {
    echo "=== Network Diagnostics ==="
    echo "Hostname: $(hostname)"
    echo "IP Addresses:"
    ip -br addr | grep -v "^lo" | awk '{print "  " $1 ": " $3}'
    echo ""
    echo "Routing Table:"
    ip route show
    echo ""
    echo "DNS Resolution:"
    cat /etc/resolv.conf | grep nameserver
    echo ""
    echo "Active Connections:"
    ss -tunp | head -10
}

test_connectivity() {
    local host="${1:-8.8.8.8}"
    
    echo "Testing connectivity to $host..."
    
    if ping -c 4 "$host" &>/dev/null; then
        echo "✓ ICMP: OK"
    else
        echo "✗ ICMP: FAILED"
    fi
    
    if timeout 5 bash -c "echo > /dev/tcp/$host/443" 2>/dev/null; then
        echo "✓ Port 443: OPEN"
    fi
    
    if timeout 5 getent hosts "$host" &>/dev/null; then
        echo "✓ DNS: RESOLVED"
    fi
}

# Log Analysis
analyze_logs() {
    local logfile="${1:-/var/log/syslog}"
    local pattern="${2:-ERROR}"
    
    if [[ ! -f "$logfile" ]]; then
        error "Log file not found: $logfile"
    fi
    
    echo "=== Log Analysis: $logfile ==="
    echo "Total lines: $(wc -l < "$logfile")"
    echo "Error lines: $(grep -c "$pattern" "$logfile" 2>/dev/null || echo 0)"
    echo ""
    echo "Recent errors:"
    grep "$pattern" "$logfile" | tail -10
}

# Backup Management
create_backup() {
    local source="$1"
    local destination="${2:-$BACKUP_DIR}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [[ ! -d "$destination" ]]; then
        mkdir -p "$destination"
    fi
    
    local basename=$(basename "$source")
    local archive="$destination/${basename}_${timestamp}.tar.gz"
    
    log "Creating backup: $archive"
    
    tar -czf "$archive" "$source" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        log "Backup created: $archive ($(du -h "$archive" | cut -f1))"
        ls -lh "$destination" | grep "$basename"
    else
        error "Backup failed"
    fi
}

# Security Hardening
security_audit() {
    echo "=== Security Audit ==="
    
    echo ""
    echo "1. User Accounts:"
    awk -F: '($3 == 0) {print "  Root user: " $1}' /etc/passwd
    
    echo ""
    echo "2. Password Policy:"
    grep -E "^PASS_MAX_DAYS|^PASS_MIN_DAYS|^PASS_WARN_AGE" /etc/login.defs
    
    echo ""
    echo "3. SSH Configuration:"
    if [[ -f /etc/ssh/sshd_config ]]; then
        echo "  PermitRootLogin: $(grep ^PermitRootLogin /etc/ssh/sshd_config 2>/dev/null || echo not set)"
        echo "  PasswordAuth: $(grep ^PasswordAuthentication /etc/ssh/sshd_config 2>/dev/null || echo not set)"
    fi
    
    echo ""
    echo "4. Failed Login Attempts:"
    lastb | head -5 2>/dev/null || echo "  (lastb not available)"
    
    echo ""
    echo "5. SUID/SGID Files:"
    find /usr -type f \( -perm -4000 -o -perm -2000 \) -exec ls -ld {} \; 2>/dev/null | head -5
}

# Main menu
show_menu() {
    cat << EOF
=== Linux System Administration Toolkit ===

1. System Information
2. User Management
3. Service Management
4. Firewall Configuration
5. Disk Usage
6. Process Management
7. Network Diagnostics
8. Log Analysis
9. Backup Creation
10. Security Audit
11. Exit

EOF
}

main() {
    mkdir -p "$BACKUP_DIR"
    
    while true; do
        show_menu
        read -p "Select option: " choice
        
        case "$choice" in
            1) get_system_info ;;
            2) 
                echo "a) List Users
b) Create User
c) Group Management"
                read -p "Select: " sub
                case "$sub" in
                    a) list_users ;;
                    b) read -p "Username: " user; create_user "$user" ;;
                    c) read -p "Action (create/add/list): " act
                       read -p "Group: " grp
                       read -p "Users: " users
                       manage_groups "$act" "$grp" "$users" ;;
                esac
                ;;
            3) 
                read -p "Service: " svc
                read -p "Action (start/stop/restart/status): " act
                manage_service "$svc" "$act"
                ;;
            4)
                read -p "Action (allow/deny/status): " act
                read -p "Port: " port
                configure_firewall "$act" "$port"
                ;;
            5) check_disk_usage ;;
            6) find_top_processes ;;
            7) network_diagnostics ;;
            8)
                read -p "Log file: " logf
                read -p "Pattern: " pat
                analyze_logs "$logf" "$pat"
                ;;
            9)
                read -p "Source path: " src
                create_backup "$src"
                ;;
            10) security_audit ;;
            11) exit 0 ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Run main function
main "$@"
```

### Example 2: Systemd Service File
```ini
[Unit]
Description=Application Service
Documentation=https://example.com/docs
After=network.target
Wants=network-online.target

[Service]
Type=notify
User=appuser
Group=appgroup
WorkingDirectory=/opt/app
ExecStart=/opt/app/bin/server
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
TimeoutStartSec=300
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=production
EnvironmentFile=/etc/default/app
EnvironmentFile=/run/secrets/app

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadOnlyPaths=/etc /var
ExecStartPre=/bin/mkdir -p /var/log/app
ExecStartPre=/bin/chown appuser:appgroup /var/log/app

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
CPUAccounting=true
MemoryAccounting=true
MemoryHigh=512M
MemoryMax=1G

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=app

# Health check
ExecStartPost=/bin/bash -c 'sleep 2 && curl -f http://localhost:8080/health || exit 1'

[Install]
WantedBy=multi-user.target
```

### Example 3: Cron Job Configuration
```bash
# /etc/cron.d/app-schedule

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# System crontab
# Run every 5 minutes
*/5 * * * * root /opt/app/scripts/sync.sh

# Daily at 2 AM
0 2 * * * root /opt/app/scripts/backup.sh

# Weekly on Sunday at 3 AM
0 3 * * 0 root /opt/app/scripts/cleanup.sh

# Monthly on 1st at 4 AM
0 4 1 * * root /opt/app/scripts/archive.sh

# Run with specific user
0 * * * * appuser /opt/app/scripts/metrics.sh
```

### Example 4: Logrotate Configuration
```bash
# /etc/logrotate.d/app

/var/log/app/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 appuser appgroup
    postrotate
        systemctl reload app > /dev/null 2>&1 || true
    endscript
}

/var/log/app/access.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid) || true
    endscript
}

/var/log/app/error.log {
    weekly
    rotate 12
    compress
    notifempty
    create 0640 appuser appgroup
    mail admin@example.com
    missingok
}
```

## Best Practices

- Keep systems updated with security patches regularly
- Use SSH key authentication instead of passwords
- Configure firewall rules with least privilege
- Implement regular backups with testing
- Monitor system resources and set up alerts
- Use SELinux or AppArmor for mandatory access control
- Follow principle of least privilege for user accounts
- Document all system changes and configurations
- Use configuration management (Ansible, Puppet)
- Implement proper logging and log rotation

## Core Competencies

- Bash scripting and automation
- User and group management
- Systemd service management
- Package management (apt/yum)
- File permissions and ACLs
- Disk management (fdisk, LVM)
- Network configuration (ip, nmcli)
- Firewall configuration (ufw, firewalld)
- Log management (journalctl, logrotate)
- SSH hardening
- Cron and systemd timers
- Security hardening
- Performance tuning
- Container and virtualization support
