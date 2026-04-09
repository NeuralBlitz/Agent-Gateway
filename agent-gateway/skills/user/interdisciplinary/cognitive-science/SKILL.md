---
name: Cognitive Science
description: Understanding human mental processes including perception, memory, reasoning, and decision-making to design better experiences
license: MIT
compatibility: universal
audience: designers, developers, product managers, researchers
category: interdisciplinary
---

# Cognitive Science

## What I Do

I apply scientific understanding of human cognition to design experiences that work with natural human psychology. I help create interfaces, products, and systems that align with how people actually perceive, remember, think, and decide.

## When to Use Me

- Designing user interfaces and interactions
- Optimizing information architecture and navigation
- Creating effective learning experiences
- Understanding decision-making biases
- Reducing cognitive load in complex systems
- Improving memory and recall in applications

## Core Concepts

1. **Working Memory Limits**: The 7±2 items constraint
2. **Attention and Focus**: Bottom-up vs top-down processing
3. **Pattern Recognition**: How we identify familiar stimuli
4. **Mental Models**: Internal representations of systems
5. **Decision-Making Biases**: Heuristics and systematic errors
6. **Memory Encoding**: How information enters long-term memory
7. **Dual-Process Theory**: System 1 (fast) vs System 2 (slow)
8. **Perceptual Organization**: Gestalt principles in UI
9. **Cognitive Load Theory**: Intrinsic, extraneous, germane load
10. **Flow State**: Optimal engagement conditions

## Code Examples

### Cognitive Load Calculator
```javascript
class CognitiveLoadCalculator {
  constructor() {
    this.limits = {
      workingMemoryItems: 7,
      chunkSize: 4,
      attentionSwitches: 4
    };
  }
  
  calculateTaskLoad(task) {
    const elements = this.countInformationElements(task);
    const interactions = this.countRequiredInteractions(task);
    const decisions = this.countDecisions(task);
    
    const baseLoad = elements;
    const interactionLoad = interactions * 2;
    const decisionLoad = decisions * 3;
    
    return {
      totalLoad: baseLoad + interactionLoad + decisionLoad,
      breakdown: {
        elements,
        interactions,
        decisions
      },
      recommendations: this.generateRecommendations({
        elements, interactions, decisions
      })
    };
  }
  
  countInformationElements(task) {
    const visibleElements = task.screenElements?.length || 0;
    const requiredFields = task.formFields?.length || 0;
    const navigationSteps = task.navigationPath?.length || 0;
    
    return visibleElements + requiredFields + navigationSteps;
  }
  
  countRequiredInteractions(task) {
    return (task.clicks || 0) + 
           (task.typing || 0) + 
           (task.scrolls || 0) +
           (task.hovers || 0);
  }
  
  countDecisions(task) {
    return task.choices?.length || 0;
  }
  
  analyzeForChunking(data, options = {}) {
    const maxChunkSize = options.maxChunkSize || this.limits.chunkSize;
    const chunkingStrategy = options.strategy || 'by-function';
    
    if (chunkingStrategy === 'by-function') {
      return this.chunkByFunction(data, maxChunkSize);
    }
    
    if (chunkingStrategy === 'by-frequency') {
      return this.chunkByFrequency(data, maxChunkSize);
    }
    
    return this.chunkByTime(data, maxChunkSize);
  }
  
  chunkByFunction(data, maxChunkSize) {
    const groups = {};
    
    data.forEach(item => {
      const category = item.function || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    
    return Object.entries(groups).map(([name, items]) => ({
      name,
      items,
      chunkIndex: 0
    }));
  }
  
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.elements > this.limits.workingMemoryItems) {
      recommendations.push({
        type: 'chunking',
        priority: 'high',
        message: `Reduce visible elements from ${analysis.elements} to under ${this.limits.workingMemoryItems}`,
        strategy: 'Use progressive disclosure'
      });
    }
    
    if (analysis.decisions > 3) {
      recommendations.push({
        type: 'simplify-decisions',
        priority: 'medium',
        message: 'Consider breaking decisions into smaller steps',
        strategy: 'Use decision trees or guided flows'
      });
    }
    
    if (analysis.interactions > 10) {
      recommendations.push({
        type: 'reduce-interactions',
        priority: 'low',
        message: 'Streamline user interactions',
        strategy: 'Combine multi-step processes'
      });
    }
    
    return recommendations;
  }
}
```

### Attention Manager
```javascript
class AttentionManager {
  constructor() {
    this.attentionBudget = 100;
    this.currentLoad = 0;
    this.focusAreas = [];
  }
  
  planVisualHierarchy(content) {
    const elements = this.categorizeByImportance(content);
    
    const hierarchy = {
      primary: elements.filter(e => e.importance >= 0.8),
      secondary: elements.filter(e => e.importance >= 0.5 && e.importance < 0.8),
      tertiary: elements.filter(e => e.importance < 0.5)
    };
    
    return {
      ...hierarchy,
      visualMapping: this.mapToVisualWeight(hierarchy),
      warnings: this.checkAttentionBudget(hierarchy)
    };
  }
  
  categorizeByImportance(content) {
    return content.map(item => {
      const baseImportance = 0.5;
      
      const modifiers = {
        isActionable: 0.2,
        isNew: 0.1,
        isUrgent: 0.15,
        isPersonal: 0.1
      };
      
      let importance = baseImportance;
      
      Object.entries(modifiers).forEach(([key, value]) => {
        if (item[key]) importance += value;
      });
      
      return {
        ...item,
        importance: Math.min(1, importance)
      };
    });
  }
  
  mapToVisualWeight(hierarchy) {
    return {
      primary: hierarchy.primary.map(item => ({
        ...item,
        visualWeight: 'high',
        size: 'large',
        color: 'accent',
        position: 'prominent'
      })),
      secondary: hierarchy.secondary.map(item => ({
        ...item,
        visualWeight: 'medium',
        size: 'medium',
        color: 'neutral',
        position: 'supporting'
      })),
      tertiary: hierarchy.tertiary.map(item => ({
        ...item,
        visualWeight: 'low',
        size: 'small',
        color: 'muted',
        position: 'supplementary'
      }))
    };
  }
  
  checkAttentionBudget(hierarchy) {
    const warnings = [];
    
    const primaryCount = hierarchy.primary.length;
    const secondaryCount = hierarchy.secondary.length;
    
    if (primaryCount > 3) {
      warnings.push({
        level: 'warning',
        message: `Too many primary elements (${primaryCount}). Users may struggle to prioritize.`
      });
    }
    
    if (secondaryCount > 7) {
      warnings.push({
        level: 'info',
        message: `Secondary elements (${secondaryCount}) may exceed comfortable scanning.`
      });
    }
    
    return warnings;
  }
  
  detectAttentionPattern(sessionData) {
    const gazeData = sessionData.gazeEvents || [];
    const interactionData = sessionData.interactions || [];
    
    const fixationPoints = this.extractFixations(gazeData);
    const scanPath = this.reconstructScanPath(gazeData);
    
    return {
      averageFixationDuration: this.calculateAvgDuration(fixationPoints),
      fixationCount: fixationPoints.length,
      scanPathLength: scanPath.length,
      attentionMap: this.generateAttentionMap(fixationPoints),
      patterns: this.identifyPatterns(scanPath, interactionData)
    };
  }
  
  extractFixations(gazeData) {
    return gazeData.filter(g => g.type === 'fixation');
  }
  
  reconstructScanPath(gazeData) {
    return gazeData
      .filter(g => g.type === 'saccade')
      .map(g => ({
        from: g.fromPosition,
        to: g.toPosition,
        duration: g.duration
      }));
  }
  
  generateAttentionMap(fixations) {
    const grid = new HeatmapGrid(100, 100);
    
    fixations.forEach(f => {
      grid.addWeight(f.x, f.y, f.duration);
    });
    
    return grid.export();
  }
}
```

### Decision Architecture System
```javascript
class DecisionArchitect {
  constructor() {
    this.biasPatterns = [];
    this.framingStrategies = [];
  }
  
  analyzeDecisionPoint(decision) {
    const context = {
      options: decision.options,
      timePressure: decision.timeConstraint,
      expertise: decision.userExpertise,
      emotionalState: decision.emotionalContext
    };
    
    const biases = this.identifyBiasRisks(context);
    const recommendations = this.recommendFraming(context);
    
    return {
      decision,
      biasRisks: biases,
      framing: recommendations,
      optimalStructure: this.suggestOptimalStructure(decision)
    };
  }
  
  identifyBiasRisks(context) {
    const risks = [];
    
    if (context.options.length > 4) {
      risks.push({
        bias: 'Choice Overload',
        description: 'Too many options can lead to decision paralysis',
        mitigation: 'Reduce to 3-4 options or add sorting/filtering'
      });
    }
    
    if (context.timePressure && context.timePressure < 30) {
      risks.push({
        bias: 'Satisficing',
        description: 'Under time pressure, users choose first acceptable option',
        mitigation: 'Present best options first'
      });
    }
    
    if (context.options.some(o => o.isAnchored)) {
      risks.push({
        bias: 'Anchoring',
        description: 'Initial information disproportionately influences choices',
        mitigation: 'Test different anchoring order'
      });
    }
    
    if (context.options.some(o => o.isLossFramed)) {
      risks.push({
        bias: 'Loss Aversion',
        description: 'Users prefer avoiding losses over acquiring gains',
        mitigation: 'Balance loss and gain framing'
      });
    }
    
    return risks;
  }
  
  recommendFraming(context) {
    return {
      defaultOption: context.expertise === 'novice' ? 'recommended' : 'letUserChoose',
      comparisonType: context.options.length <= 3 ? 'direct' : 'attribute',
      timePressureResponse: context.timePressure ? 'addTimer' : 'noTimer',
      simplification: context.expertise === 'novice' ? 'high' : 'low'
    };
  }
  
  suggestOptimalStructure(decision) {
    return {
      order: decision.options.map((o, i) => ({
        option: o,
        recommendedPosition: i < 3 ? 'early' : 'later'
      })),
      comparisons: decision.options.length > 2 ? 'vs' : null,
      summaries: {
        show: decision.options.length > 2,
        length: decision.expertise === 'novice' ? 'detailed' : 'summary'
      },
      recommendations: this.generateOptionRecommendations(decision)
    };
  }
  
  generateOptionRecommendations(decision) {
    const scored = decision.options.map(option => ({
      option,
      score: this.scoreOption(option, decision),
      reasons: this.generateReasons(option, decision)
    }));
    
    return scored.sort((a, b) => b.score - a.score);
  }
  
  scoreOption(option, context) {
    let score = 50;
    
    if (option.isRecommended) score += 20;
    if (option.isPopular) score += 10;
    if (option.easeOfUse > 7) score += 10;
    if (option.matchedUserPreference) score += 10;
    
    return Math.min(100, score);
  }
}
```

## Best Practices

1. Respect working memory limits (chunk information)
2. Design for recognition over recall
3. Use consistent patterns to build familiarity
4. Reduce extraneous cognitive load
5. Align with existing mental models
6. Provide clear feedback and confirmation
7. Design for error prevention and recovery
8. Support both expert and novice users
9. Consider emotional context in design
10. Test with real users to validate assumptions
