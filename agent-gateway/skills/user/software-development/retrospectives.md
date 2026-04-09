---
name: retrospectives
description: Practice of reflecting on team processes to identify and implement improvements
category: software-development
---

# Retrospectives

## What I Do

I am a structured practice of reflecting on team processes, identifying what went well and what could be improved, and committing to actionable changes. I help teams continuously improve their way of working through regular, facilitated discussions. By creating psychological safety and focused reflection, I enable teams to adapt and grow stronger over time.

## When to Use Me

Use me at the end of every iteration, sprint, or project milestone to reflect and improve. I am essential for agile teams committed to continuous improvement. I work well for any team that wants to develop a culture of learning and adaptation. Use me to address recurring issues, celebrate successes, and prevent problems from persisting.

## Core Concepts

- **Psychological Safety**: Creating an environment where team members can speak freely
- **Prime Directive**: Framing retrospectives with positive assumptions about intentions
- **Working Agreements**: Team norms established for effective collaboration
- **Action Items**: Specific, measurable improvements the team commits to
- **Retro Formats**: Different structures for running retrospectives
- **Improvement Backlog**: Prioritized list of improvements to implement
- **Team Health Metrics**: Indicators of team wellbeing and effectiveness
- **Blameless Culture**: Focusing on systems rather than individuals
- **Experiments**: Small tests of proposed improvements
- **Follow-Up**: Tracking progress on improvement commitments

## Code Examples

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
import uuid

class RetroFormat(Enum):
    START_STOP_CONTINUE = "start_stop_continue"
    WHAT_WENT_WELL = "what_went_well"
    FOUR_LS = "four_ls"
    SAFe_RETRO = "safe_retro"
    MAD_SAD_GLAD = "mad_sad_glad"
    TRIANGLE = "triangle"
    KALM = "kalm"

class FeedbackCategory(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    IDEA = "idea"
    QUESTION = "question"
    PRAISE = "praise"

@dataclass
class RetroItem:
    """Represents a single item in a retrospective"""
    id: str
    category: FeedbackCategory
    content: str
    votes: int = 0
    author: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    discussion_notes: str = ""
    action_items: List[str] = field(default_factory=list)

@dataclass
class ActionItem:
    """Represents an improvement action from a retrospective"""
    id: str
    description: str
    category: str
    priority: int
    owner: Optional[str] = None
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    completion_criteria: str = ""
    retro_source: str = ""

    def is_overdue(self) -> bool:
        return self.due_date and datetime.now() > self.due_date and self.status != "done"

class RetrospectiveSession:
    """Manages a retrospective session"""
    def __init__(
        self,
        name: str,
        retro_format: RetroFormat,
        facilitator: str,
        team_members: List[str]
    ):
        self.id = str(uuid.uuid4())[:8]
        self.name = name
        self.format = retro_format
        self.facilitator = facilitator
        self.team_members = team_members
        self.items: List[RetroItem] = []
        self.action_items: List[ActionItem] = []
        self.started_at = datetime.now()
        self.ended_at: Optional[datetime] = None
        self.energy_level: Optional[int] = None
        self.overall_sentiment: str = ""

    def add_item(self, category: FeedbackCategory, content: str, author: str = "") -> RetroItem:
        item = RetroItem(
            id=str(uuid.uuid4())[:8],
            category=category,
            content=content,
            author=author
        )
        self.items.append(item)
        return item

    def vote_on_item(self, item_id: str, votes: int = 1) -> None:
        for item in self.items:
            if item.id == item_id:
                item.votes += votes
                break

    def add_discussion_note(self, item_id: str, note: str) -> None:
        for item in self.items:
            if item.id == item_id:
                item.discussion_notes += f"\n{note}"
                break

    def create_action_item(
        self,
        description: str,
        category: str,
        priority: int,
        owner: Optional[str] = None,
        due_date: Optional[datetime] = None,
        retro_source: str = ""
    ) -> ActionItem:
        action = ActionItem(
            id=str(uuid.uuid4())[:8],
            description=description,
            category=category,
            priority=priority,
            owner=owner,
            due_date=due_date,
            retro_source=retro_source or self.name
        )
        self.action_items.append(action)
        return action

    def end_session(self, energy_level: int, sentiment: str) -> Dict:
        self.ended_at = datetime.now()
        self.energy_level = energy_level
        self.overall_sentiment = sentiment

        return {
            "name": self.name,
            "duration_minutes": (self.ended_at - self.started_at).total_seconds() / 60,
            "items_count": len(self.items),
            "top_items": sorted(self.items, key=lambda i: i.votes, reverse=True)[:5],
            "action_items_count": len(self.action_items),
            "energy_level": energy_level,
            "sentiment": sentiment
        }

    def get_top_items(self, top_n: int = 5) -> List[RetroItem]:
        return sorted(self.items, key=lambda i: i.votes, reverse=True)[:top_n]

    def get_items_by_category(self) -> Dict[FeedbackCategory, List[RetroItem]]:
        categorized = {category: [] for category in FeedbackCategory}
        for item in self.items:
            categorized[item.category].append(item)
        return categorized
```

```python
class RetrospectiveAnalyzer:
    """Analyzes retrospective data for trends and insights"""
    def __init__(self):
        self.sessions: List[RetrospectiveSession] = []

    def add_session(self, session: RetrospectiveSession) -> None:
        self.sessions.append(session)

    def identify_recurring_themes(self) -> Dict[str, List[Dict]]]:
        themes = {}
        all_content = " ".join(
            item.content.lower()
            for session in self.sessions
            for item in session.items
        )

        keywords = [
            "communication", "documentation", "testing", "deadline",
            "planning", "review", "meetings", "dependencies", "tools",
            "process", "workflow", "quality", "speed", "feedback"
        ]

        for keyword in keywords:
            if keyword.lower() in all_content:
                themes[keyword] = [
                    {"session": session.name, "item": item.content, "votes": item.votes}
                    for session in self.sessions
                    for item in session.items
                    if keyword.lower() in item.content.lower()
                ]

        return themes

    def calculate_trend(self, metric: str) -> Dict:
        trend_data = []
        for session in sorted(self.sessions, key=lambda s: s.started_at):
            if metric == "energy":
                if session.energy_level is not None:
                    trend_data.append({
                        "session": session.name,
                        "date": session.started_at,
                        "value": session.energy_level
                    })
            elif metric == "sentiment":
                sentiment_map = {"positive": 1, "neutral": 0, "negative": -1}
                if session.overall_sentiment:
                    trend_data.append({
                        "session": session.name,
                        "date": session.started_at,
                        "value": sentiment_map.get(session.overall_sentiment, 0)
                    })

        if len(trend_data) < 2:
            return {"trend": "insufficient_data", "data_points": trend_data}

        sorted_trend = sorted(trend_data, key=lambda d: d["date"])
        values = [d["value"] for d in sorted_trend]
        first_half_avg = sum(values[:len(values)//2]) / (len(values)//2)
        second_half_avg = sum(values[len(values)//2:]) / (len(values) - len(values)//2)

        change = second_half_avg - first_half_avg

        return {
            "trend": "improving" if change > 0.1 else "declining" if change < -0.1 else "stable",
            "change": change,
            "data_points": trend_data
        }

    def identify_improvement_patterns(self) -> Dict:
        action_completion = []
        for session in self.sessions:
            for action in session.action_items:
                action_completion.append({
                    "category": action.category,
                    "completed": action.status == "done",
                    "days_to_complete": (
                        (action.created_at - datetime.now()).days
                        if action.status == "done" else None
                    )
                })

        completion_by_category = {}
        for action in action_completion:
            cat = action["category"]
            if cat not in completion_by_category:
                completion_by_category[cat] = {"total": 0, "completed": 0}
            completion_by_category[cat]["total"] += 1
            if action["completed"]:
                completion_by_category[cat]["completed"] += 1

        return {
            "completion_rates": {
                cat: data["completed"] / data["total"] if data["total"] > 0 else 0
                for cat, data in completion_by_category.items()
            },
            "best_performing_category": max(
                completion_by_category.items(),
                key=lambda x: x[1]["completed"] / x[1]["total"] if x[1]["total"] > 0 else 0
            )[0] if completion_by_category else None
        }

    def generate_improvement_recommendations(self) -> List[Dict]:
        recommendations = []
        themes = self.identify_recurring_themes()

        for theme, mentions in themes.items():
            if len(mentions) >= 3:
                recommendations.append({
                    "area": theme,
                    "frequency": len(mentions),
                    "priority": "high",
                    "recommendation": f"Address recurring {theme} issues",
                    "evidence": mentions[:3]
                })

        trend = self.calculate_trend("energy")
        if trend.get("trend") == "declining":
            recommendations.append({
                "area": "team_energy",
                "priority": "high",
                "recommendation": "Investigate causes of declining team energy",
                "trend_data": trend
            })

        completion = self.identify_improvement_patterns()
        low_completion = [cat for cat, rate in completion["completion_rates"].items() if rate < 0.5]
        if low_completion:
            recommendations.append({
                "area": "action_item_completion",
                "priority": "medium",
                "recommendation": f"Improve follow-through on {', '.join(low_completion)} improvements",
                "affected_categories": low_completion
            })

        return recommendations
```

```python
class RetroActionTracker:
    """Tracks completion of retrospective action items"""
    def __init__(self):
        self.action_items: List[ActionItem] = []

    def add_action_item(self, action: ActionItem) -> None:
        self.action_items.append(action)

    def get_pending_actions(self) -> List[ActionItem]:
        return [a for a in self.action_items if a.status != "done"]

    def get_overdue_actions(self) -> List[ActionItem]:
        return [a for a in self.action_items if a.is_overdue()]

    def update_status(self, action_id: str, status: str) -> Dict:
        for action in self.action_items:
            if action.id == action_id:
                action.status = status
                return {"success": True, "action": action.description}
        return {"error": "Action not found"}

    def get_actions_by_owner(self) -> Dict[str, List[ActionItem]]:
        by_owner = {}
        for action in self.action_items:
            if action.owner:
                if action.owner not in by_owner:
                    by_owner[action.owner] = []
                by_owner[action.owner].append(action)
        return by_owner

    def get_actions_by_category(self) -> Dict[str, List[ActionItem]]:
        by_category = {}
        for action in self.action_items:
            if action.category not in by_category:
                by_category[action.category] = []
            by_category[action.category].append(action)
        return by_category

    def calculate_completion_rate(self) -> float:
        completed = sum(1 for a in self.action_items if a.status == "done")
        return completed / len(self.action_items) if self.action_items else 0

    def generate_completion_report(self) -> Dict:
        pending = self.get_pending_actions()
        overdue = self.get_overdue_actions()

        return {
            "total_actions": len(self.action_items),
            "completed": len(self.action_items) - len(pending),
            "pending": len(pending),
            "overdue": len(overdue),
            "completion_rate_percent": self.calculate_completion_rate() * 100,
            "overdue_by_category": {
                cat: len([a for a in overdue if a.category == cat])
                for cat in set(a.category for a in overdue)
            }
        }
```

```python
class RetroFacilitator:
    """Helps facilitate effective retrospectives"""
    def __init__(self):
        self.prime_directive = (
            "Regardless of what we discover today, we understand and truly believe "
            "that everyone did the best they could, given what they knew at the time, "
            "their skills and abilities, the resources available, and the situation at hand."
        )

    def guide_start_stop_continue(self, session: RetrospectiveSession) -> Dict:
        items = session.get_items_by_category()
        return {
            "format": "Start, Stop, Continue",
            "start": [item.content for item in items.get("IDEA", [])],
            "stop": [item.content for item in items.get("NEGATIVE", [])],
            "continue": [item.content for item in items.get("POSITIVE", [])]
        }

    def guide_four_ls(self, session: RetrospectiveSession) -> Dict:
        items = session.get_items_by_category()
        return {
            "format": "Four Ls",
            "liked": [item.content for item in items.get("POSITIVE", [])],
            "learned": [item.content for item in items.get("IDEA", [])],
            "lacked": [item.content for item in items.get("NEGATIVE", [])],
            "longed_for": [item.content for item in items.get("QUESTION", [])]
        }

    def suggest_experiments(self, session: RetrospectiveSession) -> List[Dict]:
        items = session.get_items_by_category()
        experiments = []

        for item in items.get("IDEA", []):
            experiments.append({
                "description": f"Try: {item.content}",
                "hypothesis": f"If we try {item.content}, then we will see improvement in {item.votes} votes",
                "duration": "1 sprint",
                "success_criteria": "Measurable improvement in next retro"
            })

        return experiments

    def create_team_health_check(self) -> Dict:
        return {
            "categories": [
                " Psychological Safety",
                " Dependability",
                " Structure and Clarity",
                " Meaning",
                " Impact"
            ],
            "questions": [
                "Can we take risks without feeling insecure or embarrassed?",
                "Can we count on each other to complete quality work on time?",
                "Do we understand our roles and responsibilities clearly?",
                "Does our work feel personally meaningful to us?",
                "Does our work matter to the larger organization?"
            ],
            "scale": "1-7 Likert scale"
        }
```

## Best Practices

- Hold retrospectives regularly at consistent intervals to build team habit
- Create psychological safety so team members can speak openly without fear
- Focus on actionable improvements rather than just discussing problems
- Limit action items to 2-3 per iteration to ensure follow-through
- Assign clear owners and due dates to all improvement actions
- Track and review progress on action items in subsequent retrospectives
- Rotate facilitation to develop all team members
- Use different retro formats periodically to keep engagement high
- Celebrate what went well, not just what needs improvement
- Follow up on experiments and measure their impact

## Common Patterns

- **Start, Stop, Continue**: Simple format for identifying changes
- **Four Ls**: Liked, Learned, Lacked, Longed For
- **Mad, Sad, Glad**: Emotional retrospective
- **Sailboat**: Wind, Anchors, Rocks, Island
- **Lean Coffee**: Team-driven agenda
- **Hot Air Balloon**: What inflates us, what weighs us down
- **KALM**: Keep, Add, More, Less
- **Timeline Retro**: Walk through events chronologically
