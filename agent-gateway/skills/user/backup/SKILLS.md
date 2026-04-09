# Backup Skill

Backup and restore operations.

## Commands

### Create Backup
```
/backup create <source> [destination]
```
Create backup of source.

### Restore
```
/backup restore <backup>
```
Restore from backup.

### List Backups
```
/backup list [path]
```
List available backups.

### Backup Status
```
/backup status
```
Show backup status.

### Schedule Backup
```
/backup schedule <source> <schedule>
```
Schedule recurring backup.

### Delete Backup
```
/backup delete <backup>
```
Delete backup.

### Verify Backup
```
/backup verify <backup>
```
Verify backup integrity.

### Incremental
```
/backup incremental <source>
```
Create incremental backup.

### Compress
```
/backup compress <backup>
```
Compress backup.

### Encrypt
```
/backup encrypt <backup> <password>
```
Encrypt backup.

### Restore Verify
```
/backup restore-test <backup>
```
Test restore.

### Sync to Cloud
```
/backup sync <path>
```
Sync backup to cloud.

## Examples

```
/backup create /home
/backup create /var/www/html s3://backups
/backup restore backup_2024.tar.gz
/backup list
/backup status
/backup schedule /data "0 2 * * *"
/backup delete old_backup.tar.gz
/backup verify backup.tar.gz
/backup incremental /home
/backup sync s3://my-backups
```
