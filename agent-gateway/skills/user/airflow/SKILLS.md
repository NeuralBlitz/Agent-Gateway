# Airflow Skill

Apache Airflow DAG management.

## Commands

### List DAGS
```
/airflow dags
```
List all DAGs.

### DAG Info
```
/airflow info <dag-id>
```
Show DAG info.

### Trigger DAG
```
/airflow trigger <dag-id>
```
Trigger DAG run.

### Pause
```
/airflow pause <dag-id>
```
Pause DAG.

### Unpause
```
/airflow unpause <dag-id>
```
Unpause DAG.

### Backfill
```
/airflow backfill <dag-id> <start> <end>
```
Run backfill.

### Tasks
```
/airflow tasks <dag-id>
```
List tasks in DAG.

### Task State
```
/airflow task-state <dag-id> <task-id> <date>
```
Get task state.

### Run Task
```
/airflow run <dag-id> <task-id> <date>
```
Run specific task.

### Clear
```
/airflow clear <dag-id>
```
Clear DAG runs.

### List Runs
```
/airflow runs <dag-id>
```
List DAG runs.

### Variables
```
/airflow variables
```
List variables.

### Connections
```
/airflow connections
```
List connections.

### Pool
```
/airflow pools
```
List pools.

### Webserver
```
/airflow webserver
```
Start webserver.

### Scheduler
```
/airflow scheduler
```
Start scheduler.

## Examples

```
/airflow dags
/airflow info my_dag
/airflow trigger my_dag
/airflow pause my_dag
/airflow unpause my_dag
/airflow backfill my_dag 2024-01-01 2024-01-31
/airflow tasks my_dag
/airflow task-state my_dag process_data 2024-01-15
/airflow run my_dag process_data 2024-01-15
/airflow clear my_dag
/airflow runs my_dag
/airflow variables
/airflow connections
/airflow pools
```
