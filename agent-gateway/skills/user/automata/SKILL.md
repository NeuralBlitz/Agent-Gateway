---
name: automata
description: Automata theory and computation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Implement finite automata
- Design regular expressions
- Build parsers and lexers
- Understand computational limits

## When to use me
When building text processors, lexical analyzers, or pattern matchers.

## Finite Automata

### Deterministic Finite Automaton
```python
from typing import Set, Dict

class DFA:
    """Deterministic Finite Automaton"""
    
    def __init__(self, states: Set[str], alphabet: Set[str],
                 transition: Dict[str, Dict[str, str]],
                 start_state: str, accept_states: Set[str]):
        self.states = states
        self.alphabet = alphabet
        self.transition = transition
        self.start_state = start_state
        self.accept_states = accept_states
    
    def accept(self, input_string: str) -> bool:
        """Check if DFA accepts input"""
        current = self.start_state
        
        for symbol in input_string:
            if symbol not in self.alphabet:
                return False
            
            if current not in self.transition:
                return False
            
            if symbol not in self.transition[current]:
                return False
            
            current = self.transition[current][symbol]
        
        return current in self.accept_states
    
    def simulate(self, input_string: str) -> Dict:
        """Simulate DFA and return trace"""
        trace = [{"state": self.start_state, "input": ""}]
        current = self.start_state
        
        for i, symbol in enumerate(input_string):
            if current in self.transition and symbol in self.transition[current]:
                current = self.transition[current][symbol]
                trace.append({"state": current, "input": input_string[:i+1]})
        
        return {
            "accepted": current in self.accept_states,
            "final_state": current,
            "trace": trace
        }

# Example: Binary strings divisible by 3
divisible_by_3_dfa = DFA(
    states={"q0", "q1", "q2"},
    alphabet={"0", "1"},
    transition={
        "q0": {"0": "q0", "1": "q1"},
        "q1": {"0": "q2", "1": "q0"},
        "q2": {"0": "q1", "1": "q2"}
    },
    start_state="q0",
    accept_states={"q0"}
)
```

### Nondeterministic Finite Automaton
```python
class NFA:
    """Nondeterministic Finite Automaton"""
    
    def __init__(self, states: Set[str], alphabet: Set[str],
                 transition: Dict[str, Dict[str, Set[str]]],
                 epsilon_transition: Dict[str, Set[str]],
                 start_state: str, accept_states: Set[str]):
        self.states = states
        self.alphabet = alphabet
        self.transition = transition
        self.epsilon_transition = epsilon_transition
        self.start_state = start_state
        self.accept_states = accept_states
    
    def epsilon_closure(self, states: Set[str]) -> Set[str]:
        """Compute epsilon closure of states"""
        closure = set(states)
        stack = list(states)
        
        while stack:
            state = stack.pop()
            if state in self.epsilon_transition:
                for next_state in self.epsilon_transition[state]:
                    if next_state not in closure:
                        closure.add(next_state)
                        stack.append(next_state)
        
        return closure
    
    def move(self, states: Set[str], symbol: str) -> Set[str]:
        """Compute move operation"""
        result = set()
        
        for state in states:
            if state in self.transition and symbol in self.transition[state]:
                result.update(self.transition[state][symbol])
        
        return result
    
    def accept(self, input_string: str) -> bool:
        """Check if NFA accepts input"""
        current = self.epsilon_closure({self.start_state})
        
        for symbol in input_string:
            current = self.epsilon_closure(self.move(current, symbol))
        
        return bool(current & self.accept_states)
```

### Regular Expressions to NFA (Thompson's Construction)
```python
class RegexToNFA:
    """Convert regex to NFA using Thompson's construction"""
    
    def __init__(self):
        self.state_counter = 0
    
    def create_state(self) -> str:
        """Create unique state"""
        state = f"q{self.state_counter}"
        self.state_counter += 1
        return state
    
    def build_nfa(self, regex: str) -> NFA:
        """Build NFA from regex"""
        # Simplified: parse and build NFA
        # In practice, use proper regex parser
        pass
    
    def union(self, nfa1: NFA, nfa2: NFA) -> NFA:
        """Union of two NFAs"""
        start = self.create_state()
        accept = self.create_state()
        
        new_transition = {}
        new_transition[start] = {"": {nfa1.start_state, nfa2.start_state}}
        
        # Connect accept states to new accept
        for state in nfa1.accept_states:
            if state not in new_transition:
                new_transition[state] = {}
            new_transition[state][""] = {accept}
        
        return NFA(
            states="...",
            alphabet="...",
            transition=new_transition,
            epsilon_transition="...",
            start_state=start,
            accept_states={accept}
        )
```

### Pushdown Automaton
```python
class PDA:
    """Pushdown Automaton for context-free languages"""
    
    def __init__(self, states: Set[str], alphabet: Set[str],
                 stack_alphabet: Set[str],
                 transition: Dict[str, Dict[str, Dict[str, tuple]]],
                 start_state: str, accept_states: Set[str]):
        self.states = states
        self.alphabet = alphabet
        self.stack_alphabet = stack_alphabet
        self.transition = transition
        self.start_state = start_state
        self.accept_states = accept_states
    
    def accept(self, input_string: str, mode: str = "final") -> bool:
        """Check if PDA accepts input"""
        stack = ["$"]
        state = self.start_state
        input_pos = 0
        
        while input_pos <= len(input_string):
            # Try epsilon transition
            if self._epsilon_transition(state, stack):
                state, stack = self._apply_transition(
                    state, "", stack, "ε"
                )
            
            # Try symbol transition
            if input_pos < len(input_string):
                symbol = input_string[input_pos]
                if self._symbol_transition(state, symbol, stack):
                    state, stack = self._apply_transition(
                        state, symbol, stack, symbol
                    )
                    input_pos += 1
            
            # Check for acceptance
            if input_pos == len(input_string) and state in self.accept_states:
                return True
        
        return False
```
