---
name: chaos-engineering
description: Discipline of experimenting on systems to build confidence in their capability to withstand turbulent conditions
category: devops
---

# Chaos Engineering

## What I Do

I enable teams to proactively test system resilience by introducing controlled failures. I help discover weaknesses before they cause outages, building confidence in system behavior under adverse conditions.

## When to Use Me

- Validating system reliability before production
- Testing disaster recovery procedures
- Building confidence in microservices architectures
- Meeting resilience SLAs/SLOs
- Improving incident response procedures
- Validating auto-scaling and failover
- Regular resilience testing schedules

## Core Concepts

- **Chaos Experiments**: Controlled tests that inject failures
- **Blast Radius**: Impact scope of the experiment
- **Hypothesis**: What you expect to happen during the experiment
- **Steady State**: Normal operational behavior baseline
- **Abort Conditions**: When to stop the experiment
- **MTTR**: Mean time to recovery measurement
- **Experiment Runner**: Tools like Chaos Toolkit, Gremlin
- **Observability Integration**: Metrics during experiments
- **Scope Limiting**: Containing impact to safe boundaries
- **Continuous Chaos**: Regular, automated experiments

## Code Examples

**Chaos Toolkit Experiment (YCL):**
```yaml
title: "Verify database failover works correctly"
description: |
  This experiment verifies that our PostgreSQL cluster
  can handle primary database failure

method:
  - type: action
    name: stop_database_primary
    provider:
      type: python
      module: chaosk8s.actions
      func: kill_pod
      parameters:
        label_selector: app=postgresql
        namespace: database
        mode: all
        grace_period: 0

  - type: probe
    name: check_database_reachable
    provider:
      type: python
      module: chaospostgres.probes
      func: query
      parameters:
        query: "SELECT 1"
        timeout: 10

  - type: probe
    name: verify_write_operations
    provider:
      type: python
      module: chaospostgres.probes
      func: query
      parameters:
        query: "INSERT INTO health_check (timestamp) VALUES (NOW()) RETURNING id"

  - type: probe
    name: measure_recovery_time
    type: timer
    provider:
      type: python
      module: chaosk8s.probes
      func: deployment_available_replicas
      parameters:
        name: postgresql
        namespace: database

steady-state-hypothesis:
  title: "Database is operational"
  probes:
    - type: probe
      name: database_responsive
      provider:
        type: python
        module: chaospostgres.probes
        func: query
        parameters:
          query: "SELECT version()"

rollbacks:
  - type: action
    name: restart_database
    provider:
      type: python
      module: chaosk8s.actions
      func: apply_file
      parameters:
        file: config/manifests/postgresql.yaml
```

**LitmusChaos Experiment (YAML):**
```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: nginx-chaos
  namespace: litmus
spec:
  appinfo:
    appns: default
    applabel: "app=nginx"
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '30'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: FORCE
              value: 'false'
            - name: PODS_AFFECTED_PERC
              value: '50'
        definition:
          lsecos:
            - name: pod-delete
              type: nginx-chaos
              kind: ChaosEngine
---
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-chaos
spec:
  appinfo:
    appns: default
    applabel: "app=api"
    appkind: deployment
  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: NETWORK_LATENCY
              value: '2000'
            - name: JITTER
              value: '1000'
            - name: CONTAINER_RUNTIME
              value: 'docker'
            - name: SOCKET_PATH
              value: '/var/run/docker.sock'
```

**Gremlin Chaos Script:**
```python
from gremlinapi.probabilistic import ProbabilisticAttack
from gremlinapi.targets import GremlinTargetedAttack, ContainerTarget
from gremlinapi.attack_importer import attach_chaos_script

# Resource attack - CPU stress
def cpu_stress_attack():
    attack = GremlinTargetedAttack()
    attack.target(
        ContainerTarget(
            name="nginx",
            labels={"app": "web"}
        )
    )
    attack.resource(
        cpu={
            "type": "cpu",
            "mode": "stress",
            "workers": 4,
            "duration": 120
        }
    )
    return attack.execute()

# Network attack - Packet loss
def network_loss_attack():
    attack = GremlinTargetedAttack()
    attack.target(
        ContainerTarget(
            name="api-service",
            namespace="production"
        )
    )
    attack.network(
        packet_loss={
            "type": "network",
            "mode": "loss",
            "percent": 25,
            "duration": 60,
            "corrupt": True
        }
    )
    return attack.execute()

# Shutdown attack for failover testing
def kill_leader_attack():
    attack = GremlinTargetedAttack()
    attack.target(
        ContainerTarget(
            name="postgres",
            labels={"app": "database", "role": "primary"}
        )
    )
    attack.shutdown(
        timeout=10
    )
    return attack.execute()

# Latency attack for dependency testing
def latency_injection():
    attack = GremlinTargetedAttack()
    attack.target(
        ContainerTarget(
            name="redis-cache",
            labels={"app": "cache"}
        )
    )
    attack.network(
        latency={
            "type": "network",
            "mode": "latency",
            "delay": 2000,
            "jitter": 500,
            "duration": 120
        }
    )
    return attack.execute()
```

**Kubernetes Chaos Experiment:**
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: Workflow
metadata:
  name: multi-layer-chaos
  namespace: chaos-testing
spec:
  entry: serial-chaos
  templates:
    - name: serial-chaos
      templateType: Serial
      deadline: 30m
      children:
        - pod-failure
        - network-delay
        - cpu-stress
    
    - name: pod-failure
      templateType: PodChaos
      podChaos:
        selector:
          namespaces:
            - production
          labelSelectors:
            app: api-server
        mode: one
        action: pod-kill
        gracePeriod: 0
    
    - name: network-delay
      templateType: NetworkChaos
      networkChaos:
        selector:
          namespaces:
            - production
          labelSelectors:
            app: payment-service
        mode: all
        action: delay
        delay:
          latency: 2000ms
          jitter: 500ms
          correlation: "50"
        direction: both
    
    - name: cpu-stress
      templateType: StressChaos
      stressChaos:
        selector:
          namespaces:
            - production
          labelSelectors:
            app: worker
        mode: one
        stressors:
          cpu:
            workers: 4
            load: 80
```

## Best Practices

1. **Start with non-production** - First experiments in staging
2. **Define steady state** - What does normal look like?
3. **Limit blast radius** - Start small, expand gradually
4. **Set abort conditions** - Know when to stop immediately
5. **Have rollback plan** - How to restore normal operations
6. **Measure MTTR** - Track recovery time improvements
7. **Involve on-call teams** - Include SRE in experiments
8. **Automate experiments** - Regular, scheduled chaos
9. **Document findings** - Learn from each experiment
10. **Gradually increase severity** - Build confidence incrementally
