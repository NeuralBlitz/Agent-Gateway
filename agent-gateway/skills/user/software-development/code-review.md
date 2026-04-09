---
name: Code Review
description: Systematic examination of source code to improve quality, share knowledge, and ensure standards compliance
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Languages
audience: Software Developers, Team Leads, Quality Engineers
category: software-development
---

# Code Review

## What I Do

I provide comprehensive guidance on establishing and executing effective code review practices that improve code quality, foster knowledge sharing, and maintain consistent standards across software projects. Code review is one of the most powerful quality assurance techniques, catching bugs before they reach production while spreading expertise across team members. I cover review checklists, feedback strategies, automation integration, and cultural aspects that make code reviews productive rather than adversarial.

## When to Use Me

Use code review for all non-trivial code changes before merging to main branches. Code review is essential for feature development, bug fixes, refactoring, and configuration changes. It's particularly valuable when onboarding new team members, working with unfamiliar codebases, or implementing security-sensitive changes. Skip formal reviews for obvious documentation fixes, trivial refactoring, or emergencies where time-critical fixes bypass standard processes. Always review code written by others rather than yourself, as self-review is less effective at catching issues.

## Core Concepts

- **Pull Request (PR)**: Self-contained code change package ready for review and merge
- **Review Scope**: Boundary of code under review, including related tests and documentation
- **Comments Types**: Suggestions (minor), approximations (prefer alternative), blockers (must fix)
- **Linting Automation**: Automated code style checking before human review begins
- **CI Gate**: Continuous integration checks that must pass before review starts
- **Review Depth**: Surface-level (typos/style), mid-level (logic/architecture), deep-level (algorithms/security)
- **Review Speed**: Aim for reviews within 24 hours to maintain developer momentum
- **Knowledge Transfer**: Unintended but valuable benefit of spreading expertise across team
- **Author Responsibility**: Author prepares code for review and responds to all feedback
- **Merge Requirements**: Defined criteria that must be met before code can be merged

## Code Examples

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional, Callable
from enum import Enum
from hashlib import sha256

class ReviewStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    REJECTED = "rejected"

class CommentType(Enum):
    SUGGESTION = "suggestion"
    APPROXIMATION = "approximation"
    BLOCKER = "blocker"
    QUESTION = "question"
    PRAISE = "praise"

@dataclass
class ReviewComment:
    """Represents a single review comment"""
    id: str
    file_path: str
    line_number: int
    comment_type: CommentType
    content: str
    author: str
    created_at: datetime
    is_resolved: bool = False
    reply_to: Optional[str] = None

    @classmethod
    def create(cls, file_path: str, line: int, ctype: CommentType, author: str, content: str) -> "ReviewComment":
        """Factory method with auto-generated ID"""
        content_hash = sha256(f"{file}{line}{content}".encode()).hexdigest()[:8]
        return cls(
            id=f"comment-{content_hash}",
            file_path=file_path,
            line_number=line,
            comment_type=ctype,
            author=author,
            content=content,
            created_at=datetime.now()
        )

@dataclass
class CodeReview:
    """Manages a complete code review session"""
    pull_request_id: str
    title: str
    description: str
    author: str
    reviewers: List[str]
    status: ReviewStatus = ReviewStatus.PENDING
    comments: List[ReviewComment] = None
    created_at: datetime = None
    approved_at: Optional[datetime] = None
    changed_files: int = 0
    lines_changed: int = 0

    def __post_init__(self):
        if self.comments is None:
            self.comments = []
        if self.created_at is None:
            self.created_at = datetime.now()

    def add_comment(
        self,
        file_path: str,
        line: int,
        ctype: CommentType,
        reviewer: str,
        content: str
    ) -> ReviewComment:
        """Add a comment to the review"""
        comment = ReviewComment.create(file_path, line, ctype, reviewer, content)
        self.comments.append(comment)
        self._update_status()
        return comment

    def resolve_comment(self, comment_id: str) -> bool:
        """Mark a comment as resolved"""
        for comment in self.comments:
            if comment.id == comment_id:
                comment.is_resolved = True
                return True
        return False

    def get_unresolved_comments(self) -> List[ReviewComment]:
        """Get all unresolved comments"""
        return [c for c in self.comments if not c.is_resolved]

    def get_blockers(self) -> List[ReviewComment]:
        """Get only blocker-level comments"""
        return [c for c in self.comments if c.comment_type == CommentType.BLOCKER]

    def _update_status(self) -> None:
        """Update review status based on comments"""
        blockers = self.get_blockers()
        unresolved = self.get_unresolved_comments()

        if blockers:
            self.status = ReviewStatus.CHANGES_REQUESTED
        elif unresolved:
            self.status = ReviewStatus.IN_PROGRESS

    def approve(self, reviewer: str) -> None:
        """Approve the review"""
        if reviewer not in self.reviewers:
            raise ValueError(f"{reviewer} is not a designated reviewer")
        if self.get_blockers():
            raise ValueError("Cannot approve with unresolved blockers")

        self.status = ReviewStatus.APPROVED
        self.approved_at = datetime.now()

    def get_review_summary(self) -> dict:
        """Generate review summary statistics"""
        return {
            "pr_id": self.pull_request_id,
            "status": self.status.value,
            "duration_hours": (
                (self.approved_at - self.created_at).total_seconds() / 3600
                if self.approved_at else None
            ),
            "total_comments": len(self.comments),
            "blockers": len(self.get_blockers()),
            "suggestions": len([c for c in self.comments if c.comment_type == CommentType.SUGGESTION]),
            "approvers": [r for r in self.reviewers if any(
                c.author == r and c.comment_type == CommentType.PRAISE
                for c in self.comments
            )]
        }
```

```python
class ReviewChecklist:
    """Provides configurable code review checklists"""
    def __init__(self):
        self.checks = {
            "functionality": [
                "Code correctly implements the specified requirements",
                "Edge cases are handled appropriately",
                "Error messages are user-friendly and informative",
                "No hardcoded values that should be configurable"
            ],
            "design": [
                "Single Responsibility Principle is followed",
                "Functions are small and focused (ideally < 20 lines)",
                "Code is DRY (Don't Repeat Yourself)",
                "Dependencies are injected rather than hardcoded"
            ],
            "readability": [
                "Naming clearly describes purpose (variables, functions, classes)",
                "Complex logic includes explanatory comments",
                "Formatting is consistent with project style",
                "No commented-out dead code remains"
            ],
            "testing": [
                "New code includes unit test coverage",
                "Tests are meaningful and not trivial assertions",
                "Edge cases and error scenarios are tested",
                "Test names clearly describe what is being tested"
            ],
            "performance": [
                "No unnecessary database queries or API calls",
                "Appropriate data structures are used",
                "Large iterations are optimized when needed",
                "No blocking operations in hot paths"
            ],
            "security": [
                "No sensitive data in logs",
                "Input validation and sanitization is present",
                "Authentication/authorization checks are in place",
                "No use of deprecated or insecure libraries"
            ]
        }

    def get_checklist(self, category: str = "all") -> List[str]:
        """Get checklist items for a category"""
        if category == "all":
            items = []
            for category_checks in self.checks.values():
                items.extend(category_checks)
            return items
        return self.checks.get(category, [])

    def evaluate_checklist(
        self,
        code_analysis: dict
    ) -> Dict[str, Dict[str, bool]]:
        """Evaluate code against checklist based on analysis results"""
        results = {}
        for category, checks in self.checks.items():
            category_results = {}
            for check in checks:
                check_key = check[:30].lower().replace(" ", "_")
                category_results[check_key] = code_analysis.get(check_key, False)
            results[category] = category_results
        return results

    def generate_review_comments(
        self,
        category: str,
        failed_checks: List[str]
    ) -> List[dict]:
        """Generate review comments for failed checklist items"""
        comments = []
        for check in failed_checks:
            comments.append({
                "type": CommentType.APPROXIMATION,
                "content": f"Check failed: {check}",
                "suggestion": "Please review and address this concern"
            })
        return comments
```

```python
class AutomatedReviewGate:
    """Manages automated checks before and during code review"""
    def __init__(self):
        self.gates = []
        self.results = []

    def add_gate(self, name: str, check_func: Callable, required: bool = True) -> None:
        """Add an automated gate check"""
        self.gates.append({
            "name": name,
            "check": check_func,
            "required": required
        })

    def run_gates(self, code_context: dict) -> dict:
        """Run all gates and return results"""
        self.results = []
        all_passed = True

        for gate in self.gates:
            try:
                passed = gate["check"](code_context)
                self.results.append({
                    "name": gate["name"],
                    "passed": passed,
                    "required": gate["required"],
                    "message": "Passed" if passed else "Failed"
                })
                if not passed and gate["required"]:
                    all_passed = False
            except Exception as e:
                self.results.append({
                    "name": gate["name"],
                    "passed": False,
                    "required": gate["required"],
                    "message": f"Error: {str(e)}"
                })
                all_passed = False

        return {
            "all_passed": all_passed,
            "results": self.results
        }

    def lint_check(code: str) -> bool:
        """Example: Linting gate"""
        import re
        max_line_length = 100
        for i, line in enumerate(code.split("\n"), 1):
            if len(line) > max_line_length:
                return False
        return True

    def test_coverage_check(coverage_data: dict, minimum: float = 80.0) -> bool:
        """Example: Test coverage gate"""
        return coverage_data.get("line_coverage", 0) >= minimum
```

```python
class ReviewMetrics:
    """Tracks and analyzes code review patterns and effectiveness"""
    def __init__(self):
        self.reviews: List[CodeReview] = []

    def record_review(self, review: CodeReview) -> None:
        """Record a completed review"""
        self.reviews.append(review)

    def get_average_review_time(self, days: int = 30) -> float:
        """Calculate average hours from review request to approval"""
        cutoff = datetime.now() - timedelta(days=days)
        completed = [
            r for r in self.reviews
            if r.approved_at and r.created_at >= cutoff
        ]
        if not completed:
            return 0.0

        total_hours = sum(
            (r.approved_at - r.created_at).total_seconds() / 3600
            for r in completed
        )
        return total_hours / len(completed)

    def get_reviewer_stats(self) -> dict:
        """Calculate statistics per reviewer"""
        stats = {}
        for review in self.reviews:
            for reviewer in review.reviewers:
                if reviewer not in stats:
                    stats[reviewer] = {
                        "reviews_done": 0,
                        "comments_given": 0,
                        "avg_response_time_hours": 0
                    }
                stats[reviewer]["reviews_done"] += 1
                stats[reviewer]["comments_given"] += len([
                    c for c in review.comments if c.author == reviewer
                ])
        return stats

    def get BottleneckAnalysis(self) -> dict:
        """Identify review bottlenecks and slow periods"""
        return {
            "slow_reviews": sorted(
                self.reviews,
                key=lambda r: (r.approved_at - r.created_at).total_seconds() / 3600
                if r.approved_at else 0,
                reverse=True
            )[:5],
            "reviewers_at_capacity": [
                reviewer for reviewer, stats in self.get_reviewer_stats().items()
                if stats["reviews_done"] > 10
            ],
            "common_blockers": self._analyze_common_blockers()
        }

    def _analyze_common_blockers(self) -> List[str]:
        """Analyze blocker comments to find common issues"""
        blocker_contents = [
            c.content for review in self.reviews
            for c in review.get_blockers()
        ]
        return blocker_contents[:5]
```

```python
class ReviewFeedbackGenerator:
    """Generates constructive feedback comments for code review"""
    def __init__(self):
        self.templates = {
            CommentType.SUGGESTION: [
                "Consider using {alternative} for improved clarity",
                "This could be simplified by extracting to {suggestion}",
                "Nit: {alternative_naming} might be more descriptive"
            ],
            CommentType.APPROXIMATION: [
                "Have you considered {alternative_approach}?",
                "This might not handle {edge_case} - can you verify?",
                "There might be a more idiomatic way to {suggestion}"
            ],
            CommentType.BLOCKER: [
                "This needs to be fixed before merge: {issue}",
                "Security concern: {vulnerability_description}",
                "This breaks existing functionality: {description}"
            ],
            CommentType.QUESTION: [
                "Can you explain the reasoning behind {design_decision}?",
                "What's the expected behavior for {scenario}?",
                "Would you walk me through this algorithm?"
            ],
            CommentType.PRAISE: [
                "Nice solution! Clean and efficient.",
                "Great attention to detail on {aspect}",
                "Well documented - makes the code very approachable"
            ]
        }

    def generate_feedback(
        self,
        comment_type: CommentType,
        context: dict
    ) -> str:
        """Generate feedback comment using templates"""
        import random
        templates = self.templates.get(comment_type, [])
        if not templates:
            return ""

        template = random.choice(templates)
        return template.format(**context)

    def review_feedback(
        self,
        review: CodeReview,
        tone: str = "constructive"
    ) -> dict:
        """Generate overall feedback summary for a review"""
        summary = {
            "strengths": [],
            "improvements": [],
            "overall_assessment": ""
        }

        suggestions = [c for c in review.comments if c.comment_type == CommentType.SUGGESTION]
        blockers = review.get_blockers()
        praises = [c for c in review.comments if c.comment_type == CommentType.PRAISE]

        if blockers:
            summary["overall_assessment"] = "Changes requested - address blockers before approval"
        elif len(suggestions) > 10:
            summary["overall_assessment"] = "Approve with suggestions - minor improvements needed"
        elif not suggestions:
            summary["overall_assessment"] = "LGTM - ready to merge"
        else:
            summary["overall_assessment"] = "Approve with minor suggestions"

        return summary
```

## Best Practices

- Review code within 24 hours to maintain developer momentum and avoid context switching
- Be specific and constructive in comments, offering solutions not just criticism
- Distinguish between blockers (must fix), approximations (should consider), and suggestions (nice to have)
- Automate style and basic checks so reviewers focus on architecture and logic
- Keep reviews small (< 400 lines) for thorough examination and faster turnaround
- Use checklists to ensure consistent coverage across all reviews
- Praise good code alongside constructive criticism to maintain positive culture
- Explain the "why" behind standards, not just the "what"
- Author should respond to all comments, even just to say "done" or "acknowledged"
- Track review metrics to identify process improvements and team bottlenecks

## Common Patterns

- **LGTM with Comments**: Approval with minor suggestions that don't block merge
- **Request Changes**: Blockers found that must be addressed before approval
- **Pair Programming Review**: Real-time review during coding for immediate feedback
- **Mob Review**: Entire team reviews critical changes together
- **Rotating Reviewer**: Assign different reviewers to spread knowledge
- **Expert Review**: Subject matter expert reviews for specialized concerns
- **Security Review**: Dedicated security-focused review for sensitive changes
