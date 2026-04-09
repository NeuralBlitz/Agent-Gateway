---
name: chaos-engineering
description: Practice of experimenting on systems to build confidence in their capability to withstand turbulent conditions
category: software-development
---

# Chaos Engineering

## What I Do

I am the discipline of experimenting on systems to build confidence in their capability to withstand turbulent conditions. I help organizations discover weaknesses in their systems before they cause outages in production. By proactively injecting failures and observing system behavior, I enable teams to identify and fix problems before users are impacted.

## When to Use Me

Use me when you want to validate that your systems can handle real-world failures gracefully. I am ideal for distributed systems where partial failures are common and expected. I work well for organizations that want to improve resilience and reduce incident impact. If you practice DevOps or SRE and want to build confidence in your system's ability to survive failures, I should be part of your practice.

## Core Concepts

- **Chaos Experiment**: Controlled test that injects failure into a system
- **Steady State**: Normal, healthy behavior of the system
- **Hypothesis**: Prediction of how the system will behave under failure
- **Blast Radius**: The scope of systems affected by an experiment
- **Abort Conditions**: Criteria for stopping an experiment immediately
- **Fallout**: Impact of the experiment on users or system
- **Litmus Test**: Simple test to verify system health
- **Chaos Monkey**: Randomly terminates instances in production
- **Fault Injection**: Introducing various failure types into systems
- **Resilience Testing**: Evaluating system ability to recover from failures

## Code Examples

```python
class ChaosExperiment:
    def __init__(self, name):
        self.name = name
        self.hypothesis = ""
        self.steady_state = None
        self.workload = None
        self.probes = []
        self.abort_conditions = []
        self.faults = []

    def set_hypothesis(self, hypothesis):
        self.hypothesis = hypothesis

    def define_steady_state(self, metrics):
        self.steady_state = {
            "metrics": metrics,
            "probe_interval": 5,
            "probe_timeout": 30
        }
        return self

    def add_probe(self, name, query, threshold):
        self.probes.append({
            "name": name,
            "query": query,
            "threshold": threshold,
            "comparison": "lt"
        })
        return self

    def add_abort_condition(self, condition, description):
        self.abort_conditions.append({
            "condition": condition,
            "description": description
        })
        return self

    def add_fault(self, fault_type, target, parameters):
        self.faults.append({
            "type": fault_type,
            "target": target,
            "parameters": parameters,
            "duration": parameters.get("duration", 60)
        })
        return self

    def run(self):
        results = {
            "experiment": self.name,
            "steady_state_achieved": False,
            "hypothesis_validated": False,
            "abort_reason": None,
            "faults_injected": [],
            "probe_results": []
        }

        results["steady_state_achieved"] = self._verify_steady_state()

        for fault in self.faults:
            if self._should_abort():
                results["abort_reason"] = "Abort condition triggered"
                break

            fault_result = self._inject_fault(fault)
            results["faults_injected"].append(fault_result)

            probe_result = self._collect_probes()
            results["probe_results"].append(probe_result)

        return results

    def _verify_steady_state(self):
        return True

    def _should_abort(self):
        return False

    def _inject_fault(self, fault):
        return {"status": "injected", "fault": fault["type"]}

    def _collect_probes(self):
        return {"probes": []}


class ChaosMonkey:
    def __init__(self):
        self.attacks = []

    def terminate_instance(self, instance_id):
        attack = {
            "type": "terminate",
            "target": instance_id,
            "status": "pending"
        }
        return attack

    def inject_latency(self, service, delay_ms):
        attack = {
            "type": "latency",
            "target": service,
            "delay_ms": delay_ms,
            "status": "pending"
        }
        return attack

    def corrupt_packet(self, target, percentage):
        attack = {
            "type": "packet_corruption",
            "target": target,
            "percentage": percentage,
            "status": "pending"
        }
        return attack

    def fill_disk(self, target, percentage):
        attack = {
            "type": "disk_fill",
            "target": target,
            "fill_percentage": percentage,
            "status": "pending"
        }
        return attack
```

```typescript
interface ExperimentResult {
    experiment: string;
    status: 'success' | 'failed' | 'aborted';
    hypothesis: string;
    validated: boolean;
    observations: Observation[];
    startTime: Date;
    endTime?: Date;
}

interface Observation {
    timestamp: Date;
    metric: string;
    value: number;
    expected: string;
}

class ChaosEngine {
    private experiments: Map<string, ChaosExperiment> = new Map();
    private observability: ObservabilityClient;

    constructor() {
        this.observability = new ObservabilityClient();
    }

    registerExperiment(experiment: ChaosExperiment): void {
        this.experiments.set(experiment.name, experiment);
    }

    async runExperiment(name: string): Promise<ExperimentResult> {
        const experiment = this.experiments.get(name);
        if (!experiment) {
            throw new Error(`Experiment ${name} not found`);
        }

        const result: ExperimentResult = {
            experiment: name,
            status: 'success',
            hypothesis: experiment.hypothesis,
            validated: false,
            observations: [],
            startTime: new Date()
        };

        try {
            await this.verifySteadyState(experiment, result);

            for (const fault of experiment.faults) {
                if (await this.checkAbortConditions(experiment)) {
                    result.status = 'aborted';
                    break;
                }

                await this.injectFault(fault);
                await this.wait(fault.duration);

                const observations = await this.collectObservations(experiment);
                result.observations.push(...observations);
            }

            result.validated = this.validateHypothesis(result.observations);
        } catch (error) {
            result.status = 'failed';
        } finally {
            result.endTime = new Date();
        }

        return result;
    }

    private async verifySteadyState(experiment: ChaosExperiment, result: ExperimentResult): Promise<void> {
        console.log('Verifying steady state...');
    }

    private async checkAbortConditions(experiment: ChaosExperiment): Promise<boolean> {
        return false;
    }

    private async injectFault(fault: any): Promise<void> {
        console.log(`Injecting fault: ${fault.type}`);
    }

    private async collectObservations(experiment: ChaosExperiment): Promise<Observation[]> {
        return [];
    }

    private validateHypothesis(observations: Observation[]): boolean {
        return true;
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class ObservabilityClient {
    getMetric(metricName: string): Promise<number> {
        return Promise.resolve(0);
    }
}
```

```go
package chaos

import (
	"context"
	"time"
)

type FaultType string

const (
	LatencyFault     FaultType = "latency"
	KillFault        FaultType = "kill"
	NetworkFault     FaultType = "network"
	CPUFault         FaultType = "cpu"
	MemoryFault      FaultType = "memory"
	DiskFault        FaultType = "disk"
)

type Fault struct {
	Type      FaultType
	Target    string
	Intensity int
	Duration  time.Duration
}

type ExperimentResult struct {
	ExperimentName string
	Passed         bool
	Observations  []Observation
}

type Observation struct {
	Metric      string
	Value       float64
	Timestamp   time.Time
	Normative   bool
}

type ChaosService struct {
	Experiments []Experiment
}

type Experiment struct {
	Name        string
	Description string
	Faults      []Fault
	Probes      []Probe
}

type Probe struct {
	Name   string
	Target string
	Query  string
}

func NewChaosService() *ChaosService {
	return &ChaosService{
		Experiments: []Experiment{},
	}
}

func (cs *ChaosService) AddExperiment(exp Experiment) {
	cs.Experiments = append(cs.Experiments, exp)
}

func (cs *ChaosService) RunExperiment(name string) *ExperimentResult {
	for _, exp := range cs.Experiments {
		if exp.Name == name {
			return cs.executeExperiment(exp)
		}
	}
	return nil
}

func (cs *ChaosService) executeExperiment(exp Experiment) *ExperimentResult {
	result := &ExperimentResult{
		ExperimentName: exp.Name,
		Passed:         true,
		Observations:   []Observation{},
	}

	for _, fault := range exp.Faults {
		cs.injectFault(fault)
		time.Sleep(fault.Duration)

		for _, probe := range exp.Probes {
			observation := cs.collectObservation(probe)
			result.Observations = append(result.Observations, observation)
		}
	}

	return result
}

func (cs *ChaosService) injectFault(fault Fault) {
	switch fault.Type {
	case LatencyFault:
		cs.injectLatency(fault.Target, fault.Intensity)
	case KillFault:
		cs.killInstance(fault.Target)
	case CPUFault:
		cs.stressCPU(fault.Intensity)
	}
}

func (cs *ChaosService) injectLatency(target string, ms int) {}
func (cs *ChaosService) killInstance(target string)          {}
func (cs *ChaosService) stressCPU(percentage int)            {}

func (cs *ChaosService) collectObservation(probe Probe) Observation {
	return Observation{
		Metric:    probe.Name,
		Value:     0,
		Timestamp: time.Now(),
		Normative: true,
	}
}

func (cs *ChaosService) RunAllExperiments() []*ExperimentResult {
	var results []*ExperimentResult
	for _, exp := range cs.Experiments {
		results = append(results, cs.executeExperiment(exp))
	}
	return results
}
```

```python
class NetworkChaos:
    def __init__(self):
        self.partitions = []

    def create_network_partition(self, hosts_in_group_a, hosts_in_group_b):
        partition = {
            "group_a": hosts_in_group_a,
            "group_b": hosts_in_group_b,
            "status": "active"
        }
        self.partitions.append(partition)
        return partition

    def inject_packet_loss(self, target, loss_percentage):
        return {
            "type": "packet_loss",
            "target": target,
            "loss_percentage": loss_percentage
        }

    def inject_dns_failure(self, domain, failure_type="timeout"):
        return {
            "type": "dns_failure",
            "domain": domain,
            "failure_type": failure_type
        }

    def throttle_bandwidth(self, target, max_bandwidth_kbps):
        return {
            "type": "bandwidth_throttling",
            "target": target,
            "max_kbps": max_bandwidth_kbps
        }

    def resolve_partition(self, partition):
        partition["status"] = "resolved"
        return partition


class DNSChaosExperiment:
    def __init__(self):
        self.dns_records = {}

    def hijack_dns_record(self, domain, wrong_ip):
        self.dns_records[domain] = {
            "original_ip": self.dns_records.get(domain, {}).get("current_ip"),
            "hijacked_ip": wrong_ip,
            "status": "active"
        }

    def return_dns_record(self, domain):
        if domain in self.dns_records:
            self.dns_records[domain]["status"] = "resolved"

    def simulate_dns_timeout(self, domain):
        return {
            "type": "dns_timeout",
            "domain": domain,
            "duration": 30
        }


class ResiliencyValidator:
    def __init__(self):
        self.results = []

    def validate_timeout_handling(self, service, timeout_duration):
        result = {
            "service": service,
            "timeout_duration": timeout_duration,
            "handled_gracefully": True,
            "fallback_activated": False
        }
        self.results.append(result)
        return result

    def validate_circuit_breaker(self, service, failure_threshold):
        result = {
            "service": service,
            "failure_threshold": failure_threshold,
            "circuit_opened": False,
            "recovery_successful": False
        }
        self.results.append(result)
        return result

    def validate_retry_logic(self, operation, max_retries):
        result = {
            "operation": operation,
            "max_retries": max_retries,
            "retry_count": 0,
            "eventually_successful": False
        }
        self.results.append(result)
        return result

    def generate_resilience_report(self):
        return {
            "total_tests": len(self.results),
            "passed": sum(1 for r in self.results if r.get("handled_gracefully") or r.get("circuit_opened")),
            "failed": sum(1 for r in self.results if not r.get("handled_gracefully") and not r.get("circuit_opened")),
            "recommendations": []
        }
```

## Best Practices

- Start with small, non-production experiments to build confidence before targeting production
- Define steady state hypothesis clearly before injecting any failures
- Always have abort conditions and monitoring in place to stop experiments if needed
- Minimize blast radius by starting with limited scope and gradually expanding
- Run experiments in production regularly to catch real-world weaknesses
- Learn from failures and use insights to improve system resilience
- Automate experiment execution for consistency and repeatability
- Document findings and share learnings across teams
- Balance experiment frequency with operational overhead
- Combine with game days for comprehensive resilience testing

## Common Patterns

- **Chaos Mesh**: Open source chaos engineering platform
- **LitmusChaos**: Cloud-native chaos engineering framework
- **Gremlin**: Commercial chaos engineering platform
- **AWS Fault Injection Simulator**: Managed chaos engineering service
- **Chaos Toolkit**: Open source chaos engineering experimentation platform
