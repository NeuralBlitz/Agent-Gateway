---
name: six-sigma
description: Data-driven methodology for eliminating defects and improving process quality
category: software-development
---

# Six Sigma

## What I Do

I am a disciplined, data-driven methodology for eliminating defects and improving the quality of software development processes. I use statistical methods to identify and remove the causes of errors and minimize variation in outputs. I help organizations achieve predictable processes and measurable quality improvements through a structured improvement framework with defined roles and rigorous project execution.

## When to Use Me

Use me when you have recurring quality issues that need systematic elimination. I work well for processes with measurable outputs where defects can be counted and categorized. I am ideal for organizations committed to quality excellence and willing to invest in training and structured problem-solving. If you need to reduce defects, lower costs, and improve customer satisfaction through data-driven decisions, I can guide your improvement efforts.

## Core Concepts

- **DMAIC**: Define, Measure, Analyze, Improve, Control improvement cycle
- **DPMO**: Defects Per Million Opportunities measurement standard
- **Sigma Level**: Statistical measure of process capability (6 sigma = 3.4 DPMO)
- **Process Capability**: Measure of how well a process meets specifications
- **Variation**: Difference in outputs that needs to be minimized
- **Control Charts**: Statistical tools for monitoring process stability
- **Root Cause Analysis**: Systematic identification of true causes
- **Process Maps**: Visual representation of process steps and flows
- **Statistical Process Control**: Methods for monitoring and controlling quality
- **Voice of Customer**: Customer requirements translated into measurable criteria

## Code Examples

```python
# Six Sigma process capability analysis
import numpy as np
from scipy import stats

class ProcessCapability:
    def __init__(self, data, lower_spec_limit, upper_spec_limit):
        self.data = np.array(data)
        self.lsl = lower_spec_limit
        self.usl = upper_spec_limit
        self.mean = np.mean(data)
        self.std = np.std(data, ddof=1)

    def calculate_cp(self):
        """Process Capability Index - measures potential capability"""
        return (self.usl - self.lsl) / (6 * self.std)

    def calculate_cpk(self):
        """Process Capability Index - measures actual capability"""
        cpu = (self.usl - self.mean) / (3 * self.std)
        cpl = (self.mean - self.lsl) / (3 * self.std)
        return min(cpu, cpl)

    def calculate_dpmo(self):
        """Defects Per Million Opportunities"""
        defects = sum(1 for x in self.data if x < self.lsl or x > self.usl)
        return (defects / len(self.data)) * 1_000_000

    def calculate_sigma_level(self):
        """Calculate sigma level from DPMO"""
        dpmo = self.calculate_dpmo()
        yield_percentage = 1 - (dpmo / 1_000_000)
        z_score = stats.norm.ppf(yield_percentage + 0.001375)
        return z_score + 1.5

    def is_capable(self, target_cpk=1.33):
        """Check if process meets capability target"""
        return self.calculate_cpk() >= target_cpk

    def generate_control_limits(self):
        """Generate 3-sigma control limits"""
        ucl = self.mean + 3 * self.std
        lcl = self.mean - 3 * self.std
        return {"ucl": ucl, "cl": self.mean, "lcl": lcl}
```

```typescript
// Six Sigma DMAIC framework implementation
interface Metric {
    name: string;
    baseline: number;
    target: number;
    current: number;
    units: string;
}

interface RootCause {
    factor: string;
    contribution: number;
    verified: boolean;
}

class DMAIC {
    private phase: 'define' | 'measure' | 'analyze' | 'improve' | 'control' = 'define';
    private metrics: Map<string, Metric> = new Map();
    private rootCauses: RootCause[] = [];

    define(problemStatement: string, scope: string, goals: string[]): void {
        console.log(`Define: ${problemStatement}`);
        this.phase = 'define';
    }

    measure(processData: number[], voiceOfCustomer: Map<string, number>): void {
        this.phase = 'measure';
        const data = {
            mean: processData.reduce((a, b) => a + b) / processData.length,
            std: Math.sqrt(
                processData.reduce((sum, val) =>
                    sum + Math.pow(val - this.mean(processData), 2), 0
                ) / processData.length
            ),
            dpmo: this.calculateDPMO(processData)
        };
        console.log(`Measure: ${JSON.stringify(data)}`);
    }

    private mean(data: number[]): number {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }

    private calculateDPMO(data: number[]): number {
        const defects = data.filter(d => d < 0 || d > 10).length;
        return (defects / data.length) * 1_000_000;
    }

    analyze(hypothesis: string): RootCause[] {
        this.phase = 'analyze';
        console.log(`Analyze: Testing hypothesis - ${hypothesis}`);
        return this.rootCauses;
    }

    improve(solution: string, pilotData: number[]): boolean {
        this.phase = 'improve';
        const improvement = this.calculateImprovement(pilotData);
        console.log(`Improve: ${solution}, Improvement: ${improvement}%`);
        return improvement > 20;
    }

    private calculateImprovement(data: number[]): number {
        return Math.random() * 100;
    }

    control(monitoringPlan: string): void {
        this.phase = 'control';
        console.log(`Control: Implementing ${monitoringPlan}`);
    }
}
```

```go
// Six Sigma statistical tools
package sixsigma

import (
	"math"
	"sort"
)

type StatisticalData struct {
	Values    []float64
	Mean       float64
	StdDev     float64
	Median     float64
	Range      float64
}

func NewStatisticalData(values []float64) *StatisticalData {
	sort.Float64s(values)
	mean := calculateMean(values)
	stdDev := calculateStdDev(values, mean)

	return &StatisticalData{
		Values:  values,
		Mean:    mean,
		StdDev:  stdDev,
		Median:  calculateMedian(values),
		Range:   values[len(values)-1] - values[0],
	}
}

func calculateMean(values []float64) float64 {
	var sum float64
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func calculateStdDev(values []float64, mean float64) float64 {
	var sumSquares float64
	for _, v := range values {
		sumSquares += math.Pow(v-mean, 2)
	}
	return math.Sqrt(sumSquares / float64(len(values)-1))
}

func calculateMedian(values []float64) float64 {
	mid := len(values) / 2
	if len(values)%2 == 0 {
		return (values[mid-1] + values[mid]) / 2
	}
	return values[mid]
}

func (sd StatisticalData) CalculateCp(usl, lsl float64) float64 {
	return (usl - lsl) / (6 * sd.StdDev)
}

func (sd StatisticalData) CalculateCpk(usl, lsl, target float64) float64 {
	cpu := (usl - sd.Mean) / (3 * sd.StdDev)
	cpl := (sd.Mean - lsl) / (3 * sd.StdDev)
	cpuTarget := (target - sd.Mean) / (3 * sd.StdDev)

	if cpuTarget > 0 {
		return math.Min(cpu, cpuTarget)
	}
	return math.Min(cpu, cpl)
}

func (sd StatisticalData) CalculateDPMO(opportunities, defects int) float64 {
	return float64(defects) / float64(opportunities) * 1_000_000
}

func (sd StatisticalData) NormalityTest() bool {
	n := float64(len(sd.Values))
	if n < 30 {
		return false
	}
	skewness := calculateSkewness(sd.Values, sd.Mean, sd.StdDev)
	kurtosis := calculateKurtosis(sd.Values, sd.Mean, sd.StdDev)

	return math.Abs(skewness) < 0.5 && math.Abs(kurtosis) < 0.5
}

func calculateSkewness(values []float64, mean, stdDev float64) float64 {
	var sum float64
	for _, v := range values {
		sum += math.Pow((v-mean)/stdDev, 3)
	}
	return sum / float64(len(values))
}

func calculateKurtosis(values []float64, mean, stdDev float64) float64 {
	var sum float64
	for _, v := range values {
		sum += math.Pow((v-mean)/stdDev, 4)
	}
	return sum / float64(len(values)) - 3
}
```

```python
# Six Sigma control chart implementation
import matplotlib.pyplot as plt
from typing import List, Tuple

class ControlChart:
    def __init__(self, data: List[float], chart_type="xbar"):
        self.data = data
        self.chart_type = chart_type
        self.mean = sum(data) / len(data)
        self.control_limits = self._calculate_limits()

    def _calculate_limits(self) -> Tuple[float, float, float]:
        moving_ranges = [
            abs(data[i] - data[i-1])
            for i in range(1, len(self.data))
        ]
        avg_moving_range = sum(moving_ranges) / len(moving_ranges)
        ucl = self.mean + 3 * (avg_moving_range / 1.128)
        lcl = self.mean - 3 * (avg_moving_range / 1.128)
        return (ucl, self.mean, lcl)

    def check_out_of_control(self) -> List[int]:
        out_of_control = []
        ucl, cl, lcl = self.control_limits
        for i, point in enumerate(self.data):
            if point > ucl or point < lcl:
                out_of_control.append(i)
        return out_of_control

    def check_runs(self) -> bool:
        """Check for unnatural patterns or runs"""
        n = len(self.data)
        if n < 8:
            return False

        increasing = 0
        decreasing = 0
        for i in range(1, n):
            if self.data[i] > self.data[i-1]:
                increasing += 1
            elif self.data[i] < self.data[i-1]:
                decreasing += 1

        return increasing > 6 or decreasing > 6

    def western_electric_rules(self) -> List[str]:
        """Apply Western Electric rules for control chart interpretation"""
        violations = []
        ucl, cl, lcl = self.control_limits
        sigma = (ucl - cl) / 3

        for i, point in enumerate(self.data):
            if point > ucl or point < lcl:
                violations.append(f"Point {i} beyond control limits")

            if i >= 4:
                if all(p > cl + 2 * sigma for p in self.data[i-4:i+1]):
                    violations.append(f"Rule 2 violation at point {i}")

                if all(p < cl - 2 * sigma for p in self.data[i-4:i+1]):
                    violations.append(f"Rule 3 violation at point {i}")

        return violations

    def plot(self):
        """Generate control chart visualization"""
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(range(len(self.data)), self.data, 'b-', marker='o')
        ucl, cl, lcl = self.control_limits
        ax.axhline(y=ucl, color='r', linestyle='--', label='UCL')
        ax.axhline(y=cl, color='g', linestyle='-', label='CL')
        ax.axhline(y=lcl, color='r', linestyle='--', label='LCL')
        ax.set_title(f'{self.chart_type.upper()} Control Chart')
        ax.set_xlabel('Sample Number')
        ax.set_ylabel('Value')
        ax.legend()
        return fig
```

```typescript
// Six Sigma fishbone diagram for root cause analysis
interface CauseCategory {
    name: string;
    causes: string[];
}

interface FishboneEntry {
    effect: string;
    categories: CauseCategory[];
}

class FishboneDiagram {
    private diagram: FishboneEntry;

    constructor(effect: string) {
        this.diagram = {
            effect,
            categories: [
                { name: 'People', causes: [] },
                { name: 'Process', causes: [] },
                { name: 'Equipment', causes: [] },
                { name: 'Materials', causes: [] },
                { name: 'Environment', causes: [] },
                { name: 'Management', causes: [] }
            ]
        };
    }

    addCause(categoryName: string, cause: string): void {
        const category = this.diagram.categories
            .find(c => c.name === categoryName);
        if (category) {
            category.causes.push(cause);
        }
    }

    prioritizeCauses(): { cause: string; frequency: number }[] {
        const allCauses: { cause: string; frequency: number }[] = [];

        this.diagram.categories.forEach(cat => {
            cat.causes.forEach(cause => {
                const existing = allCauses.find(c => c.cause === cause);
                if (existing) {
                    existing.frequency++;
                } else {
                    allCauses.push({ cause, frequency: 1 });
                }
            });
        });

        return allCauses.sort((a, b) => b.frequency - a.frequency);
    }

    generate5Whys(cause: string): string[] {
        const whys = [cause];
        const rootCauses: Record<string, string[]> = {
            'Inadequate training': [
                'Training program not standardized',
                'No competency assessments',
                'No refresher courses'
            ],
            'Process variation': [
                'Procedures not followed',
                'Measurements inconsistent',
                'Equipment calibration issues'
            ]
        };

        if (rootCauses[cause]) {
            return [...whys, ...rootCauses[cause]];
        }

        return ['Root cause analysis needed'];
    }
}
```

## Best Practices

- Always start with a clear project charter defining scope, goals, and business case before analysis
- Use statistical tools appropriately and ensure data quality before drawing conclusions
- Validate measurement systems using gage R&R before collecting process data
- Focus on vital few causes rather than trying to address all issues simultaneously
- Implement control plans to sustain improvements after project completion
- Use pilot tests to validate improvements before full-scale implementation
- Develop process owners and build capability within the organization for sustained results
- Balance statistical significance with practical significance when evaluating improvements
- Create dashboards to monitor key metrics and trigger responses when special causes occur
- Build a culture of data-driven decision making rather than relying on opinions or assumptions
