---
name: Refactoring
description: Systematic process of restructuring existing code without changing its external behavior to improve readability and maintainability
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Languages
audience: Software Developers, Technical Leads, Code Quality Engineers
category: software-development
---

# Refactoring

## What I Do

I provide guidance on refactoring, the disciplined process of improving code structure without altering functionality. Refactoring is essential for managing technical debt, making code more maintainable, and preparing for new features. I cover identification of refactoring opportunities, safe refactoring techniques, testing strategies, and patterns that transform spaghetti code into clean, maintainable software. Effective refactoring balances improvement work against delivering new features, ensuring codebases remain healthy over time.

## When to Use Me

Use refactoring when adding new features and existing code makes it difficult, when code is hard to understand or modify, when duplicate code appears multiple times, when tests are difficult to write, or when performance issues emerge from poor structure. Refactor before debugging to make issues easier to find. Avoid refactoring when deadlines are tight, when code will be replaced soon, or when you don't have adequate test coverage to verify behavior is preserved. Never refactor without tests or version control backup.

## Core Concepts

- **Technical Debt**: Accumulated cost of shortcuts and poor decisions that slow future development
- **Code Smell**: Surface indication of deeper problems in code structure or design
- **Refactoring Safety Net**: Tests that verify behavior is preserved during changes
- **Incremental Refactoring**: Small, safe steps rather than large risky rewrites
- **Composed Method**: Functions that do one thing at a single level of abstraction
- **Extract Method**: Moving code blocks into named functions for better readability
- **Inline Method**: Replacing method calls with body when method is trivial
- **Replace Conditional with Polymorphism**: Using objects instead of switch/if chains
- **Move Method/Field**: Relocating functionality to better-suited classes
- **Parameter Object**: Grouping related parameters into single objects

## Code Examples

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable, Any
from datetime import datetime
from abc import ABC, abstractmethod
import re

@dataclass
class CodeSmell:
    """Represents a detected code smell with location and severity"""
    name: str
    file_path: str
    line_number: int
    severity: str
    description: str
    suggestion: str

class LongMethodSmell(CodeSmell):
    """Detects methods that are too long"""
    MAX_LINES = 20

    @classmethod
    def detect(cls, file_path: str, method: dict) -> Optional["LongMethodSmell"]:
        line_count = method.get("end_line", 0) - method.get("start_line", 0)
        if line_count > cls.MAX_LINES:
            return cls(
                name="long_method",
                file_path=file_path,
                line_number=method["start_line"],
                severity="medium",
                description=f"Method has {line_count} lines, exceeding {cls.MAX_LINES}",
                suggestion="Extract smaller functions that each do one thing"
            )
        return None

class DuplicateCodeSmell(CodeSmell):
    """Detects duplicate or similar code blocks"""
    SIMILARITY_THRESHOLD = 0.8

    @classmethod
    def detect(cls, code_snippets: List[dict]) -> List["DuplicateCodeSmell"]:
        smells = []
        for i, snippet1 in enumerate(code_snippets):
            for snippet2 in code_snippets[i+1:]:
                similarity = cls._calculate_similarity(
                    snippet1["content"], snippet2["content"]
                )
                if similarity >= cls.SIMILARITY_THRESHOLD:
                    smells.append(cls(
                        name="duplicate_code",
                        file_path=snippet1.get("file", "unknown"),
                        line_number=snippet1.get("start_line", 0),
                        severity="high",
                        description=f"Duplicate code detected ({similarity*100:.0f}% similar)",
                        suggestion="Extract common code into shared function"
                    ))
        return smells

    @staticmethod
    def _calculate_similarity(text1: str, text2: str) -> float:
        """Calculate similarity ratio between two code blocks"""
        set1, set2 = set(text1.split()), set(text2.split())
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union > 0 else 0

class FeatureEnvySmell(CodeSmell):
    """Detects methods that use more data from other classes than their own"""
    @classmethod
    def detect(cls, method: dict, class_data: Dict) -> Optional["FeatureEnvySmell"]:
        own_accesses = sum(
            1 for ref in method.get("data_references", [])
            if ref["class"] == method.get("class_name")
        )
        foreign_accesses = sum(
            1 for ref in method.get("data_references", [])
            if ref["class"] != method.get("class_name")
        )

        if foreign_accesses > own_accesses * 2:
            return cls(
                name="feature_envy",
                file_path=method.get("file", "unknown"),
                line_number=method.get("start_line", 0),
                severity="medium",
                description="Method accesses more data from other classes",
                suggestion="Consider moving this method to the class with most data access"
            )
        return None
```

```python
@dataclass
class RefactoringOperation:
    """Records a refactoring operation for tracking and rollback"""
    id: str
    type: str
    description: str
    before_code: str
    after_code: str
    file_path: str
    lines_affected: tuple
    timestamp: datetime
    tests_passed: bool = True

    @classmethod
    def create(
        cls,
        op_type: str,
        description: str,
        file_path: str,
        lines: tuple,
        before: str,
        after: str
    ) -> "RefactoringOperation":
        """Factory method for creating refactoring operations"""
        import uuid
        return cls(
            id=str(uuid.uuid4()),
            type=op_type,
            description=description,
            before_code=before,
            after_code=after,
            file_path=file_path,
            lines_affected=lines,
            timestamp=datetime.now()
        )

class RefactoringSession:
    """Manages a refactoring session with safety checks and rollback"""
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.original_content = ""
        self.operations: List[RefactoringOperation] = []
        self.backup_path = f"{file_path}.backup.{datetime.now().strftime('%Y%m%d%H%M%S')}"

    def __enter__(self):
        with open(self.file_path, "r") as f:
            self.original_content = f.read()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"Refactoring failed: {exc_val}")
            print(f"Restoring from backup: {self.backup_path}")
            with open(self.backup_path, "w") as f:
                f.write(self.original_content)
        return False

    def extract_method(
        self,
        start_line: int,
        end_line: int,
        method_name: str,
        parameters: List[str]
    ) -> RefactoringOperation:
        """Extract code block into a new method"""
        lines = self.original_content.split("\n")
        code_block = "\n".join(lines[start_line:end_line+1])

        new_method = f"\n    def {method_name}({', '.join(parameters)}):\n"
        indented_block = "\n".join(f"        {line}" for line in code_block.split("\n"))
        new_method += indented_block

        replacement = f"{method_name}({', '.join(parameters)})"

        return RefactoringOperation.create(
            "extract_method",
            f"Extracted {start_line}-{end_line} to {method_name}",
            self.file_path,
            (start_line, end_line),
            code_block,
            replacement
        )

    def inline_method(self, method_call: str, method_body: str) -> RefactoringOperation:
        """Replace method call with its body"""
        return RefactoringOperation.create(
            "inline_method",
            f"Inlined {method_call}",
            self.file_path,
            (0, 0),
            method_call,
            method_body
        )

    def replace_conditional_with_polymorphism(
        self,
        switch_statement: str,
        class_hierarchy: str
    ) -> RefactoringOperation:
        """Replace switch/if chain with polymorphic objects"""
        return RefactoringOperation.create(
            "replace_conditional_polymorphism",
            "Converted conditionals to polymorphism",
            self.file_path,
            (0, 0),
            switch_statement,
            class_hierarchy
        )

    def apply_operation(self, operation: RefactoringOperation) -> None:
        """Apply a recorded refactoring operation"""
        lines = self.original_content.split("\n")
        start, end = operation.lines_affected

        if start == end == 0:
            self.original_content = self.original_content.replace(
                operation.before_code.strip(),
                operation.after_code.strip()
            )
        else:
            new_lines = (
                lines[:start] +
                [operation.after_code] +
                lines[end+1:]
            )
            self.original_content = "\n".join(new_lines)

        self.operations.append(operation)

    def save(self) -> None:
        """Save refactored code"""
        with open(self.backup_path, "w") as f:
            f.write(self.original_content)

        with open(self.file_path, "w") as f:
            f.write(self.original_content)

        print(f"Saved refactored code to {self.file_path}")
        print(f"Backup created at {self.backup_path}")
```

```python
class SafeRefactoringTechniques:
    """Collection of safe refactoring patterns with preconditions"""
    @staticmethod
    def rename_variable(
        code: str,
        old_name: str,
        new_name: str,
        scope: str = "all"
    ) -> str:
        """Safely rename variable with word boundary matching"""
        import re
        pattern = rf'\b{re.escape(old_name)}\b'
        if scope == "function":
            return re.sub(pattern, new_name, code, flags=re.MULTILINE)
        return re.sub(pattern, new_name, code)

    @staticmethod
    def extract_class(
        original_class: str,
        new_class_name: str,
        attributes: List[str],
        methods: List[str]
    ) -> tuple:
        """Extract new class from existing class, returning both class definitions"""
        extracted_attributes = "\n".join(f"    self.{attr}" for attr in attributes)
        extracted_methods = "\n".join(methods)

        new_class = f"\nclass {new_class_name}:\n"
        new_class += f"    def __init__(self):\n        {extracted_attributes}\n\n"
        new_class += extracted_methods

        updated_original = original_class.replace(
            extracted_attributes,
            f"self.{new_class_name.lower()} = {new_class_name}()"
        )

        return new_class, updated_original

    @staticmethod
    def introduce_parameter_object(
        function_params: List[str],
        class_name: str
    ) -> tuple:
        """Group parameters into a parameter object"""
        param_object = f"\n@dataclass\nclass {class_name}:\n"
        for param in function_params:
            param_object += f"    {param}: Any = None\n"

        wrapper = f"\n    def __init__(self, {class_name.lower()}: {class_name}):\n"
        for param in function_params:
            wrapper += f"        self.{param} = {class_name.lower()}.{param}\n"

        return param_object, wrapper

    @staticmethod
    def replace_magic_numbers(
        code: str,
        magic_numbers: Dict[int, str]
    ) -> str:
        """Replace magic numbers with named constants"""
        result = code
        for number, name in sorted(magic_numbers.items(), key=lambda x: -x[0]):
            result = result.replace(str(number), name)
        return result

    @staticmethod
    def decompose_conditional(
        condition: str,
        if_branch: str,
        else_branch: str,
        new_function_name: str
    ) -> str:
        """Extract conditional logic into well-named function"""
        extracted = f"\n    def {new_function_name}(self) -> bool:\n"
        extracted += f"        return {condition}\n\n"

        refactored = f"if self.{new_function_name()}:\n"
        refactored += f"        {if_branch}\n"
        refactored += f"    else:\n"
        refactored += f"        {else_branch}\n"

        return extracted + refactored
```

```python
class RefactoringPrioritizer:
    """Prioritizes refactoring opportunities based on impact and risk"""
    def __init__(self):
        self.smells: List[CodeSmell] = []

    def add_smell(self, smell: CodeSmell) -> None:
        """Add a detected code smell"""
        self.smells.append(smell)

    def prioritize(self) -> List[CodeSmell]:
        """Return smells sorted by refactoring priority"""
        def smell_priority(smell: CodeSmell) -> tuple:
            severity_score = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            return (
                -severity_score.get(smell.severity, 0),
                smell.line_number
            )

        return sorted(self.smells, key=smell_priority)

    def get_refactoring_plan(self, max_effort: int = 10) -> List[dict]:
        """Generate a refactoring plan within effort constraints"""
        prioritized = self.prioritize()
        plan = []
        total_effort = 0

        for smell in prioritized:
            effort = self._estimate_effort(smell)
            if total_effort + effort <= max_effort:
                plan.append({
                    "smell": smell,
                    "effort": effort,
                    "technique": self._suggested_technique(smell),
                    "risk": self._assess_risk(smell)
                })
                total_effort += effort

        return plan

    def _estimate_effort(self, smell: CodeSmell) -> int:
        """Estimate refactoring effort in story points"""
        effort_map = {
            "long_method": 2,
            "duplicate_code": 3,
            "feature_envy": 5,
            "large_class": 8,
            "primitive_obsession": 3,
            "data_clumps": 3
        }
        return effort_map.get(smell.name, 5)

    def _suggested_technique(self, smell: CodeSmell) -> str:
        """Suggest appropriate refactoring technique"""
        techniques = {
            "long_method": "Extract Method",
            "duplicate_code": "Extract Function / Pull Up Method",
            "feature_envy": "Move Method",
            "large_class": "Extract Class / Extract Subclass",
            "primitive_obsession": "Introduce Parameter Object / Replace Type Code",
            "data_clumps": "Extract Class / Introduce Parameter Object"
        }
        return techniques.get(smell.name, "Review and redesign")

    def _assess_risk(self, smell: CodeSmell) -> str:
        """Assess risk level of refactoring this smell"""
        high_risk = {"large_class", "feature_envy"}
        if smell.name in high_risk:
            return "high"
        return "medium"
```

```python
class RefactoringVerification:
    """Verifies refactoring preserves original behavior"""
    def __init__(self):
        self.test_results: List[dict] = []

    def run_pre_refactoring_tests(self, test_suite) -> bool:
        """Run tests before refactoring to establish baseline"""
        print("Running pre-refactoring tests...")
        results = test_suite.run()
        self.test_results.append({
            "phase": "pre",
            "passed": results.passed,
            "failed": results.failed,
            "skipped": results.skipped
        })
        return results.passed

    def run_post_refactoring_tests(self, test_suite) -> bool:
        """Run tests after refactoring to verify behavior"""
        print("Running post-refactoring tests...")
        results = test_suite.run()
        self.test_results.append({
            "phase": "post",
            "passed": results.passed,
            "failed": results.failed,
            "skipped": results.skipped
        })
        return results.failed == 0

    def compare_results(self) -> dict:
        """Compare pre and post refactoring test results"""
        pre = self.test_results[0] if self.test_results else {}
        post = self.test_results[-1] if len(self.test_results) > 1 else {}

        return {
            "behavior_preserved": (
                pre.get("passed", 0) == post.get("passed", 0) and
                pre.get("failed", 0) == post.get("failed", 0)
            ),
            "pre_refactoring": pre,
            "post_refactoring": post,
            "recommendation": (
                "Safe to merge" if (
                    pre.get("passed", 0) == post.get("passed", 0) and
                    post.get("failed", 0) == 0
                ) else "Investigate failures before merging"
            )
        }

    def detect_regression(self, pre_run: dict, post_run: dict) -> List[str]:
        """Detect any regressions introduced by refactoring"""
        regressions = []

        if post_run["failed"] > pre_run["failed"]:
            regressions.append(f"New test failures: {post_run['failed'] - pre_run['failed']}")

        if post_run["passed"] < pre_run["passed"]:
            regressions.append(f"Tests no longer passing: {pre_run['passed'] - post_run['passed']}")

        return regressions
```

## Best Practices

- Always have tests before refactoring to verify behavior is preserved
- Make small, incremental changes rather than large rewrites
- Commit after each refactoring step for easy rollback if needed
- Focus on code that changes frequently rather than stable code
- Rename variables and functions to clearly express intent
- Keep functions small and doing one thing at a single abstraction level
- Replace magic numbers and strings with named constants
- Use meaningful names that reveal intent
- Extract complex conditionals into well-named functions
- Balance refactoring with feature work to prevent endless cleanup

## Common Patterns

- **Refactoring by Abstraction**: Create interfaces before implementing changes
- **Parallel Change (Strangler Pattern)**: Gradually replace system components
- **Change Data Capture**: Track refactored code usage before full migration
- **Feature Flags**: Deploy refactored code behind flags for gradual rollout
- **Approval Testing**: Capture current output as golden reference before refactoring
- **Snapshot Testing**: Compare UI/components before and after refactoring
- **Contract Testing**: Verify API contracts remain unchanged during refactoring
