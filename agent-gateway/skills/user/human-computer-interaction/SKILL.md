---
name: human-computer-interaction
description: Principles and practices of human-computer interaction design
category: interdisciplinary
difficulty: intermediate
tags: [ux, design, research, usability]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Human-Computer Interaction

## What I Do

I am Human-Computer Interaction (HCI), the multidisciplinary field studying how people interact with computers and designing interfaces that enhance this interaction. I combine principles from computer science, psychology, design, and ergonomics to create user-friendly technologies. I focus on usability, accessibility, and the overall user experience. I employ research methods like user testing, contextual inquiry, and cognitive walkthroughs to understand user needs. I inform interface design through mental models, affordances, and feedback loops. I advocate for users throughout the design process, ensuring technology serves human needs rather than creating friction.

## When to Use Me

- Designing user interfaces and interactions
- Evaluating existing products for usability issues
- Planning user research and testing
- Creating accessible applications
- Improving workflow efficiency
- Designing new products or features
- Training UX researchers and designers
- Academic research in interaction design
- Accessible technology development

## Core Concepts

**Usability**: Ease of use measured by effectiveness, efficiency, and satisfaction.

**Affordances**: Visual cues suggesting how objects can be used.

**Mental Models**: Users' understanding of how systems work.

**Feedback**: System responses confirming user actions.

**Fitts's Law**: Time to reach target based on distance and size.

**Hick's Law**: Decision time increases with number of choices.

**Cognitive Load**: Mental effort required to use a system.

**Accessibility**: Design for users with diverse abilities.

## Code Examples

### Example 1: Usability Testing Framework
```python
#!/usr/bin/env python3
"""
Usability Testing Framework
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum
import json

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

@dataclass
class UsabilityTest:
    test_id: str
    participant_id: str
    task_name: str
    start_time: datetime
    end_time: Optional[datetime]
    status: TaskStatus
    success: bool
    time_on_task: float
    errors: List[str]
    comments: List[str]
    satisfaction_rating: Optional[int]

@dataclass
class UsabilitySession:
    session_id: str
    participant: Dict
    tasks: List[UsabilityTest]
    overall_satisfaction: float
    completion_rate: float
    average_task_time: float
    total_errors: int

class UsabilityTestingFramework:
    def __init__(self):
        self.sessions: List[UsabilitySession] = []
        self.task_definitions: Dict[str, Dict] = {}
    
    def add_task_definition(self, task_id: str, definition: Dict):
        self.task_definitions[task_id] = definition
    
    def create_session(self, participant_id: str, demographics: Dict) -> str:
        session = UsabilitySession(
            session_id=f"session_{len(self.sessions) + 1}",
            participant={
                'id': participant_id,
                'demographics': demographics,
                'created_at': datetime.now().isoformat()
            },
            tasks=[],
            overall_satisfaction=0,
            completion_rate=0,
            average_task_time=0,
            total_errors=0
        )
        self.sessions.append(session)
        return session.session_id
    
    def record_task_start(self, session_id: str, task_id: str) -> str:
        task = UsabilityTest(
            test_id=f"task_{len(self.sessions[len(self.sessions)-1].tasks) + 1}",
            participant_id=session_id,
            task_name=task_id,
            start_time=datetime.now(),
            end_time=None,
            status=TaskStatus.IN_PROGRESS,
            success=False,
            time_on_task=0,
            errors=[],
            comments=[],
            satisfaction_rating=None
        )
        self._get_session(session_id).tasks.append(task)
        return task.test_id
    
    def record_task_completion(
        self,
        session_id: str,
        test_id: str,
        success: bool,
        errors: List[str] = None,
        comments: List[str] = None,
        satisfaction: int = None
    ):
        session = self._get_session(session_id)
        task = self._get_task(session, test_id)
        
        task.end_time = datetime.now()
        task.status = TaskStatus.COMPLETED
        task.success = success
        task.time_on_task = (task.end_time - task.start_time).total_seconds()
        task.errors = errors or []
        task.comments = comments or []
        task.satisfaction_rating = satisfaction
    
    def generate_report(self) -> Dict:
        if not self.sessions:
            return {'error': 'No sessions recorded'}
        
        total_sessions = len(self.sessions)
        total_tasks = sum(len(s.tasks) for s in self.sessions)
        completed_tasks = sum(
            len([t for t in s.tasks if t.success])
            for s in self.sessions
        )
        
        all_task_times = [
            t.time_on_task
            for s in self.sessions
            for t in s.tasks
            if t.status == TaskStatus.COMPLETED
        ]
        
        all_errors = [
            len(t.errors)
            for s in self.sessions
            for t in s.tasks
        ]
        
        return {
            'summary': {
                'total_sessions': total_sessions,
                'total_tasks': total_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
                'average_task_time_seconds': sum(all_task_times) / len(all_task_times) if all_task_times else 0,
                'total_errors': sum(all_errors),
                'sessions_analyzed': total_sessions
            },
            'task_breakdown': self._analyze_tasks(),
            'error_analysis': self._analyze_errors(),
            'recommendations': self._generate_recommendations()
        }
    
    def _analyze_tasks(self) -> Dict:
        task_analysis = {}
        for task_def in self.task_definitions:
            task_times = []
            task_successes = []
            
            for session in self.sessions:
                for task in session.tasks:
                    if task.task_name == task_def:
                        task_times.append(task.time_on_task)
                        task_successes.append(task.success)
            
            task_analysis[task_def] = {
                'average_time': sum(task_times) / len(task_times) if task_times else 0,
                'success_rate': (sum(task_successes) / len(task_successes) * 100) if task_successes else 0,
                'completion_count': len(task_successes)
            }
        
        return task_analysis
    
    def _analyze_errors(self) -> Dict:
        error_counts = {}
        for session in self.sessions:
            for task in session.tasks:
                for error in task.errors:
                    error_counts[error] = error_counts.get(error, 0) + 1
        
        return dict(sorted(error_counts.items(), key=lambda x: x[1], reverse=True))
    
    def _generate_recommendations(self) -> List[str]:
        recommendations = []
        
        report = self.generate_report()
        
        if report['summary']['completion_rate'] < 80:
            recommendations.append("Review task flows for complexity and clarity")
        
        if report['summary']['average_task_time'] > 120:
            recommendations.append("Consider breaking complex tasks into smaller steps")
        
        error_analysis = report.get('error_analysis', {})
        if error_analysis:
            top_error = list(error_analysis.keys())[0] if error_analysis else None
            if top_error:
                recommendations.append(f"Address most common error: {top_error}")
        
        return recommendations


# Example Usage
framework = UsabilityTestingFramework()

framework.add_task_definition("login", {
    'description': 'User should be able to log in with valid credentials',
    'success_criteria': 'User reaches dashboard within 30 seconds'
})

framework.add_task_definition("search_product", {
    'description': 'User should find and view a specific product',
    'success_criteria': 'User views product details page'
})

session_id = framework.create_session(
    "participant_001",
    {'age': 25, 'experience': 'intermediate', 'device': 'desktop'}
)

test_id = framework.record_task_start(session_id, "login")
framework.record_task_completion(
    session_id, test_id,
    success=True,
    errors=[],
    comments=["Easy to find login button"],
    satisfaction=4
)

print(json.dumps(framework.generate_report(), indent=2))
```

### Example 2: Accessibility Checklist
```python
ACCESSIBILITY_CHECKLIST = {
    "Perceivable": [
        {
            "item": "Alternative text for images",
            "description": "All meaningful images have alt text",
            "priority": "critical",
            "wcag_level": "A"
        },
        {
            "item": "Captions for multimedia",
            "description": "Videos have captions and transcripts",
            "priority": "high",
            "wcag_level": "A"
        },
        {
            "item": "Color contrast",
            "description": "Text has 4.5:1 contrast ratio",
            "priority": "high",
            "wcag_level": "AA"
        },
        {
            "item": "Resize text",
            "description": "Text scales to 200% without loss of content",
            "priority": "medium",
            "wcag_level": "AA"
        }
    ],
    "Operable": [
        {
            "item": "Keyboard accessible",
            "description": "All functionality available via keyboard",
            "priority": "critical",
            "wcag_level": "A"
        },
        {
            "item": "Focus indicators",
            "description": "Visible focus indicators on interactive elements",
            "priority": "high",
            "wcag_level": "A"
        },
        {
            "item": "Skip navigation",
            "description": "Skip links provided for repeated content",
            "priority": "medium",
            "wcag_level": "A"
        },
        {
            "item": "No keyboard traps",
            "description": "Keyboard focus never gets stuck",
            "priority": "critical",
            "wcag_level": "A"
        },
        {
            "item": "Time limits",
            "description": "Time limits can be extended or turned off",
            "priority": "medium",
            "wcag_level": "A"
        }
    ],
    "Understandable": [
        {
            "item": "Readable content",
            "description": "Content is readable and understandable",
            "priority": "high",
            "wcag_level": "AAA"
        },
        {
            "item": "Predictable navigation",
            "description": "Navigation is consistent across pages",
            "priority": "medium",
            "wcag_level": "A"
        },
        {
            "item": "Input assistance",
            "description": "Form labels and error messages provided",
            "priority": "high",
            "wcag_level": "A"
        }
    ],
    "Robust": [
        {
            "item": "Valid HTML",
            "description": "HTML is well-formed and valid",
            "priority": "medium",
            "wcag_level": "A"
        },
        {
            "item": "ARIA landmarks",
            "description": "ARIA roles used appropriately",
            "priority": "medium",
            "wcag_level": "A"
        }
    ]
}

class AccessibilityAuditor:
    def __init__(self):
        self.violations = []
        self.warnings = []
        self.passed = []
    
    def audit_page(self, page_data: Dict) -> Dict:
        for category, checks in ACCESSIBILITY_CHECKLIST.items():
            for check in checks:
                result = self._check_element(page_data, check)
                
                if result['status'] == 'fail':
                    self.violations.append({
                        'category': category,
                        'item': check['item'],
                        'message': result['message'],
                        'priority': check['priority'],
                        'wcag_level': check['wcag_level']
                    })
                elif result['status'] == 'warning':
                    self.warnings.append(result['message'])
                else:
                    self.passed.append(check['item'])
        
        return {
            'violations': self.violations,
            'warnings': self.warnings,
            'passed': len(self.passed),
            'score': self._calculate_score(),
            'recommendations': self._generate_recommendations()
        }
    
    def _check_element(self, page_data: Dict, check: Dict) -> Dict:
        # Simplified check implementation
        return {'status': 'pass', 'message': 'Check not implemented'}
    
    def _calculate_score(self) -> float:
        total_checks = len(ACCESSIBILITY_CHECKLIST) * len(list(ACCESSIBILITY_CHECKLIST.values())[0])
        return len(self.passed) / total_checks * 100
    
    def _generate_recommendations(self) -> List[str]:
        recommendations = []
        
        critical_violations = [v for v in self.violations if v['priority'] == 'critical']
        if critical_violations:
            recommendations.append(
                f"Fix {len(critical_violations)} critical accessibility violations"
            )
        
        return recommendations
```

### Example 3: Eye Tracking Analysis
```python
@dataclass
class GazePoint:
    x: float
    y: float
    timestamp: float
    duration: float

@dataclass
class AOI:
    name: str
    bounds: Tuple[float, float, float, float]  # x1, y1, x2, y2
    order: int

class EyeTrackingAnalyzer:
    def __init__(self):
        self.fixations: List[GazePoint] = []
        self.aois: List[AOI] = []
    
    def load_data(self, data_file: str):
        # Load eye tracking data from file
        pass
    
    def add_aoi(self, aoi: AOI):
        self.aois.append(aoi)
    
    def identify_fixations(self, gaze_data: List[GazePoint], 
                         velocity_threshold: float = 30) -> List[GazePoint]:
        """Identify fixation points from raw gaze data"""
        fixations = []
        current_fixation = None
        
        for point in gaze_data:
            if current_fixation is None:
                current_fixation = point
            else:
                distance = self._calculate_distance(current_fixation, point)
                velocity = distance / (point.timestamp - current_fixation.timestamp)
                
                if velocity < velocity_threshold:
                    current_fixation = self._merge_fixations(current_fixation, point)
                else:
                    if self._is_significant_fixation(current_fixation):
                        fixations.append(current_fixation)
                    current_fixation = point
        
        return fixations
    
    def calculate_aoi_metrics(self, fixations: List[GazePoint]) -> Dict:
        """Calculate metrics for each Area of Interest"""
        aoi_metrics = {}
        
        for aoi in self.aois:
            aoi_fixations = [
                f for f in fixations
                if self._point_in_aoi(f, aoi)
            ]
            
            aoi_metrics[aoi.name] = {
                'fixation_count': len(aoi_fixations),
                'total_duration': sum(f.duration for f in aoi_fixations),
                'average_duration': (
                    sum(f.duration for f in aoi_fixations) / len(aoi_fixations) 
                    if aoi_fixations else 0
                ),
                'time_to_first': self._time_to_first_fixation(aoi_fixations),
                'visit_order': min((f.timestamp for f in aoi_fixations), default=float('inf'))
            }
        
        return aoi_metrics
    
    def generate_heat_map(self, fixations: List[GazePoint]) -> Dict:
        """Generate heat map data from fixations"""
        import numpy as np
        
        # Create density grid
        grid_size = 100
        heat_map = np.zeros((grid_size, grid_size))
        
        for fixation in fixations:
            x, y = self._normalize_coordinates(fixation.x, fixation.y)
            grid_x, grid_y = int(x * grid_size), int(y * grid_size)
            if 0 <= grid_x < grid_size and 0 <= grid_y < grid_size:
                heat_map[grid_x][grid_y] += fixation.duration
        
        return {
            'data': heat_map.tolist(),
            'max_value': float(heat_map.max()),
            'hotspots': self._identify_hotspots(heat_map)
        }
```

## Best Practices

- Design for users, not just technology
- Test with real users early and often
- Follow established usability heuristics
- Prioritize accessibility from the start
- Use iterative design with user feedback
- Document design decisions and rationale
- Consider context of use
- Balance efficiency and ease of use
- Provide clear feedback and recovery
- Design for diverse users and abilities

## Core Competencies

- User research methods
- Usability testing design
- Cognitive psychology principles
- Accessibility standards (WCAG)
- Information architecture
- Interaction design patterns
- Visual design fundamentals
- Prototyping techniques
- Eye tracking and biometrics
- Survey design and analysis
- Statistical analysis for UX
- Accessibility auditing
- Mental model analysis
- Task analysis
- Contextual inquiry
