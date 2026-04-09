---
name: User Experience Design
description: Holistic approach to creating products that provide meaningful, relevant, and delightful experiences for users
license: MIT
compatibility: universal
audience: designers, developers, product managers
category: interdisciplinary
---

# User Experience Design

## What I Do

I create comprehensive frameworks for understanding and improving how users interact with products. I combine research, design, and testing methodologies to craft experiences that meet user needs while achieving business objectives.

## When to Use Me

- Creating new products or features
- Redesigning existing experiences
- Conducting user research and synthesizing insights
- Mapping user journeys and identifying pain points
- Aligning stakeholders on design direction
- Establishing design systems and patterns

## Core Concepts

1. **User Research Methods**: Interviews, surveys, usability testing, contextual inquiry
2. **Persona Development**: Abstract user archetypes based on research
3. **User Journey Mapping**: Visualizing the complete user experience over time
4. **Information Architecture**: Organizing and structuring content logically
5. **Wireframing**: Low-fidelity structural layouts
6. **Prototyping**: Interactive representations of design solutions
7. **Design Systems**: Collections of reusable components and guidelines
8. **Journey Metrics**: Conversion rates, task completion, NPS, SUS scores
9. **Accessibility Integration**: Inclusive design from the start

## Code Examples

### User Research Analytics Dashboard
```javascript
class ResearchDashboard {
  constructor(data) {
    this.rawData = data;
  }
  
  generatePersonas() {
    const segments = this.segmentUsers();
    return segments.map(segment => ({
      name: this.generatePersonaName(segment),
      demographics: segment.demographics,
      goals: this.extractGoals(segment),
      painPoints: this.extractPainPoints(segment),
      behaviors: this.extractBehaviors(segment),
      quote: this.generateQuote(segment)
    }));
  }
  
  segmentUsers() {
    const clusters = {};
    this.rawData.responses.forEach(response => {
      const key = this.getClusterKey(response);
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(response);
    });
    return Object.values(clusters);
  }
  
  calculateJourneyMetrics(journeyData) {
    return {
      completionRate: journeyData.completed / journeyData.started,
      averageTime: journeyData.totalTime / journeyData.completed,
      satisfactionScore: this.calculateNPS(journeyData.feedback),
      errorRate: journeyData.errors / journeyData.attempts,
      dropOffPoints: this.identifyDropOffs(journeyData.steps)
    };
  }
}
```

### Journey Map Generator
```javascript
class JourneyMapper {
  constructor() {
    this.stages = [];
  }
  
  addStage(name, touchpoints, emotions, painPoints, opportunities) {
    this.stages.push({
      id: this.generateId(),
      name,
      touchpoints,
      emotions: {
        before: emotions.before,
        during: emotions.during,
        after: emotions.after
      },
      painPoints,
      opportunities
    });
    return this;
  }
  
  exportForVisualization() {
    return this.stages.map((stage, index) => ({
      stage: index + 1,
      name: stage.name,
      emotionalArc: [
        stage.emotions.before,
        stage.emotions.during,
        stage.emotions.after
      ],
      touchpoints: stage.touchpoints,
      painPoints: stage.painPoints,
      opportunities: stage.opportunities
    }));
  }
  
  identifyMomentsOfTruth() {
    return this.stages.filter(stage => 
      stage.emotions.during <= 3 || stage.painPoints.length > 2
    );
  }
}
```

### Design Token System
```javascript
const designTokens = {
  colors: {
    primary: {
      100: '#E3F2FD',
      300: '#90CAF9',
      500: '#2196F3',
      700: '#1976D2',
      900: '#0D47A1'
    },
    semantic: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, sans-serif",
      mono: "'Fira Code', monospace"
    },
    fontSize: {
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '20px',
      xxl: '24px'
    }
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
};

function applyTokens(tokens) {
  const root = document.documentElement;
  Object.entries(tokens.colors.primary).forEach(([scale, value]) => {
    root.style.setProperty(`--color-primary-${scale}`, value);
  });
  Object.entries(tokens.semantic).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
}
```

## Best Practices

1. Start with user research before designing solutions
2. Define clear success metrics before beginning design work
3. Create and use personas to maintain user focus
4. Map current-state journeys before designing future-state
5. Iterate from low to high fidelity progressively
6. Test designs with real users at each fidelity level
7. Document design decisions and rationale
8. Establish design systems before scaling
9. Consider the full experience, not just individual screens
10. Balance user needs with business requirements and technical constraints
