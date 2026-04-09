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
audience: Software Developers, DevOps Engineers, Operations Teams
category: software-development
---

# Kanban

## What I Do

I provide expertise in Kanban, a visual workflow management system that originated from Toyota's manufacturing processes and has been adapted for software development. Kanban focuses on visualizing work, limiting work-in-progress (WIP), and maximizing flow efficiency to deliver value continuously. Unlike Scrum's time-boxed iterations, Kanban allows work items to flow through the system as soon as capacity is available, making it ideal for operations teams, support teams, and development teams with continuous delivery pipelines or unpredictable incoming work.

## When to Use Me

Use Kanban when you have continuous flow of work items (bug fixes, support tickets, deployments), need to optimize existing processes without disrupting team structure, want to reduce cycle time and lead time, or work in operations, SRE, or customer support roles. Kanban excels when work arrives unpredictably and cannot be batched into sprints. It complements Scrum well (Scrumban) for teams that want Scrum's structure with Kanban's flexibility. Avoid Kanban when your team needs the discipline of fixed iterations or when ceremonies like sprint planning provide necessary structure.

## Core Concepts

- **Kanban Board**: Visual representation of workflow with columns representing process stages
- **Work-In-Progress (WIP) Limits**: Maximum number of items allowed in each column to prevent multitasking
- **Classes of Service**: Different handling priorities for different work types (expedited, standard, fixed date)
- **Lead Time**: Time from work request submission to completion
- **Cycle Time**: Time from work starting to completion
- **Throughput**: Number of work items completed per unit of time
- **Cumulative Flow Diagram**: Visualization showing work item distribution across states over time
- **Pull System**: Team members pull work when capacity is available, rather than work being pushed
- **Swimlanes**: Horizontal lanes on board for categorizing work (team, priority, work type)
- **Work Item Age**: Time a work item has been in its current state, indicating potential blockers

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
import statistics

class WorkItemType(Enum):
    USER_STORY = "user_story"
    BUG = "bug"
    TECH_DEBT = "tech_debt"
    SUPPORT = "support"
    SPIKE = "spike"

class Priority(Enum):
    EXPEDITED = 1  # Critical production issue
    HIGH = 2
    MEDIUM = 3
    LOW = 4

@dataclass
class WorkItem:
    """Represents a work item on the Kanban board"""
    id: str
    title: str
    item_type: WorkItemType
    priority: Priority
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_state: str = "BACKLOG"
    blocked: bool = False
    blocked_reason: Optional[str] = None
    cycle_time_hours: Optional[float] = None

    def calculate_cycle_time(self) -> Optional[float]:
        """Calculate cycle time once item is completed"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            self.cycle_time_hours = delta.total_seconds() / 3600
            return self.cycle_time_hours
        return None

    def age_hours(self) -> float:
        """Calculate current item age in hours"""
        reference = self.started_at or self.created_at
        delta = datetime.now() - reference
        return delta.total_seconds() / 3600

@dataclass
class KanbanColumn:
    """Represents a column on the Kanban board with WIP limits"""
    name: str
    wip_limit: Optional[int] = None
    items: List[WorkItem] = field(default_factory=list)

    def is_at_capacity(self) -> bool:
        """Check if column has reached WIP limit"""
        return self.wip_limit is not None and len(self.items) >= self.wip_limit

    def add_item(self, item: WorkItem) -> bool:
        """Add item to column if within WIP limit"""
        if self.is_at_capacity():
            return False
        item.current_state = self.name
        self.items.append(item)
        return True

    def move_item(self, item: WorkItem, to_column: 'KanbanColumn') -> bool:
        """Move item to another column"""
        if item in self.items:
            self.items.remove(item)
            return to_column.add_item(item)
        return False

class KanbanBoard:
    """Manages Kanban board operations and flow metrics"""
    def __init__(
        self,
        name: str,
        columns: Dict[str, Optional[int]]
    ):
        self.name = name
        self.columns = {
            name: KanbanColumn(name, limit)
            for name, limit in columns.items()
        }
        self.all_items: Dict[str, WorkItem] = {}

    def add_item(
        self,
        item_id: str,
        title: str,
        item_type: WorkItemType,
        priority: Priority
    ) -> bool:
        """Add new work item to backlog"""
        if item_id in self.all_items:
            return False
        
        item = WorkItem(
            id=item_id,
            title=title,
            item_type=item_type,
            priority=priority,
            created_at=datetime.now()
        )
        self.all_items[item_id] = item
        
        backlog = self.columns.get("BACKLOG")
        if backlog:
            return backlog.add_item(item)
        return True

    def advance_item(
        self,
        item_id: str,
        target_column: str,
        started: bool = False
    ) -> bool:
        """Move item through workflow"""
        item = self.all_items.get(item_id)
        if not item:
            return False
        
        current_col_name = item.current_state
        current_col = self.columns.get(current_col_name)
        target_col = self.columns.get(target_column)
        
        if not current_col or not target_col:
            return False
        
        if started and not item.started_at:
            item.started_at = datetime.now()
        
        return current_col.move_item(item, target_col)

    def complete_item(self, item_id: str) -> bool:
        """Mark item as completed"""
        item = self.all_items.get(item_id)
        if not item:
            return False
        
        item.completed_at = datetime.now()
        item.calculate_cycle_time()
        return self.advance_item(item_id, "DONE")

    def get_throughput(
        self,
        since: datetime,
        item_types: Optional[List[WorkItemType]] = None
    ) -> int:
        """Calculate throughput (items completed per time period)"""
        completed = [
            item for item in self.all_items.values()
            if item.completed_at and item.completed_at >= since
        ]
        if item_types:
            completed = [i for i in completed if i.item_type in item_types]
        return len(completed)

    def get_lead_time(self, item_type: WorkItemType) -> float:
        """Calculate average lead time for item type"""
        completed = [
            item for item in self.all_items.values()
            if item.item_type == item_type and item.completed_at
        ]
        if not completed:
            return 0.0
        
        lead_times = [
            (item.completed_at - item.created_at).total_seconds() / 3600
            for item in completed
        ]
        return statistics.mean(lead_times)

    def get_cycle_time(self, item_type: WorkItemType) -> float:
        """Calculate average cycle time for item type"""
        with_cycle_time = [
            item for item in self.all_items.values()
            if item.item_type == item_type and item.cycle_time_hours
        ]
        if not with_cycle_time:
            return 0.0
        
        return statistics.mean(item.cycle_time_hours for item in with_cycle_time)

    def identify_blocked_items(self) -> List[WorkItem]:
        """Find all items that are blocked"""
        return [item for item in self.all_items.values() if item.blocked]

    def get_wip_by_column(self) -> Dict[str, int]:
        """Get WIP count for each column"""
        return {
            name: len(col.items)
            for name, col in self.columns.items()
            if name not in ["BACKLOG", "DONE"]
        }
```

```python
class KanbanMetrics:
    """Calculates and tracks Kanban metrics for process improvement"""
    def __init__(self, board: KanbanBoard):
        self.board = board

    def cumulative_flow_data(
        self,
        since: datetime
    ) -> Dict[str, Dict[str, int]]:
        """Generate cumulative flow diagram data"""
        flow_data = {}
        
        for item in self.board.all_items.values():
            if item.created_at >= since:
                if item.id not in flow_data:
                    flow_data[item.id] = {}
                flow_data[item.id][item.current_state] = item.created_at
        
        return flow_data

    def throughput_last_n_days(self, days: int) -> float:
        """Calculate average daily throughput"""
        since = datetime.now() - timedelta(days=days)
        total = self.board.get_throughput(since)
        return total / days

    def aging_items_report(self, threshold_hours: float) -> List[WorkItem]:
        """Identify items aging beyond threshold"""
        return [
            item for item in self.board.all_items.values()
            if not item.completed_at and item.age_hours() > threshold_hours
        ]

    def monte_carlo_throughput(
        self,
        historical_throughputs: List[int],
        iterations: int = 1000
    ) -> Dict[str, float]:
        """Monte Carlo simulation for throughput prediction"""
        import random
        
        simulations = []
        for _ in range(iterations):
            sample = random.choice(historical_throughputs)
            simulations.append(sample)
        
        return {
            "p50": sorted(simulations)[iterations // 2],
            "p85": sorted(simulations)[int(iterations * 0.85)],
            "p95": sorted(simulations)[int(iterations * 0.95)]
        }
```

## Best Practices

- Start with your current workflow and visualize it before adding WIP limits
- Set initial WIP limits based on team size, typically 1.5-2x the number of team members
- WIP limits should cause conversation, not panic—they signal capacity problems to address
- Use classes of service to handle different work types with appropriate handling policies
- Measure and track cycle time consistently to identify bottlenecks and improvement opportunities
- Hold regular board reviews to discuss flow issues, blockers, and process improvements
- Make the board visible to all stakeholders for transparency and shared understanding
- Limit work types on the board to reduce complexity and cognitive load
- Use swimlanes for high-level categorization without over-fragmenting the board
- Continuously evolve WIP limits based on empirical data and team feedback

## Common Patterns

- **DevOps Kanban**: Visualizing CI/CD pipeline stages with WIP limits on build, test, deploy
- **Bug Triage Kanban**: Prioritized workflow for handling incoming support tickets
- **Feature Team Kanban**: Cross-functional teams with separate lanes for different product areas
- **Portfolio Kanban**: Managing work at portfolio level with epic, feature, and story swimlanes
- **Double-Loop Kanban**: Inner loop for development, outer loop for strategic initiatives
