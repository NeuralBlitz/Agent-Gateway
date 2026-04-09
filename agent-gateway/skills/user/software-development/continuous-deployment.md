---
name: continuous-deployment
description: Practice of automatically deploying code changes to production after passing tests
category: software-development
---

# Continuous Deployment

## When to Use Me

I am an extension of continuous integration that automatically deploys every change that passes all tests directly to production. I help organizations deliver value to users as quickly as possible by eliminating manual deployment steps and reducing the time from commit to production. I work best with mature CI/CD pipelines, comprehensive automated testing, and feature flags that enable safe, gradual rollouts.

## When to Use Me

Use me when you have high confidence in your automated tests and want to deliver value to users as quickly as possible. I am ideal for organizations with mature DevOps practices, fast test suites, and a culture that embraces frequent releases. I work well when you have effective monitoring to detect issues immediately and feature flags to enable quick rollbacks without code changes.

## Core Concepts

- **Production Readiness**: Ensuring every deployment meets quality and reliability standards
- **Automated Deployment**: Removing human intervention from the deployment process
- **Feature Flags**: Controlling feature visibility without code deployments
- **Blue-Green Deployment**: Running two identical production environments
- **Canary Deployment**: Gradually rolling out changes to a small subset of users
- **Rollback Strategy**: Ability to quickly revert to a previous version
- **Deployment Frequency**: How often you ship code to production
- **Lead Time for Changes**: Time from code commit to production deployment
- **Change Failure Rate**: Percentage of deployments causing failures
- **Mean Time to Recovery**: How quickly you can restore service after issues

## Code Examples

```python
# Continuous deployment pipeline
class ContinuousDeployment:
    def __init__(self, environment):
        self.environment = environment
        self.stages = []
        self.artifacts = []
        self.deployment_history = []

    def add_stage(self, name, action, depends_on=None):
        stage = {
            "name": name,
            "action": action,
            "depends_on": depends_on,
            "status": "pending"
        }
        self.stages.append(stage)
        return stage

    def deploy(self, artifact, environment):
        """Execute deployment pipeline"""
        results = []
        start_time = datetime.now()

        for stage in self.stages:
            if self._should_run_stage(stage, results):
                result = stage["action"](artifact, environment)
                results.append({
                    "stage": stage["name"],
                    "status": result["status"],
                    "output": result.get("output", ""),
                    "timestamp": datetime.now()
                })
                if result["status"] != "success":
                    return self._handle_failure(results, start_time)

        deployment_record = {
            "artifact": artifact,
            "environment": environment,
            "start_time": start_time,
            "end_time": datetime.now(),
            "status": "success",
            "results": results
        }
        self.deployment_history.append(deployment_record)
        return deployment_record

    def _should_run_stage(self, stage, previous_results):
        if stage["depends_on"] is None:
            return True
        return any(
            r["stage"] == stage["depends_on"] and r["status"] == "success"
            for r in previous_results
        )

    def _handle_failure(self, results, start_time):
        deployment_record = {
            "start_time": start_time,
            "end_time": datetime.now(),
            "status": "failed",
            "results": results
        }
        self.deployment_history.append(deployment_record)
        self._trigger_rollback(artifact, previous_version)
        return deployment_record

    def _trigger_rollback(self, artifact, target_version):
        """Execute rollback procedure"""
        rollback = {
            "artifact": artifact,
            "target_version": target_version,
            "timestamp": datetime.now(),
            "status": "pending"
        }
        return rollback
```

```typescript
// Deployment strategies
interface DeploymentConfig {
    strategy: 'rolling' | 'blue_green' | 'canary' | 'recreate';
    environment: string;
    version: string;
    trafficSplit?: number;
}

class DeploymentStrategy {
    private environments: Map<string, Environment> = new Map();

    execute(config: DeploymentConfig): DeploymentResult {
        switch (config.strategy) {
            case 'rolling':
                return this.rollingDeploy(config);
            case 'blue_green':
                return this.blueGreenDeploy(config);
            case 'canary':
                return this.canaryDeploy(config);
            case 'recreate':
                return this.recreateDeploy(config);
            default:
                throw new Error(`Unknown strategy: ${config.strategy}`);
        }
    }

    private rollingDeploy(config: DeploymentConfig): DeploymentResult {
        const instances = this.environments.get(config.environment)?.instances || [];
        const results: { instance: string; status: string }[] = [];

        for (const instance of instances) {
            results.push({
                instance,
                status: this.updateInstance(config.version)
            });
        }

        return {
            strategy: 'rolling',
            results,
            success: results.every(r => r.status === 'success')
        };
    }

    private blueGreenDeploy(config: DeploymentConfig): DeploymentResult {
        const greenReady = this.prepareEnvironment('green', config.version);
        const testsPassed = this.runSmokeTests('green');

        if (testsPassed) {
            this.switchTraffic('green');
            this.keepEnvironment('blue', 60);
            return { strategy: 'blue_green', success: true };
        }

        this.cleanupEnvironment('green');
        return { strategy: 'blue_green', success: false };
    }

    private canaryDeploy(config: DeploymentConfig): DeploymentResult {
        const canaryPercentage = config.trafficSplit || 10;
        const results: { phase: string; traffic: number; status: string }[] = [];

        results.push({
            phase: 'initial',
            traffic: canaryPercentage,
            status: this.deployToSubset(canaryPercentage, config.version)
        });

        for (let traffic = canaryPercentage; traffic <= 100; traffic += 20) {
            if (traffic < 100) {
                this.wait(5);
                if (!this.isStable()) {
                    return { strategy: 'canary', results, success: false };
                }
            }
            results.push({
                phase: 'progressive',
                traffic,
                status: this.increaseTraffic(traffic)
            });
        }

        return { strategy: 'canary', results, success: true };
    }

    private recreateDeploy(config: DeploymentConfig): DeploymentResult {
        this.terminateAllInstances(config.environment);
        this.wait(30);
        return {
            strategy: 'recreate',
            results: [{
                instance: 'all',
                status: this.deployToAll(config.version)
            }],
            success: true
        };
    }

    private updateInstance(version: string): string {
        return 'success';
    }

    private prepareEnvironment(name: string, version: string): boolean {
        return true;
    }

    private runSmokeTests(environment: string): boolean {
        return true;
    }

    private switchTraffic(environment: string): void {}

    private cleanupEnvironment(name: string): void {}

    private deployToSubset(percentage: number, version: string): string {
        return 'success';
    }

    private isStable(): boolean {
        return true;
    }

    private increaseTraffic(percentage: number): string {
        return 'success';
    }

    private terminateAllInstances(environment: string): void {}

    private deployToAll(version: string): string {
        return 'success';
    }

    private wait(minutes: number): void {}
}

interface DeploymentResult {
    strategy: string;
    results: { [key: string]: any }[];
    success: boolean;
}
```

```go
// Deployment monitoring and health checks
package deployment

import (
	"fmt"
	"time"
)

type DeploymentStatus string

const (
	Deploying DeploymentStatus = "deploying"
	Ready     DeploymentStatus = "ready"
	Unhealthy DeploymentStatus = "unhealthy"
	RollingBack DeploymentStatus = "rolling_back"
)

type HealthCheck struct {
	Name        string
	Endpoint    string
	Interval    time.Duration
	Timeout     time.Duration
	Status      string
	LastChecked time.Time
}

type DeploymentMonitor struct {
	CurrentVersion string
	PreviousVersion string
	Status         DeploymentStatus
	HealthChecks   []HealthCheck
	Metrics        DeploymentMetrics
}

type DeploymentMetrics struct {
	DeploymentTime     time.Duration
	RequestSuccessRate  float64
	ResponseTimeP50     float64
	ResponseTimeP99     float64
	ErrorRate           float64
}

func NewDeploymentMonitor(current, previous string) *DeploymentMonitor {
	return &DeploymentMonitor{
		CurrentVersion:  current,
		PreviousVersion: previous,
		Status:          Deploying,
		HealthChecks:    []HealthCheck{},
		Metrics:         DeploymentMetrics{},
	}
}

func (dm *DeploymentMonitor) AddHealthCheck(name, endpoint string, interval, timeout time.Duration) {
	dm.HealthChecks = append(dm.HealthChecks, HealthCheck{
		Name:     name,
		Endpoint: endpoint,
		Interval: interval,
		Timeout:  timeout,
		Status:   "pending",
	})
}

func (dm *DeploymentMonitor) CheckHealth() map[string]string {
	results := make(map[string]string)
	for _, check := range dm.HealthChecks {
		if dm.performCheck(check) {
			results[check.Name] = "healthy"
		} else {
			results[check.Name] = "unhealthy"
		}
	}
	return results
}

func (dm *DeploymentMonitor) performCheck(check HealthCheck) bool {
	return true
}

func (dm *DeploymentMonitor) IsHealthy() bool {
	results := dm.CheckHealth()
	for _, status := range results {
		if status != "healthy" {
			return false
		}
	}
	return true
}

func (dm *DeploymentMonitor) CalculateAvailability(uptime, total time.Duration) float64 {
	return float64(uptime) / float64(total) * 100
}

func (dm *DeploymentMonitor) String() string {
	return fmt.Sprintf(
		"Deployment %s: Status=%s, Availability=%.2f%%",
		dm.CurrentVersion, dm.Status,
		dm.CalculateAvailability(time.Hour*24*7, time.Hour*24*7),
	)
}
```

```python
# Feature flags for safe deployments
class FeatureFlag:
    def __init__(self, name, enabled=False, rollout_percentage=0):
        self.name = name
        self.enabled = enabled
        self.rollout_percentage = rollout_percentage
        self.targeting_rules = []
        self.metrics = {"enabled_count": 0, "disabled_count": 0}

    def evaluate(self, user_id, user_attributes=None):
        if not self.enabled:
            self.metrics["disabled_count"] += 1
            return False

        for rule in self.targeting_rules:
            if self._matches_rule(user_attributes, rule):
                return True

        if self.rollout_percentage > 0:
            user_hash = hash(f"{self.name}:{user_id}")
            if (abs(user_hash) % 100) < self.rollout_percentage:
                self.metrics["enabled_count"] += 1
                return True

        self.metrics["disabled_count"] += 1
        return False

    def _matches_rule(self, user_attributes, rule):
        if not user_attributes:
            return False
        for key, value in rule.items():
            if user_attributes.get(key) != value:
                return False
        return True

    def add_targeting_rule(self, rule):
        self.targeting_rules.append(rule)

    def update_rollout(self, percentage):
        self.rollout_percentage = min(100, max(0, percentage))

    def toggle(self, enabled):
        self.enabled = enabled

    def get_metrics(self):
        return self.metrics


class FeatureFlagService:
    def __init__(self):
        self.flags = {}
        self.logger = []

    def create_flag(self, name, default_enabled=False):
        self.flags[name] = FeatureFlag(name, default_enabled)
        return self.flags[name]

    def evaluate_flag(self, flag_name, user_id, attributes=None):
        flag = self.flags.get(flag_name)
        if flag:
            return flag.evaluate(user_id, attributes)
        return False

    def incrementally_rollout(self, flag_name, target_percentage, step=10):
        flag = self.flags.get(flag_name)
        if flag:
            new_percentage = min(flag.rollout_percentage + step, target_percentage)
            flag.update_rollout(new_percentage)
            return new_percentage
        return None

    def emergency_rollback(self, flag_name):
        flag = self.flags.get(flag_name)
        if flag:
            flag.toggle(False)
            self.logger.append({
                "action": "emergency_rollback",
                "flag": flag_name,
                "timestamp": datetime.now()
            })
            return True
        return False

    def get_flag_status(self, flag_name):
        flag = self.flags.get(flag_name)
        if flag:
            return {
                "name": flag.name,
                "enabled": flag.enabled,
                "rollout_percentage": flag.rollout_percentage,
                "metrics": flag.get_metrics()
            }
        return None
```

```typescript
// Deployment verification and smoke tests
interface SmokeTest {
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    expectedStatus: number;
    expectedResponse?: { [key: string]: any };
    timeout: number;
}

interface TestResult {
    test: string;
    status: 'passed' | 'failed';
    responseTime: number;
    error?: string;
}

class DeploymentVerification {
    private smokeTests: SmokeTest[] = [];
    private results: TestResult[] = [];

    addSmokeTest(test: SmokeTest): void {
        this.smokeTests.push(test);
    }

    async runSmokeTests(): Promise<TestResult[]> {
        this.results = [];
        for (const test of this.smokeTests) {
            const result = await this.executeTest(test);
            this.results.push(result);
        }
        return this.results;
    }

    private async executeTest(test: SmokeTest): Promise<TestResult> {
        const startTime = Date.now();
        try {
            const response = await this.makeRequest(test);
            const responseTime = Date.now() - startTime;

            if (response.status !== test.expectedStatus) {
                return {
                    test: test.name,
                    status: 'failed',
                    responseTime,
                    error: `Expected status ${test.expectedStatus}, got ${response.status}`
                };
            }

            if (test.expectedResponse) {
                const match = this.compareResponses(response.body, test.expectedResponse);
                if (!match) {
                    return {
                        test: test.name,
                        status: 'failed',
                        responseTime,
                        error: 'Response body did not match expected'
                    };
                }
            }

            return {
                test: test.name,
                status: 'passed',
                responseTime
            };
        } catch (error) {
            return {
                test: test.name,
                status: 'failed',
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    private async makeRequest(test: SmokeTest): Promise<{ status: number; body: any }> {
        return { status: test.expectedStatus, body: {} };
    }

    private compareResponses(actual: any, expected: { [key: string]: any }): boolean {
        for (const key in expected) {
            if (actual[key] !== expected[key]) {
                return false;
            }
        }
        return true;
    }

    getSummary(): { passed: number; failed: number; avgResponseTime: number } {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const avgResponseTime = this.results.reduce(
            (sum, r) => sum + r.responseTime, 0
        ) / this.results.length;

        return { passed, failed, avgResponseTime };
    }

    isDeploymentHealthy(): boolean {
        return this.results.every(r => r.status === 'passed');
    }
}
```

## Best Practices

- Implement comprehensive automated testing including unit, integration, and end-to-end tests before deployment
- Use feature flags to decouple deployments from releases and enable instant rollbacks
- Deploy to production-like environments frequently to catch issues early
- Implement blue-green or canary deployment strategies to minimize risk of new releases
- Monitor deployment health continuously and have automated rollback triggers
- Keep deployment processes idempotent so they can be run multiple times safely
- Maintain detailed deployment logs and audit trails for troubleshooting and compliance
- Use immutable artifacts that are built once and deployed consistently across environments
- Implement proper database migration strategies that handle rollbacks gracefully
- Regularly practice deployments and incident response to ensure your processes work when needed
