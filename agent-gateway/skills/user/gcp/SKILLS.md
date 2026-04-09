# GCP Skill

Google Cloud Platform management.

## Commands

### List Instances
```
/gcp compute list
```
List Compute Engine instances.

### Instance Status
```
/gcp compute status <instance>
```
Get instance status.

### Start Instance
```
/gcp compute start <instance>
```
Start instance.

### Stop Instance
```
/gcp compute stop <instance>
```
Stop instance.

### List Buckets
```
/gcp storage list
```
List Cloud Storage buckets.

### Upload File
```
/gcp storage upload <bucket> <file>
```
Upload to bucket.

### Download File
```
/gcp storage download <bucket> <object>
```
Download from bucket.

### List Functions
```
/gcp functions list
```
List Cloud Functions.

### Deploy Function
```
/gcp functions deploy <name> <source>
```
Deploy function.

### List Run Services
```
/gcp run list
```
List Cloud Run services.

### BigQuery Datasets
```
/gcp bigquery datasets
```
List BigQuery datasets.

### SQL Instances
```
/gcp sql list
```
List Cloud SQL instances.

## Examples

```
/gcp compute list
/gcp compute status myvm
/gcp compute start myvm
/gcp storage list
/gcp storage upload mybucket data.csv
/gcp functions list
/gcp run list
/gcp bigquery datasets
/gcp sql list
```
