# Cron Jobs

## Overview

Cron Jobs are scheduled tasks that run automatically at specified intervals. They are essential for automation, maintenance, batch processing, and recurring operations in any production system. Cron expressions provide flexible scheduling with minute, hour, day, month, and weekday specifications.

## Description

Cron jobs enable time-based scheduling of commands or scripts. The cron daemon reads configuration files (crontabs) and executes scheduled tasks. Modern implementations add features like systemd timers, distributed job queues, failure handling, logging, and monitoring. Cron jobs handle cleanup, backups, notifications, data synchronization, and periodic computations.

## Prerequisites

- Unix/Linux system administration
- Scheduling concepts
- Shell scripting
- Error handling
- Logging and monitoring

## Core Competencies

- Cron expression syntax
- Systemd timer configuration
- Job scheduling patterns
- Failure handling
- Distributed scheduling
- Job locking
- Resource cleanup
- Monitoring and alerting

## Implementation

```python
import os
import subprocess
import time
import threading
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import hashlib
import json

logger = logging.getLogger(__name__)

class ScheduleType(Enum):
    CRON = "cron"
    INTERVAL = "interval"
    DATETIME = "datetime"

@dataclass
class CronSchedule:
    minute: str = "*"
    hour: str = "*"
    day: str = "*"
    month: str = "*"
    weekday: str = "*"

    def to_expression(self) -> str:
        return f"{self.minute} {self.hour} {self.day} {self.month} {self.weekday}"

    @classmethod
    def from_expression(cls, expr: str) -> "CronSchedule":
        parts = expr.split()
        while len(parts) < 5:
            parts.append("*")
        return cls(
            minute=parts[0],
            hour=parts[1],
            day=parts[2],
            month=parts[3],
            weekday=parts[4]
        )

    def should_run(self, dt: datetime) -> bool:
        if not self._matches(dt.minute, self.minute):
            return False
        if not self._matches(dt.hour, self.hour):
            return False
        if not self._matches(dt.day, self.day):
            return False
        if not self._matches(dt.month, self.month):
            return False
        if not self._matches_wd(dt.weekday(), self.weekday):
            return False
        return True

    def _matches(self, value: int, pattern: str) -> bool:
        if pattern == "*":
            return True
        if "," in pattern:
            return str(value) in pattern.split(",")
        if "/" in pattern:
            base, step = pattern.split("/", 1)
            base = int(base) if base != "*" else 0
            step = int(step)
            return (value - base) % step == 0
        return value == int(pattern)

    def _matches_wd(self, weekday: int, pattern: str) -> bool:
        if pattern == "*":
            return True
        if "," in pattern:
            return str(weekday) in pattern.split(",")
        return weekday == int(pattern)

    def get_next_run(self, from_dt: datetime = None) -> datetime:
        dt = from_dt or datetime.now()
        for _ in range(366 * 24 * 60):
            if self.should_run(dt):
                return dt
            dt += timedelta(minutes=1)
        return None

@dataclass
class CronJob:
    name: str
    command: str
    schedule: CronSchedule
    enabled: bool = True
    user: str = "root"
    environment: Dict[str, str] = field(default_factory=dict)
    working_directory: str = ""
    timeout: int = 3600
    retry_count: int = 0
    retry_delay: int = 60
    lock_file: str = ""
    email_on_failure: str = ""
    output_log: str = ""
    error_log: str = ""
    last_run: datetime = None
    next_run: datetime = None
    last_status: str = "never"
    last_duration: float = 0.0
    execution_count: int = 0

class CronScheduler:
    def __init__(self):
        self.jobs: Dict[str, CronJob] = {}
        self.running = False
        self.lock_dir = "/tmp/cron_locks"
        os.makedirs(self.lock_dir, exist_ok=True)
        self.log_dir = "/var/log/cron"
        os.makedirs(self.log_dir, exist_ok=True)
        self._scheduler_thread: Optional[threading.Thread] = None

    def add_job(self, job: CronJob):
        self.jobs[job.name] = job
        job.next_run = job.schedule.get_next_run()

    def remove_job(self, name: str):
        if name in self.jobs:
            del self.jobs[name]

    def get_job(self, name: str) -> Optional[CronJob]:
        return self.jobs.get(name)

    def list_jobs(self) -> List[CronJob]:
        return list(self.jobs.values())

    def _acquire_lock(self, job: CronJob) -> Optional[str]:
        if not job.lock_file:
            return None
        lock_path = os.path.join(self.lock_dir, f"{job.lock_file}.lock")
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            return lock_path
        except FileExistsError:
            logger.info(f"Job {job.name} is already running")
            return None

    def _release_lock(self, lock_path: str):
        if lock_path and os.path.exists(lock_path):
            os.remove(lock_path)

    def _execute_job(self, job: CronJob):
        lock_path = self._acquire_lock(job)
        if not lock_path and job.lock_file:
            return

        start_time = time.time()
        stdout_path = os.path.join(self.log_dir, f"{job.name}.out")
        stderr_path = os.path.join(self.log_dir, f"{job.name}.err")

        job.last_run = datetime.now()
        job.execution_count += 1

        logger.info(f"Executing job: {job.name}")

        env = {**os.environ, **job.environment}
        cwd = job.working_directory or "/"

        try:
            result = subprocess.run(
                job.command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=job.timeout,
                env=env,
                cwd=cwd
            )

            with open(stdout_path, "a") as f:
                f.write(f"[{datetime.now().isoformat()}] stdout:\n{result.stdout}\n")

            if result.stderr:
                with open(stderr_path, "a") as f:
                    f.write(f"[{datetime.now().isoformat()}] stderr:\n{result.stderr}\n")

            if result.returncode == 0:
                job.last_status = "success"
            else:
                job.last_status = "failed"
                if job.retry_count > 0:
                    self._retry_job(job)

        except subprocess.TimeoutExpired:
            job.last_status = "timeout"
            logger.error(f"Job {job.name} timed out")

        except Exception as e:
            job.last_status = "error"
            logger.error(f"Job {job.name} failed: {e}")

        finally:
            job.last_duration = time.time() - start_time
            job.next_run = job.schedule.get_next_run()
            self._release_lock(lock_path)

    def _retry_job(self, job: CronJob):
        if job.retry_count > 0:
            job.retry_count -= 1
            logger.info(f"Scheduling retry for job {job.name} in {job.retry_delay}s")
            timer = threading.Timer(job.retry_delay, self._execute_job, args=[job])
            timer.start()

    def _scheduler_loop(self):
        while self.running:
            now = datetime.now()

            for name, job in list(self.jobs.items()):
                if not job.enabled:
                    continue

                if job.next_run and job.next_run <= now:
                    thread = threading.Thread(target=self._execute_job, args=[job])
                    thread.start()

            time.sleep(1)

    def start(self):
        self.running = True
        self._scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self._scheduler_thread.start()
        logger.info("Cron scheduler started")

    def stop(self):
        self.running = False
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=5)
        logger.info("Cron scheduler stopped")

    def get_status(self) -> Dict:
        return {
            "running": self.running,
            "total_jobs": len(self.jobs),
            "enabled_jobs": len([j for j in self.jobs.values() if j.enabled]),
            "jobs": [
                {
                    "name": j.name,
                    "enabled": j.enabled,
                    "schedule": j.schedule.to_expression(),
                    "next_run": j.next_run.isoformat() if j.next_run else None,
                    "last_run": j.last_run.isoformat() if j.last_run else None,
                    "last_status": j.last_status,
                    "execution_count": j.execution_count,
                }
                for j in self.jobs.values()
            ]
        }

    def run_now(self, name: str):
        job = self.jobs.get(name)
        if job:
            thread = threading.Thread(target=self._execute_job, args=[job])
            thread.start()

class DistributedScheduler:
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url
        self.jobs: Dict[str, Dict] = {}
        self.leader = False
        self._lock_acquired = False

    def acquire_leadership(self, ttl: int = 30) -> bool:
        logger.info("Attempting to acquire scheduler leadership")
        return True

    def schedule_job(self, job_id: str, schedule: CronSchedule, payload: Dict):
        self.jobs[job_id] = {
            "schedule": schedule.to_expression(),
            "payload": payload,
            "scheduled_at": time.time(),
            "status": "pending"
        }

    def get_scheduled_jobs(self) -> List[Dict]:
        return [
            {"id": k, **v}
            for k, v in self.jobs.items()
        ]

    def cancel_job(self, job_id: str):
        if job_id in self.jobs:
            del self.jobs[job_id]

class JobQueue:
    def __init__(self, max_size: int = 1000):
        self.queue: List[Dict] = []
        self.max_size = max_size
        self.processing: Dict[str, Dict] = {}
        self.lock = threading.Lock()

    def enqueue(self, job: Dict) -> bool:
        with self.lock:
            if len(self.queue) >= self.max_size:
                logger.warning("Job queue is full")
                return False
            job["queued_at"] = time.time()
            job["status"] = "queued"
            self.queue.append(job)
            return True

    def dequeue(self) -> Optional[Dict]:
        with self.lock:
            if not self.queue:
                return None
            job = self.queue.pop(0)
            job["status"] = "processing"
            job["started_at"] = time.time()
            self.processing[job.get("id", str(time.time()))] = job
            return job

    def mark_complete(self, job_id: str, result: Any = None):
        with self.lock:
            if job_id in self.processing:
                job = self.processing.pop(job_id)
                job["status"] = "completed"]
                job["completed_at"] = time.time()
                job["result"] = result

    def mark_failed(self, job_id: str, error: str):
        with self.lock:
            if job_id in self.processing:
                job = self.processing.pop(job_id)
                job["status"] = "failed"
                job["failed_at"] = time.time()
                job["error"] = error

    def get_stats(self) -> Dict:
        with self.lock:
            return {
                "queued": len(self.queue),
                "processing": len(self.processing),
                "total": len(self.queue) + len(self.processing),
                "max_size": self.max_size
            }
```

## Use Cases

- Data backup automation
- Log rotation and cleanup
- Report generation
- Cache invalidation
- Email digest sending
- Database maintenance
- Health check monitoring
- Sync operations

## Artifacts

- `CronSchedule`: Schedule parsing
- `CronJob`: Job definition
- `CronScheduler`: Single-node scheduler
- `DistributedScheduler`: Multi-node scheduling
- `JobQueue`: Job processing queue

## Related Skills

- System Administration
- Shell Scripting
- Task Scheduling
- Distributed Systems
- Error Handling
- Monitoring
