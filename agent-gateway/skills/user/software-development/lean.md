---
name: lean
description: Methodology focused on maximizing value by eliminating waste and optimizing processes
category: software-development
---

# Lean

## What I Do

I am a methodology that focuses on maximizing value by eliminating waste and optimizing processes throughout the software development lifecycle. I help teams identify and remove activities that do not add value while continuously improving the delivery of features that customers actually want. I emphasize respect for people, visual management, and the relentless pursuit of perfection in all aspects of software development.

## When to Use Me

Use me when you want to optimize your software development process to deliver more value with less waste. I work well for organizations experiencing inefficiencies, long lead times, or excessive inventory in the form of partially completed work. I am ideal for teams looking to improve quality while reducing costs and cycle times. If you want to create a culture of continuous improvement and respect for all team members, I can guide your transformation.

## Core Concepts

- **Value**: Defined from the customer's perspective, not what you think they need
- **Value Stream**: All activities required to deliver a feature from request to deployment
- **Waste**: Any activity that consumes resources but does not add value
- **Flow**: Smooth progression of work without delays or interruptions
- **Pull**: Work is started based on actual demand, not predictions
- **Perfection**: Continuous improvement toward ideal processes
- **Respect for People**: Honoring contributions and developing capabilities
- **Generative AI**: Collaborative intelligence amplifying human creativity
- **Visual Management**: Making work and problems visible
- **Built-in Quality**: Preventing defects rather than detecting them

## Code Examples

```python
# Lean value stream mapping
class ValueStream:
    def __init__(self, name):
        self.name = name
        self.activities = []
        self.lead_time = 0
        self.process_time = 0
        self.waste_percentage = 0

    def add_activity(self, name, process_time, is_value_added=True):
        activity = {
            "name": name,
            "process_time": process_time,
            "wait_time": 0,
            "is_value_added": is_value_added
        }
        self.activities.append(activity)
        self._recalculate_metrics()

    def calculate_waste(self):
        total_time = sum(a["process_time"] + a["wait_time"] for a in self.activities)
        va_time = sum(a["process_time"] for a in self.activities if a["is_value_added"])
        self.waste_percentage = ((total_time - va_time) / total_time * 100) if total_time > 0 else 0
        return self.waste_percentage

    def identify_waste_types(self):
        waste_types = {
            "waiting": 0,
            "overproduction": 0,
            "defects": 0,
            "overprocessing": 0,
            "inventory": 0,
            "motion": 0,
            "transport": 0
        }
        for activity in self.activities:
            if activity["wait_time"] > 0:
                waste_types["waiting"] += activity["wait_time"]
        return waste_types

    def optimize_flow(self):
        optimized = ValueStream(self.name)
        for activity in self.activities:
            if activity["is_value_added"]:
                optimized.add_activity(
                    activity["name"],
                    activity["process_time"],
                    True
                )
            elif activity["wait_time"] > 0:
                activity["wait_time"] = max(0, activity["wait_time"] - 0.3)
                optimized.add_activity(
                    activity["name"],
                    activity["process_time"],
                    activity["is_value_added"]
                )
        return optimized
```

```typescript
// Lean waste identification and elimination
interface Activity {
    name: string;
    duration: number;
    valueAdded: boolean;
    wasteType?: WasteType;
    status: 'pending' | 'in_progress' | 'completed';
}

type WasteType =
    | 'waiting'
    | 'overproduction'
    | 'defects'
    | 'overprocessing'
    | 'inventory'
    | 'motion'
    | 'transport'
    | 'unused_talent';

class WasteEliminator {
    activities: Activity[] = [];

    addActivity(activity: Activity): void {
        this.activities.push(activity);
    }

    identifyWaste(): { type: WasteType; duration: number }[] {
        const wasteMap = new Map<WasteType, number>();

        this.activities.forEach(activity => {
            if (!activity.valueAdded && activity.wasteType) {
                wasteMap.set(
                    activity.wasteType,
                    (wasteMap.get(activity.wasteType) || 0) + activity.duration
                );
            }
        });

        return Array.from(wasteMap.entries()).map(([type, duration]) => ({
            type,
            duration
        }));
    }

    calculateWastePercentage(): number {
        const totalDuration = this.activities.reduce(
            (sum, a) => sum + a.duration, 0
        );
        const wasteDuration = this.activities
            .filter(a => !a.valueAdded)
            .reduce((sum, a) => sum + a.duration, 0);

        return totalDuration > 0 ? (wasteDuration / totalDuration) * 100 : 0;
    }

    suggestImprovements(): string[] {
        const improvements: string[] = [];
        const waste = this.identifyWaste();

        waste.forEach(({ type, duration }) => {
            switch (type) {
                case 'waiting':
                    improvements.push(
                        'Reduce handoffs and implement parallel processing'
                    );
                    break;
                case 'defects':
                    improvements.push(
                        'Add quality checks earlier in the process'
                    );
                    break;
                case 'motion':
                    improvements.push(
                        'Optimize workspace layout and tool access'
                    );
                    break;
            }
        });

        return improvements;
    }
}
```

```go
// Lean process improvement tracking
package lean

import "time"

type ProcessStep struct {
	Name           string
	ProcessTime    time.Duration
	WaitTime       time.Duration
	ValueAdded     bool
	QualityMetrics map[string]float64
}

type ProcessImprovement struct {
	Step        string
	Original    time.Duration
	Improved    time.Duration
	Percentage  float64
}

type LeanProcess struct {
	Name             string
	Steps            []ProcessStep
	Improvements     []ProcessImprovement
	TotalLeadTime    time.Duration
	TotalProcessTime time.Duration
}

func NewLeanProcess(name string) *LeanProcess {
	return &LeanProcess{
		Name:         name,
		Steps:        []ProcessStep{},
		Improvements: []ProcessImprovement{},
	}
}

func (lp *LeanProcess) AddStep(step ProcessStep) {
	lp.Steps = append(lp.Steps, step)
	lp.recalculateTimes()
}

func (lp *LeanProcess) recalculateTimes() {
	var totalLead, totalProcess time.Duration
	for _, step := range lp.Steps {
		totalLead += step.ProcessTime + step.WaitTime
		if step.ValueAdded {
			totalProcess += step.ProcessTime
		}
	}
	lp.TotalLeadTime = totalLead
	lp.TotalProcessTime = totalProcess
}

func (lp *LeanProcess) CalculateOEE() float64 {
	availability := 1.0
	performance := float64(lp.TotalProcessTime) / float64(lp.TotalLeadTime)
	quality := lp.calculateQualityRate()

	return availability * performance * quality
}

func (lp *LeanProcess) calculateQualityRate() float64 {
	var totalDefects float64
	var totalItems float64

	for _, step := range lp.Steps {
		for _, metric := range step.QualityMetrics {
			if metric < 1.0 {
				totalDefects += (1.0 - metric)
			}
			totalItems++
		}
	}

	if totalItems == 0 {
		return 1.0
	}
	return 1.0 - (totalDefects / totalItems)
}
```

```python
# Lean continuous improvement cycle (PDCA)
class PDCA:
    def __init__(self):
        self.cycle_count = 0
        self.improvements = []

    def plan(self, problem, root_cause, solution):
        plan = {
            "phase": "plan",
            "problem": problem,
            "root_cause": root_cause,
            "solution": solution,
            "metrics": {},
            "expected_outcome": None
        }
        return plan

    def do_(self, plan, trial_run=True):
        result = {
            "phase": "do",
            "plan": plan,
            "trial_run": trial_run,
            "actual_results": None,
            "deviations": []
        }
        return result

    def check(self, do_result, expected_outcome):
        actual = do_result["actual_results"]
        comparison = {
            "phase": "check",
            "expected": expected_outcome,
            "actual": actual,
            "variance": None,
            "success": actual == expected_outcome if actual and expected_outcome else None
        }
        if actual and expected_outcome:
            comparison["variance"] = abs(actual - expected_outcome) / expected_outcome * 100
        return comparison

    def act(self, check_result, standardize=True):
        action = {
            "phase": "act",
            "check_result": check_result,
            "standardize": standardize,
            "changes_to_process": [],
            "lessons_learned": ""
        }
        if check_result["success"]:
            if standardize:
                action["changes_to_process"] = ["Update standard procedures"]
        return action

    def run_cycle(self, problem, root_cause, solution, expected_outcome):
        self.cycle_count += 1
        plan = self.plan(problem, root_cause, solution)
        do = self.do_(plan)
        check = self.check(do, expected_outcome)
        act = self.act(check)
        self.improvements.append(act)
        return act
```

```typescript
// Lean A3 problem solving
interface A3Report {
    problem: string;
    background: string;
    currentState: string;
    targetState: string;
    rootCause: string;
    countermeasures: Countermeasure[];
    actionPlan: ActionItem[];
    results: Result[];
}

interface Countermeasure {
    id: string;
    description: string;
    owner: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
}

interface ActionItem {
    what: string;
    who: string;
    when: Date;
    where: string;
    how: string;
}

interface Result {
    metric: string;
    baseline: number;
    target: number;
    actual: number;
    status: 'achieved' | 'partial' | 'missed';
}

class A3ProblemSolving {
    report: A3Report;

    constructor() {
        this.report = {
            problem: '',
            background: '',
            currentState: '',
            targetState: '',
            rootCause: '',
            countermeasures: [],
            actionPlan: [],
            results: []
        };
    }

    defineProblem(problem: string): void {
        this.report.problem = problem;
    }

    analyzeRootCause(method: '5_why' | 'fishbone'): string {
        const rootCause = method === '5_why'
            ? this.run5Whys()
            : this.runFishbone();
        this.report.rootCause = rootCause;
        return rootCause;
    }

    private run5Whys(): string {
        return 'Root cause identified through 5 levels of why questioning';
    }

    private runFishbone(): string {
        return 'Root cause identified through fishbone diagram analysis';
    }

    addCountermeasure(description: string, owner: string, dueDate: Date): void {
        this.report.countermeasures.push({
            id: `CM-${Date.now()}`,
            description,
            owner,
            dueDate,
            status: 'pending'
        });
    }

    trackResults(): { achieved: number; total: number } {
        const achieved = this.report.results
            .filter(r => r.status === 'achieved').length;
        return {
            achieved,
            total: this.report.results.length
        };
    }
}
```

## Best Practices

- Start by clearly defining value from the customer's perspective before analyzing your current process
- Map your entire value stream to identify all activities, distinguishing value-added from non-value-added
- Implement pull-based systems where work is started based on actual demand rather than forecasts
- Focus improvement efforts on constraints that limit overall throughput using theory of constraints
- Use andon signals to make problems visible immediately when they occur
- Establish standardized work as a foundation for continuous improvement
- Gemba walks help leaders understand actual conditions by observing work where it happens
- Develop people and respect their contributions as the foundation of all improvement
- Measure outcomes rather than activities to ensure you're improving what matters
- Create a culture where problems are seen as opportunities for improvement, not failures
