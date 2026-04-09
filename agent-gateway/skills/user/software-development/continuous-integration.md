---
name: continuous-integration
description: Practice of frequently integrating code changes with automated build and testing
category: software-development
---

# Continuous Integration

## What I Do

I am a software development practice where developers frequently merge code changes into a main branch, with each merge triggering automated builds and tests. I help teams detect integration problems early and ensure that the codebase remains in a working state at all times. I enable faster feedback on code changes and reduce the risk of integration conflicts and deployment issues.

## When to Use Me

Use me whenever multiple developers are working on the same codebase. I am essential for teams practicing agile or DevOps methodologies where rapid, reliable releases are important. I work best when you have automated tests that can verify code correctness quickly. If you want to reduce integration pain and get faster feedback on your code changes, I should be a foundational practice in your development workflow.

## Core Concepts

- **Main Branch**: The single source of truth that should always be in a deployable state
- **Feature Branches**: Short-lived branches for individual features or fixes
- **Automated Build**: Compiling and packaging code without manual intervention
- **Automated Testing**: Running unit, integration, and other tests automatically
- **Pull Requests**: Code review process before merging changes
- **Build Status**: Visibility into whether the current code builds successfully
- **Fast Feedback**: Quick notification of issues to developers
- **Build Pipeline**: Sequence of automated steps from code commit to artifact
- **Test Coverage**: Percentage of code exercised by automated tests
- **Code Quality Gates**: Quality thresholds that must be met before merging

## Code Examples

```python
# Continuous integration pipeline configuration
class CIPipeline:
    def __init__(self, name):
        self.name = name
        self.stages = []
        self.triggers = ["push", "pull_request", "manual"]
        self.conditions = []

    def add_stage(self, name, commands, depends_on=None):
        stage = {
            "name": name,
            "commands": commands,
            "depends_on": depends_on,
            "status": "pending",
            "artifacts": [],
            "timeout_minutes": 30
        }
        self.stages.append(stage)
        return stage

    def run_pipeline(self, commit_sha):
        """Execute the full CI pipeline"""
        results = []
        for stage in self.stages:
            if stage["depends_on"] and not self._are_dependencies_met(
                stage["depends_on"], results
            ):
                stage["status"] = "skipped"
                continue

            result = self._execute_stage(stage)
            results.append({
                "stage": stage["name"],
                "status": result["status"],
                "duration": result["duration"],
                "artifacts": result["artifacts"]
            })

        return {
            "pipeline": self.name,
            "commit": commit_sha,
            "results": results,
            "success": all(r["status"] == "passed" for r in results)
        }

    def _execute_stage(self, stage):
        start_time = datetime.now()
        stage["status"] = "running"

        output = []
        for command in stage["commands"]:
            result = self._run_command(command)
            output.append(result)
            if result["exit_code"] != 0:
                stage["status"] = "failed"
                return {
                    "status": "failed",
                    "duration": (datetime.now() - start_time).total_seconds(),
                    "artifacts": [],
                    "output": output
                }

        stage["status"] = "passed"
        return {
            "status": "passed",
            "duration": (datetime.now() - start_time).total_seconds(),
            "artifacts": stage["artifacts"],
            "output": output
        }

    def _run_command(self, command):
        import subprocess
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                timeout=300
            )
            return {
                "command": command,
                "exit_code": result.returncode,
                "stdout": result.stdout.decode(),
                "stderr": result.stderr.decode()
            }
        except Exception as e:
            return {
                "command": command,
                "exit_code": 1,
                "stdout": "",
                "stderr": str(e)
            }
```

```typescript
// CI build status and notification system
interface BuildResult {
    buildId: string;
    commitSha: string;
    branch: string;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
    stages: BuildStage[];
    startTime: Date;
    endTime?: Date;
    duration?: number;
}

interface BuildStage {
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    duration?: number;
    logs: string[];
}

class CIBuildMonitor {
    private builds: Map<string, BuildResult> = new Map();
    private notifications: NotificationChannel[] = [];

    startBuild(commitSha: string, branch: string): BuildResult {
        const build: BuildResult = {
            buildId: `build-${Date.now()}`,
            commitSha,
            branch,
            status: 'pending',
            stages: [],
            startTime: new Date()
        };
        this.builds.set(build.buildId, build);
        return build;
    }

    updateStage(buildId: string, stageName: string, status: BuildStage['status']): void {
        const build = this.builds.get(buildId);
        if (build) {
            const stage = build.stages.find(s => s.name === stageName);
            if (stage) {
                stage.status = status;
                if (status === 'running') {
                    stage.logs.push(`[${new Date().toISOString()}] Stage started`);
                }
            }
        }
    }

    completeBuild(buildId: string, status: 'passed' | 'failed'): void {
        const build = this.builds.get(buildId);
        if (build) {
            build.status = status;
            build.endTime = new Date();
            build.duration = build.endTime.getTime() - build.startTime.getTime();
            this.notify(build);
        }
    }

    private notify(build: BuildResult): void {
        this.notifications.forEach(channel => {
            channel.send({
                buildId: build.buildId,
                status: build.status,
                duration: build.duration,
                commitSha: build.commitSha
            });
        });
    }

    getBuildHistory(limit: number = 10): BuildResult[] {
        return Array.from(this.builds.values())
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    }

    getAverageBuildTime(): number {
        const completed = Array.from(this.builds.values())
            .filter(b => b.status === 'passed' || b.status === 'failed');
        if (completed.length === 0) return 0;
        return completed.reduce((sum, b) => sum + (b.duration || 0), 0) / completed.length;
    }
}

interface NotificationChannel {
    send(message: { buildId: string; status: string; duration?: number; commitSha: string }): void;
}
```

```go
// CI test execution and coverage
package ci

import (
	"fmt"
	"os/exec"
	"time"
)

type TestResult struct {
	Name        string
	Status      string
	Duration    time.Duration
	Passed      int
	Failed      int
	Skipped     int
	Coverage    float64
	Output      string
}

type TestSuite struct {
	Tests    []TestResult
	TotalDuration time.Duration
}

func RunTests(pattern string) (*TestSuite, error) {
	suite := &TestSuite{
		Tests: []TestResult{},
	}

	cmd := exec.Command("go", "test", "-v", "-cover", "-json", pattern)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Test execution error: %v\n", err)
	}

	suite.parseOutput(string(output))
	return suite, nil
}

func (ts *TestSuite) parseOutput(output string) {
	ts.TotalDuration = time.Duration(0)
	for _, test := range ts.Tests {
		ts.TotalDuration += test.Duration
	}
}

func (ts *TestSuite) CalculateCoverage() float64 {
	var totalCoverage float64
	tested := 0

	for _, test := range ts.Tests {
		if test.Coverage > 0 {
			totalCoverage += test.Coverage
			tested++
		}
	}

	if tested == 0 {
		return 0
	}
	return totalCoverage / float64(tested)
}

func (ts *TestSuite) GetFailedTests() []string {
	var failed []string
	for _, test := range ts.Tests {
		if test.Status == "fail" {
			failed = append(failed, test.Name)
		}
	}
	return failed
}

func (ts *TestSuite) IsPassing() bool {
	for _, test := range ts.Tests {
		if test.Status == "fail" {
			return false
		}
	}
	return true
}

func (ts *TestSuite) Summary() string {
	totalPassed := 0
	totalFailed := 0
	for _, test := range ts.Tests {
		totalPassed += test.Passed
		totalFailed += test.Failed
	}
	return fmt.Sprintf(
		"Tests: %d passed, %d failed in %v",
		totalPassed, totalFailed, ts.TotalDuration,
	)
}
```

```python
# CI code quality gates
class CodeQualityGates:
    def __init__(self):
        self.gates = []
        self.results = []

    def add_gate(self, name, threshold, gate_type="min"):
        self.gates.append({
            "name": name,
            "threshold": threshold,
            "type": gate_type
        })

    def evaluate_coverage(self, percentage):
        gate = next((g for g in self.gates if g["name"] == "test_coverage"), None)
        if gate:
            result = {
                "gate": "test_coverage",
                "actual": percentage,
                "threshold": gate["threshold"],
                "passed": percentage >= gate["threshold"] if gate["type"] == "min" else True
            }
            self.results.append(result)
            return result
        return None

    def evaluate_complexity(self, max_complexity):
        gate = next((g for g in self.gates if g["name"] == "max_complexity"), None)
        if gate:
            result = {
                "gate": "max_complexity",
                "actual": max_complexity,
                "threshold": gate["threshold"],
                "passed": max_complexity <= gate["threshold"]
            }
            self.results.append(result)
            return result
        return None

    def evaluate_dupication(self, percentage):
        gate = next((g for g in self.gates if g["name"] == "code_duplication"), None)
        if gate:
            result = {
                "gate": "code_duplication",
                "actual": percentage,
                "threshold": gate["threshold"],
                "passed": percentage <= gate["threshold"]
            }
            self.results.append(result)
            return result
        return None

    def run_all_gates(self, metrics):
        self.results = []
        if "coverage" in metrics:
            self.evaluate_coverage(metrics["coverage"])
        if "complexity" in metrics:
            self.evaluate_complexity(metrics["complexity"])
        if "duplication" in metrics:
            self.evaluate_duplication(metrics["duplication"])
        return self.all_passed()

    def all_passed(self):
        return all(r["passed"] for r in self.results)

    def get_failed_gates(self):
        return [r for r in self.results if not r["passed"]]
```

```typescript
// CI pull request automation
interface PullRequest {
    id: string;
    title: string;
    author: string;
    sourceBranch: string;
    targetBranch: string;
    status: 'open' | 'merged' | 'closed';
    checks: Check[];
    approvals: Approval[];
    comments: Comment[];
}

interface Check {
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    details?: string;
}

interface Approval {
    reviewer: string;
    status: 'approved' | 'changes_requested' | 'commented';
    timestamp: Date;
}

interface Comment {
    author: string;
    content: string;
    timestamp: Date;
}

class PRAutomation {
    private prs: Map<string, PullRequest> = new Map();
    private requiredChecks = ['build', 'test', 'lint', 'security_scan'];

    createPR(title: string, author: string, sourceBranch: string, targetBranch: string): PullRequest {
        const pr: PullRequest = {
            id: `PR-${Date.now()}`,
            title,
            author,
            sourceBranch,
            targetBranch,
            status: 'open',
            checks: this.requiredChecks.map(check => ({
                name: check,
                status: 'pending'
            })),
            approvals: [],
            comments: []
        };
        this.prs.set(pr.id, pr);
        this.triggerChecks(pr.id);
        return pr;
    }

    private triggerChecks(prId: string): void {
        const pr = this.prs.get(prId);
        if (pr) {
            pr.checks.forEach(check => {
                check.status = 'running';
                setTimeout(() => {
                    check.status = 'passed';
                    this.evaluateMergeability(prId);
                }, 1000);
            });
        }
    }

    evaluateMergeability(prId: string): boolean {
        const pr = this.prs.get(prId);
        if (!pr) return false;

        const allChecksPassed = pr.checks.every(c => c.status === 'passed');
        const hasApprovals = pr.approvals.some(a => a.status === 'approved');
        const noChangesRequested = !pr.approvals.some(a => a.status === 'changes_requested');

        return allChecksPassed && hasApprovals && noChangesRequested;
    }

    canMerge(prId: string): { canMerge: boolean; blockers: string[] } {
        const pr = this.prs.get(prId);
        const blockers: string[] = [];

        if (!pr) return { canMerge: false, blockers: ['PR not found'] };

        pr.checks.forEach(check => {
            if (check.status !== 'passed') {
                blockers.push(`Check "${check.name}" ${check.status}`);
            }
        });

        const approvals = pr.approvals.filter(a => a.status === 'approved').length;
        if (approvals < 1) {
            blockers.push('At least 1 approval required');
        }

        const changesRequested = pr.approvals.some(a => a.status === 'changes_requested');
        if (changesRequested) {
            blockers.push('Changes have been requested');
        }

        return {
            canMerge: blockers.length === 0,
            blockers
        };
    }

    mergePR(prId: string): boolean {
        const { canMerge } = this.canMerge(prId);
        if (canMerge) {
            const pr = this.prs.get(prId);
            if (pr) {
                pr.status = 'merged';
                return true;
            }
        }
        return false;
    }
}
```

## Best Practices

- Commit code frequently, ideally multiple times per day, to reduce integration conflicts
- Keep builds fast by parallelizing tests and optimizing slow test suites
- Never leave the build broken, and stop work immediately if the build fails
- Use meaningful commit messages that describe what changed and why
- Run the same build locally that would run in CI to catch issues early
- Maintain comprehensive automated test suites covering unit, integration, and end-to-end tests
- Use branch protection rules to prevent merging code that fails quality gates
- Make build status visible to the entire team using badges and notifications
- Keep dependencies up to date and use lockfiles to ensure reproducible builds
- Review and iterate on your CI process regularly based on metrics and team feedback
