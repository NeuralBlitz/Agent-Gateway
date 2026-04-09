---
name: backup-recovery
description: Backup and disaster recovery planning and implementation for enterprise systems
license: MIT
compatibility: opencode
metadata:
  audience: system-administrators
  category: systems-administration
---

## What I do
- Design backup strategies and policies
- Implement backup solutions (Veeam, Bacula, rsync, Restic)
- Create disaster recovery plans
- Test backup restores regularly
- Manage replication and snapshots
- Coordinate failover procedures
- Document recovery procedures
- Optimize backup windows
- Implement backup encryption
- Monitor backup success and integrity

## When to use me
When designing backup strategies, implementing disaster recovery procedures, or troubleshooting backup failures.

## Core Concepts
- Backup types (full, incremental, differential)
- RPO (Recovery Point Objective) and RTO (Recovery Time Objective)
- Backup media and storage strategies
- Replication and failover clustering
- Snapshot management
- Backup encryption and security
- Disaster recovery testing
- Cloud backup solutions
- Database backup strategies
- Bare-metal recovery procedures

## Code Examples

### Backup Scripts
```bash
#!/bin/bash
set -euo pipefail

# Configuration
readonly BACKUP_BASE="/backup"
readonly RETENTION_DAYS=30
readonly ENCRYPTION_KEY_FILE="/etc/backup/encryption.key"
readonly LOG_FILE="/var/log/backup.log"
readonly NOTIFICATION_EMAIL="admin@example.com"

# Logging
log() {
    local level="$1"
    shift
    local message="$@"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

log "INFO" "=== Backup started ==="

# Database backup function
backup_database() {
    local db_type="$1"
    local db_host="$2"
    local db_name="$3"
    local backup_path="$4"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    log "INFO" "Backing up database: $db_name"
    
    case "$db_type" in
        postgresql)
            local backup_file="${backup_path}/${db_name}_${timestamp}.sql.gz.enc"
            
            # Create backup with compression and encryption
            PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$db_host" -U "${DB_USER}" "$db_name" | \
                gzip | \
                openssl enc -aes-256-cbc -salt -pbkdf2 \
                    -pass file:"$ENCRYPTION_KEY_FILE" \
                    -out "$backup_file"
            
            # Verify backup
            if openssl enc -d -aes-256-cbc -pbkdf2 \
                -pass file:"$ENCRYPTION_KEY_FILE" \
                -in "$backup_file" | gzip -d > /dev/null; then
                local size=$(du -h "$backup_file" | cut -f1)
                log "INFO" "Backup verified: $backup_file ($size)"
                
                # Calculate checksum
                sha256sum "$backup_file" > "${backup_file}.sha256"
                log "INFO" "Checksum created for $backup_file"
            else
                log "ERROR" "Backup verification failed for $db_name"
                return 1
            fi
            ;;
            
        mysql)
            local backup_file="${backup_path}/${db_name}_${timestamp}.sql.gz.enc"
            
            mysqldump -h "$db_host" -u "${DB_USER}" -p"${DB_PASSWORD}" \
                --single-transaction --quick "$ \
                gzip |db_name" | \
                openssl enc -aes-256-cbc -salt -pbkdf2 \
                    -pass file:"$ENCRYPTION_KEY_FILE" \
                    -out "$backup_file"
            ;;
    esac
    
    # Set permissions
    chmod 600 "$backup_file"
}

# File system backup with rsync
backup_filesystem() {
    local source_path="$1"
    local dest_path="$2"
    local backup_name="$3"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    log "INFO" "Backing up filesystem: $source_path"
    
    # Create directory structure
    mkdir -p "${dest_path}/${backup_name}/${timestamp}"
    
    # Perform rsync backup with hard links for efficiency
    rsync -av --delete \
        --link-dest="${dest_path}/${backup_name}/current" \
        "$source_path/" \
        "${dest_path}/${backup_name}/${timestamp}/"
    
    # Update current symlink
    rm -f "${dest_path}/${backup_name}/current"
    ln -s "${dest_path}/${backup_name}/${timestamp}" "${dest_path}/${backup_name}/current"
    
    log "INFO" "Filesystem backup completed: ${dest_path}/${backup_name}/${timestamp}"
}

# Kubernetes backup with Velero
backup_kubernetes() {
    local backup_name="$1"
    local included_namespaces="${2:-*}"
    local excluded_namespaces="${3:-kube-system,kube-public}"
    
    log "INFO" "Creating Kubernetes backup: $backup_name"
    
    # Create Velero backup
    velero backup create "$backup_name" \
        --include-namespaces "$included_namespaces" \
        --exclude-namespaces "$excluded_namespaces" \
        --snapshot-volumes \
        --wait
    
    # Verify backup status
    velero backup describe "$backup_name" --details
    velero backup logs "$backup_name" | tail -20
}

# Retention policy enforcement
enforce_retention() {
    local backup_path="$1"
    local max_age_days="${2:-$RETENTION_DAYS}"
    
    log "INFO" "Enforcing retention policy (${max_age_days} days)"
    
    # Find and remove old backups
    local deleted=0
    while IFS= read -r -d '' backup; do
        rm -rf "$backup"
        ((deleted++))
        log "INFO" "Removed old backup: $backup"
    done < <(find "$backup_path" -maxdepth 1 -type d -name "??????_??_??_??_??_??" -mtime +$max_age_days -print0)
    
    log "INFO" "Removed $deleted old backup directories"
}

# Health check
backup_health_check() {
    log "INFO" "Running backup health check"
    
    local checks_passed=0
    local checks_failed=0
    
    # Check backup directory exists
    if [ -d "$BACKUP_BASE" ]; then
        log "INFO" "Backup directory exists: $BACKUP_BASE"
        ((checks_passed++))
    else
        log "ERROR" "Backup directory missing: $BACKUP_BASE"
        ((checks_failed++))
    fi
    
    # Check latest backup age
    local latest_backup=$(find "$BACKUP_BASE" -maxdepth 2 -type d -name "??????_??_??_??_??_??" -printf '%T+ %p\n' 2>/dev/null | sort -r | head -1 | cut -d' ' -f2-)
    if [ -n "$latest_backup" ]; then
        local backup_age=$(find "$latest_backup" -maxdepth 1 -type f -printf '%T+\n' 2>/dev/null | head -1)
        log "INFO" "Latest backup: $backup_name ($backup_age)"
        ((checks_passed++))
    else
        log "ERROR" "No backups found"
        ((checks_failed++))
    fi
    
    # Check encryption key exists
    if [ -f "$ENCRYPTION_KEY_FILE" ]; then
        ((checks_passed++))
    else
        log "ERROR" "Encryption key missing"
        ((checks_failed++))
    fi
    
    # Summary
    log "INFO" "Health check: $checks_passed passed, $checks_failed failed"
    
    if [ $checks_failed -gt 0 ]; then
        echo "Backup health check FAILED" | mail -s "Backup Alert" "$NOTIFICATION_EMAIL"
        return 1
    fi
}

# Main execution
main() {
    local action="${1:-all}"
    
    case "$action" in
        database)
            backup_database "postgresql" "db.example.com" "app_production" "/backup/databases"
            ;;
        filesystem)
            backup_filesystem "/var/www" "/backup/filesystems" "www"
            ;;
        kubernetes)
            backup_kubernetes "daily-$(date +%Y%m%d)"
            ;;
        retention)
            enforce_retention "/backup"
            ;;
        health)
            backup_health_check
            ;;
        all|*)
            backup_database "postgresql" "db.example.com" "app_production" "/backup/databases"
            backup_filesystem "/var/www" "/backup/filesystems" "www"
            backup_kubernetes "daily-$(date +%Y%m%d)"
            enforce_retention "/backup"
            backup_health_check
            ;;
    esac
    
    log "INFO" "=== Backup completed ==="
}

main "$@"
```

### Disaster Recovery Plan
```markdown
# Disaster Recovery Plan

## Executive Summary
- **RPO**: 4 hours (max data loss)
- **RTO**: 8 hours (max downtime)
- **Recovery Sites**: Primary (AWS us-east-1), DR (AWS us-west-2)

## Critical Systems
| System | RTO | RPO | Priority |
|--------|-----|-----|----------|
| Database | 2h | 15min | P0 |
| Application | 4h | 1h | P1 |
| File Storage | 8h | 4h | P2 |

## Recovery Procedures

### 1. Database Recovery (PostgreSQL)
```bash
#!/bin/bash
# Emergency DB recovery script

# Variables
BACKUP_PATH="/dr-backup/postgresql"
LATEST_BACKUP=$(ls -td "$BACKUP_PATH"/*/ | head -1)
TARGET_HOST="dr-db.example.com"

# Stop application
kubectl scale deployment/app --replicas=0 -n production

# Restore database
ssh "$TARGET_HOST" "sudo systemctl stop postgresql"
scp "$LATEST_BACKUP"/*.enc "$TARGET_HOST:/tmp/"
ssh "$TARGET_HOST" "
    cd /tmp
    for file in *.enc; do
        openssl enc -d -aes-256-cbc -pbkdf2 \
            -pass file:/etc/backup/encryption.key \
            -in \"\$file\" -out \"\${file%.enc}\" 2>/dev/null || true
    done
    find /tmp -name '*.sql' -exec psql -U postgres -d app_production {} \;
"
ssh "$TARGET_HOST" "sudo systemctl start postgresql"

# Verify
psql -h "$TARGET_HOST" -U postgres -d app_production -c \"SELECT COUNT(*) FROM users;\"
```

### 2. Application Recovery
```bash
#!/bin/bash
# Emergency application recovery

# Update kubeconfig to DR cluster
export KUBECONFIG=/etc/kubernetes/dr-kubeconfig

# Verify cluster health
kubectl get nodes
kubectl get pods -n production

# Restore ConfigMaps and Secrets
kubectl apply -f /dr-backup/k8s/configmaps/
kubectl apply -f /dr-backup/k8s/secrets/

# Deploy applications
kubectl apply -f /dr-backup/k8s/deployments/

# Scale up
kubectl scale deployment/app --replicas=3 -n production

# Verify
kubectl rollout status deployment/app -n production
kubectl get svc -n production
```

### 3. DNS Failover
```bash
#!/bin/bash
# Update DNS for failover

# Get DR site IPs
DR_LB=$(aws elb describe-load-balancers \
    --load-balancer-names app-dr \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

# Update Route53
aws route53 change-resource-record-sets \
    --hosted-zone-id ZXXXXXXXXXXXXX \
    --change-batch file://<(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "app.example.com",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{ "Value": "$DR_LB" }]
    }
  }]
}
EOF
)

echo "DNS updated to point to DR site"
```

## Testing Schedule
- **Weekly**: Backup verification
- **Monthly**: Database restore test
- **Quarterly**: Full DR simulation

## Contacts
| Role | Name | Phone | Email |
|------|------|-------|-------|
| DR Coordinator | John Smith | +1-555-0100 | john.smith@example.com |
| DBA | Jane Doe | +1-555-0101 | jane.doe@example.com |
```

## Best Practices
- Follow 3-2-1 backup rule: 3 copies, 2 media types, 1 offsite
- Test restores regularly, not just backups
- Document recovery procedures and keep them updated
- Automate backup verification checksums
- Use encryption for sensitive data at rest and in transit
- Maintain clear RPO/RTO definitions for each system
- Implement monitoring for backup jobs and success rates
- Use source-controlled backup configurations
- Regular DR testing and documentation of findings
- Maintain offline/offsite backup copies for ransomware protection
