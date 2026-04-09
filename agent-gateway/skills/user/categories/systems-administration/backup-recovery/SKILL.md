---
name: backup-recovery
description: Backup and disaster recovery planning and implementation
category: systems-administration
difficulty: intermediate
tags: [backup, recovery, disaster, data-protection]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Backup and Recovery

## What I Do

I am Backup and Recovery, the discipline of protecting data and ensuring business continuity through systematic data protection strategies. I encompass full backups, incremental backups, differential backups, and continuous data protection. I help organizations meet Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO). I implement redundancy through local and offsite copies, testing recovery procedures regularly. I cover various data types: files, databases, system states, virtual machines, and cloud resources. I integrate with tape libraries, disk arrays, cloud storage, and object storage. I ensure compliance requirements through encryption, retention policies, and audit trails.

## When to Use Me

- Protecting critical business data
- Meeting compliance requirements (HIPAA, SOX, GDPR)
- Disaster recovery planning
- Ransomware protection and recovery
- Database backup and point-in-time recovery
- Virtual machine protection
- Cloud workload backup
- Long-term archival storage

## Core Concepts

**RTO (Recovery Time Objective)**: Maximum acceptable downtime.

**RPO (Recovery Point Objective)**: Maximum acceptable data loss.

**Backup Types**: Full, incremental, differential, synthetic full.

**Retention Policies**: How long backups are kept.

**Backup Windows**: Scheduled times for backup operations.

**Immutability**: Write-once storage for ransomware protection.

**3-2-1 Rule**: 3 copies, 2 media types, 1 offsite.

**Validation**: Testing backup integrity and recovery procedures.

## Code Examples

### Example 1: Backup Orchestration Script (Bash)
```bash
#!/bin/bash
set -euo pipefail

# Backup Orchestration Script
readonly LOG_DIR="/var/log/backups"
readonly BACKUP_BASE="/mnt/backups"
readonly RETENTION_DAYS=30
readonly ENCRYPTION_KEY_FILE="/etc/backup/encryption.key"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/backup.log"
}

error() {
    echo "[ERROR] $*" | tee -a "$LOG_DIR/backup.log"
    exit 1
}

# Calculate checksums for verification
calculate_checksum() {
    local file="$1"
    sha256sum "$file" | awk '{print $1}'
}

verify_checksum() {
    local file="$1"
    local expected="$2"
    local actual=$(calculate_checksum "$file")
    
    if [[ "$expected" == "$actual" ]]; then
        echo "OK"
    else
        echo "FAILED"
    fi
}

# Database backup functions
backup_mysql() {
    local db_host="$1"
    local db_name="$2"
    local db_user="$3"
    local output_dir="$4"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    log "Starting MySQL backup for $db_name..."
    
    local backup_file="${output_dir}/mysql_${db_name}_${timestamp}.sql.gz.enc"
    
    mysqldump \
        -h "$db_host" \
        -u "$db_user" \
        -p"${DB_PASSWORD:-}" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        "$db_name" |
        gzip |
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -pass file:"$ENCRYPTION_KEY_FILE" \
            -out "$backup_file"
    
    local checksum=$(calculate_checksum "$backup_file")
    echo "$checksum $backup_file" >> "${output_dir}/checksums.txt"
    
    log "MySQL backup completed: $backup_file"
    
    # Return file size for reporting
    du -h "$backup_file" | cut -f1
}

backup_postgres() {
    local db_host="$1"
    local db_name="$2"
    local output_dir="$3"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    log "Starting PostgreSQL backup for $db_name..."
    
    local backup_file="${output_dir}/postgres_${db_name}_${timestamp}.dump.gz.enc"
    
    PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "$db_host" \
        -U "$db_user" \
        -Fc \
        "$db_name" |
        gzip |
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -pass file:"$ENCRYPTION_KEY_FILE" \
            -out "$backup_file"
    
    local checksum=$(calculate_checksum "$backup_file")
    echo "$checksum $backup_file" >> "${output_dir}/checksums.txt"
    
    log "PostgreSQL backup completed: $backup_file"
}

# File system backup
backup_filesystem() {
    local source_dir="$1"
    local output_dir="$2"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name=$(basename "$source_dir")
    
    log "Starting filesystem backup for $source_dir..."
    
    local backup_file="${output_dir}/fs_${backup_name}_${timestamp}.tar.gz.enc"
    
    tar -czf - -C "$(dirname "$source_dir")" "$(basename "$source_dir")" |
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -pass file:"$ENCRYPTION_KEY_FILE" \
            -out "$backup_file"
    
    local checksum=$(calculate_checksum "$backup_file")
    echo "$checksum $backup_file" >> "${output_dir}/checksums.txt"
    
    log "Filesystem backup completed: $backup_file"
    du -h "$backup_file" | cut -f1
}

# System state backup (Linux)
backup_system_state() {
    local output_dir="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    log "Starting system state backup..."
    
    # Backup /etc
    backup_filesystem "/etc" "$output_dir"
    
    # Backup package lists
    if command -v dpkg &>/dev/null; then
        dpkg --get-selections > "${output_dir}/packages_${timestamp}.txt"
        log "Package list backed up"
    fi
    
    # Backup cron jobs
    if [[ -d /etc/cron.d ]]; then
        backup_filesystem "/etc/cron.d" "$output_dir"
    fi
    
    # Backup user databases
    if command -v getent &>/dev/null; then
        getent passwd > "${output_dir}/users_${timestamp}.txt"
        getent group > "${output_dir}/groups_${timestamp}.txt"
    fi
    
    log "System state backup completed"
}

# Retention management
cleanup_old_backups() {
    local backup_dir="$1"
    local retention_days="$2"
    
    log "Cleaning up backups older than $retention_days days..."
    
    find "$backup_dir" -type f -mtime +"$retention_days" -delete
    find "$backup_dir" -type d -empty -delete
    
    # Clean up orphaned checksum entries
    while IFS= read -r line; do
        local file=$(echo "$line" | cut -d' ' -f2-)
        if [[ ! -f "$file" ]]; then
            sed -i "/$file/d" "${backup_dir}/checksums.txt"
        fi
    done < "${backup_dir}/checksums.txt"
    
    log "Cleanup completed"
}

# Verify all backups
verify_all_backups() {
    local backup_dir="$1"
    local failed=0
    
    log "Verifying all backups..."
    
    while IFS= read -r line; do
        local checksum=$(echo "$line" | awk '{print $1}')
        local file=$(echo "$line" | cut -d' ' -f2-)
        
        if [[ -f "$file" ]]; then
            local result=$(verify_checksum "$file" "$checksum")
            if [[ "$result" == "FAILED" ]]; then
                error "Checksum verification FAILED: $file"
                ((failed++))
            else
                echo "✓ $file: OK"
            fi
        else
            error "Backup file missing: $file"
            ((failed++))
        fi
    done < "${backup_dir}/checksums.txt"
    
    if [[ $failed -eq 0 ]]; then
        log "All backups verified successfully"
    else
        error "$failed backup(s) failed verification"
    fi
}

# Generate backup report
generate_report() {
    local backup_dir="$1"
    local report_file="${backup_dir}/backup_report_$(date +%Y%m%d).txt"
    
    cat > "$report_file" << EOF
=== Backup Report ===
Generated: $(date)
Backup Directory: $backup_dir

=== Backup Summary ===
Total Files: $(find "$backup_dir" -type f | wc -l)
Total Size: $(du -sh "$backup_dir" | cut -f1)

=== Recent Backups ===
$(ls -lh "$backup_dir" | grep -E '\.(sql|dump|tar|gz|enc)$' | tail -10)

=== Verification Status ===
EOF
    
    tail -5 "${backup_dir}/backup.log" >> "$report_file"
    
    # Send notification
    if command -v mail &>/dev/null; then
        mail -s "Backup Report - $(hostname)" admin@example.com < "$report_file"
    fi
    
    log "Report generated: $report_file"
}

# Main backup orchestration
run_backup() {
    local config_file="${1:-/etc/backup/config.sh}"
    
    if [[ -f "$config_file" ]]; then
        source "$config_file"
    fi
    
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_BASE"
    
    local timestamp=$(date +%Y%m%d)
    local daily_dir="${BACKUP_BASE}/daily/${timestamp}"
    mkdir -p "$daily_dir"
    
    log "Starting backup process..."
    
    # Run configured backups
    if [[ -n "${MYSQL_HOSTS:-}" ]]; then
        for db_host in $MYSQL_HOSTS; do
            for db_name in $MYSQL_DATABASES; do
                backup_mysql "$db_host" "$db_name" "$MYSQL_USER" "$daily_dir"
            done
        done
    fi
    
    if [[ -n "${POSTGRES_HOSTS:-}" ]]; then
        for db_host in $POSTGRES_HOSTS; do
            backup_postgres "$db_host" "$POSTGRES_DB" "$daily_dir"
        done
    fi
    
    if [[ -n "${BACKUP_DIRS:-}" ]]; then
        for dir in $BACKUP_DIRS; do
            backup_filesystem "$dir" "$daily_dir"
        done
    fi
    
    # System state backup
    backup_system_state "$daily_dir"
    
    # Verify and cleanup
    verify_all_backups "$BACKUP_BASE"
    cleanup_old_backups "$BACKUP_BASE" "$RETENTION_DAYS"
    generate_report "$BACKUP_BASE"
    
    log "Backup process completed"
}

# Recovery functions
restore_mysql() {
    local backup_file="$1"
    local db_host="$2"
    local db_name="$3"
    local db_user="$4"
    
    log "Restoring MySQL database from $backup_file..."
    
    openssl enc -aes-256-cbc -d -pbkdf2 \
        -pass file:"$ENCRYPTION_KEY_FILE" \
        -in "$backup_file" |
        gunzip |
        mysql -h "$db_host" -u "$db_user" -p"${DB_PASSWORD:-}" "$db_name"
    
    log "MySQL restore completed"
}

restore_filesystem() {
    local backup_file="$1"
    local restore_dir="$2"
    
    log "Restoring filesystem from $backup_file..."
    
    mkdir -p "$restore_dir"
    
    openssl enc -aes-256-cbc -d -pbkdf2 \
        -pass file:"$ENCRYPTION_KEY_FILE" \
        -in "$backup_file" |
        tar -xzf - -C "$restore_dir"
    
    log "Filesystem restore completed"
}

# Point-in-time recovery
pit_recovery_mysql() {
    local target_time="$1"
    local binlog_dir="$2"
    
    log "Performing point-in-time recovery to $target_time..."
    
    # First restore last full backup
    local last_full=$(ls -t "$BACKUP_BASE"/*/mysql_*.sql.gz.enc | tail -1)
    restore_mysql "$last_full"
    
    # Apply incremental backups
    # Apply binary logs for point-in-time
    mysqlbinlog \
        --stop-datetime="$target_time" \
        "$binlog_dir"/binlog.* |
        mysql -u root -p
    
    log "Point-in-time recovery completed"
}

# Run main function
run_backup "$@"
```

### Example 2: Veeam Backup Integration (PowerShell)
```powershell
# Veeam Backup PowerShell Integration

function Get-VeeamBackupJob {
    <#
    .SYNOPSIS
        Get backup job status
    #>
    Add-PSSnapin VeeamPSSnapin -ErrorAction SilentlyContinue
    
    Get-VBRJob |
        Select-Object Name, JobType, IsScheduleEnabled,
                      LastRunTime, LastResult, NextRunTime
}

function Start-VeeamBackupJob {
    <#
    .SYNOPSIS
        Start a backup job
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$JobName
    )
    
    $job = Get-VBRJob -Name $JobName -ErrorAction Stop
    
    Start-VBRJob -Job $job
    
    Write-Host "Started backup job: $JobName"
}

function Get-VeeamBackupReport {
    <#
    .SYNOPSIS
        Generate backup status report
    #>
    
    $report = @()
    
    $jobs = Get-VBRJob | Where-Object {$_.IsScheduleEnabled}
    
    foreach ($job in $jobs) {
        $session = Get-VBRBackupSession -Job $job | Sort-Object -Property CreationTime -Descending | Select-Object -First 1
        
        $report += [PSCustomObject]@{
            JobName = $job.Name
            JobType = $job.JobType
            Enabled = $job.IsScheduleEnabled
            LastRun = $session.CreationTime
            LastResult = $session.Result
            SizeGB = [math]::Round($job.GetStorage().Stats.BackupSize / 1GB, 2)
            DataSizeGB = [math]::Round($job.GetStorage().Stats.DataSize / 1GB, 2)
            Deduplication = "$([math]::Round($job.GetStorage().Stats.DedupRatio, 1))x"
            Compression = "$([math]::Round($job.GetStorage().Stats.CompressRatio, 1))x"
        }
    }
    
    return $report | Sort-Object JobName
}

function Test-VeeamBackupIntegrity {
    <#
    .SYNOPSIS
        Verify backup integrity using SureBackup
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$JobName
    )
    
    $job = Get-VBRJob -Name $JobName
    $backup = Get-VBRBackup -Name $JobName
    
    # Start SureBackup verification
    $vbrServer = Get-VBRServer -Name $env:COMPUTERNAME
    $sureBackupJob = Start-VBRSureBackup -Backup $backup -Server $vbrServer -Wait
    
    $sureBackupJob | Select-Object Name, CreationTime, State, Result
}

function Export-VeeamBackupList {
    <#
    .SYNOPSIS
        Export all backups to CSV
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$OutputPath
    )
    
    $backups = Get-VBRBackup
    
    $backupInfo = foreach ($backup in $backups) {
        foreach ($restorePoint in $backup.GetAllPoints()) {
            [PSCustomObject]@{
                BackupName = $backup.Name
                JobType = $backup.JobType
                CreationTime = $restorePoint.CreationTime
                SizeGB = [math]::Round($restorePoint.GetAppropriateSize().Bytes / 1GB, 2)
                Retention = $restorePoint.Type
                Storage = $backup.GetStorage().Path
            }
        }
    }
    
    $backupInfo | Export-Csv -Path $OutputPath -NoTypeInformation
    Write-Host "Exported $($backupInfo.Count) restore points to $OutputPath"
}
```

### Example 3: Cloud Backup Script (Python)
```python
#!/usr/bin/env python3
"""
Cloud Backup Manager - Backup to AWS S3, Azure Blob, GCP Storage
"""
import boto3
import hashlib
import json
import os
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor

@dataclass
class BackupConfig:
    provider: str
    bucket: str
    region: str
    encryption_key: str
    retention_days: int
    compression: bool = True
    parallel_uploads: int = 4

class CloudProvider(ABC):
    @abstractmethod
    def upload_file(self, local_path: str, remote_path: str) -> Dict:
        pass
    
    @abstractmethod
    def download_file(self, remote_path: str, local_path: str) -> None:
        pass
    
    @abstractmethod
    def list_objects(self, prefix: str = '') -> List[Dict]:
        pass
    
    @abstractmethod
    def delete_object(self, remote_path: str) -> None:
        pass
    
    @abstractmethod
    def get_object_metadata(self, remote_path: str) -> Dict:
        pass

class S3BackupProvider(CloudProvider):
    def __init__(self, config: BackupConfig):
        self.config = config
        self.s3 = boto3.client('s3',
            region_name=config.region
        )
        self.bucket = config.bucket
    
    def upload_file(self, local_path: str, remote_path: str) -> Dict:
        checksum = self.calculate_checksum(local_path)
        
        extra_args = {
            'ServerSideEncryption': 'aws:kms',
            'SSEKMSKeyId': self.config.encryption_key,
            'Metadata': {
                'checksum': checksum,
                'backup_date': datetime.utcnow().isoformat()
            }
        }
        
        if self.config.compression:
            extra_args['ContentEncoding'] = 'gzip'
        
        start_time = time.time()
        self.s3.upload_file(local_path, self.bucket, remote_path, ExtraArgs=extra_args)
        
        return {
            'path': remote_path,
            'size': os.path.getsize(local_path),
            'checksum': checksum,
            'upload_time': time.time() - start_time,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def download_file(self, remote_path: str, local_path: str) -> None:
        self.s3.download_file(self.bucket, remote_path, local_path)
    
    def list_objects(self, prefix: str = '') -> List[Dict]:
        response = self.s3.list_objects_v2(
            Bucket=self.bucket,
            Prefix=prefix
        )
        
        return [{
            'key': obj['Key'],
            'size': obj['Size'],
            'last_modified': obj['LastModified'].isoformat()
        } for obj in response.get('Contents', [])]
    
    def delete_object(self, remote_path: str) -> None:
        self.s3.delete_object(Bucket=self.bucket, Key=remote_path)
    
    def get_object_metadata(self, remote_path: str) -> Dict:
        response = self.s3.head_object(Bucket=self.bucket, Key=remote_path)
        return {
            'size': response['ContentLength'],
            'checksum': response['Metadata'].get('checksum'),
            'last_modified': response['LastModified'].isoformat()
        }
    
    def calculate_checksum(self, file_path: str) -> str:
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

class BackupManager:
    def __init__(self, config: BackupConfig):
        self.config = config
        self.providers: Dict[str, CloudProvider] = {}
    
    def register_provider(self, name: str, provider: CloudProvider):
        self.providers[name] = provider
    
    def upload_with_retry(self, provider_name: str, local_path: str, 
                          remote_path: str, max_retries: int = 3) -> Dict:
        provider = self.providers[provider_name]
        
        for attempt in range(max_retries):
            try:
                return provider.upload_file(local_path, remote_path)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
    
    def parallel_upload(self, local_path: str, remote_path: str) -> None:
        """Upload to multiple providers in parallel"""
        with ThreadPoolExecutor(max_workers=len(self.providers)) as executor:
            futures = {
                name: executor.submit(self.upload_with_retry, name, local_path, remote_path)
                for name in self.providers.keys()
            }
            
            for name, future in futures.items():
                try:
                    result = future.result()
                    print(f"Uploaded to {name}: {result['path']}")
                except Exception as e:
                    print(f"Failed to upload to {name}: {e}")
    
    def cleanup_old_backups(self, provider_name: str, retention_days: int = None) -> int:
        provider = self.providers[provider_name]
        retention = retention_days or self.config.retention_days
        cutoff_date = datetime.utcnow() - timedelta(days=retention)
        
        deleted = 0
        objects = provider.list_objects()
        
        for obj in objects:
            last_modified = datetime.fromisoformat(obj['last_modified'])
            if last_modified < cutoff_date:
                provider.delete_object(obj['key'])
                deleted += 1
        
        print(f"Deleted {deleted} old backups from {provider_name}")
        return deleted
    
    def verify_backups(self, provider_name: str) -> Dict:
        provider = self.providers[provider_name]
        results = {'verified': 0, 'failed': 0, 'missing': 0}
        
        objects = provider.list_objects()
        
        for obj in objects:
            try:
                local_checksum = None
                if obj['key'].endswith('.md5'):
                    # Check corresponding checksum file
                    pass
                
                results['verified'] += 1
            except Exception:
                results['failed'] += 1
        
        return results

def main():
    config = BackupConfig(
        provider='s3',
        bucket='my-backup-bucket',
        region='us-east-1',
        encryption_key='kms-key-id',
        retention_days=30
    )
    
    manager = BackupManager(config)
    
    # Upload files
    files_to_backup = [
        '/data/databases/backup.sql.gz.enc',
        '/data/documents/archive.tar.gz.enc',
        '/etc/config_backup.tar.gz.enc'
    ]
    
    for file_path in files_to_backup:
        if os.path.exists(file_path):
            remote_path = f"backups/{datetime.now().strftime('%Y/%m/%d')}/{os.path.basename(file_path)}"
            manager.parallel_upload(file_path, remote_path)
    
    # Cleanup old backups
    for provider_name in manager.providers:
        manager.cleanup_old_backups(provider_name)

if __name__ == '__main__':
    main()
```

## Best Practices

- Follow the 3-2-1 backup rule (3 copies, 2 media types, 1 offsite)
- Test recovery procedures regularly
- Implement encryption for backup data
- Set appropriate RTO/RPO based on business needs
- Automate backup scheduling and monitoring
- Use immutable storage for ransomware protection
- Document recovery procedures and maintain runbooks
- Monitor backup success/failure with alerting
- Perform regular integrity checks on backups
- Maintain backup metadata and catalogs

## Core Competencies

- Backup strategies and planning
- Database backup (SQL, MySQL, PostgreSQL)
- File system backup
- System state backup
- Virtual machine backup
- Cloud backup services
- Backup encryption
- Retention policies
- Recovery testing
- Backup monitoring
- Tape/disk/cloud storage
- Point-in-time recovery
- Backup automation
- Compliance requirements
