---
name: infrastructure-as-code
description: Managing infrastructure through machine-readable definition files
category: software-development
---

# Infrastructure as Code

## What I Do

I am a practice of managing and provisioning infrastructure through machine-readable definition files rather than physical hardware configuration or interactive configuration tools. I enable consistent, repeatable, and version-controlled infrastructure management. I help organizations treat infrastructure configuration with the same rigor as application code, including testing, review, and version control.

## When to Use Me

Use me whenever you need to manage infrastructure in a consistent, reproducible way. I am essential for teams practicing DevOps or cloud-native development where environments need to be created and destroyed frequently. I work well for compliance-heavy environments where audit trails are important. If you want to eliminate snowflake servers and ensure environments are identical, I should be a core practice in your organization.

## Core Concepts

- **Declarative Configuration**: Defining desired state rather than procedural steps
- **Idempotency**: Running the same configuration multiple times produces the same result
- **Immutable Infrastructure**: Replacing rather than modifying infrastructure
- **State Management**: Tracking the current state of infrastructure
- **Terraform**: Popular IaC tool for multi-cloud infrastructure
- **CloudFormation**: AWS-specific IaC service
- **Pulumi**: IaC using general-purpose programming languages
- **Ansible**: Configuration management and automation tool
- **Modules**: Reusable, composable infrastructure components
- **Drift Detection**: Identifying differences between desired and actual state

## Code Examples

```python
# Terraform-like infrastructure definition
class InfrastructureDefinition:
    def __init__(self, provider):
        self.provider = provider
        self.resources = []
        self.variables = {}
        self.outputs = {}
        self.providers = {}

    def add_resource(self, resource_type, name, **properties):
        resource = {
            "type": resource_type,
            "name": name,
            "properties": properties,
            "depends_on": properties.get("depends_on", [])
        }
        self.resources.append(resource)
        return resource

    def add_variable(self, name, default=None, description=None):
        self.variables[name] = {
            "default": default,
            "description": description
        }
        return self.variables[name]

    def add_output(self, name, value, description=None):
        self.outputs[name] = {
            "value": value,
            "description": description
        }
        return self.outputs[name]

    def generate_terraform_config(self):
        config = {
            "terraform": {
                "required_providers": self.providers
            },
            "variable": self.variables,
            "resource": {},
            "output": self.outputs
        }

        for resource in self.resources:
            res_type = resource["type"]
            if res_type not in config["resource"]:
                config["resource"][res_type] = {}
            config["resource"][res_type][resource["name"]] = {
                k: v for k, v in resource["properties"].items()
                if k != "depends_on"
            }

        return config

    def validate(self):
        """Validate infrastructure definition"""
        errors = []
        for resource in self.resources:
            if not resource["name"].isalnum() and "_" not in resource["name"]:
                errors.append(f"Invalid resource name: {resource['name']}")
        return {"valid": len(errors) == 0, "errors": errors}


class TerraformExecutor:
    def __init__(self):
        self.state = {}

    def plan(self, definition):
        """Generate execution plan"""
        plan = {
            "add": [],
            "change": [],
            "destroy": []
        }
        for resource in definition.resources:
            if resource["name"] not in self.state:
                plan["add"].append(resource)
            elif self.state[resource["name"]] != resource["properties"]:
                plan["change"].append(resource)
        return plan

    def apply(self, plan):
        """Apply infrastructure changes"""
        results = []
        for resource in plan.get("add", []):
            result = self._provision_resource(resource)
            results.append({"resource": resource["name"], "status": result})
        return {"applied": len([r for r in results if r["status"] == "success"])}

    def _provision_resource(self, resource):
        self.state[resource["name"]] = resource["properties"]
        return "success"

    def destroy(self):
        """Destroy all managed resources"""
        self.state = {}
        return {"destroyed": True}
```

```typescript
// Pulumi-like infrastructure as code
interface ResourceOptions {
    parent?: Resource;
    dependsOn?: Resource[];
    protect?: boolean;
    providers?: { [key: string]: Provider };
}

interface Resource {
    urn: string;
    id?: string;
    state: { [key: string]: any };
}

class ComponentResource implements Resource {
    urn: string;
    state: { [key: string]: any };
    protected: boolean = false;
    dependencies: Resource[] = [];

    constructor(type: string, name: string, options?: ResourceOptions) {
        this.urn = `urn:pulumi:stack::project::${type}::${name}`;
        this.state = {};
        if (options?.protect) {
            this.protected = true;
        }
        if (options?.dependsOn) {
            this.dependencies = options.dependsOn;
        }
    }

    registerOutputs(outputs: { [key: string]: any }): void {
        Object.assign(this.state, outputs);
    }
}

class CloudStorageBucket extends ComponentResource {
    constructor(name: string, args: BucketArgs, options?: ResourceOptions) {
        super('aws:s3/bucket:Bucket', name, options);
        this.state = {
            bucket: name,
            acl: args.acl || 'private',
            versioning: args.versioning || false,
            serverSideEncryption: args.serverSideEncryption
        };
    }
}

interface BucketArgs {
    acl?: string;
    versioning?: boolean;
    serverSideEncryption?: boolean;
}

class InfrastructureStack {
    private resources: Resource[] = [];

    createBucket(name: string, args: BucketArgs): CloudStorageBucket {
        const bucket = new CloudStorageBucket(name, args);
        this.resources.push(bucket);
        return bucket;
    }

    async up(): Promise<void> {
        for (const resource of this.resources) {
            await this.provision(resource);
        }
    }

    async down(): Promise<void> {
        for (const resource of this.resources) {
            await this.deprovision(resource);
        }
        this.resources = [];
    }

    private async provision(resource: Resource): Promise<void> {
        console.log(`Provisioning ${resource.urn}`);
        resource.id = `id-${Date.now()}`;
    }

    private async deprovision(resource: Resource): Promise<void> {
        console.log(`Deprovisioning ${resource.urn}`);
        resource.id = undefined;
    }

    getResourceGraph(): { [key: string]: string[] } {
        const graph: { [key: string]: string[] } = {};
        this.resources.forEach(r => {
            graph[r.urn] = r.dependencies.map(d => d.urn);
        });
        return graph;
    }
}
```

```go
// Ansible-like configuration management
package ansible

import (
	"fmt"
	"os"
)

type Task struct {
	Name    string
	Module  string
	Args    map[string]interface{}
	When    string
	Notify  []string
}

type Playbook struct {
	Name  string
	Hosts []string
	Tasks []Task
	Vars  map[string]interface{}
}

type AnsibleExecutor struct {
	Playbooks []Playbook
	Inventory map[string][]string
}

func NewAnsibleExecutor() *AnsibleExecutor {
	return &AnsibleExecutor{
		Playbooks: []Playbook{},
		Inventory: make(map[string][]string),
	}
}

func (ae *AnsibleExecutor) AddPlaybook(name, hostPattern string) *Playbook {
	playbook := Playbook{
		Name:  name,
		Hosts: []string{hostPattern},
		Tasks: []Task{},
		Vars:  make(map[string]interface{}),
	}
	ae.Playbooks = append(ae.Playbooks, playbook)
	return &ae.Playbooks[len(ae.Playbooks)-1]
}

func (p *Playbook) AddTask(name, module string, args map[string]interface{}) *Task {
	task := Task{
		Name:   name,
		Module: module,
		Args:   args,
	}
	p.Tasks = append(p.Tasks, task)
	return &p.Tasks[len(p.Tasks)-1]
}

func (ae *AnsibleExecutor) Execute() error {
	for _, playbook := range ae.Playbooks {
		fmt.Printf("PLAY [%s]\n", playbook.Name)

		for _, task := range playbook.Tasks {
			if !ae.shouldRun(task.When) {
				fmt.Printf(f"    SKIP: %s (condition not met)\n", task.Name)
				continue
			}

			fmt.Printf("    TASK [%s]\n", task.Name)
			if err := ae.runModule(task); err != nil {
				return err
			}
		}
	}
	return nil
}

func (ae *AnsibleExecutor) shouldRun(condition string) bool {
	if condition == "" {
		return true
	}
	return true
}

func (ae *AnsibleExecutor) runModule(task Task) error {
	switch task.Module {
	case "apt":
		return ae.runAptModule(task.Args)
	case "service":
		return ae.runServiceModule(task.Args)
	case "copy":
		return ae.runCopyModule(task.Args)
	case "file":
		return ae.runFileModule(task.Args)
	default:
		fmt.Printf("        ok: [%s]\n", task.Module)
		return nil
	}
}

func (ae *AnsibleExecutor) runAptModule(args map[string]interface{}) error {
	fmt.Printf("        ok: [apt]\n")
	return nil
}

func (ae *AnsibleExecutor) runServiceModule(args map[string]interface{}) error {
	fmt.Printf("        ok: [service]\n")
	return nil
}

func (ae *AnsibleExecutor) runCopyModule(args map[string]interface{}) error {
	fmt.Printf("        ok: [copy]\n")
	return nil
}

func (ae *AnsibleExecutor) runFileModule(args map[string]interface{}) error {
	fmt.Printf("        ok: [file]\n")
	return nil
}

func (ae *AnsibleExecutor) AddHost(host, group string) {
	ae.Inventory[group] = append(ae.Inventory[group], host)
}
```

```python
# Infrastructure drift detection
class DriftDetector:
    def __init__(self, current_state_file):
        self.current_state = self._load_state(current_state_file)
        self.desired_state = None
        self.drift_report = []

    def load_desired_state(self, desired_state):
        self.desired_state = desired_state

    def detect_drift(self):
        self.drift_report = []

        for resource_type, resources in self.desired_state.items():
            if resource_type not in self.current_state:
                self.drift_report.append({
                    "type": "missing",
                    "resource_type": resource_type,
                    "message": f"Resource type {resource_type} not in current state"
                })
                continue

            for name, desired_props in resources.items():
                current_props = self.current_state[resource_type].get(name)

                if current_props is None:
                    self.drift_report.append({
                        "type": "add",
                        "resource_type": resource_type,
                        "name": name,
                        "message": f"Resource {name} exists in desired but not current state"
                    })
                else:
                    drift = self._compare_properties(desired_props, current_props)
                    if drift:
                        self.drift_report.append({
                            "type": "change",
                            "resource_type": resource_type,
                            "name": name,
                            "changes": drift
                        })

        return self.drift_report

    def _compare_properties(self, desired, current):
        changes = {}
        for key, desired_value in desired.items():
            if key.startswith("_"):
                continue
            current_value = current.get(key)
            if current_value != desired_value:
                changes[key] = {
                    "desired": desired_value,
                    "current": current_value
                }
        return changes

    def _load_state(self, state_file):
        return {}

    def get_drift_summary(self):
        return {
            "total_drift": len(self.drift_report),
            "additions": len([d for d in self.drift_report if d["type"] == "add"]),
            "changes": len([d for d in self.drift_report if d["type"] == "change"]),
            "deletions": len([d for d in self.drift_report if d["type"] == "missing"]),
            "has_drift": len(self.drift_report) > 0
        }
```

```python
# Multi-cloud infrastructure provisioning
class CloudProvider:
    def __init__(self, name):
        self.name = name
        self.resources = {}

    def provision_compute(self, instance_type, image_id):
        return {"type": "compute", "instance_type": instance_type}

    def provision_storage(self, size_gb):
        return {"type": "storage", "size_gb": size_gb}

    def provision_network(self, cidr_block):
        return {"type": "network", "cidr": cidr_block}


class MultiCloudInfrastructure:
    def __init__(self):
        self.providers = {
            "aws": CloudProvider("AWS"),
            "azure": CloudProvider("Azure"),
            "gcp": CloudProvider("GCP")
        }
        self.resources = []

    def deploy_to_cloud(self, cloud, resource_type, **kwargs):
        provider = self.providers.get(cloud)
        if not provider:
            raise ValueError(f"Unknown cloud provider: {cloud}")

        resource = None
        if resource_type == "compute":
            resource = provider.provision_compute(
                kwargs.get("instance_type", "t3.micro"),
                kwargs.get("image_id", "ami-12345678")
            )
        elif resource_type == "storage":
            resource = provider.provision_storage(kwargs.get("size_gb", 100))
        elif resource_type == "network":
            resource = provider.provision_network(kwargs.get("cidr", "10.0.0.0/16"))

        if resource:
            self.resources.append({
                "cloud": cloud,
                "resource": resource
            })
        return resource

    def estimate_cost(self, cloud, resource_type, **kwargs):
        costs = {
            "aws": {"compute": 0.05, "storage": 0.10, "network": 0.02},
            "azure": {"compute": 0.06, "storage": 0.09, "network": 0.02},
            "gcp": {"compute": 0.04, "storage": 0.08, "network": 0.02}
        }
        hourly_rate = costs.get(cloud, {}).get(resource_type, 0)
        monthly_cost = hourly_rate * 24 * 30 * kwargs.get("count", 1)
        return monthly_cost

    def generate_cost_report(self):
        report = {}
        for cloud in self.providers:
            cloud_resources = [r for r in self.resources if r["cloud"] == cloud]
            total_cost = sum(
                self.estimate_cost(cloud, r["resource"]["type"])
                for r in cloud_resources
            )
            report[cloud] = {"resources": len(cloud_resources), "monthly_cost": total_cost}
        return report
```

## Best Practices

- Version control all infrastructure code including Terraform, CloudFormation, or Ansible playbooks
- Use modules or reusable components to ensure consistency and reduce duplication
- Implement proper state management and backup to prevent infrastructure loss
- Use separate environments for dev, staging, and production with promotion between them
- Apply the same code review and testing practices to infrastructure code as application code
- Implement drift detection to identify when actual infrastructure diverges from defined state
- Use immutable infrastructure patterns when possible to ensure reproducibility
- Parameterize configurations to support different environments and use cases
- Document infrastructure decisions and maintain runbooks for common operations
- Test infrastructure changes using tools like Terratest before applying to production
