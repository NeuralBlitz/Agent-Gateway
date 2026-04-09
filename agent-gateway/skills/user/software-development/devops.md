---
name: devops
description: Cultural and technical movement bridging development and operations for faster delivery
category: software-development
---

# DevOps

## What I Do

I am a cultural and technical movement that bridges the gap between development and operations to enable faster, more reliable software delivery. I combine cultural philosophies, practices, and tools that increase an organization's ability to deliver applications and services at high velocity. I help organizations evolve and improve products more rapidly than traditional software development approaches.

## When to Use Me

Use me when you want to accelerate software delivery while improving quality and reliability. I am ideal for organizations experiencing friction between development and operations teams, slow release cycles, or frequent production incidents. I work well when you need to implement continuous integration and deployment pipelines, adopt infrastructure as code, and establish effective monitoring and feedback loops.

## Core Concepts

- **Culture**: Shared responsibility and collaboration between development and operations
- **Automation**: Reducing manual effort in building, testing, and deploying software
- **Continuous Integration**: Merging code changes frequently with automated testing
- **Continuous Delivery**: Ensuring code is always in a deployable state
- **Infrastructure as Code**: Managing infrastructure through machine-readable files
- **Monitoring and Observability**: Tracking system behavior and performance
- **Microservices**: Architecting applications as loosely coupled services
- **CI/CD Pipeline**: Automated sequence of build, test, and deploy stages
- **Feedback Loops**: Rapidly incorporating learning from production into development
- **Shifting Left**: Performing testing earlier in the development lifecycle

## Code Examples

```python
# DevOps pipeline configuration
class DevOpsPipeline:
    def __init__(self, name):
        self.name = name
        self.stages = []
        self.environment = {}
        self.artifacts = []

    def add_stage(self, name, actions):
        stage = {
            "name": name,
            "actions": actions,
            "status": "pending",
            "duration": 0
        }
        self.stages.append(stage)
        return stage

    def configure_environment(self, env_vars):
        self.environment.update(env_vars)

    def run_stage(self, stage_name):
        stage = next((s for s in self.stages if s["name"] == stage_name), None)
        if stage:
            stage["status"] = "running"
            start_time = datetime.now()
            for action in stage["actions"]:
                action["status"] = self._execute_action(action)
            stage["duration"] = (datetime.now() - start_time).total_seconds()
            stage["status"] = "completed" if all(
                a["status"] for a in stage["actions"]
            ) else "failed"
        return stage

    def _execute_action(self, action):
        action_handlers = {
            "build": self._build,
            "test": self._test,
            "deploy": self._deploy,
            "security_scan": self._security_scan
        }
        handler = action_handlers.get(action["type"])
        return handler(action) if handler else False

    def _build(self, action):
        return {"status": "success", "output": f"Built {action.get('target')}"}

    def _test(self, action):
        return {"status": "success", "tests_run": 150, "passed": 150}

    def _deploy(self, action):
        return {"status": "success", "environment": action.get("env")}

    def _security_scan(self, action):
        return {"status": "success", "vulnerabilities": 0}

    def generate_report(self):
        return {
            "pipeline": self.name,
            "stages": self.stages,
            "total_duration": sum(s["duration"] for s in self.stages),
            "overall_status": "passed" if all(
                s["status"] == "completed" for s in self.stages
            ) else "failed"
        }
```

```typescript
// DevOps monitoring and observability
interface Metric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
}

interface Alert {
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
}

class ObservabilityPlatform {
    private metrics: Map<string, Metric[]> = new Map();
    private alerts: Alert[] = [];
    private thresholds: Map<string, { warning: number; critical: number }> = new Map();

    recordMetric(name: string, value: number, unit: string): void {
        const metric: Metric = { name, value, unit, timestamp: new Date() };
        const existing = this.metrics.get(name) || [];
        this.metrics.set(name, [...existing, metric]);
        this.checkThresholds(name, value);
    }

    setThreshold(name: string, warning: number, critical: number): void {
        this.thresholds.set(name, { warning, critical });
    }

    private checkThresholds(name: string, value: number): void {
        const threshold = this.thresholds.get(name);
        if (!threshold) return;

        if (value >= threshold.critical) {
            this.alerts.push({
                severity: 'critical',
                message: `${name} critical threshold exceeded: ${value}`,
                timestamp: new Date()
            });
        } else if (value >= threshold.warning) {
            this.alerts.push({
                severity: 'warning',
                message: `${name} warning threshold exceeded: ${value}`,
                timestamp: new Date()
            });
        }
    }

    getMetricsSummary(name: string): { min: number; max: number; avg: number } {
        const metrics = this.metrics.get(name) || [];
        if (metrics.length === 0) {
            return { min: 0, max: 0, avg: 0 };
        }
        const values = metrics.map(m => m.value);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b) / values.length
        };
    }

    getActiveAlerts(): Alert[] {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return this.alerts.filter(a => a.timestamp > oneHourAgo);
    }
}
```

```go
// DevOps infrastructure management
package devops

import (
	"fmt"
	"time"
)

type Infrastructure struct {
	Resources []Resource
	State     string
}

type Resource struct {
	ID        string
	Type      string
	Name      string
	Config    map[string]interface{}
	State     string
	CreatedAt time.Time
}

type InfrastructureProvider struct {
	Resources []Resource
}

func NewInfrastructureProvider() *InfrastructureProvider {
	return &InfrastructureProvider{
		Resources: []Resource{},
	}
}

func (ip *InfrastructureProvider) CreateResource(
	resType, name string, config map[string]interface{}) Resource {
	res := Resource{
		ID:        fmt.Sprintf("%s-%d", name, time.Now().Unix()),
		Type:      resType,
		Name:      name,
		Config:    config,
		State:     "pending",
		CreatedAt: time.Now(),
	}
	ip.Resources = append(ip.Resources, res)
	return res
}

func (ip *InfrastructureProvider) Provision(resourceID string) error {
	for i := range ip.Resources {
		if ip.Resources[i].ID == resourceID {
			ip.Resources[i].State = "provisioning"
			time.Sleep(100 * time.Millisecond)
			ip.Resources[i].State = "running"
			return nil
		}
	}
	return fmt.Errorf("resource %s not found", resourceID)
}

func (ip *InfrastructureProvider) GetStatus() map[string]int {
	status := map[string]int{
		"pending":    0,
		"provisioning": 0,
		"running":   0,
		"failed":    0,
	}

	for _, res := range ip.Resources {
		status[res.State]++
	}

	return status
}

func (ip *InfrastructureProvider) GetResourceCost(resourceType string) float64 {
	costs := map[string]float64{
		"server":   0.10,
		"database": 0.25,
		"storage":  0.05,
		"network":  0.02,
	}

	var total float64
	for _, res := range ip.Resources {
		if res.Type == resourceType {
			total += costs[res.Type]
		}
	}
	return total
}
```

```python
# DevOps feature flags and progressive delivery
class FeatureFlag:
    def __init__(self, name, enabled=False, percentage=0, targeting_rules=None):
        self.name = name
        self.enabled = enabled
        self.percentage = percentage
        self.targeting_rules = targeting_rules or {}
        self.metrics = {"enabled_count": 0, "disabled_count": 0}

    def evaluate(self, user_context):
        if not self.enabled:
            self.metrics["disabled_count"] += 1
            return False

        if self.targeting_rules.get("authenticated") and not user_context.get("authenticated"):
            return False

        if self.targeting_rules.get("user_ids"):
            if user_context.get("id") in self.targeting_rules["user_ids"]:
                return True

        if self.percentage > 0:
            user_hash = hash(f"{self.name}:{user_context.get('id', 'anonymous')}")
            if (abs(user_hash) % 100) < self.percentage:
                self.metrics["enabled_count"] += 1
                return True

        self.metrics["disabled_count"] += 1
        return False

    def canary_deploy(self, current_value, target_percentage, step=5):
        """Gradually increase rollout percentage"""
        new_percentage = min(current_value + step, target_percentage)
        self.percentage = new_percentage
        return new_percentage

    def rollback(self):
        """Disable the feature immediately"""
        self.enabled = False
        self.percentage = 0
        return self


class ProgressiveDelivery:
    def __init__(self):
        self.feature_flags = {}
        self.deployment_strategies = ["rolling", "blue_green", "canary"]

    def create_canary_deployment(self, service, target_traffic=10):
        deployment = {
            "service": service,
            "strategy": "canary",
            "target_traffic": target_weight = target_traffic,
            "current_traffic": 0,
            "status": "initializing"
        }
        return deployment

    def shift_traffic(self, deployment, new_percentage):
        """Shift traffic to new version"""
        deployment["current_traffic"] = new_percentage
        deployment["status"] = "in_progress"
        if new_percentage >= deployment["target_traffic"]:
            deployment["status"] = "complete"
        return deployment
```

```typescript
// DevOps incident management and chaos engineering
interface Incident {
    id: string;
    severity: 'critical' | 'major' | 'minor';
    status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
    title: string;
    timeline: TimelineEvent[];
}

interface TimelineEvent {
    timestamp: Date;
    action: string;
    actor: string;
    note: string;
}

class IncidentManager {
    private incidents: Map<string, Incident> = new Map();

    createIncident(title: string, severity: Incident['severity']): Incident {
        const incident: Incident = {
            id: `INC-${Date.now()}`,
            severity,
            status: 'open',
            title,
            timeline: [{
                timestamp: new Date(),
                action: 'created',
                actor: 'system',
                note: 'Incident created'
            }]
        };
        this.incidents.set(incident.id, incident);
        return incident;
    }

    updateStatus(incidentId: string, status: Incident['status']): void {
        const incident = this.incidents.get(incidentId);
        if (incident) {
            incident.status = status;
            incident.timeline.push({
                timestamp: new Date(),
                action: 'status_change',
                actor: 'system',
                note: `Status changed to ${status}`
            });
        }
    }

    getMTTR(): number {
        const resolvedIncidents = Array.from(this.incidents.values())
            .filter(i => i.status === 'resolved');

        if (resolvedIncidents.length === 0) return 0;

        const totalTime = resolvedIncidents.reduce((sum, incident) => {
            const created = incident.timeline[0].timestamp;
            const resolved = incident.timeline
                .find(e => e.action === 'status_change' && e.note.includes('resolved'));
            if (resolved) {
                return sum + (resolved.timestamp.getTime() - created.getTime());
            }
            return sum;
        }, 0);

        return totalTime / resolvedIncidents.length / 1000 / 60;
    }
}

class ChaosExperiment {
    runExperiment(target: string, failureInjection: string): boolean {
        console.log(`Running chaos experiment on ${target}: ${failureInjection}`);
        return true;
    }

    calculateResilienceScore(): number {
        return Math.random() * 100;
    }
}
```

## Best Practices

- Automate everything from code commit to production deployment to eliminate human error and increase speed
- Keep environments consistent across development, testing, and production using infrastructure as code
- Implement comprehensive monitoring and alerting to detect issues before users notice them
- Use feature flags to enable safe deployments and quick rollbacks without code changes
- Foster a culture of shared responsibility where both developers and operators care about production
- Measure key metrics like deployment frequency, lead time, and MTTR to track improvements
- Design for failure by assuming any component can fail and implementing appropriate safeguards
- Implement proper logging, tracing, and metrics to enable effective debugging and analysis
- Use canary deployments and progressive rollouts to minimize risk of new releases
- Conduct regular game days and chaos engineering experiments to test system resilience
