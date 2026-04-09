---
name: sprint-planning
description: Ceremony for defining sprint goals and committing to achievable work
category: software-development
---

# Sprint Planning

## What I Do

I am the agile ceremony where the team defines what can be delivered in the upcoming sprint and how that work will be achieved. I help teams create focus, establish commitment, and align on shared goals. By facilitating collaboration between product owner and development team, I ensure sprints have clear objectives and achievable workloads.

## When to Use Me

Use me at the beginning of every sprint to plan and commit to work. I am essential for Scrum teams practicing time-boxed iterations. I work best when product owner provides a prioritized backlog and the team has historical velocity data. Use me to create sprint goals, select backlog items, and break work into manageable tasks.

## Core Concepts

- **Sprint Goal**: The single objective the sprint aims to achieve
- **Sprint Backlog**: Selected items plus the plan for delivering them
- **Story Points**: Relative estimation of effort for backlog items
- **Velocity**: Historical measure of work completed per sprint
- **Capacity Planning**: Determining how much work the team can commit to
- **Definition of Done**: Criteria for considering work complete
- **Product Owner**: Owns the backlog and prioritizes work
- **Development Team**: Commits to and executes the sprint work
- **Sprint Length**: Fixed duration, typically 1-4 weeks
- **Commitment**: Team's pledge to achieve the sprint goal

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
import uuid

class StoryPoint(Enum):
    ONE = 1
    TWO = 2
    THREE = 3
    FIVE = 5
    EIGHT = 8
    THIRTEEN = 13
    TWENTY_ONE = 21

@dataclass
class UserStory:
    """Represents a user story for sprint planning"""
    id: str
    title: str
    description: str
    priority: int
    story_points: Optional[StoryPoint] = None
    acceptance_criteria: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    status: str = "backlog"
    assignee: Optional[str] = None
    tasks: List[Dict] = field(default_factory=list)

    @property
    def point_value(self) -> int:
        return self.story_points.value if self.story_points else 0

    def add_task(self, task_name: str, estimated_hours: float, owner: str = "") -> Dict:
        task = {
            "id": str(uuid.uuid4())[:8],
            "name": task_name,
            "estimated_hours": estimated_hours,
            "remaining_hours": estimated_hours,
            "owner": owner,
            "status": "pending"
        }
        self.tasks.append(task)
        return task

    def complete_task(self, task_id: str) -> Dict:
        for task in self.tasks:
            if task["id"] == task_id:
                task["status"] = "completed"
                return task
        return {"error": "Task not found"}

@dataclass
class Sprint:
    """Represents a sprint with goal and backlog"""
    id: str
    name: str
    goal: str
    start_date: datetime
    end_date: datetime
    planned_points: int = 0
    completed_points: int = 0
    stories: List[UserStory] = field(default_factory=list)
    status: str = "planned"

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.date).days

    @property
    def remaining_days(self) -> int:
        return max(0, (self.end_date - datetime.now()).days)

    @property
    def velocity_percent(self) -> float:
        if self.planned_points == 0:
            return 0
        return (self.completed_points / self.planned_points) * 100

    def add_story(self, story: UserStory) -> None:
        self.stories.append(story)
        self.planned_points += story.point_value

    def mark_story_complete(self, story_id: str) -> None:
        for story in self.stories:
            if story.id == story_id:
                story.status = "done"
                self.completed_points += story.point_value

    def get_completion_forecast(self) -> Dict:
        days_passed = (datetime.now() - self.start_date).days
        total_days = self.duration_days
        percent_time_passed = days_passed / total_days if total_days > 0 else 1

        planned_at_point = self.planned_points * percent_time_passed
        ahead = self.completed_points - planned_at_point

        return {
            "days_remaining": self.remaining_days,
            "points_completed": self.completed_points,
            "points_remaining": self.planned_points - self.completed_points,
            "status": "on_track" if ahead >= 0 else "behind",
            "estimated_completion": self.planned_points * (1 + abs(ahead) / self.completed_points) if self.completed_points > 0 else self.planned_points
        }

    def calculate_burndown(self) -> List[Dict]:
        data = []
        total = self.planned_points
        remaining = total

        for story in sorted(self.stories, key=lambda s: s.status == "done"):
            if story.status == "done":
                remaining -= story.point_value

        return data
```

```python
class SprintPlanner:
    """Helps plan and manage sprints"""
    def __init__(self):
        self.sprints: List[Sprint] = []
        self.velocity_history: List[float] = []

    def create_sprint(
        self,
        name: str,
        goal: str,
        start_date: datetime,
        duration_days: int = 14
    ) -> Sprint:
        sprint = Sprint(
            id=str(uuid.uuid4())[:8],
            name=name,
            goal=goal,
            start_date=start_date,
            end_date=start_date + timedelta(days=duration_days)
        )
        self.sprints.append(sprint)
        return sprint

    def calculate_team_capacity(
        self,
        team_size: int,
        hours_per_day: float,
        sprint_days: int,
        holidays: int = 0,
        meetings_overhead: float = 0.2
    ) -> float:
        available_days = sprint_days - holidays
        daily_capacity = team_size * hours_per_day * (1 - meetings_overhead)
        return available_days * daily_capacity

    def estimate_sprint_capacity(
        self,
        historical_velocity: List[float],
        confidence_factor: float = 0.9
    ) -> float:
        if not historical_velocity:
            return 0

        avg_velocity = sum(historical_velocity) / len(historical_velocity)
        variance = sum((v - avg_velocity) ** 2 for v in historical_velocity) / len(historical_velocity)
        std_dev = variance ** 0.5

        return max(1, avg_velocity - confidence_factor * std_dev)

    def select_stories_for_sprint(
        self,
        sprint: Sprint,
        backlog: List[UserStory],
        target_points: float
    ) -> List[UserStory]:
        selected = []
        remaining_points = target_points

        sorted_backlog = sorted(backlog, key=lambda s: s.priority)

        for story in sorted_backlog:
            if story.point_value <= remaining_points:
                if not self._has_blocking_dependencies(story, selected):
                    selected.append(story)
                    sprint.add_story(story)
                    remaining_points -= story.point_value

        return selected

    def _has_blocking_dependencies(
        self,
        story: UserStory,
        selected: List[UserStory]
    ) -> bool:
        selected_ids = {s.id for s in selected}
        return any(dep not in selected_ids for dep in story.dependencies)

    def create_sprint_goal(
        self,
        sprint_number: int,
        theme: str,
        stories: List[UserStory]
    ) -> str:
        story_titles = ", ".join(s.title for story in stories[:3])
        return f"Sprint {sprint_number}: {theme} - {story_titles}"

    def decompose_story_into_tasks(
        self,
        story: UserStory,
        tasks: List[Dict]
    ) -> List[Dict]:
        for task_def in tasks:
            story.add_task(
                task_def["name"],
                task_def.get("hours", 4),
                task_def.get("owner", "")
            )
        return story.tasks

    def generate_sprint_plan_report(self, sprint: Sprint) -> Dict:
        return {
            "sprint": sprint.name,
            "goal": sprint.goal,
            "duration_days": sprint.duration_days,
            "team_commitment": {
                "planned_points": sprint.planned_points,
                "story_count": len(sprint.stories),
                "estimated_hours": sum(
                    sum(task["estimated_hours"] for task in story.tasks)
                    for story in sprint.stories
                )
            },
            "capacity": {
                "days": sprint.duration_days,
                "expected_velocity": sprint.planned_points
            },
            "stories": [
                {
                    "id": s.id,
                    "title": s.title,
                    "points": s.point_value,
                    "tasks": len(s.tasks)
                }
                for s in sprint.stories
            ]
        }
```

```python
class StoryEstimator:
    """Supports story point estimation during planning"""
    def __init__(self):
        self.estimates: List[Dict] = []

    def record_estimation_session(
        self,
        story_id: str,
        estimates: Dict[str, int]
    ) -> Dict:
        values = list(estimates.values())
        avg = sum(values) / len(values)
        variance = sum((v - avg) ** 2 for v in values) / len(values)

        session = {
            "story_id": story_id,
            "estimates": estimates,
            "average": avg,
            "standard_deviation": variance ** 0.5,
            "consensus": self._calculate_consensus(estimates)
        }
        self.estimates.append(session)
        return session

    def _calculate_consensus(self, estimates: Dict[str, int]) -> float:
        values = list(estimates.values())
        if len(values) < 2:
            return 1.0

        min_val, max_val = min(values), max(values)
        if min_val == max_val:
            return 1.0

        return 1 - (max_val - min_val) / max_val

    def get_fibonacci_scale(self) -> List[int]:
        return [1, 2, 3, 5, 8, 13, 21, 34, 55]

    def suggest_story_points(
        self,
        complexity: int,
        uncertainty: int,
        effort: int
    ) -> int:
        raw_score = (complexity + uncertainty + effort) / 3

        if raw_score <= 1:
            return 1
        elif raw_score <= 2:
            return 2
        elif raw_score <= 3:
            return 3
        elif raw_score <= 5:
            return 5
        elif raw_score <= 8:
            return 8
        elif raw_score <= 13:
            return 13
        else:
            return 21

    def compare_story_complexity(
        self,
        baseline_story: Dict,
        new_story: Dict
    ) -> Dict:
        factors = ["complexity", "uncertainty", "effort", "risk"]

        base_total = sum(baseline_story.get(f, 0) for f in factors)
        new_total = sum(new_story.get(f, 0) for f in factors)

        ratio = new_total / base_total if base_total > 0 else 1

        return {
            "ratio": ratio,
            "relative_size": "similar" if 0.8 <= ratio <= 1.2 else "larger" if ratio > 1.2 else "smaller"
        }
```

```python
class BacklogPrioritizer:
    """Prioritizes backlog items for sprint planning"""
    def __init__(self):
        self.items: List[UserStory] = []

    def add_backlog_item(self, item: UserStory) -> None:
        self.items.append(item)

    def calculate_priority_score(
        self,
        item: UserStory,
        business_value: int,
        time_sensitivity: int,
        dependency_impact: int,
        implementation_difficulty: int
    ) -> float:
        value_score = business_value * 3
        urgency_score = time_sensitivity * 2
        dependency_score = dependency_impact * 1.5
        difficulty_factor = max(1, 6 - implementation_difficulty)

        return (value_score + urgency_score + dependency_score) / difficulty_factor

    def prioritize_by_value_density(self) -> List[UserStory]:
        scored = []
        for item in self.items:
            density = self.calculate_priority_score(
                item,
                item.priority * 10,
                5,
                len(item.dependencies) * 2,
                3
            )
            scored.append((item, density))

        return [item for item, _ in sorted(scored, key=lambda x: x[1], reverse=True)]

    def identify_quick_wins(self) -> List[UserStory]:
        quick_wins = []
        for item in self.items:
            if item.point_value <= 3:
                quick_wins.append(item)
        return sorted(quick_wins, key=lambda i: i.priority, reverse=True)

    def identify_big_bets(self) -> List[UserStory]:
        big_bets = []
        for item in self.items:
            if item.point_value >= 8:
                big_bets.append(item)
        return sorted(big_bets, key=lambda i: i.priority, reverse=True)

    def analyze_dependencies(self) -> Dict:
        dependency_graph = {}
        for item in self.items:
            dependency_graph[item.id] = item.dependencies

        return {
            "critical_path": self._find_critical_path(dependency_graph),
            "items_with_dependencies": sum(1 for item in self.items if item.dependencies),
            "unblockers": self._identify_unblockers()
        }

    def _find_critical_path(self, graph: Dict, visited: set = None) -> List[str]:
        return []

    def _identify_unblockers(self) -> List[UserStory]:
        dependent_ids = set()
        for item in self.items:
            for dep in item.dependencies:
                dependent_ids.add(dep)

        return [item for item in self.items if item.id in dependent_ids]
```

```python
class SprintReviewPrep:
    """Prepares for sprint review demonstration"""
    def __init__(self):
        self.demonstration_items: List[Dict] = []

    def prepare_demonstration(
        self,
        sprint: Sprint,
        stakeholder_focus: List[str]
    ) -> Dict:
        completed = [s for s in sprint.stories if s.status == "done"]
        demo_items = []

        for story in completed:
            demo_items.append({
                "story_id": story.id,
                "title": story.title,
                "acceptance_met": self._verify_acceptance_criteria(story),
                "demo_focus": self._align_with_stakeholders(story, stakeholder_focus),
                "key_points": self._extract_demo_key_points(story)
            })

        self.demonstration_items = demo_items

        return {
            "sprint": sprint.name,
            "goal": sprint.goal,
            "completion_rate": sprint.velocity_percent,
            "demonstration_items": demo_items,
            "feedback_requested": []
        }

    def _verify_acceptance_criteria(self, story: UserStory) -> Dict:
        return {
            "criteria_met": all(
                criterion.startswith("[x]") or criterion.startswith("DONE:")
                for criterion in story.acceptance_criteria
            ),
            "criteria_count": len(story.acceptance_criteria)
        }

    def _align_with_stakeholders(self, story: UserStory, focus: List[str]) -> List[str]:
        aligned = []
        for stakeholder in focus:
            if stakeholder.lower() in story.description.lower():
                aligned.append(stakeholder)
        return aligned if aligned else ["General"]

    def _extract_demo_key_points(self, story: UserStory) -> List[str]:
        return [
            f"Implemented: {story.title}",
            f"Value delivered: {', '.join(story.acceptance_criteria[:2])}",
            f"Effort: {story.point_value} story points"
        ]

    def generate_review_metrics(self, sprint: Sprint) -> Dict:
        completed = [s for s in sprint.stories if s.status == "done"]
        in_progress = [s for s in sprint.stories if s.status == "in_progress"]

        return {
            "committed_points": sprint.planned_points,
            "completed_points": sprint.completed_points,
            "completion_rate": sprint.velocity_percent,
            "stories_completed": len(completed),
            "stories_in_progress": len(in_progress),
            "scope_changes": self._count_scope_changes(sprint)
        }

    def _count_scope_changes(self, sprint: Sprint) -> int:
        return 0
```

## Best Practices

- Use historical velocity to inform sprint capacity but adjust for team changes and sprint context
- Ensure sprint goal is specific, measurable, and meaningful to the whole team
- Break stories into tasks that can be completed within a day
- Only commit to what the team can realistically achieve
- Involve the whole team in planning rather than having individuals commit separately
- Leave buffer for unexpected work and technical improvements
- Refine backlog before planning to ensure stories are ready
- Consider team member skills and availability when assigning work
- Make sprint goal visible throughout the sprint for focus
- Track progress daily to identify early warning signs

## Common Patterns

- **Story Mapping**: Visualizing stories in release and sprint layers
- **Planning Poker**: Team-based estimation for better accuracy
- **Capacity Planning**: Using velocity and team availability
- **Sprint Goal Templates**: Structured goal setting
- **Task Decomposition**: Breaking stories into sub-tasks
- **Dependency Mapping**: Understanding story relationships
- **Definition of Ready**: Clear criteria for sprint-ready stories
- **Velocity Tracking**: Historical capacity measurement
