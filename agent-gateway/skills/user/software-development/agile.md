---
name: Agile
description: Iterative software development methodology emphasizing flexibility, collaboration, and continuous delivery of value
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Development Teams
audience: Software Developers, Product Managers, Team Leads, Executives
category: software-development
---

# Agile

## What I Do

I provide comprehensive guidance on Agile methodologies, the family of iterative approaches that revolutionized software development. Agile emphasizes delivering working software in small increments, welcoming changing requirements, close collaboration between business and developers, and continuous improvement. I cover Agile principles, frameworks like Scrum and Kanban, scaling practices, and cultural aspects that make Agile succeed. Agile enables teams to respond to change quickly while maintaining sustainable development pace.

## When to Use Me

Use Agile when dealing with uncertain or evolving requirements, complex problem-solving, or projects where traditional planning fails. Agile is ideal for product development, startups, and any effort where customer needs may change. It's essential when you need fast feedback cycles and continuous value delivery. Consider alternatives like Waterfall only for very stable, well-understood projects with regulatory requirements mandating upfront planning. Most modern software benefits from Agile approaches.

## Core Concepts

- **Iterative Development**: Work in short cycles delivering incremental value
- **Incremental Delivery**: Frequent releases of working software
- **Customer Collaboration**: Ongoing engagement with stakeholders
- **Responding to Change**: Embracing changing requirements as competitive advantage
- **Working Software**: Primary measure of progress over comprehensive documentation
- **Sustainable Pace**: Maintaining consistent velocity without burnout
- **Self-Organizing Teams**: Teams decide how to do work, not managers
- **Continuous Improvement**: Regular reflection and process adjustment
- **Technical Excellence**: Good design enables agility
- **Face-to-Face Conversation**: Most efficient communication method

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum

class FeatureStatus(Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"

@dataclass
class Feature:
    """Represents a feature or user story"""
    id: str
    name: str
    description: str
    priority: int
    status: FeatureStatus = FeatureStatus.BACKLOG
    story_points: int = 0
    assignee: Optional[str] = None
    dependencies: List[str] = field(default_factory=list)
    acceptance_criteria: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def start(self) -> None:
        """Mark feature as started"""
        if self.status == FeatureStatus.BACKLOG:
            self.status = FeatureStatus.IN_PROGRESS
            self.started_at = datetime.now()

    def complete(self) -> None:
        """Mark feature as completed"""
        if self.status == FeatureStatus.IN_PROGRESS:
            self.status = FeatureStatus.DONE
            self.completed_at = datetime.now()

    def is_blocked_by(self, feature_id: str) -> bool:
        """Check if feature is blocked by another"""
        return feature_id in self.dependencies and self.status != FeatureStatus.DONE

@dataclass
class Release:
    """Represents a planned or completed release"""
    version: str
    name: str
    features: List[str]
    target_date: Optional[datetime]
    released_at: Optional[datetime] = None
    notes: str = ""

    @property
    def is_released(self) -> bool:
        """Check if release has been deployed"""
        return self.released_at is not None

class AgileBacklog:
    """Manages feature backlog with prioritization"""
    def __init__(self, name: str):
        self.name = name
        self.features: Dict[str, Feature] = {}

    def add_feature(self, feature: Feature) -> None:
        """Add feature to backlog"""
        self.features[feature.id] = feature

    def prioritize(self) -> List[Feature]:
        """Return features sorted by priority"""
        return sorted(
            self.features.values(),
            key=lambda f: (f.priority, f.created_at)
        )

    def get_ready_for_development(self, max_points: int = 13) -> List[Feature]:
        """Get features that are ready to be started"""
        ready = []
        for feature in self.features.values():
            if feature.status == FeatureStatus.BACKLOG:
                if not any(
                    self.features.get(dep, Feature("", "", "", 0)).status != FeatureStatus.DONE
                    for dep in feature.dependencies
                ):
                    ready.append(feature)
        return ready[:10]

    def calculate_velocity(self, iterations: int = 3) -> float:
        """Calculate average velocity from completed features"""
        completed = [
            f for f in self.features.values()
            if f.status == FeatureStatus.DONE
            and f.completed_at
        ]
        
        if len(completed) < iterations:
            return sum(f.story_points for f in completed) / max(1, len(completed))
        
        sorted_completed = sorted(completed, key=lambda f: f.completed_at)
        recent = sorted_completed[-iterations:]
        return sum(f.story_points for f in recent) / iterations

    def estimate_completion(self, target_points: int) -> datetime:
        """Estimate when backlog will reach target"""
        velocity = self.calculate_velocity()
        remaining = sum(
            f.story_points for f in self.features.values()
            if f.status != FeatureStatus.DONE
        )
        
        iterations_needed = remaining / velocity
        iterations_needed = max(1, iterations_needed)
        
        return datetime.now() + timedelta(weeks=iterations_needed * 2)
```

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict
import random

class Iteration:
    """Represents an Agile iteration (sprint or iteration)"""
    def __init__(
        self,
        name: str,
        start_date: datetime,
        duration_days: int = 14
    ):
        self.name = name
        self.start_date = start_date
        self.duration_days = duration_days
        self.end_date = start_date + timedelta(days=duration_days)
        self.planned_points: int = 0
        self.completed_points: int = 0
        self.items: List[dict] = []
        self.retrospective_items: List[dict] = []

    @property
    def progress_percent(self) -> float:
        """Calculate iteration progress"""
        if self.planned_points == 0:
            return 0.0
        return (self.completed_points / self.planned_points) * 100

    def add_item(self, name: str, points: int, status: str = "planned") -> None:
        """Add work item to iteration"""
        self.items.append({
            "name": name,
            "points": points,
            "status": status
        })
        if status == "planned":
            self.planned_points += points

    def complete_item(self, name: str) -> None:
        """Mark item as completed"""
        for item in self.items:
            if item["name"] == name:
                item["status"] = "completed"
                self.completed_points += item["points"]
                break

    def is_active(self) -> bool:
        """Check if iteration is currently running"""
        now = datetime.now()
        return self.start_date <= now <= self.end_date

    def is_completed(self) -> bool:
        """Check if iteration has ended"""
        return datetime.now() > self.end_date

class AgileTeam:
    """Manages Agile team and iteration planning"""
    def __init__(self, name: str, members: List[str]):
        self.name = name
        self.members = members
        self.current_iteration: Optional[Iteration] = None
        self.iterations: List[Iteration] = []
        self.velocity_history: List[int] = []

    def start_iteration(
        self,
        name: str,
        start_date: datetime = None,
        duration_days: int = 14
    ) -> Iteration:
        """Start a new iteration"""
        if self.current_iteration and not self.current_iteration.is_completed():
            raise ValueError("Current iteration not completed")

        self.current_iteration = Iteration(
            name=name,
            start_date=start_date or datetime.now(),
            duration_days=duration_days
        )
        self.iterations.append(self.current_iteration)
        return self.current_iteration

    def complete_iteration(self) -> dict:
        """Complete current iteration and record metrics"""
        if not self.current_iteration:
            raise ValueError("No active iteration")

        iteration = self.current_iteration
        self.velocity_history.append(iteration.completed_points)

        summary = {
            "name": iteration.name,
            "planned": iteration.planned_points,
            "completed": iteration.completed_points,
            "progress": iteration.progress_percent,
            "avg_velocity": sum(self.velocity_history) / len(self.velocity_history)
        }

        self.current_iteration = None
        return summary

    def plan_capacity(self, iteration: Iteration) -> int:
        """Calculate team capacity for iteration"""
        member_capacity = 8  # story points per member per iteration
        return len(self.members) * member_capacity

    def get_burndown_data(self) -> List[dict]:
        """Generate burndown chart data"""
        if not self.current_iteration:
            return []

        data = []
        total = self.current_iteration.planned_points
        remaining = total

        for day in range(self.current_iteration.duration_days):
            date = self.current_iteration.start_date + timedelta(days=day)
            completed = sum(
                item["points"]
                for item in self.current_iteration.items
                if item["status"] == "completed"
            )
            remaining = total - completed

            data.append({
                "date": date,
                "ideal": total * (1 - day / self.current_iteration.duration_days),
                "actual": remaining
            })

        return data
```

```python
from dataclasses import dataclass
from typing import List, Dict, Callable
from datetime import datetime

@dataclass
class UserStory:
    """Represents a user story with INVEST criteria"""
    id: str
    title: str
    description: str
    as_a: str
    i_want: str
    so_that: str
    acceptance_criteria: List[str]
    story_points: int = 0
    priority: int = 0

    def is_invest_compliant(self) -> Dict[str, List[str]]:
        """Check if story follows INVEST principles"""
        issues = []

        # Independent
        if "depends on" in self.description.lower():
            issues.append("Story should be independent")

        # Negotiable
        if len(self.description) > 500:
            issues.append("Story should be negotiable, too detailed")

        # Valuable
        if not self.so_that:
            issues.append("Story must deliver value to user")

        # Estimable
        if self.story_points == 0:
            issues.append("Story needs estimation")

        # Small
        if len(self.acceptance_criteria) > 10:
            issues.append("Story may be too large")

        # Testable
        if not self.acceptance_criteria:
            issues.append("Story needs acceptance criteria")

        return {"compliant": len(issues) == 0, "issues": issues}

class UserStoryFactory:
    """Creates well-formed user stories"""
    @staticmethod
    def create(
        user_type: str,
        goal: str,
        reason: str,
        criteria: List[str],
        points: int = 0
    ) -> UserStory:
        """Factory method for creating user stories"""
        import uuid
        return UserStory(
            id=str(uuid.uuid4())[:8],
            title=f"{user_type} {goal}",
            description=f"As a {user_type}, I want to {goal}, so that {reason}.",
            as_a=user_type,
            i_want=goal,
            so_that=reason,
            acceptance_criteria=criteria,
            story_points=points
        )

    @staticmethod
    def split_large_story(
        large_story: UserStory,
        split_strategy: str = "by_user_path"
    ) -> List[UserStory]:
        """Split large story into smaller ones"""
        stories = []

        if split_strategy == "by_user_path":
            for i, path in enumerate(["happy_path", "error_path", "edge_case"]):
                stories.append(UserStoryFactory.create(
                    user_type=large_story.as_a,
                    goal=f"{large_story.i_want} ({path})",
                    reason=large_story.so_that,
                    criteria=large_story.acceptance_criteria[:3],
                    points=large_story.story_points // 3
                ))

        return stories

class BacklogRefinement:
    """Manages backlog grooming activities"""
    def __init__(self):
        self.stories: List[UserStory] = []

    def add_story(self, story: UserStory) -> None:
        """Add story to backlog"""
        self.stories.append(story)

    def refine(self) -> Dict[str, List[UserStory]]:
        """Perform backlog refinement"""
        refined = {
            "ready": [],
            "needs_work": [],
            "too_large": []
        }

        for story in self.stories:
            compliance = story.is_invest_compliant()
            if compliance["compliant"]:
                refined["ready"].append(story)
            elif story.story_points > 13:
                refined["too_large"].append(story)
            else:
                refined["needs_work"].append(story)

        return refined

    def estimate_with_planning_poker(
        self,
        estimates: List[int]
    ) -> int:
        """Calculate consensus estimate using planning poker"""
        if not estimates:
            return 0
        
        from statistics import mode
        try:
            return mode(estimates)
        except StatisticsError:
            return int(sum(estimates) / len(estimates))
```

```python
from dataclasses import dataclass
from typing import List, Dict, Callable
from datetime import datetime

@dataclass
class Feedback:
    """Customer feedback for prioritization"""
    id: str
    source: str
    description: str
    sentiment: str  # positive, neutral, negative
    frequency: int  # how many times mentioned
    impact_score: int  # estimated business impact
    effort_estimate: int  # relative effort to implement

    @property
    def priority_score(self) -> int:
        """Calculate priority score for feedback"""
        return (self.impact_score * 3) - (self.effort_estimate)

class CustomerFeedbackLoop:
    """Manages feedback collection and analysis"""
    def __init__(self):
        self.feedback_items: List[Feedback] = []

    def add_feedback(
        self,
        source: str,
        description: str,
        sentiment: str,
        impact: int,
        effort: int
    ) -> None:
        """Add customer feedback item"""
        import uuid
        self.feedback_items.append(Feedback(
            id=str(uuid.uuid4())[:8],
            source=source,
            description=description,
            sentiment=sentiment,
            frequency=1,
            impact_score=impact,
            effort_estimate=effort
        ))

    def aggregate_similar(self) -> None:
        """Group similar feedback items"""
        grouped = {}

        for item in self.feedback_items:
            key = item.description[:20].lower()
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(item)

        for items in grouped.values():
            if len(items) > 1:
                first = items[0]
                first.frequency = len(items)
                for duplicate in items[1:]:
                    if duplicate in self.feedback_items:
                        self.feedback_items.remove(duplicate)

    def prioritize_backlog(self) -> List[Feedback]:
        """Return feedback sorted by priority"""
        return sorted(
            self.feedback_items,
            key=lambda f: f.priority_score,
            reverse=True
        )

    def generate_insights(self) -> Dict[str, any]:
        """Generate insights from feedback analysis"""
        total = len(self.feedback_items)
        if total == 0:
            return {"count": 0}

        sentiments = {}
        for item in self.feedback_items:
            sentiments[item.sentiment] = sentiments.get(item.sentiment, 0) + 1

        avg_impact = sum(f.impact_score for f in self.feedback_items) / total
        avg_effort = sum(f.effort_estimate for f in self.feedback_items) / total

        return {
            "total_items": total,
            "sentiment_breakdown": sentiments,
            "average_impact": avg_impact,
            "average_effort": avg_effort,
            "high_impact_items": [
                f.description for f in self.feedback_items
                if f.impact_score >= 8
            ],
            "quick_wins": [
                f.description for f in self.feedback_items
                if f.impact_score >= 6 and f.effort_estimate <= 3
            ]
        }
```

```python
from dataclasses import dataclass, field
from typing import List, Dict, Callable
from datetime import datetime, timedelta
import random

@dataclass
class ContinuousImprovementItem:
    """Tracks improvement action items"""
    id: str
    description: str
    category: str  # process, tooling, skills, culture
    priority: int
    owner: str
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime = None
    impact: str = "unknown"  # high, medium, low

class RetrospectiveManager:
    """Manages iteration retrospectives"""
    def __init__(self):
        self.retrospectives: List[dict] = []
        self.improvements: List[ContinuousImprovementItem] = []

    def conduct_retrospective(
        self,
        iteration_name: str,
        what_went_well: List[str],
        what_to_improve: List[str],
        action_items: List[Dict]
    ) -> dict:
        """Conduct retrospective meeting"""
        retrospective = {
            "iteration": iteration_name,
            "date": datetime.now(),
            "went_well": what_went_well,
            "to_improve": what_to_improve,
            "action_items": action_items,
            "team_mood": self._calculate_team_mood(what_went_well, what_to_improve)
        }

        self.retrospectives.append(retrospective)

        for item in action_items:
            self.improvements.append(ContinuousImprovementItem(
                id=item.get("id", str(random.randint(1000, 9999))),
                description=item["description"],
                category=item.get("category", "process"),
                priority=item.get("priority", 5),
                owner=item.get("owner", "unassigned"),
                impact=item.get("impact", "unknown")
            ))

        return retrospective

    def _calculate_team_mood(
        self,
        positives: List[str],
        negatives: List[str]
    ) -> str:
        """Calculate team morale indicator"""
        if len(positives) > len(negatives) * 2:
            return "very_positive"
        elif len(positives) > len(negatives):
            return "positive"
        elif len(positives) == len(negatives):
            return "neutral"
        else:
            return "needs_attention"

    def track_improvement_progress(self) -> Dict[str, Dict]:
        """Track completion of improvement items"""
        progress = {}
        for item in self.improvements:
            progress[item.id] = {
                "description": item.description,
                "status": item.status,
                "age_days": (datetime.now() - item.created_at).days,
                "overdue": (
                    item.status != "done" and
                    (datetime.now() - item.created_at).days > 14
                )
            }
        return progress

    def generate_improvement_report(self) -> Dict[str, any]:
        """Generate improvement tracking report"""
        completed = [i for i in self.improvements if i.status == "done"]
        pending = [i for i in self.improvements if i.status != "done"]
        overdue = [i for i in pending if (datetime.now() - i.created_at).days > 14]

        by_category = {}
        for item in self.improvements:
            cat = item.category
            if cat not in by_category:
                by_category[cat] = {"total": 0, "completed": 0}
            by_category[cat]["total"] += 1
            if item.status == "done":
                by_category[cat]["completed"] += 1

        return {
            "total_improvements": len(self.improvements),
            "completed": len(completed),
            "pending": len(pending),
            "overdue": len(overdue),
            "completion_rate": len(completed) / max(1, len(self.improvements)),
            "by_category": by_category,
            "recommendations": self._generate_recommendations()
        }

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on trends"""
        recommendations = []

        overdue_count = sum(
            1 for i in self.improvements
            if i.status != "done" and (datetime.now() - i.created_at).days > 14
        )

        if overdue_count > 5:
            recommendations.append("Review overdue improvements and either complete or discard")

        categories = set(i.category for i in self.improvements)
        if len(categories) < 3:
            recommendations.append("Consider improvements across all categories")

        return recommendations
```

## Best Practices

- Start with a working process, then iterate on it continuously
- Focus on sustainable pace; burnout defeats Agile's purpose
- Make technical practices as important as process practices
- Encourage team ownership of process improvement
- Measure outcomes, not just activity
- Adapt frameworks to your context; don't force fit
- Invest in automated testing to enable safe changes
- Practice continuous integration and delivery
- Retrospect regularly and act on findings
- Balance planning with empiricism; embrace uncertainty

## Common Patterns

- **Scrum**: Time-boxed sprints with defined roles and ceremonies
- **Kanban**: Continuous flow with WIP limits
- **Scrumban**: Hybrid of Scrum and Kanban
- **Extreme Programming (XP)**: Technical practices focused
- **SAFe**: Scaled Agile Framework for enterprises
- **LeSS**: Large-Scale Scrum for multiple teams
- **Feature Teams**: Cross-functional teams owning features
- **DevOps**: Development and operations collaboration
- **Continuous Delivery**: Automated deployment pipeline
- **Trunk-Based Development**: Short-lived branches, frequent integration
