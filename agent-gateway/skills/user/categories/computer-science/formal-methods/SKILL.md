---
name: Formal Methods
description: Application of mathematical reasoning to software and hardware systems including model checking, theorem proving, specification languages, and verification techniques for correctness guarantees
license: MIT
compatibility: universal
audience: Software Engineers, Security Engineers, Verification Specialists
category: Computer Science

---

# Formal Methods

## What I Do

I specialize in formal methods—the application of mathematical techniques to specify, model, and verify software and hardware systems. My expertise spans formal specification languages (TLA+, Alloy, VDM, Z), model checking, theorem proving (Coq, Isabelle, HOL), temporal logic, program verification, and safety-critical system certification. I use mathematical rigor to prove correctness properties, detect design flaws early, and ensure systems meet their specifications under all possible executions.

## When to Use Me

- Designing concurrent or distributed systems with correctness guarantees
- Verifying safety-critical software (avionics, medical, automotive)
- Finding subtle bugs in protocols and algorithms
- Proving security properties of cryptographic implementations
- Specifying system requirements formally before implementation
- Validating hardware designs and CPU pipelines
- Checking liveness and fairness properties
- Achieving certification standards (DO-178C, ISO 26262)

## Core Concepts

1. **Formal Specification**: Precise, mathematical description of system behavior
2. **Model Checking**: Exhaustively exploring state spaces to verify properties
3. **Temporal Logic**: LTL and CTL for expressing time-dependent properties
4. **Theorem Proving**: Interactive and automated proof of mathematical properties
5. **Invariant Discovery**: Finding and verifying loop and system invariants
6. **Refinement**: Proving implementation correctly implements specification
7. **Abstraction**: Creating tractable models by abstracting details
8. **Deadlock Freedom**: Proving absence of circular waits in concurrent systems
9. **Safety Properties**: Proving "something bad never happens"
10. **Liveness Properties**: Proving "something good eventually happens"

## Code Examples

```python
# TLA+ Specification - Distributed Lock
# This is TLA+ syntax - can be checked with TLC model checker

"""
----------------------------- MODULE Lock -----------------------------
EXTENDS Naturals

VARIABLES owner, waiting, queue

Init ==
    /\ owner = "none"
    /\ waiting = {}
    /\ queue = <<>>

RequestLock(p) ==
    /\ owner # p
    /\ p \notin waiting
    /\ waiting' = waiting \union {p}
    /\ queue' = queue \o <<p>>
    /\ owner' = owner

ReleaseLock ==
    /\ owner # "none"
    /\ waiting' = waiting \ {owner}
    /\ owner' = "none"
    /\ queue' = Tail(queue)

GrantLock ==
    /\ owner = "none"
    /\ queue # <<>>
    /\ owner' = Head(queue)
    /\ queue' = Tail(queue)
    /\ waiting' = waiting \ {Head(queue)}

Next ==
    \E p \in Process:
        \/ RequestLock(p)
        \/ ReleaseLock
        \/ GrantLock

Safety ==
    owner = "none" \/ owner \notin waiting

Liveness ==
    /\ Init => <> owner = "none"
    /\ []<> ReleaseLock

Spec == Init /\ [][Next]_<<owner, waiting, queue>>

=============================================================================
"""

# Python model checking equivalent using Python's model checking libraries
from enum import Enum
from typing import Set, Tuple, Optional
from collections import deque

class State:
    def __init__(self, owner: Optional[str], waiting: Set[str], queue: Tuple[str, ...]):
        self.owner = owner
        self.waiting = waiting
        self.queue = queue
    
    def __hash__(self):
        return hash((self.owner, tuple(sorted(self.waiting)), self.queue))
    
    def __eq__(self, other):
        return (self.owner == other.owner and 
                self.waiting == other.waiting and 
                self.queue == self.queue)
    
    def __repr__(self):
        return f"State(owner={self.owner}, waiting={self.waiting}, queue={self.queue})"

def request_lock(state: State, p: str) -> Optional[State]:
    if state.owner != p and p not in state.waiting:
        new_waiting = state.waiting | {p}
        new_queue = state.queue + (p,)
        return State(state.owner, new_waiting, new_queue)
    return None

def release_lock(state: State) -> Optional[State]:
    if state.owner is not None:
        new_waiting = state.waiting - {state.owner}
        new_queue = state.queue[1:] if state.queue else ()
        return State(None, new_waiting, new_queue)
    return None

def grant_lock(state: State) -> Optional[State]:
    if state.owner is None and state.queue:
        new_owner = state.queue[0]
        new_queue = state.queue[1:]
        new_waiting = state.waiting - {new_owner}
        return State(new_owner, new_waiting, new_queue)
    return None

def check_safety_property(initial_state: State, max_depth: int = 100) -> bool:
    """Check that at most one process holds the lock."""
    visited = {initial_state}
    stack = [initial_state]
    
    while stack:
        state = stack.pop()
        
        # Check safety: if owner exists, owner should not be waiting
        if state.owner is not None and state.owner in state.waiting:
            print(f"SAFETY VIOLATION: {state}")
            return False
        
        # Generate successors
        for p in ['P1', 'P2', 'P3']:
            for op in [request_lock, release_lock, grant_lock]:
                new_state = op(state, p) if op != grant_lock else op(state)
                if new_state and new_state not in visited:
                    visited.add(new_state)
                    stack.append(new_state)
    
    return True

# Run model checking
initial = State(owner=None, waiting=set(), queue=())
print(f"Safety property holds: {check_safety_property(initial)}")
```

```coq
(* Coq Theorem Proving Example - Proving List Reversal Properties *)

(* Define natural numbers *)
Inductive nat : Type :=
  | O : nat
  | S : nat -> nat.

(* Define addition *)
Fixpoint add (n m : nat) : nat :=
  match n with
  | O => m
  | S n' => S (add n' m)
  end.

(* Define list *)
Inductive list (A : Type) : Type :=
  | nil : list A
  | cons : A -> list A -> list A.

Arguments nil {A}.
Arguments cons {A} _ _.

(* Define append *)
Fixpoint app {A : Type} (l1 l2 : list A) : list A :=
  match l1 with
  | nil => l2
  | cons x l1' => cons x (app l1' l2)
  end.

(* Define length *)
Fixpoint length {A : Type} (l : list A) : nat :=
  match l with
  | nil => O
  | cons _ l' => S (length l')
  end.

(* Theorem: appending nil to a list gives the same list *)
Theorem app_nil_r : forall (A : Type) (l : list A),
  app l nil = l.
Proof.
  intros A l.
  induction l.
  - simpl. reflexivity.
  - simpl. rewrite IHl. reflexivity.
Qed.

(* Theorem: appending is associative *)
Theorem app_assoc : forall (A : Type) (l1 l2 l3 : list A),
  app (app l1 l2) l3 = app l1 (app l2 l3).
Proof.
  intros A l1 l2 l3.
  induction l1.
  - simpl. reflexivity.
  - simpl. rewrite IHl1. reflexivity.
Qed.

(* Theorem: length of appended lists *)
Theorem length_app : forall (A : Type) (l1 l2 : list A),
  length (app l1 l2) = add (length l1) (length l2).
Proof.
  intros A l1 l2.
  induction l1.
  - simpl. reflexivity.
  - simpl. rewrite IHl1. reflexivity.
Qed.
```

```alloy
// Alloy Specification - Restaurant Reservation System
module restaurant

sig Reservation {
    time: Int,
    size: Int,
    table: lone Table,
    confirmed: Bool
}

sig Table {
    capacity: Int,
    reserved: set Reservation
}

fact {
    all t: Table | all r: t.reserved |
        r.size <= t.capacity
}

fact {
    all r: Reservation |
        one t: Table | r.table = t implies r.time in 8..22
}

pred makeReservation[t: Table, r: Reservation] {
    r.table = t
    r.confirmed = True
    t.reserved = t.reserved + r
}

pred cancelReservation[t: Table, r: Reservation] {
    r.table = none
    r.confirmed = False
    t.reserved = t.reserved - r
}

run {} for 5 but exactly 3 Reservation, 2 Table

assert noDoubleBooking {
    all t: Table | all disjoint r1, r2: t.reserved |
        r1.time != r2.time
}

check noDoubleBooking for 5

pred available[t: Table, time: Int] {
    no r: t.reserved | r.time = time
}

run available for 5
```

## Best Practices

1. **Start Small**: Begin with abstract models, add detail incrementally
2. **Separate Concerns**: Model different aspects (safety, liveness) separately
3. **Find Invariants**: Identify key properties that must always hold
4. **CheckAssertions Frequently**: Use asserts to catch violations early
5. **Cover Edge Cases**: Test boundary conditions and failure scenarios
6. **Document Specifications**: Explain what each property means in domain terms
7. **Refine Gradually**: Move from abstract spec to concrete implementation
8. **Use Multiple Tools**: Combine model checking with theorem proving
9. **Iterate on Counterexamples**: Use failure traces to improve specs
10. **Match Effort to Criticality**: Apply formal methods where bugs are costly
