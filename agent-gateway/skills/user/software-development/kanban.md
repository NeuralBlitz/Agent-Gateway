---
name: Kanban
description: Visual workflow management method for optimizing value delivery through continuous flow
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Teams
audience: Software Developers, Team Leads, Operations Engineers
category: software-development
---

# Kanban

## What I Do

I provide guidance on implementing Kanban, a visual workflow management system that originated from Toyota's manufacturing processes. Kanban helps teams visualize work, limit work-in-progress (WIP), and maximize efficiency through continuous delivery. Unlike Scrum's time-boxed iterations, Kanban focuses on continuous flow where items move through defined states as capacity allows. I cover board design, WIP limits, metrics, and optimization strategies that enable teams to deliver value steadily without the overhead of fixed sprint boundaries.

## When to Use Me

Use Kanban when you need continuous delivery capabilities, have unpredictable work arrivals, or work in operations/support environments where tickets arrive continuously. Kanban excels for maintenance teams, DevOps pipelines, customer support integration, and any workflow where items should be completed as soon as possible rather than batching. It's ideal for teams that prefer flexibility over fixed iteration cadences and want to optimize flow efficiency. Avoid Kanban if your team needs the structure of time-boxed iterations or if regulatory requirements mandate fixed release cycles.

## Core Concepts

- **Kanban Board**: Visual representation of work states as columns with cards representing work items
- **Work-in-Progress (WIP) Limits**: Caps on items per column to prevent overloading and bottlenecks
- **Work Item Types**: Different card types for features, bugs, tech debt, and emergencies
- **Cycle Time**: Duration from work start to completion, measuring actual throughput efficiency
- **Lead Time**: Duration from request creation to delivery, including queue time
- **Throughput**: Number of items completed per unit time, the primary Kanban metric
- **Cumulative Flow Diagram**: Visual representation of work distribution across states over time
- **Classes of Service**: Different handling priorities for standard, expedited, and fixed-date work
- **Swimlanes**: Horizontal lanes for categorizing work by type, priority, or team ownership
- **Pull System**: Work is pulled into columns only when capacity is available, never pushed

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
from collections import defaultdict

class WorkItemType(Enum):
    FEATURE = "feature"
    BUG = "bug"
    TECH_DEBT = "tech_debt"
    EMERGENCY = "emergency"

class WorkItemStatus(Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    TESTING = "testing"
    DONE = "done"

@dataclass
class WorkItem:
    """Represents a Kanban work item with tracking metadata"""
    id: str
    title: str
    item_type: WorkItemType
    status: WorkItemStatus = WorkItemStatus.BACKLOG
    priority: int = 5
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assignee: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)

    @property
    def cycle_time_hours(self) -> Optional[float]:
        """Calculate cycle time if item is completed"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return delta.total_seconds() / 3600
        return None

    @property
    def lead_time_hours(self) -> Optional[float]:
        """Calculate lead time if item is completed"""
        if self.created_at and self.completed_at:
            delta = self.completed_at - self.created_at
            return delta.total_seconds() / 3600
        return None

    def start_work(self) -> None:
        """Mark work as started"""
        if self.status == WorkItemStatus.BACKLOG:
            self.status = WorkItemStatus.IN_PROGRESS
            self.started_at = datetime.now()

    def complete_work(self) -> None:
        """Mark work as completed"""
        if self.status == WorkItemStatus.IN_PROGRESS:
            self.status = WorkItemStatus.DONE
            self.completed_at = datetime.now()

class KanbanColumn:
    """Represents a column on the Kanban board with WIP limits"""
    def __init__(self, name: str, wip_limit: Optional[int] = None):
        self.name = name
        self.wip_limit = wip_limit
        self.items: List[WorkItem] = []

    @property
    def is_at_limit(self) -> bool:
        """Check if column has reached WIP limit"""
        return self.wip_limit is not None and len(self.items) >= self.wip_limit

    @property
    def utilization_percent(self) -> float:
        """Calculate column utilization"""
        if self.wip_limit is None:
            return 100.0
        return (len(self.items) / self.wip_limit) * 100

    def add_item(self, item: WorkItem) -> bool:
        """Add item to column, respecting WIP limit"""
        if self.is_at_limit:
            return False
        self.items.append(item)
        return True

    def remove_item(self, item_id: str) -> Optional[WorkItem]:
        """Remove item from column"""
        for i, item in enumerate(self.items):
            if item.id == item.id:
                return self.items.pop(i)
        return None

class KanbanBoard:
    """Manages a complete Kanban board with columns and workflow rules"""
    def __init__(self, name: str):
        self.name = name
        self.columns: Dict[WorkItemStatus, KanbanColumn] = {}
        self.items: Dict[str, WorkItem] = {}
        self.history: List[dict] = []

        default_wip_limits = {
            WorkItemStatus.BACKLOG: None,
            WorkItemStatus.IN_PROGRESS: 5,
            WorkItemStatus.REVIEW: 3,
            WorkItemStatus.TESTING: 3,
            WorkItemStatus.DONE: None
        }

        for status, limit in default_wip_limits.items():
            self.columns[status] = KanbanColumn(status.value, limit)

    def add_item(self, item: WorkItem) -> bool:
        """Add new item to backlog"""
        if item.id in self.items:
            return False
        self.items[item.id] = item
        self._log_action("add", item.id, None, WorkItemStatus.BACKLOG)
        return self.columns[WorkItemStatus.BACKLOG].add_item(item)

    def move_item(self, item_id: str, new_status: WorkItemStatus) -> bool:
        """Move item to new status column"""
        if item_id not in self.items:
            return False

        item = self.items[item_id]
        old_status = item.status

        source_column = self.columns[old_status]
        target_column = self.columns[new_status]

        if target_column.is_at_limit:
            return False

        source_column.remove_item(item_id)
        item.status = new_status
        target_column.add_item(item)

        if new_status == WorkItemStatus.IN_PROGRESS:
            item.start_work()
        elif new_status == WorkItemStatus.DONE:
            item.complete_work()

        self._log_action("move", item_id, old_status, new_status)
        return True

    def _log_action(self, action: str, item_id: str, old_status: Optional[WorkItemStatus], new_status: WorkItemStatus) -> None:
        """Log board actions for analytics"""
        self.history.append({
            "timestamp": datetime.now(),
            "action": action,
            "item_id": item_id,
            "old_status": old_status.value if old_status else None,
            "new_status": new_status.value
        })

    def get_throughput(self, days: int = 30) -> float:
        """Calculate throughput (items completed per day)"""
        cutoff = datetime.now() - timedelta(days=days)
        completed = [
            item for item in self.items.values()
            if item.completed_at and item.completed_at >= cutoff
        ]
        return len(completed) / days

    def get_lead_time(self, days: int = 30) -> float:
        """Calculate average lead time in hours"""
        cutoff = datetime.now() - timedelta(days=days)
        completed = [
            item for item in self.items.values()
            if item.completed_at and item.completed_at >= cutoff and item.lead_time_hours
        ]
        if not completed:
            return 0.0
        return sum(item.lead_time_hours for item in completed) / len(completed)

    def get_cycle_time(self, days: int = 30) -> float:
        """Calculate average cycle time in hours"""
        cutoff = datetime.now() - timedelta(days=days)
        completed = [
            item for item in self.items.values()
            if item.completed_at and item.completed_at >= cutoff and item.cycle_time_hours
        ]
        if not completed:
            return 0.0
        return sum(item.cycle_time_hours for item in completed) / len(completed)

    def get_cumulative_flow_data(self) -> List[dict]:
        """Generate data for cumulative flow diagram"""
        if not self.history:
            return []

        dates = sorted(set(h["timestamp"].date() for h in self.history))
        flow_data = []

        for date in dates:
            day_data = {"date": date}
            for status in WorkItemStatus:
                count = sum(
                    1 for item in self.items.values()
                    if item.status == status and item.created_at.date() <= date
                )
                day_data[status.value] = count
            flow_data.append(day_data)

        return flow_data
```

```python
class WorkInProgressManager:
    """Manages WIP limits and identifies bottlenecks"""
    def __init__(self, board: KanbanBoard):
        self.board = board

    def get_bottleneck_analysis(self) -> List[dict]:
        """Identify columns that are bottlenecks"""
        bottlenecks = []

        for status, column in self.board.columns.items():
            if column.wip_limit and column.utilization_percent >= 100:
                bottlenecks.append({
                    "column": status.value,
                    "current_items": len(column.items),
                    "wip_limit": column.wip_limit,
                    "utilization": column.utilization_percent,
                    "recommendation": "Consider increasing WIP limit or adding capacity"
                })

        return sorted(bottlenecks, key=lambda x: x["utilization"], reverse=True)

    def suggest_wip_limits(self) -> Dict[str, int]:
        """Suggest optimal WIP limits based on throughput"""
        throughput = self.board.get_throughput()
        avg_cycle = self.board.get_cycle_time()

        suggestions = {}
        for status, column in self.board.columns.items():
            if column.wip_limit is None:
                continue

            target = max(1, int(throughput * (avg_cycle / 24)))
            suggestions[status.value] = min(column.wip_limit, target)

        return suggestions
```

```python
class KanbanMetrics:
    """Calculates and tracks Kanban metrics for continuous improvement"""
    def __init__(self, board: KanbanBoard):
        self.board = board

    def generate_metrics_report(self) -> dict:
        """Generate comprehensive Kanban metrics report"""
        return {
            "throughput": {
                "daily": self.board.get_throughput(1),
                "weekly": self.board.get_throughput(7),
                "monthly": self.board.get_throughput(30)
            },
            "cycle_time": {
                "hours": self.board.get_cycle_time(30),
                "days": self.board.get_cycle_time(30) / 24
            },
            "lead_time": {
                "hours": self.board.get_lead_time(30),
                "days": self.board.get_lead_time(30) / 24
            },
            "wip_status": {
                status.value: {
                    "current": len(column.items),
                    "limit": column.wip_limit,
                    "at_limit": column.is_at_limit
                }
                for status, column in self.board.columns.items()
            },
            "work_distribution": {
                item_type.value: sum(
                    1 for item in self.board.items.values()
                    if item.item_type == item_type
                )
                for item_type in WorkItemType
            }
        }

    def predict_completion_date(self, item_id: str) -> Optional[datetime]:
        """Predict when an item will be completed based on historical throughput"""
        if item_id not in self.board.items:
            return None

        item = self.board.items[item_id]
        if item.status == WorkItemStatus.DONE:
            return item.completed_at

        throughput = self.board.get_throughput()
        if throughput == 0:
            return None

        items_ahead = sum(
            1 for i in self.board.items.values()
            if i.created_at < item.created_at
            and i.status != WorkItemStatus.DONE
        )

        days_to_complete = items_ahead / throughput
        return datetime.now() + timedelta(days=days_to_complete)
```

```python
class ClassOfService:
    """Manages different service classes for prioritized work handling"""
    def __init__(self):
        self.classes = {
            "standard": {"wip_multiplier": 1, "lead_time_target": 7},
            "expedited": {"wip_multiplier": 2, "lead_time_target": 1},
            "fixed_date": {"wip_multiplier": 1.5, "lead_time_target": None},
            "intangible": {"wip_multiplier": 0.5, "lead_time_target": 14}
        }

    def apply_service_class(
        self,
        board: KanbanBoard,
        item: WorkItem,
        service_class: str
    ) -> None:
        """Apply service class rules to work item"""
        if service_class not in self.classes:
            return

        rules = self.classes[service_class]

        if item.status == WorkItemStatus.IN_PROGRESS:
            for status, column in board.columns.items():
                if status == WorkItemStatus.IN_PROGRESS and column.wip_limit:
                    adjusted_limit = int(column.wip_limit * rules["wip_multiplier"])
                    if len(column.items) < adjusted_limit:
                        return
                    print(f"Warning: Expedited item {item.id} waiting for capacity")

    def get_service_level_agreement(
        self,
        service_class: str
    ) -> Optional[int]:
        """Get lead time target in days for service class"""
        if service_class not in self.classes:
            return None
        return self.classes[service_class]["lead_time_target"]
```

## Best Practices

- Start with current workflow visualization before implementing any changes or limits
- Set initial WIP limits conservatively and adjust based on actual team capacity
- Measure cycle time and lead time consistently to identify improvement opportunities
- Use classes of service to handle urgent work without disrupting overall flow
- Review and optimize board structure regularly based on bottleneck analysis
- Limit Work-in-Progress to expose problems rather than masking them with buffers
- Use cumulative flow diagrams to identify work accumulation and queue problems
- Establish clear policies for when items can move between states
- Focus on reducing cycle time rather than maximizing utilization
- Make the Kanban board visible to all stakeholders for transparency

## Common Patterns

- **Two-Column Kanban**: Simplest board with just To Do and Done columns for minimal overhead
- **DevOps Pipeline Board**: Specialized board with Build, Test, Deploy columns for CI/CD
- **Bug Triage Board**: Prioritized bug tracking with severity and owner assignments
- **Scaled Kanban**: Multiple teams using synchronized boards with portfolio-level visibility
- **Mixed Scrum-Kanban (Scrumban)**: Hybrid approach with sprint planning within Kanban flow
- **Production Kanban**: Visual management of production issues and incidents
- **Requirement Kanban**: Managing product backlog items with flow optimization
