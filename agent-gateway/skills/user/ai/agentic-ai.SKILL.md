---
name: Agentic AI
category: ai
description: Building autonomous AI agents capable of reasoning, planning, and executing multi-step tasks
---

# Agentic AI

## What I do

I enable AI systems to function as autonomous agents that can perceive environments, reason about goals, plan actions, and execute tasks with minimal human intervention. I combine language model capabilities with tools, memory systems, and decision-making frameworks to create systems that can handle complex, multi-step workflows independently.

## When to use me

- Building autonomous research assistants that can browse and synthesize information
- Creating AI agents for software development and code generation
- Developing personal AI assistants that can take actions on user's behalf
- Automating complex workflows spanning multiple tools and APIs
- Building game AI and interactive simulations
- Creating autonomous trading and financial analysis agents
- Developing embodied AI systems for robotics applications

## Core Concepts

1. **ReAct Pattern**: Combining reasoning and acting in interleaved steps, where the agent reasons about the current state, takes actions, and observes results.

2. **Tool Use**: Equipping agents with external tools (search, calculation, API calls) that they can invoke based on task requirements.

3. **Planning Hierarchies**: Decomposing complex goals into manageable subtasks through explicit planning steps.

4. **Memory Systems**: Maintaining short-term (conversation) and long-term (learned knowledge) memory for coherent agent behavior.

5. **Reflection and Self-Correction**: Enabling agents to evaluate their outputs and correct errors through explicit reflection steps.

6. **Agent Architecture**: Composing perception, reasoning, planning, and action modules into cohesive agent systems.

7. **Environment Interaction**: Defining how agents perceive and act within their operational environment.

8. **Goal Specification**: Translating high-level objectives into concrete, achievable targets for agent completion.

## Code Examples

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json

@dataclass
class Tool:
    name: str
    description: str
    parameters: Dict[str, Any]
    
    @abstractmethod
    def execute(self, **kwargs) -> Any:
        pass

class CalculatorTool(Tool):
    def __init__(self):
        super().__init__(
            name="calculator",
            description="Perform mathematical calculations",
            parameters={
                "expression": {"type": "string", "description": "Mathematical expression"}
            }
        )
    
    def execute(self, expression: str) -> float:
        try:
            return eval(expression)
        except Exception as e:
            return f"Error: {str(e)}"

class SearchTool(Tool):
    def __init__(self):
        super().__init__(
            name="search",
            description="Search for information on the web",
            parameters={
                "query": {"type": "string", "description": "Search query"}
            }
        )
    
    def execute(self, query: str) -> List[Dict[str, str]]:
        return [
            {"title": "Sample Result 1", "snippet": f"Sample information about {query}"},
            {"title": "Sample Result 2", "snippet": f"Additional details on {query}"}
        ]
```

```python
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class Action:
    tool_name: str
    arguments: dict
    thought: str

@dataclass
class StepResult:
    action: Action
    observation: str
    reward: float = 0.0

class ReActAgent:
    def __init__(self, llm, tools: List[Tool], max_steps: int = 10):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.max_steps = max_steps
        self.history = []
    
    def plan(self, goal: str) -> List[Action]:
        actions = []
        
        prompt = f"""
Goal: {goal}
Available tools: {', '.join(self.tools.keys())}

Think step by step and decide what action to take.
"""
        
        for step in range(self.max_steps):
            thought = self.llm.generate(prompt)
            
            if "FINAL ANSWER" in thought:
                break
            
            tool_name, args = self._parse_action(thought)
            
            if tool_name not in self.tools:
                observation = f"Unknown tool: {tool_name}"
            else:
                tool = self.tools[tool_name]
                observation = tool.execute(**args)
            
            actions.append(Action(tool_name, args, thought))
            self.history.append(StepResult(actions[-1], observation))
            
            prompt = f"""
Goal: {goal}
Previous actions: {[a.tool_name for a in actions]}
Last observation: {observation}

What should you do next?
"""
        
        return actions
    
    def _parse_action(self, thought: str) -> tuple:
        lines = thought.strip().split('\n')
        for line in lines:
            if line.startswith('Action:'):
                parts = line[7:].strip().split('(', 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    args_str = parts[1].rstrip(')')
                    try:
                        args = eval(f"dict({args_str})")
                    except:
                        args = {}
                    return name, args
        return "finish", {"result": thought}
```

```python
import time
from typing import List, Any

class MemorySystem:
    def __init__(self, max_short_term: int = 10, max_long_term: int = 100):
        self.short_term = []
        self.long_term = []
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term
        self.importance_threshold = 0.7
    
    def add(self, content: str, importance: float = 0.5):
        memory = {"content": content, "importance": importance, "timestamp": time.time()}
        
        if importance >= self.importance_threshold:
            self.long_term.append(memory)
            if len(self.long_term) > self.max_long_term:
                self.long_term.pop(0)
        else:
            self.short_term.append(memory)
            if len(self.short_term) > self.max_short_term:
                self._consolidate()
    
    def _consolidate(self):
        if not self.short_term:
            return
        
        oldest = self.short_term.pop(0)
        if oldest["importance"] >= self.importance_threshold:
            self.long_term.append(oldest)
    
    def retrieve(self, query: str, k: int = 5) -> List[str]:
        all_memories = self.short_term + self.long_term
        scores = []
        
        for mem in all_memories:
            score = self._similarity(query, mem["content"])
            scores.append((mem["content"], score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return [s[0] for s in scores[:k]]
    
    def _similarity(self, a: str, b: str) -> float:
        words_a = set(a.lower().split())
        words_b = set(b.lower().split())
        if not words_a or not words_b:
            return 0.0
        return len(words_a & words_b) / len(words_a | words_b)
    
    def get_context(self, current_task: str) -> str:
        relevant = self.retrieve(current_task)
        short_term = "\n".join([m["content"] for m in self.short_term])
        return f"Short-term: {short_term}\nRelevant memories: {'; '.join(relevant)}"
```

```python
from typing import List, Callable
import random

class Planner:
    def __init__(self, llm, decomposition_prompt: str = None):
        self.llm = llm
        self.decomposition_prompt = decomposition_prompt or """
Break down the following goal into clear, ordered subtasks.
Goal: {goal}
Subtasks (one per line, numbered):
"""
    
    def decompose(self, goal: str) -> List[dict]:
        prompt = self.decomposition_prompt.format(goal=goal)
        subtasks = self.llm.generate(prompt)
        
        parsed = []
        for line in subtasks.split('\n'):
            if line.strip() and (line[0].isdigit() or '- ' in line):
                task = line.split(')', 1)[-1].strip() if ')' in line else line.lstrip('- ').strip()
                parsed.append({
                    "task": task,
                    "status": "pending",
                    "dependencies": [],
                    "attempts": 0
                })
        
        return parsed
    
    def execute_with_retry(self, subtasks: List[dict], executor_func: Callable) -> List[dict]:
        for subtask in subtasks:
            while subtask["attempts"] < 3:
                result = executor_func(subtask["task"])
                if result["success"]:
                    subtask["status"] = "completed"
                    break
                subtask["attempts"] += 1
            else:
                subtask["status"] = "failed"
        
        return subtasks
```

```python
from abc import ABC, abstractmethod
from typing import Any, Dict

class Environment(ABC):
    @abstractmethod
    def reset(self) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def step(self, action: Any) -> tuple:
        pass
    
    @abstractmethod
    def render(self) -> str:
        pass

class WebEnvironment(Environment):
    def __init__(self, browser):
        self.browser = browser
        self.current_url = "about:blank"
        self.history = []
    
    def reset(self) -> Dict[str, Any]:
        self.browser.get("about:blank")
        self.current_url = "about:blank"
        return {"url": self.current_url, "page_source": ""}
    
    def step(self, action: Dict[str, Any]) -> tuple:
        action_type = action.get("type", "click")
        
        if action_type == "goto":
            self.browser.get(action["url"])
            self.current_url = action["url"]
            self.history.append(action["url"])
        
        elif action_type == "click":
            element = self.browser.find_element_by_selector(action["selector"])
            if element:
                element.click()
        
        elif action_type == "type":
            element = self.browser.find_element_by_selector(action["selector"])
            if element:
                element.clear()
                element.send_keys(action["text"])
        
        elif action_type == "scroll":
            self.browser.execute_script(f"window.scrollBy(0, {action['pixels']})")
        
        observation = self.browser.page_source
        reward = 1.0 if "success" in action else 0.0
        done = action.get("done", False)
        
        return {"page_source": observation, "url": self.current_url}, reward, done
    
    def render(self) -> str:
        return f"Current URL: {self.current_url}\nHistory: {self.history[-5:]}"
```

## Best Practices

1. Implement clear success criteria and stopping conditions to prevent infinite loops in agent execution.

2. Use structured output parsing to reliably extract tool calls from LLM responses.

3. Maintain human-in-the-loop oversight for high-stakes decisions even in autonomous systems.

4. Design tool interfaces to be self-documenting and error-resistant for agent use.

5. Implement proper timeout and retry mechanisms for all external tool calls.

6. Use hierarchical planning for complex tasks to improve reliability and debuggability.

7. Maintain detailed execution logs for debugging and improving agent behavior over time.

8. Implement cost tracking and budget enforcement when agents make API calls.

9. Design agents with explicit error handling and graceful degradation.

10. Regularly evaluate agent performance on diverse tasks to identify failure modes.
