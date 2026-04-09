---
name: Science Communication
description: Translating complex scientific concepts into accessible, engaging narratives for diverse audiences
license: MIT
compatibility: universal
audience: researchers, communicators, educators
category: interdisciplinary
---

# Science Communication

## What I Do

I bridge the gap between scientific research and public understanding by translating complex concepts into accessible narratives. I help scientists share their work effectively with journalists, policymakers, and general audiences.

## When to Use Me

- Writing press releases and media materials
- Creating public-facing research summaries
- Developing educational content for non-experts
- Presenting research to policymakers
- Building science outreach programs
- Communicating uncertainty and risk effectively

## Core Concepts

1. **Audience Adaptation**: Simplifying without dumbing down
2. **Metaphor and Analogy**: Making abstract concepts tangible
3. **Narrative Structure**: Storytelling in scientific contexts
4. **Uncertainty Communication**: Presenting confidence levels honestly
5. **Visual Communication**: Diagrams, infographics, and models
6. **Media Relations**: Working with journalists effectively
7. **Public Engagement**: Two-way dialogue with communities
8. **Misinformation Resistance**: Addressing common misconceptions
9. **Risk Communication**: Contextualizing probabilities and impacts
10. **Ethics in Science Comm**: Accuracy vs. accessibility balance

## Code Examples

### Research Summary Generator
```javascript
class ResearchSummaryGenerator {
  constructor() {
    this.readabilityTargets = {
      general: { gradeLevel: 8, audience: 'general public' },
      educated: { gradeLevel: 12, audience: 'educated non-experts' },
      informed: { gradeLevel: 14, audience: 'journalists, policymakers' }
    };
  }
  
  generateLaySummary(paper, options = {}) {
    const target = this.readabilityTargets[options.level || 'general'];
    
    let summary = {
      title: this.reformulateTitle(paper.title),
      context: this.explainContext(paper.background),
      methods: this.simplifyMethods(paper.methods, options.level),
      findings: this.presentFindings(paper.results),
      implications: this.explainImplications(paper.conclusions),
      limitations: this.presentLimitations(paper.limitations),
      uncertainty: this.quantifyUncertainty(paper.confidence)
    };
    
    return {
      ...summary,
      metadata: {
        originalGradeLevel: this.calculateGradeLevel(paper.title + paper.abstract),
        adaptedGradeLevel: target.gradeLevel,
        audience: target.audience
      }
    };
  }
  
  reformulateTitle(title) {
    const technicalRemoval = [
      /Analysis of /gi,
      /Study on /gi,
      /Investigation of /gi,
      /A /gi
    ];
    
    let simplified = title;
    technicalRemoval.forEach(pattern => {
      simplified = simplified.replace(pattern, '');
    });
    
    return simplified.trim();
  }
  
  simplifyMethods(methods, level) {
    if (level === 'general') {
      return {
        approach: this.mapMethodApproach(methods.type),
        participants: this.humanizeNumbers(methods.participants),
        duration: this.humanizeTime(methods.duration)
      };
    }
    return methods;
  }
  
  presentFindings(findings) {
    return findings.map(finding => ({
      statement: this.createFindingStatement(finding),
      strength: this.qualifyStrength(finding.statisticalSignificance),
      practicalMeaning: this.explainPracticalImpact(finding.effectSize)
    }));
  }
  
  quantifyUncertainty(confidence) {
    const qualifiers = {
      veryHigh: 'extremely confident',
      high: 'confident',
      moderate: 'fairly confident',
      low: 'somewhat uncertain',
      veryLow: 'highly uncertain'
    };
    
    return {
      level: confidence.level,
      qualifier: qualifiers[confidence.level] || 'uncertain',
      percentage: confidence.percentage,
      caveats: confidence.caveats || []
    };
  }
  
  createFindingStatement(finding) {
    const templates = [
      'The study found that {relationship} among {population}.',
      'Results showed {direction} {magnitude} in {outcome}.',
      '{population} experienced {change} in {outcome} when {condition}.'
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return template
      .replace('{relationship}', finding.relationship)
      .replace('{population}', finding.population)
      .replace('{direction}', finding.direction)
      .replace('{magnitude}', finding.magnitude)
      .replace('{outcome}', finding.outcome)
      .replace('{change}', finding.change)
      .replace('{condition}', finding.condition);
  }
}
```

### Interactive Explainer Builder
```javascript
class ExplainerBuilder {
  constructor() {
    this.concepts = [];
    this.analogies = [];
    this.interactiveElements = [];
  }
  
  addConcept(name, definition, options = {}) {
    this.concepts.push({
      id: this.generateId(),
      name,
      definition,
      examples: options.examples || [],
      prerequisites: options.prerequisites || [],
      depth: options.depth || 1
    });
    return this;
  }
  
  addAnalogy(conceptId, analogy) {
    this.analogies.push({
      conceptId,
      ...analogy
    });
    return this;
  }
  
  addInteractive(conceptId, element) {
    this.interactiveElements.push({
      conceptId,
      ...element
    });
    return this;
  }
  
  buildForAudience(audienceLevel) {
    const filteredConcepts = this.filterByDepth(audienceLevel);
    
    const explainer = {
      introduction: this.createIntroduction(),
      concepts: filteredConcepts.map(c => ({
        ...c,
        analogy: this.getAnalogyForConcept(c.id),
        interactive: this.getInteractiveForConcept(c.id)
      }));
    };
    
    return this.generateHTML(explainer);
  }
  
  filterByDepth(level) {
    const depthMap = { child: 1, teen: 2, adult: 3, expert: 4 };
    const maxDepth = depthMap[level] || 2;
    
    return this.concepts.filter(c => c.depth <= maxDepth);
  }
  
  generateHTML(explainer) {
    let html = `<div class="explainer">`;
    
    html += `<section class="introduction">${explainer.introduction}</section>`;
    
    explainer.concepts.forEach(concept => {
      html += `<article class="concept" data-depth="${concept.depth}">`;
      html += `<h3>${concept.name}</h3>`;
      html += `<p>${concept.definition}</p>`;
      
      if (concept.analogy) {
        html += this.renderAnalogy(concept.analogy);
      }
      
      if (concept.interactive) {
        html += this.renderInteractive(concept.interactive);
      }
      
      html += `</article>`;
    });
    
    html += `</div>`;
    return html;
  }
  
  renderAnalogy(analogy) {
    return `
      <div class="analogy" role="note">
        <strong>Think of it like:</strong>
        <p>${analogy.scenario}</p>
        <p class="mapping">${analogy.mapping}</p>
      </div>
    `;
  }
  
  renderInteractive(element) {
    if (element.type === 'slider') {
      return `
        <div class="interactive-slider" data-param="${element.parameter}">
          <label>${element.label}: <span class="value">${element.default}</span></label>
          <input type="range" min="${element.min}" max="${element.max}" 
                 value="${element.default}" step="${element.step}">
        </div>
      `;
    }
    return '';
  }
}
```

### Misinformation Response System
```javascript
class MisinformationResponder {
  constructor() {
    this.claimPatterns = [];
    this.responses = new Map();
  }
  
  registerClaim(pattern, response) {
    this.claimPatterns.push({
      regex: typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern,
      response
    });
    return this;
  }
  
  generateResponse(claim) {
    const matched = this.matchClaim(claim);
    
    if (matched) {
      return {
        acknowledgment: this.generateAcknowledgment(claim),
        correction: matched.response.correction,
        evidence: matched.response.evidence,
        context: matched.response.context,
        sources: matched.response.sources,
        uncertainty: matched.response.uncertainty || null
      };
    }
    
    return this.generateGenericResponse(claim);
  }
  
  matchClaim(claim) {
    return this.claimPatterns.find(p => p.regex.test(claim));
  }
  
  generateAcknowledgment(claim) {
    const acknowledgments = [
      'I understand why this might seem concerning.',
      'This is a common question about the topic.',
      'I can see how this claim might be concerning.'
    ];
    
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }
  
  generateGenericResponse(claim) {
    return {
      acknowledgment: 'This is an important topic that deserves careful consideration.',
      correction: 'The relationship is more nuanced than often portrayed.',
      evidence: [],
      context: 'Scientific understanding evolves as new evidence emerges.',
      sources: [],
      uncertainty: 'Research is ongoing and conclusions may change.'
    };
  }
  
  generateUncertaintyMessage(uncertainty) {
    const messages = {
      veryHigh: 'The evidence strongly supports this conclusion.',
      high: 'The evidence supports this conclusion.',
      moderate: 'The evidence moderately supports this conclusion.',
      low: 'The evidence weakly supports this conclusion.',
      veryLow: 'The evidence does not strongly support this conclusion.'
    };
    
    return messages[uncertainty] || 'The evidence is mixed.';
  }
}
```

## Best Practices

1. Start with the why, not the what
2. Use concrete examples and familiar contexts
3. Acknowledge uncertainty honestly
4. Provide actionable next steps when possible
5. Match vocabulary to audience expertise
6. Use visuals to complement text explanations
7. Address misconceptions directly
8. Balance accuracy with accessibility
9. Provide pathways to learn more
10. Test understanding with representative audiences
