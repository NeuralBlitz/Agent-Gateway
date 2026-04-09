---
name: Product Management
description: Guiding products from conception through launch and growth by balancing user needs, business goals, and technical feasibility
license: MIT
compatibility: universal
audience: product managers, developers, designers
category: interdisciplinary
---

# Product Management

## What I Do

I lead product strategy and execution by defining vision, prioritizing features, and coordinating cross-functional teams. I balance user needs, business objectives, and technical constraints to deliver products that achieve market success.

## When to Use Me

- Defining product vision and strategy
- Prioritizing features and roadmap planning
- Conducting market and user research
- Setting and tracking product KPIs
- Aligning stakeholders on product direction
- Managing the product lifecycle from inception to retirement

## Core Concepts

1. **Product Vision**: Long-term purpose and direction
2. **User Personas**: Target user archetypes
3. **Jobs to be Done**: Tasks users hire products to accomplish
4. **Prioritization Frameworks**: RICE, MoSCoW, Kano, Value vs Effort
5. **OKRs**: Objectives and Key Results for goal setting
6. **Product-Market Fit**: Validating product-market alignment
7. **Lean Product Development**: Build-Measure-Learn cycles
8. **A/B Testing**: Data-driven feature validation
9. **Roadmapping**: Communicating strategy and progress
10. **North Star Metric**: Primary growth metric alignment

## Code Examples

### Product Strategy Builder
```javascript
class ProductStrategy {
  constructor() {
    this.vision = null;
    this.objectives = [];
    this.targetUsers = [];
    this.competitors = [];
    this.differentators = [];
  }
  
  setVision(vision) {
    this.vision = {
      statement: vision,
      timeframe: '3-5 years',
      validated: false,
      stakeholderSignoff: []
    };
    return this;
  }
  
  addObjective(objective) {
    const objectiveNode = {
      id: this.generateId(),
      title: objective.title,
      keyResults: objective.keyResults?.map(kr => ({
        id: this.generateId(),
        description: kr,
        target: kr.target,
        current: kr.current || 0,
        unit: kr.unit || 'percent',
        progress: 0
      })),
      status: 'draft',
      owner: objective.owner,
      initiatives: []
    };
    
    this.objectives.push(objectiveNode);
    return this;
  }
  
  defineTargetUsers(personas) {
    this.targetUsers = personas.map(p => ({
      id: this.generateId(),
      name: p.name,
      role: p.role,
      goals: p.goals,
      painPoints: p.painPoints,
      behaviors: p.behaviors,
      jobsToBeDone: p.jobsToBeDone?.map(j => ({
        task: j.task,
        importance: j.importance,
        currentSolutions: j.currentSolutions,
        gaps: j.gaps
      })),
      marketSize: p.marketSize || null
    }));
    
    return this;
  }
  
  analyzeCompetitors() {
    return this.competitors.map(competitor => ({
      ...competitor,
      strengths: competitor.strengths || [],
      weaknesses: competitor.weaknesses || [],
      marketShare: competitor.marketShare || 0,
      positioning: competitor.positioning,
      threats: this.identifyThreats(competitor),
      opportunities: this.identifyOpportunities(competitor)
    }));
  }
  
  identifyThreats(competitor) {
    return this.targetUsers
      .filter(user => 
        competitor.strengths.some(s => 
          user.painPoints.some(p => p.includes(s))
        )
      )
      .map(user => `Competitor ${competitor.name} addresses ${user.name}'s pain points`);
  }
  
  identifyOpportunities(competitor) {
    return this.targetUsers
      .filter(user => 
        competitor.weaknesses.some(w => 
          user.goals.some(g => g.includes(w))
        )
      )
      .map(user => `Gap in ${competitor.name} for ${user.name}'s ${user.goals[0]}`);
  }
  
  generateStrategyCanvas() {
    return {
      vision: this.vision,
      objectives: this.objectives,
      targetUsers: this.targetUsers,
      competitiveLandscape: this.analyzeCompetitors(),
      differentiators: this.differentiators,
      valueProposition: this.generateValueProposition()
    };
  }
  
  generateValueProposition() {
    return this.targetUsers.map(user => ({
      user: user.name,
      job: user.jobsToBeDone?.[0]?.task || 'Primary goal',
      pains: user.painPoints.slice(0, 3),
      gains: user.goals.slice(0, 3),
      ourDifferentiators: this.differentiators.filter(d =>
        user.painPoints.some(p => 
          d.addresses?.some(a => p.includes(a))
        )
      )
    }));
  }
}
```

### Feature Prioritizer
```javascript
class FeaturePrioritizer {
  constructor() {
    this.features = [];
    this.criteria = [];
  }
  
  addFeature(feature) {
    const scoredFeature = {
      ...feature,
      scores: {},
      weightedScore: 0,
      rank: null
    };
    
    this.features.push(scoredFeature);
    return this;
  }
  
  setCriteria(criteria) {
    this.criteria = criteria.map(c => ({
      name: c.name,
      weight: c.weight || 1,
      scale: c.scale || { min: 1, max: 10 },
      evaluate: c.evaluate
    }));
    
    return this;
  }
  
  prioritize(method = 'rice') {
    switch (method) {
      case 'rice':
        return this.calculateRICE();
      case 'moscow':
        return this.categorizeMoSCoW();
      case 'kano':
        return this.categorizeKano();
      case 'weighted':
        return this.calculateWeightedScores();
      default:
        return this.calculateRICE();
    }
  }
  
  calculateRICE() {
    return this.features.map(feature => {
      const reach = this.score(feature, 'reach');
      const impact = this.score(feature, 'impact');
      const confidence = this.score(feature, 'confidence');
      const effort = this.score(feature, 'effort');
      
      return {
        ...feature,
        rice: {
          reach,
          impact,
          confidence,
          effort,
          score: (reach * impact * confidence) / effort
        }
      };
    }).sort((a, b) => b.rice.score - a.rice.score);
  }
  
  score(feature, criterion) {
    const scores = {
      reach: { low: 1, medium: 5, high: 10 },
      impact: { minimal: 0.25, small: 0.5, medium: 1, large: 2, massive: 3 },
      confidence: { low: 0.5, medium: 0.75, high: 1 },
      effort: { months: 20, weeks: 10, days: 5 }
    };
    
    return scores[criterion]?.[feature[criterion]] || feature[criterion] || 5;
  }
  
  categorizeMoSCoW() {
    const categories = {
      mustHave: [],
      shouldHave: [],
      couldHave: [],
      wontHave: []
    };
    
    const sorted = [...this.features].sort((a, b) => 
      (b.value || 0) - (a.value || 0)
    );
    
    const totalValue = sorted.reduce((sum, f) => sum + (f.value || 0), 0);
    const mustHaveThreshold = totalValue * 0.6;
    const shouldHaveThreshold = totalValue * 0.85;
    
    let cumulative = 0;
    sorted.forEach(feature => {
      cumulative += feature.value || 0;
      
      if (cumulative <= mustHaveThreshold) {
        categories.mustHave.push({ ...feature, rationale: 'Essential value' });
      } else if (cumulative <= shouldHaveThreshold) {
        categories.shouldHave.push({ ...feature, rationale: 'High value add' });
      } else if (feature.importance <= 3) {
        categories.couldHave.push({ ...feature, rationale: 'Nice to have' });
      } else {
        categories.wontHave.push({ ...feature, rationale: 'Out of scope' });
      }
    });
    
    return categories;
  }
  
  categorizeKano() {
    return this.features.map(feature => {
      const assessment = {
        attractive: this.assessAttractive(feature),
        oneDimensional: this.assessOneDimensional(feature),
        mustBe: this.assessMustBe(feature),
        indifferent: this.assessIndifferent(feature),
        reverse: this.assessReverse(feature)
      };
      
      const category = Object.entries(assessment)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        ...feature,
        kanoCategory: category,
        satisfactionPotential: this.calculateSatisfactionPotential(assessment),
        investmentPriority: this.mapToPriority(category)
      };
    });
  }
  
  calculateSatisfactionPotential(assessment) {
    return (
      (assessment.attractive * 1.5) +
      assessment.oneDimensional -
      (assessment.mustBe * 0.5)
    );
  }
  
  mapToPriority(category) {
    const priorities = {
      mustBe: 1,
      oneDimensional: 2,
      attractive: 3,
      indifferent: 4,
      reverse: 5
    };
    return priorities[category];
  }
}
```

### Roadmap Generator
```javascript
class RoadmapGenerator {
  constructor() {
    this.initiatives = [];
    this.quarters = [];
    this.themes = [];
  }
  
  addInitiative(initiative) {
    this.initiatives.push({
      id: this.generateId(),
      ...initiative,
      status: 'planned',
      progress: 0,
      dependencies: initiative.dependsOn || [],
      risks: initiative.risks || [],
      metrics: initiative.successMetrics || []
    });
    return this;
  }
  
  setQuarters(quarters) {
    this.quarters = quarters.map(q => ({
      id: q.id,
      name: q.name,
      start: q.startDate,
      end: q.endDate,
      objectives: q.objectives || [],
      capacity: q.capacity || 100,
      allocated: 0,
      initiatives: []
    }));
    return this;
  }
  
  setThemes(themes) {
    this.themes = themes.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#3b82f6',
      description: t.description,
      strategicAlignment: t.alignment
    }));
    return this;
  }
  
  assignToQuarters() {
    const sorted = [...this.initiatives].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
    
    this.quarters.forEach(quarter => {
      const remainingCapacity = quarter.capacity - quarter.allocated;
      
      sorted
        .filter(i => !i.assignedQuarter && i.effort <= remainingCapacity)
        .forEach(initiative => {
          initiative.assignedQuarter = quarter.id;
          initiative.startDate = quarter.start;
          initiative.endDate = quarter.end;
          quarter.initiatives.push(initiative);
          quarter.allocated += initiative.effort;
        });
    });
    
    return {
      quarters: this.quarters,
      unassigned: this.initiatives.filter(i => !i.assignedQuarter),
      capacityUtilization: this.quarters.map(q => ({
        quarter: q.name,
        allocated: q.allocated,
        capacity: q.capacity,
        utilization: q.allocated / q.capacity
      }))
    };
  }
  
  generateVisualRoadmap() {
    const assignments = this.assignToQuarters();
    
    const timeline = assignments.quarters.map(quarter => ({
      quarter: quarter.name,
      period: `${quarter.start} - ${quarter.end}`,
      width: 3,
      items: quarter.initiatives.map(init => ({
        id: init.id,
        name: init.name,
        theme: this.getThemeColor(init.theme),
        duration: this.calculateDuration(init),
        dependencies: init.dependencies.length > 0 ? 'Yes' : 'None',
        milestone: init.isMilestone,
        confidence: init.confidence || 'medium'
      }))
    }));
    
    return {
      title: 'Product Roadmap',
      timeframe: `${assignments.quarters[0]?.start} - ${assignments.quarters[assignments.quarters.length - 1]?.end}`,
      timeline,
      themes: this.themes,
      legend: this.generateLegend(),
      notes: {
        confidence: 'Confidence levels based on discovery completeness',
        dependencies: 'Items with dependencies must be sequenced accordingly',
        tentative: 'Items marked tentative are subject to change'
      }
    };
  }
  
  getThemeColor(themeId) {
    return this.themes.find(t => t.id === themeId)?.color || '#888';
  }
  
  calculateDuration(initiative) {
    const start = new Date(initiative.startDate);
    const end = new Date(initiative.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }
  
  generateOKRDashboard() {
    return {
      objectives: this.objectives,
      keyResults: this.keyResults,
      progress: this.calculateOverallProgress(),
      health: this.assessOKRHealth(),
      recommendations: this.generateRecommendations()
    };
  }
  
  calculateOverallProgress() {
    if (!this.keyResults?.length) return 0;
    
    const total = this.keyResults.reduce((sum, kr) => {
      if (kr.target === 0) return sum;
      return sum + Math.min(100, (kr.current / kr.target) * 100);
    }, 0);
    
    return Math.round(total / this.keyResults.length);
  }
  
  assessOKRHealth() {
    const progress = this.calculateOverallProgress();
    const trend = this.calculateProgressTrend();
    
    if (progress >= 70 && trend >= 0) return 'healthy';
    if (progress >= 40 && trend >= 0) return 'at-risk';
    if (progress < 40) return 'off-track';
    return 'regressing';
  }
}
```

## Best Practices

1. Start with clear problem definition, not solutions
2. Deeply understand user needs through research
3. Prioritize based on value and strategic alignment
4. Communicate vision and progress consistently
5. Make data-driven decisions when possible
6. Balance short-term wins with long-term strategy
7. Build and maintain cross-functional relationships
8. Iterate quickly and validate assumptions
9. Set clear success metrics before launching
10. Continuously gather and act on feedback
