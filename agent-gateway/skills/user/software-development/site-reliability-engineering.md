---
name: site-reliability-engineering
description: Discipline combining software engineering and operations to build reliable systems
category: software-development
---

# Site Reliability Engineering

## What I Do

I am a discipline that incorporates aspects of software engineering and applies them to infrastructure and operations problems. I aim to create scalable and highly reliable software systems by setting reliability targets, measuring current system performance against those targets, and implementing automation to prevent or remediate issues. I help organizations balance the need for rapid feature development with system reliability.

## When to Use Me

Use me when you need to ensure high availability and reliability for production systems. I am ideal for organizations operating critical services where downtime has significant business impact. I work well for teams wanting to apply software engineering practices to operational challenges. If you want to measure and improve reliability systematically while enabling developer velocity, I can guide your approach.

## Core Concepts

- **Service Level Objectives**: Quantifiable reliability targets for services
- **Error Budgets**: Allowable failure margin within reliability targets
- **Toil Reduction**: Eliminating manual, repetitive operational work
- **SRE Golden Signals**: Latency, traffic, errors, and saturation metrics
- **SLI Selection**: Choosing appropriate indicators for your service
- **Incident Management**: Structured approach to responding to outages
- **Post-Mortems**: Learning from failures without blame
- **Blameless Culture**: Focusing on system improvement over individual blame
- **Capacity Planning**: Forecasting and preparing for future demand
- **Release Engineering**: Safely deploying changes to production

## Code Examples

```python
# SRE service level objectives
class ServiceLevelObjective:
    def __init__(self, name, target, window, sli_type):
        self.name = name
        self.target = target
        self.window = window
        self.sli_type = sli_type
        self.measurements = []

    def record_measurement(self, value, timestamp):
        self.measurements.append({
            "value": value,
            "timestamp": timestamp
        })

    def calculate_compliance(self):
        if not self.measurements:
            return {"compliant": False, "percentage": 0}

        good = sum(1 for m in self.measurements if self._is_good(m["value"]))
        total = len(self.measurements)
        percentage = (good / total * 100) if total > 0 else 0

        return {
            "compliant": percentage >= self.target,
            "percentage": percentage,
            "good_measurements": good,
            "total_measurements": total
        }

    def _is_good(self, value):
        if self.sli_type == "availability":
            return value == 1
        elif self.sli_type == "latency":
            return value <= self.target
        return True

    def get_error_budget(self):
        compliance = self.calculate_compliance()
        budget = 100 - compliance["percentage"]
        return {
            "budget_remaining": max(0, budget),
            "budget_consumed": min(100, 100 - budget),
            "is_healthy": budget >= (100 - self.target)
        }


class SLIMeasurements:
    def __init__(self):
        self.availability = []
        self.latency = []
        self.throughput = []

    def record_request(self, success, latency_ms, timestamp):
        self.availability.append({
            "success": success,
            "timestamp": timestamp
        })
        self.latency.append({
            "latency": latency_ms,
            "timestamp": timestamp
        })

    def calculate_availability(self, window_seconds=300):
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)
        recent = [r for r in self.availability if r["timestamp"] > window_start]
        successful = sum(1 for r in recent if r["success"])
        return (successful / len(recent) * 100) if recent else 100

    def calculate_latency_p50(self):
        if not self.latency:
            return 0
        sorted_latency = sorted(self.latency, key=lambda x: x["latency"])
        mid = len(sorted_latency) // 2
        return sorted_latency[mid]["latency"]

    def calculate_latency_p99(self):
        if not self.latency:
            return 0
        sorted_latency = sorted(self.latency, key=lambda x: x["latency"])
        index = int(len(sorted_latency) * 0.99)
        return sorted_latency[index]["latency"]
```

```typescript
// SRE golden signals monitoring
interface GoldenSignals {
    latency: LatencySignal;
    traffic: TrafficSignal;
    errors: ErrorSignal;
    saturation: SaturationSignal;
}

interface LatencySignal {
    p50: number;
    p90: number;
    p99: number;
    avg: number;
}

interface TrafficSignal {
    requestsPerSecond: number;
    errorsPerSecond: number;
    bytesIn: number;
    bytesOut: number;
}

interface ErrorSignal {
    totalErrors: number;
    errorRate: number;
    byCode: { [statusCode: number]: number };
}

interface SaturationSignal {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    queueDepth: number;
}

class GoldenSignalsMonitor {
    private signals: GoldenSignals;

    constructor() {
        this.signals = {
            latency: { p50: 0, p90: 0, p99: 0, avg: 0 },
            traffic: { requestsPerSecond: 0, errorsPerSecond: 0, bytesIn: 0, bytesOut: 0 },
            errors: { totalErrors: 0, errorRate: 0, byCode: {} },
            saturation: { cpuPercent: 0, memoryPercent: 0, diskPercent: 0, queueDepth: 0 }
        };
    }

    recordRequest(latencyMs: number, statusCode: number, bytesIn: number, bytesOut: number): void {
        this.signals.traffic.requestsPerSecond++;
        this.signals.traffic.bytesIn += bytesIn;
        this.signals.traffic.bytesOut += bytesOut;

        if (statusCode >= 400) {
            this.signals.errors.totalErrors++;
            this.signals.errors.byCode[statusCode] =
                (this.signals.errors.byCode[statusCode] || 0) + 1;
        }

        this.updateLatencyPercentiles(latencyMs);
    }

    private updateLatencyPercentiles(latencyMs: number): void {
        this.signals.latency.p50 = latencyMs;
        this.signals.latency.p90 = latencyMs * 1.5;
        this.signals.latency.p99 = latencyMs * 2;
        this.signals.latency.avg = latencyMs;
    }

    recordSaturation(cpu: number, memory: number, disk: number, queue: number): void {
        this.signals.saturation.cpuPercent = cpu;
        this.signals.saturation.memoryPercent = memory;
        this.signals.saturation.diskPercent = disk;
        this.signals.saturation.queueDepth = queue;
    }

    getHealthStatus(): { status: 'healthy' | 'degraded' | 'critical'; issues: string[] } {
        const issues: string[] = [];

        if (this.signals.latency.p99 > 1000) {
            issues.push(`High P99 latency: ${this.signals.latency.p99}ms`);
        }

        if (this.signals.errors.errorRate > 0.01) {
            issues.push(`High error rate: ${(this.signals.errors.errorRate * 100).toFixed(2)}%`);
        }

        if (this.signals.saturation.cpuPercent > 80) {
            issues.push(`High CPU usage: ${this.signals.saturation.cpuPercent}%`);
        }

        if (this.signals.saturation.memoryPercent > 85) {
            issues.push(`High memory usage: ${this.signals.saturation.memoryPercent}%`);
        }

        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (issues.length >= 2) {
            status = 'critical';
        } else if (issues.length === 1) {
            status = 'degraded';
        }

        return { status, issues };
    }
}
```

```go
// SRE incident management and post-mortems
package sre

import (
	"fmt"
	"time"
)

type IncidentSeverity string

const (
	Sev1 IncidentSeverity = "sev1"
	Sev2 IncidentSeverity = "sev2"
	Sev3 IncidentSeverity = "sev3"
	Sev4 IncidentSeverity = "sev4"
)

type Incident struct {
	ID            string
	Title         string
	Severity      IncidentSeverity
	Status        string
	StartTime     time.Time
	EndTime       *time.Time
	AffectedServices []string
	Timeline      []TimelineEvent
}

type TimelineEvent struct {
	Timestamp   time.Time
	Action      string
	Description string
	Actor       string
}

type PostMortem struct {
	IncidentID    string
	RootCauses    []string
	ContributingFactors []string
	Impact       ImpactSummary
	Actions      []ActionItem
}

type ImpactSummary struct {
	Duration        time.Duration
	UsersAffected   int
	RevenueLost     float64
	SLAViolations   int
}

type ActionItem struct {
	Description   string
	Owner         string
	DueDate       time.Time
	Status        string
}

func NewIncident(title string, severity IncidentSeverity) *Incident {
	return &Incident{
		ID:        fmt.Sprintf("INC-%d", time.Now().Unix()),
		Title:     title,
		Severity:  severity,
		Status:    "investigating",
		StartTime: time.Now(),
		Timeline:  []TimelineEvent{},
	}
}

func (i *Incident) AddTimelineEvent(action, description, actor string) {
	event := TimelineEvent{
		Timestamp:   time.Now(),
		Action:      action,
		Description: description,
		Actor:       actor,
	}
	i.Timeline = append(i.Timeline, event)
}

func (i *Incident) Resolve() {
	now := time.Now()
	i.EndTime = &now
	i.Status = "resolved"
	i.AddTimelineEvent("resolved", "Incident resolved", "system")
}

func (i *Incident) Duration() time.Duration {
	endTime := i.EndTime
	if endTime == nil {
		return time.Since(i.StartTime)
	}
	return endTime.Sub(i.StartTime)
}

func (p PostMortem) CalculateMTTR(incidents []*Incident) time.Duration {
	var total time.Duration
	for _, incident := range incidents {
		if incident.EndTime != nil {
			total += incident.Duration()
		}
	}
	if len(incidents) == 0 {
		return 0
	}
	return total / time.Duration(len(incidents))
}

func (p PostMortem) GenerateReport() string {
	return fmt.Sprintf(
		"Post-Mortem Report\nIncident: %s\nDuration: %v\nRoot Causes: %v\nActions: %d",
		p.IncidentID, p.Impact.Duration, p.RootCauses, len(p.Actions),
	)
}
```

```python
# SRE error budget management
class ErrorBudget:
    def __init__(self, slo_target, window_days=30):
        self.slo_target = slo_target
        self.window_days = window_days
        self.measurements = []
        self.remaining = 100.0

    def record_period(self, total_requests, successful_requests):
        availability = (successful_requests / total_requests * 100) if total_requests > 0 else 100
        budget_consumed = 100 - availability
        self.remaining = max(0, self.remaining - budget_consumed)

        self.measurements.append({
            "period": len(self.measurements) + 1,
            "total": total_requests,
            "successful": successful_requests,
            "availability": availability,
            "budget_consumed": budget_consumed,
            "budget_remaining": self.remaining
        })

    def get_health_status(self):
        if self.remaining > 50:
            return "healthy", "Plenty of error budget remaining"
        elif self.remaining > 20:
            return "caution", "Error budget running low"
        else:
            return "critical", "Error budget nearly exhausted"

    def should_slow_deployment(self):
        status, _ = self.get_health_status()
        return status == "critical"

    def get_burn_rate(self):
        if len(self.measurements) < 2:
            return 0
        recent = self.measurements[-7:]
        avg_burn = sum(m["budget_consumed"] for m in recent) / len(recent)
        return avg_burn

    def predict_exhaustion(self):
        burn_rate = self.get_burn_rate()
        if burn_rate <= 0:
            return None
        periods_remaining = self.remaining / burn_rate
        return periods_remaining


class ErrorBudgetPolicy:
    def __init__(self, budget):
        self.budget = budget

    def can_deploy(self):
        if self.budget.should_slow_deployment():
            return False, "Error budget critically low"
        return True, "Deploy permitted"

    def get_deployment_restrictions(self):
        status = self.budget.get_health_status()[0]
        if status == "critical":
            return ["Require additional review", "Limit to hotfixes only"]
        elif status == "caution":
            return ["Increased monitoring required"]
        return []
```

```python
# SRE toil reduction automation
class ToilTracker:
    def __init__(self):
        self.tasks = []

    def record_toil(self, task_name, duration_minutes, category):
        self.tasks.append({
            "task": task_name,
            "duration": duration_minutes,
            "category": category,
            "timestamp": datetime.now()
        })

    def calculate_total_toil(self):
        return sum(task["duration"] for task in self.tasks)

    def get_toil_by_category(self):
        by_category = {}
        for task in self.tasks:
            category = task["category"]
            if category not in by_category:
                by_category[category] = 0
            by_category[category] += task["duration"]
        return by_category

    def identify_automation_candidates(self):
        repetitive = [t for t in self.tasks if t["category"] == "repetitive"]
        high_frequency = {}
        for task in repetitive:
            if task["task"] not in high_frequency:
                high_frequency[task["task"]] = 0
            high_frequency[task["task"]] += 1

        sorted_tasks = sorted(high_frequency.items(), key=lambda x: x[1], reverse=True)
        return [task for task, count in sorted_tasks[:5]]


class AutomatedRemediation:
    def __init__(self, automation_rules):
        self.rules = automation_rules

    def check_and_remediate(self, alert):
        for rule in self.rules:
            if rule.matches(alert):
                if rule.can_auto_remediate():
                    return rule.execute_remediation(alert)
        return {"remediated": False, "reason": "No matching automation rule"}

    def create_remediation_playbook(self, incident_type, steps):
        playbook = {
            "type": incident_type,
            "steps": steps,
            "automated_steps": [],
            "manual_steps": []
        }
        return playbook

    def calculate_toil_saved(self, manual_time, automated_time, frequency):
        time_saved_per_incident = manual_time - automated_time
        monthly_saved = time_saved_per_incident * frequency
        return monthly_saved
```

## Best Practices

- Define clear SLOs that align with business needs and customer expectations
- Track error budgets and use them to balance feature velocity with reliability
- Implement SRE golden signals monitoring for all production services
- Conduct blameless post-mortems to learn from incidents and improve systems
- Reduce toil systematically by automating repetitive operational tasks
- Establish clear escalation policies and runbooks for common issues
- Practice incident response through game days and chaos engineering
- Balance reliability investment with feature development using error budget policies
- Use gradual rollouts and feature flags to reduce risk of changes
- Measure and improve MTTR (mean time to recovery) as a key reliability metric
