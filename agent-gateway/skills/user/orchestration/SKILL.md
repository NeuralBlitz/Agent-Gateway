---
name: orchestration
description: Workload orchestration and automation
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Orchestrate complex multi-container workloads
- Manage container lifecycle and scheduling
- Implement job scheduling and cron jobs
- Configure resource allocation and quotas
- Set up auto-scaling and self-healing
- Manage stateful workloads

## When to use me

- When managing containerized applications
- When scheduling batch jobs
- When implementing microservices
- When scaling applications automatically
- When managing stateful applications
- When orchestrating hybrid workloads

## Key Concepts

### Kubernetes Jobs and CronJobs

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processor
spec:
  ttlSecondsAfterFinished: 100
  backoffLimit: 3
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: processor
          image: data-processor:latest
          command: ["./process.sh"]
          env:
            - name: BATCH_SIZE
              value: "1000"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: backup-tool:latest
              command: ["./backup.sh"]
              env:
                - name: BACKUP_PATH
                  value: "/data"
```

### Nomad Configuration

```hcl
job "data-processor" {
  datacenters = ["dc1"]
  type = "batch"
  
  group "processor" {
    count = 10
    
    task "process" {
      driver = "docker"
      
      config {
        image = "processor:latest"
        args  = ["--batch-size", "1000"]
      }
      
      resources {
        cpu    = 500
        memory = 512
      }
      
      constraint {
        attribute = "${attr.platform.arch}"
        value     = "amd64"
      }
      
      service {
        name = "processor"
        port = "http"
        
        check {
          type     = "http"
          path     = "/health"
          interval = "10s"
          timeout  = "5s"
        }
      }
    }
  }
}
```

### Docker Swarm

```yaml
version: '3.8'

services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  backend:
    driver: overlay
```

### Workflow Orchestration

```python
# Airflow DAG example
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'dataeng',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'etl_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
)

def extract():
    pass

def transform():
    pass

def load():
    pass

t1 = PythonOperator(
    task_id='extract',
    python_callable=extract,
    dag=dag,
)

t2 = PythonOperator(
    task_id='transform',
    python_callable=transform,
    dag=dag,
)

t3 = PythonOperator(
    task_id='load',
    python_callable=load,
    dag=dag,
)

t1 >> t2 >> t3
```

### Argo Workflows

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: ml-pipeline
spec:
  entrypoint: ml-training
  templates:
    - name: ml-training
      dag:
        tasks:
          - name: preprocess
            template: preprocess
          - name: train
            template: train
            dependencies: [preprocess]
          - name: evaluate
            template: evaluate
            dependencies: [train]
          - name: deploy
            template: deploy
            dependencies: [evaluate]
            
    - name: preprocess
      container:
        image: ml-preprocess:latest
        command: [python, preprocess.py]
        
    - name: train
      container:
        image: ml-train:latest
        command: [python, train.py]
        
    - name: evaluate
      container:
        image: ml-eval:latest
        command: [python, evaluate.py]
        
    - name: deploy
      container:
        image: ml-deploy:latest
        command: [python, deploy.py]
```

### Key Orchestration Features

- **Scheduling**: Time-based and event-based
- **Resource Management**: CPU, memory, GPU
- **Dependency Management**: DAG-based workflows
- **Failure Handling**: Retries, fallbacks
- **Scaling**: Horizontal and vertical
- **State Management**: Persistent volumes, checkpoints
- **Security**: RBAC, secrets management
