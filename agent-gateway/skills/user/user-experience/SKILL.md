---
name: user-experience
description: Comprehensive user experience design and strategy
category: interdisciplinary
difficulty: intermediate
tags: [ux, design, strategy, research]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# User Experience

## What I Do

I am User Experience (UX), the holistic discipline encompassing all aspects of a user's interaction with a product, service, or system. I go beyond interface design to consider the entire user journey including emotions, perceptions, and behaviors. I integrate user research, design, and strategy to create meaningful, effective experiences. I measure success through metrics like task completion, satisfaction, and emotional response. I advocate for users while balancing business goals and technical constraints. I create frameworks for consistent, empathetic design across products and touchpoints. I believe that great experiences don't happen by accident—they require intentional design and continuous iteration.

## When to Use Me

- Designing new products or features
- Improving existing products
- Creating design systems
- Developing brand experience strategy
- Planning user research initiatives
- Aligning teams around user needs
- Measuring and tracking UX metrics
- Training UX teams and stakeholders
- Conducting UX audits

## Core Concepts

**User Journey**: Sequence of steps users take to accomplish goals.

**Personas**: Fictional representations of user types.

**Jobs to Be Done**: Underlying motivations driving user behavior.

**Experience Maps**: Visual representation of user experience across touchpoints.

**Design Thinking**: Human-centered problem-solving methodology.

**Service Design**: Designing service ecosystems holistically.

**Emotional Design**: Designing for emotional response and connection.

**UX Metrics**: Quantitative measures of user experience success.

## Code Examples

### Example 1: User Journey Mapping
```python
#!/usr/bin/env python3
"""
User Journey Mapping Framework
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum
import json

class Stage(Enum):
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    DECISION = "decision"
    RETENTION = "retention"
    ADVOCACY = "advocacy"

class TouchpointType(Enum):
    WEBSITE = "website"
    MOBILE_APP = "mobile_app"
    EMAIL = "email"
    SOCIAL = "social"
    CUSTOMER_SERVICE = "customer_service"
    PHYSICAL = "physical"
    CHAT = "chat"

@dataclass
class Touchpoint:
    name: str
    type: TouchpointType
    channel: str
    description: str
    pain_points: List[str]
    opportunities: List[str]
    metrics: Dict[str, float]

@dataclass
class JourneyStage:
    name: str
    stage: Stage
    touchpoints: List[Touchpoint]
    user_goals: List[str]
    emotions: List[str]
    questions: List[str]
    barriers: List[str]
    success_metrics: List[str]

@dataclass
class UserJourney:
    journey_id: str
    persona: str
    primary_goal: str
    stages: List[JourneyStage]
    created_at: datetime
    last_updated: datetime

class JourneyMappingFramework:
    def __init__(self):
        self.journeys: Dict[str, UserJourney] = {}
        self.templates: Dict[str, UserJourney] = {}
    
    def create_journey(self, journey_id: str, persona: str, primary_goal: str) -> UserJourney:
        journey = UserJourney(
            journey_id=journey_id,
            persona=persona,
            primary_goal=primary_goal,
            stages=[],
            created_at=datetime.now(),
            last_updated=datetime.now()
        )
        self.journeys[journey_id] = journey
        return journey
    
    def add_stage(self, journey_id: str, stage: JourneyStage):
        if journey_id in self.journeys:
            self.journeys[journey_id].stages.append(stage)
            self.journeys[journey_id].last_updated = datetime.now()
    
    def generate_map(self, journey_id: str) -> Dict:
        journey = self.journeys.get(journey_id)
        if not journey:
            return {'error': 'Journey not found'}
        
        return {
            'summary': {
                'id': journey.journey_id,
                'persona': journey.persona,
                'goal': journey.primary_goal,
                'total_stages': len(journey.stages),
                'total_touchpoints': sum(
                    len(stage.touchpoints) for stage in journey.stages
                )
            },
            'touchpoint_analysis': self._analyze_touchpoints(journey),
            'pain_point_analysis': self._analyze_pain_points(journey),
            'emotion_analysis': self._analyze_emotions(journey),
            'opportunity_matrix': self._generate_opportunities(journey),
            'recommended_actions': self._generate_recommendations(journey)
        }
    
    def _analyze_touchpoints(self, journey: UserJourney) -> Dict:
        touchpoint_counts = {}
        for stage in journey.stages:
            for tp in stage.touchpoints:
                touchpoint_counts[tp.name] = touchpoint_counts.get(tp.name, 0) + 1
        
        return {
            'counts': touchpoint_counts,
            'most_frequent': max(touchpoint_counts.items(), key=lambda x: x[1]),
            'by_type': self._group_by_type(journey)
        }
    
    def _group_by_type(self, journey: UserJourney) -> Dict:
        by_type = {}
        for stage in journey.stages:
            for tp in stage.touchpoints:
                if tp.type.value not in by_type:
                    by_type[tp.type.value] = []
                by_type[tp.type.value].append({
                    'name': tp.name,
                    'stage': stage.name
                })
        return by_type
    
    def _analyze_pain_points(self, journey: UserJourney) -> Dict:
        all_pain_points = []
        for stage in journey.stages:
            all_pain_points.extend(stage.pain_points)
        
        return {
            'total': len(all_pain_points),
            'unique': list(set(all_pain_points)),
            'by_stage': {
                stage.name: stage.pain_points 
                for stage in journey.stages 
                if stage.pain_points
            }
        }
    
    def _analyze_emotions(self, journey: UserJourney) -> Dict:
        emotion_counts = {}
        for stage in journey.stages:
            for emotion in stage.emotions:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        return {
            'all_emotions': emotion_counts,
            'positive_count': sum(
                v for k, v in emotion_counts.items() 
                if k.lower() in ['happy', 'satisfied', 'confident', 'delighted']
            ),
            'negative_count': sum(
                v for k, v in emotion_counts.items() 
                if k.lower() in ['frustrated', 'confused', 'anxious', 'angry']
            )
        }
    
    def _generate_opportunities(self, journey: UserJourney) -> List[Dict]:
        opportunities = []
        for stage in journey.stages:
            for tp in stage.touchpoints:
                for opp in tp.opportunities:
                    opportunities.append({
                        'opportunity': opp,
                        'stage': stage.name,
                        'touchpoint': tp.name,
                        'impact': 'high' if stage.stage in [Stage.DECISION, Stage.RETENTION] else 'medium'
                    })
        return sorted(opportunities, key=lambda x: x['impact'], reverse=True)
    
    def _generate_recommendations(self, journey: UserJourney) -> List[Dict]:
        recommendations = []
        
        # Identify pain points with high impact
        for stage in journey.stages:
            if stage.barriers:
                recommendations.append({
                    'type': 'barrier_removal',
                    'priority': 'high',
                    'stage': stage.name,
                    'recommendation': f"Address barriers in {stage.name}",
                    'details': stage.barriers
                })
        
        # Identify emotion gaps
        emotion_analysis = self._analyze_emotions(journey)
        if emotion_analysis['negative_count'] > emotion_analysis['positive_count']:
            recommendations.append({
                'type': 'emotional_improvement',
                'priority': 'high',
                'recommendation': 'Improve overall emotional experience'
            })
        
        return recommendations


# Example Usage
framework = JourneyMappingFramework()

# Create journey
journey = framework.create_journey(
    "ecommerce_checkout",
    persona="Busy Professional",
    primary_goal="Complete purchase quickly and easily"
)

# Add awareness stage
framework.add_stage("ecommerce_checkout", JourneyStage(
    name="Discover Product",
    stage=Stage.AWARENESS,
    touchpoints=[
        Touchpoint(
            name="Search Engine",
            type=TouchpointType.WEBSITE,
            channel="Google",
            description="User searches for product",
            pain_points=["Slow loading", "Irrelevant results"],
            opportunities=["Better SEO", "Faster pages"],
            metrics={'bounce_rate': 45.0, 'time_on_site': 120.0}
        )
    ],
    user_goals=["Find product quickly", "Compare options"],
    emotions=["curious", "hopeful"],
    questions=["Is this what I need?", "What are the alternatives?"],
    barriers=["Information overload", "Trust issues"],
    success_metrics=["Conversion rate", "Time to purchase"]
))

print(json.dumps(framework.generate_map("ecommerce_checkout"), indent=2))
```

### Example 2: UX Metrics Dashboard
```python
@dataclass
class UXMetric:
    name: str
    value: float
    unit: str
    category: str
    trend: str  # up, down, stable
    target: float
    last_updated: datetime

class UXMetricsDashboard:
    def __init__(self):
        self.metrics: List[UXMetric] = []
        self.goals: Dict[str, float] = {}
    
    def track_metric(self, metric: UXMetric):
        self.metrics.append(metric)
    
    def set_goal(self, metric_name: str, target: float):
        self.goals[metric_name] = target
    
    def calculate_scorecard(self) -> Dict:
        scores = []
        for goal_name, target in self.goals.items():
            metric = self._get_latest_metric(goal_name)
            if metric:
                achieved = metric.value >= target
                score = (metric.value / target) * 100 if target > 0 else 0
                scores.append({
                    'metric': goal_name,
                    'current': metric.value,
                    'target': target,
                    'achieved': achieved,
                    'score': min(score, 100),
                    'trend': metric.trend
                })
        
        overall_score = sum(s['score'] for s in scores) / len(scores) if scores else 0
        
        return {
            'overall_score': overall_score,
            'metrics_breakdown': scores,
            'summary': {
                'achieved': sum(1 for s in scores if s['achieved']),
                'total': len(scores),
                'improving': sum(1 for s in scores if s['trend'] == 'up'),
                'declining': sum(1 for s in scores if s['trend'] == 'down')
            }
        }
    
    def _get_latest_metric(self, name: str) -> Optional[UXMetric]:
        return next(
            (m for m in reversed(self.metrics) if m.name == name),
            None
        )


# Common UX Metrics
UX_METRICS = {
    'task_completion_rate': 'Task Completion Rate',
    'time_on_task': 'Time on Task (seconds)',
    'task_success_rate': 'Task Success Rate',
    'system_usability_scale': 'SUS Score',
    'net_promoter_score': 'NPS',
    'customer_effort_score': 'CES',
    'first_try_success': 'First Try Success Rate',
    'error_rate': 'Error Rate',
    'time_to_value': 'Time to Value (hours)',
    'engagement_score': 'Engagement Score',
    'retention_rate': 'Retention Rate',
    'satisfaction_score': 'Satisfaction Score'
}
```

### Example 3: Design System Documentation
```python
DESIGN_SYSTEM = {
    "principles": [
        {
            "name": "User-Centered",
            "description": "Design decisions prioritize user needs and goals",
            "guidelines": [
                "Every interaction should serve a clear user purpose",
                "Reduce cognitive load through clarity and simplicity",
                "Test assumptions with real users regularly"
            ]
        },
        {
            "name": "Consistent",
            "description": "Similar elements behave similarly across the system",
            "guidelines": [
                "Follow established patterns before creating new ones",
                "Use the design system components first",
                "Document any deviations from patterns"
            ]
        },
        {
            "name": "Accessible",
            "description": "Everyone can use the product regardless of ability",
            "guidelines": [
                "Meet WCAG 2.1 AA standards",
                "Design for keyboard navigation",
                "Provide multiple ways to accomplish tasks"
            ]
        }
    ],
    "colors": {
        "primary": {
            "main": "#007AFF",
            "light": "#5AC8FA",
            "dark": "#0056B3",
            "contrast": "#FFFFFF"
        },
        "secondary": {
            "main": "#5856D6",
            "light": "#AF52DE",
            "dark": "#4639C8"
        },
        "semantic": {
            "success": "#34C759",
            "warning": "#FF9500",
            "error": "#FF3B30",
            "info": "#007AFF"
        },
        "accessibility": {
            "text_on_primary": "#FFFFFF",
            "text_on_secondary": "#FFFFFF",
            "text_on_success": "#FFFFFF"
        }
    },
    "typography": {
        "font_family": {
            "primary": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            "monospace": "SF Mono, Monaco, Consolas, monospace"
        },
        "scale": {
            "display": {"size": 48, "weight": "Bold", "line_height": 56},
            "h1": {"size": 32, "weight": "Bold", "line_height": 40},
            "h2": {"size": 24, "weight": "Semibold", "line_height": 32},
            "h3": {"size": 20, "weight": "Semibold", "line_height": 28},
            "body": {"size": 16, "weight": "Regular", "line_height": 24},
            "caption": {"size": 12, "weight": "Regular", "line_height": 16}
        }
    },
    "spacing": {
        "base_unit": 4,
        "scale": {
            "xs": 4,
            "sm": 8,
            "md": 16,
            "lg": 24,
            "xl": 32,
            "xxl": 48,
            "xxxl": 64
        }
    },
    "components": {
        "Button": {
            "variants": ["primary", "secondary", "ghost", "destructive"],
            "sizes": ["small", "medium", "large"],
            "states": ["default", "hover", "active", "disabled", "focus"],
            "accessibility": {
                "min_touch_target": "44x44px",
                "focus_indicator": "2px solid #007AFF",
                "aria_required": False
            }
        },
        "TextInput": {
            "variants": ["default", "error", "success", "disabled"],
            "sizes": ["small", "medium", "large"],
            "accessibility": {
                "labels": "Required",
                "error_announcement": True,
                "autocomplete": True
            }
        }
    }
}
```

## Best Practices

- Start with user research before designing
- Create and use personas to guide decisions
- Map complete user journeys
- Design for emotions, not just functionality
- Use data to inform design decisions
- Test continuously with real users
- Document design decisions and patterns
- Measure and track UX metrics
- Iterate based on feedback
- Balance user needs with business goals

## Core Competencies

- User research and synthesis
- Journey mapping
- Persona development
- Information architecture
- Interaction design
- Visual design
- Prototyping
- Usability testing
- UX metrics and analytics
- Design systems
- Service design
- Design strategy
- Stakeholder alignment
- Workshop facilitation
- Communication and presentation
