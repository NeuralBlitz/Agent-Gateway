---
name: linux
description: Linux operating system administration and scripting for servers, containers, and development environments
license: MIT
compatibility: opencode
metadata:
  audience: system-administrators
  category: systems-administration
---

## What I do
- Manage Linux systems using command-line tools
- Configure system services and daemons
- Monitor system performance and resources
- Manage users, groups, and permissions
- Configure networking and firewall rules
- Automate tasks with shell scripts
- Manage storage and filesystems
- Configure logging and auditing
- Implement security hardening
- Debug system issues

## When to use me
When administering Linux servers, troubleshooting system issues, writing automation scripts, or configuring system services.

## Core Concepts
- File system hierarchy and management
- Process management and systemd
- User/group administration and PAM
- Network configuration (ip, nmcli, netplan)
- Package management (apt, yum, dnf)
- Firewall configuration (iptables, nftables)
- SELinux/AppArmor mandatory access control
- Log management (journald, rsyslog)
- Systemd service units
- Shell scripting (bash, zsh)

## Code Examples

### System Administration
```bash
#!/bin/bash

# System information gathering
get_system_info() {
    echo "=== System Information ==="
    echo "Hostname: $(hostname)"
    echo "Kernel: $(uname -r)"
    echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
    echo "Load Average: $(cat /proc/loadavg | awk '{print $1, $2, $3}')"
}

# Memory and CPU analysis
analyze_resources() {
    echo "=== Resource Analysis ==="
    echo "Memory:"
    free -h | awk 'NR==2{printf "  Used: %s/%s (%.1f%%)\n", $3, $2, $3/$2*100}'
    echo "CPU:"
    awk '/^cpu /{printf "  Usage: %.1f%%\n", 100-($5+$6)*100/($2+$4+$5+$6)}' /proc/stat
    echo "Top Memory Processes:"
    ps aux --sort=-%mem | head -6 | awk '{printf "  %s: %.1f%%\n", $11, $4}'
}

# Disk usage analysis
analyze_disk() {
    echo "=== Disk Usage ==="
    df -h | awk 'NR>1 && $1!="tmpfs" && $1!="overlay" {
        printf "  %s: %s/%s (%.0f%%)\n", $6, $3, $2, $5
    }'
    echo "Largest directories:"
    du -h --max-depth=2 /var 2>/dev/null | sort -hr | head -5
}

# Service management
manage_service() {
    local service="$1"
    local action="${2:-status}"
    
    case "$action" in
        start|stop|restart|reload)
            sudo systemctl "$action" "$service"
            ;;
        status)
            systemctl is-active "$service" && echo "$service: active" || echo "$service: inactive"
            systemctl is-enabled "$service" && echo "enabled" || echo "disabled"
            ;;
        logs)
            sudo journalctl -u "$service" -n 50 --no-pager
            ;;
        *)
            echo "Unknown action: $action"
            ;;
    esac
}

# Network diagnostic
network_diagnostics() {
    echo "=== Network Status ==="
    echo "Interface statistics:"
    ip -s link | grep -A1 "^[0-9]" | head -20
    echo "Routing table:"
    ip route show
    echo "DNS resolution test:"
    host google.com 2>/dev/null || echo "DNS lookup failed"
    echo "Active connections:"
    ss -tunapl | head -10
}
```

### User and Permission Management
```bash
#!/bin/bash

# Create user with specified groups
create_application_user() {
    local username="$1"
    local groups="${2:-app}"
    
    if id "$username" &>/dev/null; then
        echo "User $username already exists"
        return 1
    fi
    
    sudo useradd -r -s /sbin/nologin -M "$username"
    for group in $groups; do
        sudo usermod -aG "$group" "$username" 2>/dev/null
    done
    echo "Created user: $username"
}

# Audit file permissions
audit_permissions() {
    local path="${1:-.}"
    local issues=0
    
    echo "=== Permission Audit for $path ==="
    
    # World-writable files
    world_writable=$(find "$path" -perm -002 -type f 2>/dev/null)
    if [ -n "$world_writable" ]; then
        echo "WORLD WRITABLE FILES:"
        echo "$world_writable"
        issues=$((issues + $(echo "$world_writable" | wc -l)))
    fi
    
    # Files without group write
    sgid_files=$(find "$path" -perm -2000 -type f 2>/dev/null)
    if [ -n "$sgid_files" ]; then
        echo "SGID FILES:"
        echo "$sgid_files"
    fi
    
    # SUID files
    suid_files=$(find "$path" -perm -4000 -type f 2>/dev/null)
    if [ -n "$suid_files" ]; then
        echo "SUID FILES:"
        echo "$suid_files"
    fi
    
    echo "Total issues found: $issues"
}

# Set permissions recursively
secure_directory() {
    local path="$1"
    local owner="${2:-root}"
    local group="${3:-root}"
    
    # Set directory ownership
    sudo chown -R "$owner:$group" "$path"
    
    # Set directory permissions (755 for dirs, 644 for files)
    find "$path" -type d -exec chmod 755 {} \;
    find "$path" -type f -exec chmod 644 {} \;
    
    # Make sensitive files more restrictive
    find "$path" -name "*.key" -o -name "*.pem" -o -name "*password*" | \
        xargs -I{} chmod 600 {} 2>/dev/null
    
    echo "Secured: $path"
}
```

### Firewall Configuration
```bash
#!/bin/bash

# Configure firewalld with common rules
configure_firewall() {
    local interface="${1:-eth0}"
    
    # Set default policies
    sudo firewall-cmd --set-default-zone=drop
    sudo firewall-cmd --zone=drop --add-interface="$interface"
    sudo firewall-cmd --zone=trusted --add-interface=lo
    
    # Allow SSH (change port if needed)
    sudo firewall-cmd --zone=public --add-service=ssh
    sudo firewall-cmd --zone=public --add-port=2222/tcp --permanent
    
    # Allow HTTP/HTTPS
    sudo firewall-cmd --zone=public --add-service=http
    sudo firewall-cmd --zone=public --add-service=https
    
    # Allow from internal network
    sudo firewall-cmd --zone=trusted --add-source=10.0.0.0/8
    sudo firewall-cmd --zone=trusted --add-source=192.168.0.0/16
    
    # Reload and save
    sudo firewall-cmd --reload
    sudo firewall-cmd --runtime-to-permanent
    echo "Firewall configured"
}

# Configure nftables
configure_nftables() {
    sudo nft -f - <<'EOF'
table inet filter {
    chain input {
        type filter hook input priority 0;
        ct state established,related accept
        iif lo accept
        ip protocol icmp accept
        tcp dport ssh accept
        tcp dport {80, 443} accept
        drop
    }
    chain forward {
        type filter hook forward priority 0;
        drop
    }
    chain output {
        type filter hook output priority 0;
        accept
    }
}
EOF
    sudo nft add table inet filter
    echo "nftables configured"
}
```

### Log Analysis
```bash
#!/bin/bash

# Analyze system logs
analyze_logs() {
    local timeframe="${1:-24h}"
    local logfile="${2:-/var/log/syslog}"
    
    echo "=== Log Analysis ($timeframe) ==="
    
    # Failed login attempts
    echo "Failed SSH attempts:"
    journalctl -u sshd --since "$timeframe" | grep "Failed" | \
        awk '{print $11}' | sort | uniq -c | sort -rn | head -10
    
    # Most frequent error messages
    echo "Common errors:"
    journalctl -p err --since "$timeframe" --no-pager | \
        awk '{print $5}' | sort | uniq -c | sort -rn | head -10
    
    # System restarts
    echo "Recent restarts:"
    last reboot | head -5
}

# Configure logrotate
configure_logrotate() {
    cat > /etc/logrotate.d/app-logs <<'EOF'
/var/log/app/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload app > /dev/null 2>&1 || true
    endscript
}
EOF
    echo "Log rotation configured for /var/log/app/"
}
```

## Best Practices
- Use SSH keys instead of passwords for authentication
- Keep systems updated with regular security patches
- Configure automated security updates for production systems
- Use fail2ban or similar tools to prevent brute force attacks
- Implement proper backup strategies and test restores regularly
- Use configuration management (Ansible, Puppet, Chef)
- Monitor system metrics with Prometheus, Grafana, or similar
- Enable and review audit logs for security events
- Use sudo instead of root login for day-to-day administration
- Document all system configurations and changes
