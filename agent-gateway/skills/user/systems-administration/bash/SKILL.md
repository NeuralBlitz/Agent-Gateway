---
name: bash
description: Bash shell scripting for automation, system administration, and command-line productivity
license: MIT
compatibility: opencode
metadata:
  audience: system-administrators
  category: systems-administration
---

## What I do
- Write automation scripts for system tasks
- Process and transform data files
- Manage processes and system resources
- Create interactive shell menus
- Parse logs and configuration files
- Handle error conditions and debugging
- Manage text processing with grep, sed, awk
- Schedule jobs with cron and at
- Create reusable script functions
- Build complex workflows

## When to use me
When automating system administration tasks, processing data files, creating shell scripts, or working in Linux/Unix environments.

## Core Concepts
- Bash scripting syntax and best practices
- Parameter expansion and quoting
- Process substitution and pipes
- Control structures (if, case, loops, functions)
- Regular expressions with grep/sed/awk
- Exit codes and error handling
- Arrays and associative arrays
- Here-documents and here-strings
- Signal handling and traps
- Subshells and command grouping

## Code Examples

### System Automation Scripts
```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
readonly LOG_FILE="/var/log/backup.log"
readonly BACKUP_DIR="/backup"
readonly RETENTION_DAYS=30

# Logging function
log() {
    local level="$1"
    shift
    local message="$@"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

# Database backup function
backup_postgresql() {
    local db_name="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/${db_name}_${timestamp}.sql.gz"
    
    log "INFO" "Starting backup of database: $db_name"
    
    if pg_dump "$db_name" | gzip > "$backup_file"; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "INFO" "Backup completed: $backup_file ($size)"
        
        # Verify backup integrity
        if gzip -t "$backup_file" 2>/dev/null; then
            log "INFO" "Backup verified successfully"
        else
            log "ERROR" "Backup verification failed!"
            return 1
        fi
    else
        log "ERROR" "Backup failed for database: $db_name"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days"
    
    local deleted=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted++))
        log "INFO" "Removed: $file"
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -print0)
    
    log "INFO" "Cleaned up $deleted old backup files"
}

# Health check function
health_check() {
    local checks_passed=0
    local checks_failed=0
    
    # Check disk space
    if df / | awk 'NR==2 {exit ($5 > 90)}'; then
        log "INFO" "Disk space check: PASSED"
        ((checks_passed++))
    else
        log "ERROR" "Disk space check: FAILED (>/= 90% used)"
        ((checks_failed++))
    fi
    
    # Check memory
    local mem_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    if (( $(echo "$mem_usage < 90" | bc -l) )); then
        log "INFO" "Memory check: PASSED ($mem_usage%)"
        ((checks_passed++))
    else
        log "ERROR" "Memory check: FAILED ($mem_usage%)"
        ((checks_failed++))
    fi
    
    # Check critical services
    for service in nginx postgresql redis; do
        if systemctl is-active --quiet "$service"; then
            log "INFO" "Service $service: RUNNING"
            ((checks_passed++))
        else
            log "ERROR" "Service $service: NOT RUNNING"
            ((checks_failed++))
        fi
    done
    
    log "INFO" "Health check complete: $checks_passed passed, $checks_failed failed"
    return $checks_failed
}

# Main execution
main() {
    log "INFO" "========================================="
    log "INFO" "Backup script started"
    
    # Run health check first
    health_check || {
        log "WARN" "Health check failed, but continuing with backup"
    }
    
    # Backup databases
    for db in app_production app_staging; do
        backup_postgresql "$db" || log "ERROR" "Failed to backup: $db"
    done
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "INFO" "Backup script completed"
    log "INFO" "========================================="
}

# Execute main function
main "$@"
```

### Advanced Data Processing
```bash
#!/usr/bin/env bash
set -euo pipefail

# Parse CSV and generate reports
generate_user_report() {
    local csv_file="$1"
    local output_dir="$2"
    
    # Create output directory
    mkdir -p "$output_dir"
    
    # Process CSV with awk
    awk -F',' '
    NR > 1 {
        # Count by department
        dept_count[$3]++
        # Sum salaries
        dept_salary[$3] += $5
        # Track active/inactive
        if ($6 == "active") active_count++
        else inactive_count++
    }
    END {
        print "Department Report"
        print "================="
        for (dept in dept_count) {
            printf "%-20s: %3d employees, $%10.2f avg salary\n", \
                dept, dept_count[dept], dept_salary[dept] / dept_count[dept]
        }
        printf "\nTotal Active: %d\nTotal Inactive: %d\n", active_count, inactive_count
    }' "$csv_file" > "$output_dir/department_summary.txt"
    
    # Generate JSON with jq-like approach using Python
    python3 <<PYEOF
import csv
import json
import sys

data = []
with open('$csv_file', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        data.append({
            'id': int(row['id']),
            'name': row['name'],
            'email': row['email'],
            'department': row['department'],
            'salary': float(row['salary'])
        })

with open('$output_dir/users.json', 'w') as f:
    json.dump(data, f, indent=2)
PYEOF
    
    log "INFO" "Reports generated in $output_dir"
}

# Concurrent processing with GNU parallel
process_files_concurrent() {
    local source_dir="$1"
    local dest_dir="$2"
    local max_jobs="${3:-4}"
    
    export DEST_DIR="$dest_dir"
    
    process_single_file() {
        local file="$1"
        local basename=$(basename "$file")
        echo "Processing $basename to $DEST_DIR"
        # Actual processing logic here
        cp "$file" "$DEST_DIR/${basename%.txt}_processed.txt"
    }
    
    export -f process_single_file
    find "$source_dir" -name "*.txt" -print0 | \
        xargs -0 -P "$max_jobs" -I {} bash -c 'process_single_file "$@"' _ {}
}
```

### Network Utilities
```bash
#!/usr/bin/env bash

# Port scanner
scan_ports() {
    local host="${1:-localhost}"
    local start_port="${2:-1}"
    local end_port="${3:-1024}"
    
    echo "Scanning $host ports $start_port-$end_port..."
    
    for port in $(seq $start_port $end_port); do
        if timeout 0.5 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null; then
            echo "Port $port: OPEN ($(grep "^$port/" /etc/services 2>/dev/null | cut -f1 || echo 'unknown')"
        fi
    done
}

# Network bandwidth monitor
monitor_bandwidth() {
    local interface="${1:-eth0}"
    local interval="${2:-1}"
    
    echo "Monitoring $interface bandwidth (interval: ${interval}s)"
    echo "RX (MB)  TX (MB)    RX/s     TX/s"
    echo "-------  -------   ------   ------"
    
    local prev_rx=$(cat /sys/class/net/$interface/statistics/rx_bytes)
    local prev_tx=$(cat /sys/class/net/$interface/statistics/tx_bytes)
    
    while true; do
        sleep "$interval"
        
        local curr_rx=$(cat /sys/class/net/$interface/statistics/rx_bytes)
        local curr_tx=$(cat /sys/class/net/$interface/statistics/tx_bytes)
        
        local rx_diff=$((curr_rx - prev_rx))
        local tx_diff=$((curr_tx - prev_tx))
        
        printf "%7.2f  %7.2f  %7.2f  %7.2f\n" \
            $((curr_rx / 1024 / 1024)) $((curr_tx / 1024 / 1024)) \
            $(echo "scale=2; $rx_diff / 1024 / 1024 / $interval" | bc) \
            $(echo "scale=2; $tx_diff / 1024 / 1024 / $interval" | bc)
        
        prev_rx=$curr_rx
        prev_tx=$curr_tx
    done
}
```

## Best Practices
- Always use `set -euo pipefail` at script start
- Use double quotes around variables to prevent word splitting
- Use `readonly` for constants and configuration values
- Prefer `printf` over `echo` for portable output
- Use functions to organize code and enable testing
- Return meaningful exit codes (0=success, non-zero=failure)
- Document scripts with comments and usage functions
- Handle signals with trap for cleanup
- Avoid parsing output of `ls` - use globs instead
- Test scripts with shellcheck for common issues
