# Canary Deployment

## Overview

Canary Deployment is a release strategy that gradually rolls out new software versions to a small subset of users before progressively expanding the rollout to the entire user base. This approach allows teams to detect issues and measure the impact of changes with minimal risk, as problems affect only a small percentage of traffic initially. The name derives from the historical practice of using canaries in coal mines to detect toxic gases before they affected miners.

## Description

Canary deployments implement a controlled, incremental release process where new versions coexist with stable versions, with traffic gradually shifting from old to new. The process typically begins by routing a small percentage (often 1-5%) of traffic to the canary version, monitoring for errors, performance degradation, and business metrics. If metrics remain healthy, traffic is incrementally increased until the canary version handles all traffic and the old version is decommissioned.

Key components include traffic splitting mechanisms, metric collection and analysis, automated rollback capabilities, and configuration management for gradual rollouts. Modern implementations often integrate with service meshes, container orchestrators, and observability platforms to automate the entire process while maintaining safety and visibility.

## Prerequisites

- Understanding of deployment strategies and release management
- Familiarity with containerization (Docker) and orchestration (Kubernetes)
- Knowledge of load balancing and traffic routing concepts
- Experience with monitoring and observability tools
- Understanding of metrics collection and alerting
- Knowledge of rollback procedures and incident response

## Core Competencies

- Traffic splitting and routing configuration
- Metric definition and monitoring for canary analysis
- Automated rollback trigger implementation
- Gradual rollout scheduling
- A/B testing integration with canary deployments
- Multi-environment canary management
- Feature flag integration
- Risk assessment and rollback decision criteria

## Implementation

### Python Implementation for Canary Deployment Controller

```python
import time
import random
import threading
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import logging
import json
from statistics import mean, stdev

logger = logging.getLogger(__name__)


class DeploymentStatus(Enum):
    INITIALIZING = "initializing"
    ROLLING_OUT = "rolling_out"
    MONITORING = "monitoring"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    PAUSED = "paused"


@dataclass
class CanaryConfig:
    initial_weight: float = 5.0
    final_weight: float = 100.0
    step_weight: float = 10.0
    step_interval: int = 300
    min_success_rate: float = 0.99
    max_error_rate: float = 0.01
    max_latency_p99: float = 500.0
    evaluation_window: int = 60
    auto_rollback: bool = True
    rollback_threshold: float = 0.95
    metrics: List[str] = field(default_factory=lambda: ["error_rate", "latency_p99", "success_rate"])


@dataclass
class MetricSample:
    timestamp: float
    value: float
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class VersionMetrics:
    version: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    latency_samples: List[float] = field(default_factory=list)
    error_rate: float = 0.0
    avg_latency: float = 0.0
    p50_latency: float = 0.0
    p90_latency: float = 0.0
    p99_latency: float = 0.0


class MetricsCollector:
    def __init__(self, window_size: int = 300):
        self.window_size = window_size
        self.samples: Dict[str, List[MetricSample]] = {}
        self.lock = threading.Lock()

    def record(self, metric_name: str, value: float, labels: Optional[Dict] = None):
        labels = labels or {}
        key = f"{metric_name}:{json.dumps(labels, sort_keys=True)}"

        with self.lock:
            if key not in self.samples:
                self.samples[key] = []

            self.samples[key].append(
                MetricSample(timestamp=time.time(), value=value, labels=labels)
            )

            cutoff = time.time() - self.window_size
            self.samples[key] = [
                s for s in self.samples[key] if s.timestamp > cutoff
            ]

    def get_samples(self, metric_name: str, labels: Optional[Dict] = None) -> List[float]:
        labels = labels or {}
        key = f"{metric_name}:{json.dumps(labels, sort_keys=True)}"

        with self.lock:
            return [s.value for s in self.samples.get(key, [])]

    def compute_stats(self, metric_name: str, labels: Optional[Dict] = None) -> Dict:
        samples = self.get_samples(metric_name, labels)
        if not samples:
            return {"count": 0, "min": 0, "max": 0, "avg": 0, "p50": 0, "p90": 0, "p99": 0}

        sorted_samples = sorted(samples)
        n = len(sorted_samples)

        return {
            "count": n,
            "min": sorted_samples[0],
            "max": sorted_samples[-1],
            "avg": mean(sorted_samples),
            "p50": sorted_samples[n // 2],
            "p90": sorted_samples[int(n * 0.9)],
            "p99": sorted_samples[int(n * 0.99)] if n > 100 else sorted_samples[-1],
            "stdev": stdev(sorted_samples) if n > 1 else 0,
        }


class CanaryAnalyzer:
    def __init__(self, config: CanaryConfig):
        self.config = config
        self.baseline_metrics: Optional[VersionMetrics] = None
        self.canary_metrics: VersionMetrics = None

    def set_baseline(self, metrics: VersionMetrics):
        self.baseline_metrics = metrics

    def set_canary(self, metrics: VersionMetrics):
        self.canary_metrics = metrics

    def analyze(self) -> Dict[str, Any]:
        if not self.baseline_metrics or not self.canary_metrics:
            return {"healthy": False, "reason": "insufficient_data"}

        results = {}
        all_healthy = True

        if "error_rate" in self.config.metrics:
            error_check = self._check_error_rate()
            results["error_rate"] = error_check
            all_healthy = all_healthy and error_check["passed"]

        if "latency_p99" in self.config.metrics:
            latency_check = self._check_latency()
            results["latency_p99"] = latency_check
            all_healthy = all_healthy and latency_check["passed"]

        if "success_rate" in self.config.metrics:
            success_check = self._check_success_rate()
            results["success_rate"] = success_check
            all_healthy = all_healthy and success_check["passed"]

        return {
            "healthy": all_healthy,
            "checks": results,
            "recommendation": self._get_recommendation(results),
        }

    def _check_error_rate(self) -> Dict:
        canary_error_rate = self.canary_metrics.error_rate
        baseline_error_rate = self.baseline_metrics.error_rate

        threshold = max(baseline_error_rate * (1 + self.config.rollback_threshold), 0.05)

        return {
            "passed": canary_error_rate <= threshold,
            "canary_rate": canary_error_rate,
            "baseline_rate": baseline_error_rate,
            "threshold": threshold,
            "message": (
                f"Error rate {canary_error_rate:.4f} within threshold"
                if canary_error_rate <= threshold
                else f"Error rate {canary_error_rate:.4f} exceeds threshold {threshold:.4f}"
            ),
        }

    def _check_latency(self) -> Dict:
        canary_p99 = self.canary_metrics.p99_latency
        baseline_p99 = self.baseline_metrics.p99_latency

        threshold = max(baseline_p99 * 1.5, self.config.max_latency_p99)

        return {
            "passed": canary_p99 <= threshold,
            "canary_p99": canary_p99,
            "baseline_p99": baseline_p99,
            "threshold": threshold,
            "message": (
                f"P99 latency {canary_p99:.2f}ms within threshold"
                if canary_p99 <= threshold
                else f"P99 latency {canary_p99:.2f}ms exceeds threshold {threshold:.2f}ms"
            ),
        }

    def _check_success_rate(self) -> Dict:
        canary_success = self.canary_metrics.successful_requests / max(self.canary_metrics.total_requests, 1)
        threshold = self.config.min_success_rate

        return {
            "passed": canary_success >= threshold,
            "canary_success_rate": canary_success,
            "threshold": threshold,
            "message": (
                f"Success rate {canary_success:.4f} meets threshold"
                if canary_success >= threshold
                else f"Success rate {canary_success:.4f} below threshold {threshold:.4f}"
            ),
        }

    def _get_recommendation(self, results: Dict) -> str:
        if all(check.get("passed", False) for check in results.values()):
            return "promote"
        elif any(check.get("passed", False) for check in results.values()):
            return "pause"
        else:
            return "rollback"


class CanaryDeployment:
    def __init__(
        self,
        deployment_id: str,
        baseline_version: str,
        canary_version: str,
        config: Optional[CanaryConfig] = None,
        metrics_collector: Optional[MetricsCollector] = None,
    ):
        self.deployment_id = deployment_id
        self.baseline_version = baseline_version
        self.canary_version = canary_version
        self.config = config or CanaryConfig()
        self.metrics_collector = metrics_collector or MetricsCollector()
        self.analyzer = CanaryAnalyzer(self.config)

        self.status = DeploymentStatus.INITIALIZING
        self.current_weight = self.config.initial_weight
        self.baseline_metrics = VersionMetrics(version=baseline_version)
        self.canary_metrics = VersionMetrics(version=canary_version)

        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.history: List[Dict] = []

        self._running = False
        self._lock = threading.Lock()
        self._monitor_thread: Optional[threading.Thread] = None

    def start(self):
        with self._lock:
            if self.status != DeploymentStatus.INITIALIZING:
                raise ValueError(f"Cannot start deployment in status: {self.status}")

            self.status = DeploymentStatus.ROLLING_OUT
            self.start_time = datetime.utcnow()
            self._running = True
            self._monitor_thread = threading.Thread(target=self._run_loop, daemon=True)
            self._monitor_thread.start()

            logger.info(
                f"Started canary deployment {self.deployment_id}: "
                f"{self.canary_version} at {self.current_weight}%"
            )

    def _run_loop(self):
        while self._running and self.current_weight < self.config.final_weight:
            time.sleep(self.config.step_interval)
            self._evaluate_and_progress()

        if self.current_weight >= self.config.final_weight:
            self._complete_successfully()

    def _evaluate_and_progress(self):
        if not self._running:
            return

        self.status = DeploymentStatus.MONITORING
        logger.info(f"Canary deployment {self.deployment_id}: evaluation phase")

        analysis = self.analyzer.analyze()
        self.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "weight": self.current_weight,
            "analysis": analysis,
        })

        if analysis["healthy"]:
            if self.current_weight + self.config.step_weight >= self.config.final_weight:
                self.current_weight = self.config.final_weight
                self._complete_successfully()
            else:
                self.current_weight += self.config.step_weight
                self.status = DeploymentStatus.ROLLING_OUT
                logger.info(
                    f"Canary {self.deployment_id}: promoting to {self.current_weight}%"
                )
        else:
            recommendation = analysis["recommendation"]
            if recommendation == "rollback" and self.config.auto_rollback:
                self._rollback()
            elif recommendation == "pause":
                self.status = DeploymentStatus.PAUSED
                logger.warning(
                    f"Canary {self.deployment_id}: paused for manual review"
                )

    def _complete_successfully(self):
        self._running = False
        self.status = DeploymentStatus.SUCCESS
        self.end_time = datetime.utcnow()
        logger.info(f"Canary deployment {self.deployment_id}: completed successfully")

    def _rollback(self):
        self._running = False
        self.status = DeploymentStatus.ROLLED_BACK
        self.end_time = datetime.utcnow()
        self.current_weight = 0
        logger.info(f"Canary deployment {self.deployment_id}: rolled back")

    def pause(self):
        with self._lock:
            if self.status == DeploymentStatus.ROLLING_OUT:
                self.status = DeploymentStatus.PAUSED

    def resume(self):
        with self._lock:
            if self.status == DeploymentStatus.PAUSED:
                self.status = DeploymentStatus.ROLLING_OUT
                if not self._monitor_thread or not self._monitor_thread.is_alive():
                    self._monitor_thread = threading.Thread(target=self._run_loop, daemon=True)
                    self._monitor_thread.start()

    def force_rollback(self):
        self._rollback()

    def get_status(self) -> Dict:
        with self._lock:
            return {
                "deployment_id": self.deployment_id,
                "status": self.status.value,
                "baseline_version": self.baseline_version,
                "canary_version": self.canary_version,
                "current_weight": self.current_weight,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "end_time": self.end_time.isoformat() if self.end_time else None,
                "duration_seconds": (
                    (self.end_time - self.start_time).total_seconds()
                    if self.end_time and self.start_time else None
                ),
                "history": self.history,
                "metrics": {
                    "baseline": self._metrics_to_dict(self.baseline_metrics),
                    "canary": self._metrics_to_dict(self.canary_metrics),
                },
                "config": {
                    "initial_weight": self.config.initial_weight,
                    "step_weight": self.config.step_weight,
                    "step_interval": self.config.step_interval,
                    "auto_rollback": self.config.auto_rollback,
                },
            }

    def _metrics_to_dict(self, metrics: VersionMetrics) -> Dict:
        return {
            "version": metrics.version,
            "total_requests": metrics.total_requests,
            "successful_requests": metrics.successful_requests,
            "failed_requests": metrics.failed_requests,
            "error_rate": metrics.error_rate,
            "avg_latency": metrics.avg_latency,
            "p99_latency": metrics.p99_latency,
        }


class CanaryRouter:
    def __init__(self):
        self.deployments: Dict[str, CanaryDeployment] = {}
        self.lock = threading.Lock()

    def register_deployment(self, deployment: CanaryDeployment):
        with self.lock:
            self.deployments[deployment.deployment_id] = deployment

    def get_deployment(self, deployment_id: str) -> Optional[CanaryDeployment]:
        with self.lock:
            return self.deployments.get(deployment_id)

    def route_request(
        self,
        deployment_id: str,
        request_hash: int,
    ) -> str:
        deployment = self.get_deployment(deployment_id)
        if not deployment:
            return "baseline"

        if request_hash % 100 < deployment.current_weight:
            return "canary"
        return "baseline"

    def get_weights(self, deployment_id: str) -> Dict[str, float]:
        deployment = self.get_deployment(deployment_id)
        if not deployment:
            return {"baseline": 100.0, "canary": 0.0}
        return {
            "baseline": 100.0 - deployment.current_weight,
            "canary": deployment.current_weight,
        }
```

### Go Implementation

```go
package canary

import (
	"context"
	"encoding/json"
	"math"
	"sort"
	"sync"
	"time"
)

type Status string

const (
	StatusInitializing Status = "initializing"
	StatusRollingOut   Status = "rolling_out"
	StatusMonitoring   Status = "monitoring"
	StatusSuccess      Status = "success"
	StatusFailed       Status = "failed"
	StatusRolledBack   Status = "rolled_back"
	StatusPaused       Status = "paused"
)

type Config struct {
	InitialWeight      float64
	FinalWeight        float64
	StepWeight         float64
	StepInterval       time.Duration
	MinSuccessRate     float64
	MaxErrorRate       float64
	MaxLatencyP99      time.Duration
	EvaluationWindow   time.Duration
	AutoRollback       bool
	RollbackThreshold  float64
	Metrics            []string
}

type MetricSample struct {
	Timestamp time.Time
	Value     float64
	Labels    map[string]string
}

type VersionMetrics struct {
	Version          string
	TotalRequests    int64
	SuccessfulReqs   int64
	FailedReqs       int64
	LatencySamples   []float64
	ErrorRate        float64
	AvgLatency       time.Duration
	P50Latency       time.Duration
	P90Latency       time.Duration
	P99Latency       time.Duration
	mu               sync.RWMutex
}

func (m *VersionMetrics) RecordRequest(success bool, latency time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalRequests++
	if success {
		m.SuccessfulReqs++
	} else {
		m.FailedReqs++
	}
	m.LatencySamples = append(m.LatencySamples, float64(latency.Microseconds()))

	if len(m.LatencySamples) > 1000 {
		m.LatencySamples = m.LatencySamples[len(m.LatencySamples)-1000:]
	}

	m.ErrorRate = float64(m.FailedReqs) / float64(m.TotalRequests)

	if len(m.LatencySamples) > 0 {
		sum := float64(0)
		for _, l := range m.LatencySamples {
			sum += l
		}
		m.AvgLatency = time.Duration(sum / float64(len(m.LatencySamples)) * 1000)

		sorted := make([]float64, len(m.LatencySamples))
		copy(sorted, m.LatencySamples)
		sort.Float64s(sorted)

		m.P50Latency = time.Duration(sorted[len(sorted)/2] * 1000)
		m.P90Latency = time.Duration(sorted[int(float64(len(sorted))*0.9)] * 1000)
		if len(sorted) > 100 {
			m.P99Latency = time.Duration(sorted[int(float64(len(sorted))*0.99)] * 1000)
		} else {
			m.P99Latency = m.P90Latency
		}
	}
}

type AnalysisResult struct {
	Healthy       bool
	Checks        map[string]CheckResult
	Recommendation string
}

type CheckResult struct {
	Passed    bool
	Message   string
	CanaryVal float64
	Threshold float64
}

type Deployment struct {
	ID               string
	BaselineVersion  string
	CanaryVersion    string
	Config           Config
	Status           Status
	CurrentWeight    float64
	BaselineMetrics  *VersionMetrics
	CanaryMetrics    *VersionMetrics
	StartTime        time.Time
	EndTime          time.Time
	History          []HistoryEntry
	Running          bool
	mu               sync.RWMutex
	stopCh           chan struct{}
}

type HistoryEntry struct {
	Timestamp   time.Time
	Weight      float64
	Analysis    AnalysisResult
}

type Analyzer struct {
	Config          Config
	BaselineMetrics *VersionMetrics
	CanaryMetrics   *VersionMetrics
}

func NewAnalyzer(cfg Config) *Analyzer {
	return &Analyzer{Config: cfg}
}

func (a *Analyzer) SetBaseline(m *VersionMetrics) {
	a.BaselineMetrics = m
}

func (a *Analyzer) SetCanary(m *VersionMetrics) {
	a.CanaryMetrics = m
}

func (a *Analyzer) Analyze() AnalysisResult {
	result := AnalysisResult{
		Checks: make(map[string]CheckResult),
	}

	if a.BaselineMetrics == nil || a.CanaryMetrics == nil {
		result.Healthy = false
		result.Recommendation = "insufficient_data"
		return result
	}

	allHealthy := true

	for _, metric := range a.Config.Metrics {
		var check CheckResult
		switch metric {
		case "error_rate":
			check = a.checkErrorRate()
		case "latency_p99":
			check = a.checkLatency()
		case "success_rate":
			check = a.checkSuccessRate()
		}
		result.Checks[metric] = check
		if !check.Passed {
			allHealthy = false
		}
	}

	result.Healthy = allHealthy
	if allHealthy {
		result.Recommendation = "promote"
	} else {
		passedChecks := 0
		for _, c := range result.Checks {
			if c.Passed {
				passedChecks++
			}
		}
		if passedChecks > 0 {
			result.Recommendation = "pause"
		} else {
			result.Recommendation = "rollback"
		}
	}

	return result
}

func (a *Analyzer) checkErrorRate() CheckResult {
	canaryRate := a.CanaryMetrics.ErrorRate
	baselineRate := a.BaselineMetrics.ErrorRate
	threshold := math.Max(baselineRate*(1+a.Config.RollbackThreshold), 0.05)

	return CheckResult{
		Passed:    canaryRate <= threshold,
		Message:   formatErrorMessage(canaryRate, threshold),
		CanaryVal: canaryRate,
		Threshold: threshold,
	}
}

func (a *Analyzer) checkLatency() CheckResult {
	canaryP99 := a.CanaryMetrics.P99Latency.Seconds() * 1000
	baselineP99 := a.BaselineMetrics.P99Latency.Seconds() * 1000
	threshold := math.Max(baselineP99*1.5, a.Config.MaxLatencyP99.Seconds()*1000)

	return CheckResult{
		Passed:    canaryP99 <= threshold,
		Message:   formatLatencyMessage(canaryP99, threshold),
		CanaryVal: canaryP99,
		Threshold: threshold,
	}
}

func (a *Analyzer) checkSuccessRate() CheckResult {
	canaryRate := float64(a.CanaryMetrics.SuccessfulReqs) / float64(a.CanaryMetrics.TotalRequests)

	return CheckResult{
		Passed:    canaryRate >= a.Config.MinSuccessRate,
		Message:   formatSuccessMessage(canaryRate, a.Config.MinSuccessRate),
		CanaryVal: canaryRate,
		Threshold: a.Config.MinSuccessRate,
	}
}

func formatErrorMessage(rate, threshold float64) string {
	if rate <= threshold {
		return "Error rate within threshold"
	}
	return "Error rate exceeds threshold"
}

func formatLatencyMessage(latency, threshold float64) string {
	if latency <= threshold {
		return "P99 latency within threshold"
	}
	return "P99 latency exceeds threshold"
}

func formatSuccessMessage(rate, threshold float64) string {
	if rate >= threshold {
		return "Success rate meets threshold"
	}
	return "Success rate below threshold"
}

func NewDeployment(id, baselineVersion, canaryVersion string, cfg Config) *Deployment {
	return &Deployment{
		ID:              id,
		BaselineVersion: baselineVersion,
		CanaryVersion:   canaryVersion,
		Config:          cfg,
		Status:          StatusInitializing,
		CurrentWeight:  cfg.InitialWeight,
		BaselineMetrics: &VersionMetrics{Version: baselineVersion},
		CanaryMetrics:   &VersionMetrics{Version: canaryVersion},
		stopCh:          make(chan struct{}),
	}
}

func (d *Deployment) Start(ctx context.Context) error {
	d.mu.Lock()
	if d.Status != StatusInitializing {
		d.mu.Unlock()
		return nil
	}
	d.Status = StatusRollingOut
	d.Running = true
	d.StartTime = time.Now()
	d.mu.Unlock()

	go d.run(ctx)
	return nil
}

func (d *Deployment) run(ctx context.Context) {
	ticker := time.NewTicker(d.Config.StepInterval)
	defer ticker.Stop()

	for d.Running && d.CurrentWeight < d.Config.FinalWeight {
		select {
		case <-ticker.C:
			d.evaluate()
		case <-ctx.Done():
			d.Running = false
			return
		case <-d.stopCh:
			d.Running = false
			return
		}
	}

	if d.CurrentWeight >= d.Config.FinalWeight {
		d.complete()
	}
}

func (d *Deployment) evaluate() {
	d.mu.Lock()
	d.Status = StatusMonitoring
	currentWeight := d.CurrentWeight
	d.mu.Unlock()

	analyzer := NewAnalyzer(d.Config)
	analyzer.SetBaseline(d.BaselineMetrics)
	analyzer.SetCanary(d.CanaryMetrics)
	analysis := analyzer.Analyze()

	d.mu.Lock()
	d.History = append(d.History, HistoryEntry{
		Timestamp: time.Now(),
		Weight:    currentWeight,
		Analysis:  analysis,
	})

	if analysis.Healthy {
		if d.CurrentWeight+d.Config.StepWeight >= d.Config.FinalWeight {
			d.CurrentWeight = d.Config.FinalWeight
			d.complete()
		} else {
			d.CurrentWeight += d.Config.StepWeight
			d.Status = StatusRollingOut
		}
	} else {
		if analysis.Recommendation == "rollback" && d.Config.AutoRollback {
			d.rollback()
		} else if analysis.Recommendation == "pause" {
			d.Status = StatusPaused
		}
	}
	d.mu.Unlock()
}

func (d *Deployment) complete() {
	d.Running = false
	d.Status = StatusSuccess
	d.EndTime = time.Now()
}

func (d *Deployment) rollback() {
	d.Running = false
	d.Status = StatusRolledBack
	d.EndTime = time.Now()
	d.CurrentWeight = 0
}

func (d *Deployment) Pause() {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.Status == StatusRollingOut {
		d.Status = StatusPaused
	}
}

func (d *Deployment) Resume() {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.Status == StatusPaused {
		d.Status = StatusRollingOut
		d.Running = true
		go d.run(context.Background())
	}
}

func (d *Deployment) ForceRollback() {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.rollback()
}

func (d *Deployment) StatusJSON() ([]byte, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	return json.Marshal(d)
}

type Router struct {
	mu           sync.RWMutex
	deployments  map[string]*Deployment
}

func NewRouter() *Router {
	return &Router{
		deployments: make(map[string]*Deployment),
	}
}

func (r *Router) Register(d *Deployment) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.deployments[d.ID] = d
}

func (r *Router) Get(deploymentID string) (*Deployment, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	d, ok := r.deployments[deploymentID]
	return d, ok
}

func (r *Router) Weights(deploymentID string) (baseline, canary float64) {
	d, ok := r.Get(deploymentID)
	if !ok {
		return 100.0, 0.0
	}
	return 100.0 - d.CurrentWeight, d.CurrentWeight
}

func (r *Router) RouteRequest(deploymentID string, requestHash int) string {
	d, ok := r.Get(deploymentID)
	if !ok || d.Status != StatusSuccess && d.Status != StatusRollingOut {
		return "baseline"
	}

	if requestHash%100 < int(d.CurrentWeight) {
		return "canary"
	}
	return "baseline"
}
```

## Use Cases

- **New Feature Rollout**: Gradually expose new features to users while monitoring for bugs, performance issues, or negative user behavior patterns.

- **Infrastructure Upgrades**: Migrate to new infrastructure components (databases, message queues, cloud regions) with minimal risk by routing small percentages of traffic initially.

- **Algorithm Changes**: Deploy new recommendation algorithms, ranking models, or pricing engines with careful monitoring of business metrics.

- **Dependency Updates**: Roll out updates to shared libraries or frameworks across services incrementally.

- **Regional Rollouts**: Gradually expand to geographic regions, starting with smaller or less critical regions before major markets.

## Artifacts

- `CanaryDeployment` class: Core deployment orchestration
- `CanaryConfig` dataclass: Configuration for rollout parameters
- `CanaryAnalyzer` class: Metrics analysis and health assessment
- `MetricsCollector`: Time-windowed metric aggregation
- `VersionMetrics`: Version-specific metrics tracking
- `CanaryRouter`: Traffic routing based on deployment weights

## Related Skills

- Blue-Green Deployment: Complementary deployment strategy
- Feature Flags: Integration with canary rollouts
- Service Mesh Integration: Traffic management in microservices
- Monitoring and Alerting: Observability integration
- Kubernetes Deployment Strategies: Native deployment patterns
- A/B Testing: Statistical comparison methods
