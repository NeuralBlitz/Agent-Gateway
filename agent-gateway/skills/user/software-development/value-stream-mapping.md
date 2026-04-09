---
name: value-stream-mapping
description: Lean technique for analyzing and designing the flow of materials and information
category: software-development
---

# Value Stream Mapping

## What I Do

I am a lean technique for analyzing and designing the flow of materials and information required to bring a product or service to a customer. I help teams visualize all steps in a process, distinguish value-adding from non-value-adding activities, and identify opportunities for improvement. By mapping the entire value stream from request to delivery, I enable organizations to eliminate waste and optimize value delivery.

## When to Use Me

Use me when you want to understand and improve complex workflows involving multiple teams or systems. I am ideal for identifying bottlenecks, reducing lead times, and eliminating waste in software delivery processes. I work well for organizations implementing DevOps, Lean, or Agile transformations who need data-driven insights for improvement. Use me when onboarding new processes, optimizing existing ones, or when handoffs between teams cause delays.

## Core Concepts

- **Value Stream**: All activities (value-adding and non-value-adding) required to deliver work
- **Value-Adding Activities**: Steps that directly contribute to meeting customer needs
- **Non-Value-Adding Activities**: Waste that should be eliminated or minimized
- **Lead Time**: Total time from request to delivery
- **Process Time**: Actual working time spent on value-adding activities
- **Cycle Time**: Time to complete one unit of work
- **Takt Time**: Rate at which products must be completed to meet customer demand
- **Information Flow**: How data and decisions move through the process
- **Kaizen Events**: Focused improvement activities resulting from mapping
- **Future State**: Optimized version of the value stream after improvements

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum

class ActivityType(Enum):
    VALUE_ADDING = "value_adding"
    BUSINESS_RULE = "business_rule"
    NON_VALUE_ADDING = "non_value_adding"
    WAIT = "wait"

@dataclass
class ValueStreamActivity:
    """Represents an activity in the value stream"""
    id: str
    name: str
    activity_type: ActivityType
    process_time_minutes: float = 0
    wait_time_minutes: float = 0
    owner: str = ""
    system: str = ""
    inputs: List[str] = field(default_factory=list)
    outputs: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    @property
    def lead_time_contribution(self) -> float:
        return self.process_time_minutes + self.wait_time_minutes

    @property
    def efficiency(self) -> float:
        if self.lead_time_contribution == 0:
            return 0
        return (self.process_time_minutes / self.lead_time_contribution) * 100

@dataclass
class ValueStream:
    """Represents a complete value stream with activities and flow"""
    id: str
    name: str
    customer: str
    product_or_service: str
    activities: List[ValueStreamActivity] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def total_lead_time(self) -> float:
        return sum(a.lead_time_contribution for a in self.activities)

    @property
    def total_process_time(self) -> float:
        return sum(a.process_time_minutes for a in self.activities)

    @property
    def efficiency(self) -> float:
        if self.total_lead_time == 0:
            return 0
        return (self.total_process_time / self.total_lead_time) * 100

    @property
    def value_adding_activities(self) -> List[ValueStreamActivity]:
        return [a for a in self.activities if a.activity_type == ActivityType.VALUE_ADDING]

    @property
    def waste_activities(self) -> List[ValueStreamActivity]:
        return [a for a in self.activities if a.activity_type in [
            ActivityType.NON_VALUE_ADDING, ActivityType.WAIT
        ]]

    def add_activity(self, activity: ValueStreamActivity) -> None:
        self.activities.append(activity)

    def calculate_cycle_time(self) -> float:
        if not self.activities:
            return 0
        return sum(a.process_time_minutes for a in self.activities)

    def generate_waste_summary(self) -> Dict[str, float]:
        summary = {}
        for activity in self.activities:
            if activity.activity_type in [ActivityType.NON_VALUE_ADDING, ActivityType.WAIT]:
                summary[activity.name] = summary.get(activity.name, 0) + activity.lead_time_contribution
        return summary

    def identify_bottlenecks(self) -> List[ValueStreamActivity]:
        max_wait = max((a.wait_time_minutes for a in self.activities), default=0)
        return [a for a in self.activities if a.wait_time_minutes == max_wait and max_wait > 0]

    def create_future_state(self) -> "ValueStream":
        future = ValueStream(
            id=f"{self.id}_future",
            name=f"{self.name} (Future State)",
            customer=self.customer,
            product_or_service=self.product_or_service
        )

        for activity in self.activities:
            if activity.activity_type == ActivityType.WAIT:
                future.add_activity(ValueStreamActivity(
                    id=f"{activity.id}_improved",
                    name=activity.name,
                    activity_type=ActivityType.NON_VALUE_ADDING,
                    process_time_minutes=activity.process_time_minutes,
                    wait_time_minutes=activity.wait_time_minutes * 0.5,
                    owner=activity.owner,
                    system=activity.system
                ))
            else:
                future.add_activity(ValueStreamActivity(
                    id=f"{activity.id}_improved",
                    name=activity.name,
                    activity_type=activity.activity_type,
                    process_time_minutes=activity.process_time_minutes * 0.8,
                    wait_time_minutes=activity.wait_time_minutes,
                    owner=activity.owner,
                    system=activity.system
                ))

        return future

    def calculate_improvement_metrics(self, future_state: "ValueStream") -> Dict:
        current_lead_time = self.total_lead_time
        future_lead_time = future_state.total_lead_time
        improvement = ((current_lead_time - future_lead_time) / current_lead_time) * 100 if current_lead_time > 0 else 0

        return {
            "current_lead_time_days": current_lead_time / (60 * 24),
            "future_lead_time_days": future_lead_time / (60 * 24),
            "lead_time_reduction_percent": improvement,
            "current_efficiency": self.efficiency,
            "future_efficiency": future_state.efficiency,
            "activities_eliminated": len(self.activities) - len(future_state.activities)
        }
```

```python
class ValueStreamMappingSession:
    """Facilitates value stream mapping workshops"""
    def __init__(self):
        self.participants: List[str] = []
        self.current_stream: Optional[ValueStream] = None
        self.future_stream: Optional[ValueStream] = None
        self.findings: List[Dict] = []
        self.action_items: List[Dict] = []

    def add_participant(self, role: str, name: str) -> None:
        self.participants.append({"role": role, "name": name})

    def start_mapping(self, stream_id: str, stream_name: str, customer: str, product: str) -> None:
        self.current_stream = ValueStream(
            id=stream_id,
            name=stream_name,
            customer=customer,
            product_or_service=product
        )

    def add_mapping_activity(
        self,
        name: str,
        activity_type: str,
        process_time: float,
        wait_time: float,
        owner: str,
        system: str
    ) -> None:
        if self.current_stream:
            self.current_stream.add_activity(ValueStreamActivity(
                id=f"act_{len(self.current_stream.activities) + 1}",
                name=name,
                activity_type=ActivityType(activity_type),
                process_time_minutes=process_time,
                wait_time_minutes=wait_time,
                owner=owner,
                system=system
            ))

    def identify_waste(self) -> List[str]:
        if not self.current_stream:
            return []

        waste_types = {
            "Waiting": [],
            "Motion": [],
            "Transportation": [],
            "Overprocessing": [],
            "Overproduction": [],
            "Defects": [],
            "Inventory": [],
            "Skills Underutilization": []
        }

        for activity in self.current_stream.activities:
            if activity.activity_type == ActivityType.WAIT:
                waste_types["Waiting"].append(activity.name)
            elif activity.wait_time_minutes > activity.process_time_minutes * 2:
                waste_types["Overprocessing"].append(activity.name)

        return [wt for wt, items in waste_types.items() if items]

    def calculate_flow_efficiency(self) -> Dict:
        if not self.current_stream:
            return {}

        flow_time = self.current_stream.total_lead_time
        process_time = self.current_stream.total_process_time

        return {
            "flow_efficiency_percent": (process_time / flow_time * 100) if flow_time > 0 else 0,
            "process_time_percent": (process_time / flow_time * 100) if flow_time > 0 else 0,
            "wait_time_percent": ((flow_time - process_time) / flow_time * 100) if flow_time > 0 else 0
        }

    def generate_improvement_plan(self) -> List[Dict]:
        if not self.current_stream:
            return []

        improvements = []

        for activity in self.current_stream.activities:
            if activity.activity_type == ActivityType.WAIT:
                improvements.append({
                    "type": "reduce_wait",
                    "activity": activity.name,
                    "current_wait": activity.wait_time_minutes,
                    "target_wait": activity.wait_time_minutes * 0.5,
                    "approach": "Implement queuing system or automation"
                })
            elif activity.activity_type == ActivityType.NON_VALUE_ADDING:
                if "review" in activity.name.lower():
                    improvements.append({
                        "type": "eliminate",
                        "activity": activity.name,
                        "approach": "Consider pre-approved patterns or automate review"
                    })
                else:
                    improvements.append({
                        "type": "automate",
                        "activity": activity.name,
                        "approach": "Implement automation or self-service"
                    })

        return improvements

    def create_future_state(self) -> ValueStream:
        if not self.current_stream:
            return None

        future = self.current_stream.create_future_state()
        self.future_stream = future
        return future

    def document_findings(self, finding: str, impact: str, effort: str) -> None:
        self.findings.append({
            "finding": finding,
            "impact": impact,
            "effort": effort,
            "timestamp": datetime.now()
        })

    def assign_action_item(self, description: str, owner: str, due_date: datetime) -> None:
        self.action_items.append({
            "description": description,
            "owner": owner,
            "due_date": due_date,
            "status": "pending",
            "created_at": datetime.now()
        })

    def generate_report(self) -> Dict:
        return {
            "stream": self.current_stream.name if self.current_stream else None,
            "participants": self.participants,
            "current_metrics": {
                "total_activities": len(self.current_stream.activities) if self.current_stream else 0,
                "total_lead_time_days": self.current_stream.total_lead_time / (60 * 24) if self.current_stream else 0,
                "efficiency_percent": self.current_stream.efficiency if self.current_stream else 0
            },
            "future_metrics": {
                "total_activities": len(self.future_stream.activities) if self.future_stream else 0,
                "total_lead_time_days": self.future_stream.total_lead_time / (60 * 24) if self.future_stream else 0,
                "efficiency_percent": self.future_stream.efficiency if self.future_stream else 0
            },
            "improvement_metrics": self.current_stream.calculate_improvement_metrics(self.future_stream) if self.future_stream and self.current_stream else {},
            "findings": self.findings,
            "action_items": self.action_items
        }
```

```python
from typing import List, Dict
from datetime import datetime

class LeadTimeAnalyzer:
    """Analyzes and optimizes lead time through value stream data"""
    def __init__(self):
        self.data_points: List[Dict] = []

    def record_completion(self, item_id: str, start_time: datetime, end_time: datetime) -> None:
        self.data_points.append({
            "item_id": item_id,
            "start_time": start_time,
            "end_time": end_time,
            "lead_time_hours": (end_time - start_time).total_seconds() / 3600
        })

    def calculate_lead_time_metrics(self, days: int = 30) -> Dict:
        cutoff = datetime.now() - timedelta(days=days)
        recent = [d for d in self.data_points if d["end_time"] >= cutoff]

        if not recent:
            return {"error": "No data available"}

        lead_times = [d["lead_time_hours"] for d in recent]

        return {
            "count": len(recent),
            "average_lead_time_hours": sum(lead_times) / len(lead_times),
            "min_lead_time_hours": min(lead_times),
            "max_lead_time_hours": max(lead_times),
            "median_lead_time_hours": sorted(lead_times)[len(lead_times) // 2],
            "p90_lead_time_hours": sorted(lead_times)[int(len(lead_times) * 0.9)]
        }

    def identify_lead_time_trends(self) -> Dict:
        if len(self.data_points) < 2:
            return {"error": "Insufficient data for trend analysis"}

        sorted_data = sorted(self.data_points, key=lambda d: d["end_time"])

        recent_lead_times = [d["lead_time_hours"] for d in sorted_data[-7:]]
        older_lead_times = [d["lead_time_hours"] for d in sorted_data[-14:-7]]

        recent_avg = sum(recent_lead_times) / len(recent_lead_times)
        older_avg = sum(older_lead_times) / len(older_lead_times) if older_lead_times else recent_avg

        change = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0

        return {
            "trend": "increasing" if change > 5 else "decreasing" if change < -5 else "stable",
            "change_percent": change,
            "recent_avg_hours": recent_avg,
            "older_avg_hours": older_avg
        }

    def predict_lead_time(self) -> Dict:
        metrics = self.calculate_lead_time_metrics(30)
        trends = self.identify_lead_time_trends()

        return {
            "predicted_lead_time_hours": metrics.get("average_lead_time_hours", 0),
            "confidence": "high" if len(self.data_points) > 20 else "medium" if len(self.data_points) > 10 else "low",
            "trend": trends.get("trend", "stable")
        }
```

```python
class KanbanValueStreamIntegration:
    """Integrates value stream mapping with Kanban metrics"""
    def __init__(self):
        self.kanban_data = {}
        self.value_stream_data = {}

    def correlate_metrics(self) -> Dict:
        throughput = self.kanban_data.get("throughput_per_week", 0)
        lead_time = self.value_stream_data.get("average_lead_time_days", 0)
        cycle_time = self.kanban_data.get("average_cycle_time_hours", 0) / 24

        return {
            "throughput": throughput,
            "lead_time": lead_time,
            "cycle_time": cycle_time,
            "littles_law_valid": self._validate_littles_law(throughput, lead_time, cycle_time),
            "optimization_priority": self._calculate_optimization_priority()
        }

    def _validate_littles_law(self, throughput: float, lead_time: float, cycle_time: float) -> bool:
        wip = throughput * lead_time if lead_time > 0 and throughput > 0 else 0
        return abs(wip - cycle_time) / max(wip, cycle_time) < 0.1 if wip > 0 else True

    def _calculate_optimization_priority(self) -> List[Dict]:
        priorities = []

        for activity in self.value_stream_data.get("activities", []):
            if activity.get("wait_time", 0) > activity.get("process_time", 0) * 2:
                priorities.append({
                    "activity": activity["name"],
                    "priority": "high",
                    "recommendation": "Reduce wait time through queuing optimization"
                })
            elif activity.get("activity_type") == "non_value_adding":
                priorities.append({
                    "activity": activity["name"],
                    "priority": "medium",
                    "recommendation": "Evaluate for elimination or automation"
                })

        return sorted(priorities, key=lambda p: 0 if p["priority"] == "high" else 1)
```

## Best Practices

- Map the current state before designing the future state to ground improvements in reality
- Include all stakeholders who touch the value stream for comprehensive understanding
- Distinguish clearly between value-adding, business rule, and waste activities
- Measure actual times rather than estimates for accurate analysis
- Use data to identify bottlenecks rather than relying on opinions
- Focus on reducing lead time and wait time, not just process time
- Create specific, measurable future state with clear improvement targets
- Implement improvements incrementally rather than all at once
- Track progress against future state targets continuously
- Make value stream mapping a regular practice, not a one-time event

## Common Patterns

- **Software Delivery Value Stream**: From request to deployed feature
- **Incident Response Value Stream**: From alert to resolution
- **Onboarding Value Stream**: From hire to productivity
- **Change Management Value Stream**: From request to implementation
- **Customer Support Value Stream**: From ticket to resolution
- **Deployment Value Stream**: From commit to production
