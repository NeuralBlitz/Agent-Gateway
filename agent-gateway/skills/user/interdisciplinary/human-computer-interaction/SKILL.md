---
name: Human-Computer Interaction
description: Design principles and practices for creating effective, intuitive, and accessible interfaces between humans and computer systems
license: MIT
compatibility: universal
audience: developers, designers, product managers
category: interdisciplinary
---

# Human-Computer Interaction

## What I Do

I help design and evaluate interactive systems that optimize the user experience through evidence-based principles. I bridge the gap between technical capabilities and human cognition to create interfaces that are efficient, learnable, and satisfying to use.

## When to Use Me

- Designing new interfaces or interaction paradigms
- Evaluating existing products for usability issues
- Improving task completion rates and user satisfaction
- Understanding user mental models and expectations
- Reducing cognitive load in complex applications
- Optimizing workflows for efficiency

## Core Concepts

1. **Usability Dimensions**: Effectiveness, efficiency, satisfaction, learnability, and error prevention
2. **Fitts's Law**: The time to acquire a target is a function of distance and size
3. **Hick's Law**: Reaction time increases with the number of choices
4. **Gestalt Principles**: Visual perception rules (proximity, similarity, closure, continuity)
5. **Cognitive Load Theory**: Intrinsic, extraneous, and germane load management
6. **Mental Models**: Users' understanding of how systems work
7. **Affordances**: Perceived and actual properties that determine how something can be used
8. **Feedback loops**: System responses to user actions
9. **Progressive Disclosure**: Showing information gradually to reduce complexity

## Code Examples

### Accessible Button Component
```jsx
import React from 'react';

const AccessibleButton = ({ children, onClick, ariaLabel, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    style={{
      padding: '12px 24px',
      fontSize: '16px',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      minWidth: '44px',
      minHeight: '44px'
    }}
  >
    {children}
  </button>
);
```

### Focus Management System
```javascript
class FocusManager {
  constructor(container) {
    this.container = container;
    this. focusableSelector = 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  }
  
  getFocusableElements() {
    return Array.from(
      this.container.querySelectorAll(this.focusableSelector)
    ).filter(el => !el.hasAttribute('disabled'));
  }
  
  trapFocus() {
    const focusable = this.getFocusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    
    this.container.addEventListener('keydown', handleKeyDown);
    return () => this.container.removeEventListener('keydown', handleKeyDown);
  }
}
```

### User Flow Analytics
```javascript
class FlowAnalyzer {
  constructor() {
    this.events = [];
  }
  
  trackStep(userId, stepName, metadata = {}) {
    const event = {
      userId,
      stepName,
      timestamp: Date.now(),
      metadata
    };
    this.events.push(event);
    return event;
  }
  
  calculateCompletionRate(flowId, totalSteps) {
    const completions = this.events.filter(
      e => e.stepName === 'completed' && e.metadata.flowId === flowId
    ).length;
    
    const started = new Set(
      this.events
        .filter(e => e.metadata.flowId === flowId)
        .map(e => e.userId)
    ).size;
    
    return started > 0 ? completions / started : 0;
  }
  
  identifyDropOffPoints(flowId) {
    const steps = {};
    const users = new Set();
    
    this.events
      .filter(e => e.metadata.flowId === flowId)
      .forEach(e => {
        users.add(e.userId);
        if (!steps[e.stepName]) {
          steps[e.stepName] = new Set();
        }
        steps[e.stepName].add(e.userId);
      });
    
    return Object.entries(steps).map(([step, stepUsers]) => ({
      step,
      dropoffRate: 1 - (stepUsers.size / users.size)
    }));
  }
}
```

## Best Practices

1. Design for the user's mental model, not the system's architecture
2. Follow accessibility standards (WCAG 2.1 AA minimum)
3. Provide clear and immediate feedback for all user actions
4. Use consistent patterns and conventions across the application
5. Design for error prevention first, then graceful error recovery
6. Minimize cognitive load through progressive disclosure
7. Test with real users early and often
8. Consider context of use (mobile, desktop, voice, etc.)
9. Design for all abilities, including temporary and situational impairments
10. Iterate based on measurable usability metrics
