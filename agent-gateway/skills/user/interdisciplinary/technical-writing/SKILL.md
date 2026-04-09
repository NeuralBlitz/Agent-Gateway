---
name: Technical Writing
description: Creating clear, accurate, and usable documentation for technical products, APIs, and systems
license: MIT
compatibility: universal
audience: developers, technical writers, product managers
category: interdisciplinary
---

# Technical Writing

## What I Do

I transform complex technical information into clear, accurate, and usable documentation. I create user guides, API documentation, system architecture documents, and knowledge base articles that help users understand and use products effectively.

## When to Use Me

- Writing API documentation and reference guides
- Creating user manuals and getting started guides
- Documenting system architecture and design decisions
- Writing release notes and changelogs
- Building internal knowledge bases
- Simplifying complex technical concepts for various audiences

## Core Concepts

1. **Audience Analysis**: Tailoring content to reader knowledge level
2. **Document Planning**: Outlining and structuring for clarity
3. **Plain Language**: Clear, concise, jargon-free writing
4. **Information Architecture**: Logical grouping and navigation
5. **Task-Based Documentation**: How-to guides organized by user goals
6. **API Documentation Standards**: OpenAPI, AsyncAPI, and DocOps
7. **Version Control for Docs**: Git-based documentation workflows
8. **Single-Source Publishing**: Reusing content across formats
9. **Accessibility in Docs**: Structure, headings, alt text
10. **Documentation Testing**: Verifying code examples work

## Code Examples

### API Documentation Generator
```javascript
class APIDocGenerator {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api/v1';
    this.version = options.version || '1.0.0';
    this.endpoints = [];
  }
  
  addEndpoint(method, path, config) {
    this.endpoints.push({
      method: method.toUpperCase(),
      path: this.formatPath(path),
      summary: config.summary || '',
      description: config.description || '',
      tags: config.tags || [],
      parameters: this.extractParameters(path, config.parameters || []),
      requestBody: config.requestBody,
      responses: config.responses || {},
      examples: config.examples || []
    });
    return this;
  }
  
  formatPath(path) {
    return path.replace(/{([^}]+)}/g, ':$1');
  }
  
  extractParameters(path, parameters) {
    const pathParams = path.match(/{([^}]+)}/g) || [];
    const pathParamNames = pathParams.map(p => p.slice(1, -1));
    
    return [
      ...pathParamNames.map(name => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' }
      })),
      ...parameters
    ];
  }
  
  generateMarkdown() {
    let md = `# API Reference\n\n`;
    md += `**Base URL:** \`${this.baseUrl}\`\n`;
    md += `**Version:** ${this.version}\n\n`;
    
    const grouped = this.groupByTags();
    
    for (const [tag, endpoints] of Object.entries(grouped)) {
      md += `## ${tag}\n\n`;
      
      for (const endpoint of endpoints) {
        md += this.formatEndpointMarkdown(endpoint);
      }
    }
    
    return md;
  }
  
  formatEndpointMarkdown(endpoint) {
    let md = `### ${endpoint.method} ${endpoint.path}\n\n`;
    md += `**Summary:** ${endpoint.summary}\n\n`;
    
    if (endpoint.description) {
      md += `${endpoint.description}\n\n`;
    }
    
    if (endpoint.parameters.length > 0) {
      md += `#### Parameters\n\n`;
      md += `| Name | In | Type | Required | Description |\n`;
      md += `|------|-----|------|----------|-------------|\n`;
      
      endpoint.parameters.forEach(p => {
        md += `| ${p.name} | ${p.in} | ${p.schema?.type || 'string'} | ${p.required} | ${p.description || ''} |\n`;
      });
      md += `\n`;
    }
    
    if (endpoint.examples.length > 0) {
      md += `#### Examples\n\n`;
      
      endpoint.examples.forEach(ex => {
        md += `**Request:**\n`;
        md += '```\n';
        md += `${endpoint.method} ${this.baseUrl}${endpoint.path}\n`;
        if (ex.body) {
          md += `\n${JSON.stringify(ex.body, null, 2)}\n`;
        }
        md += '```\n\n';
        
        md += `**Response:**\n`;
        md += '```json\n';
        md += `${JSON.stringify(ex.response, null, 2)}\n`;
        md += '```\n\n';
      });
    }
    
    return md;
  }
  
  generateOpenAPI() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: this.version
      },
      servers: [{ url: this.baseUrl }],
      paths: this.buildOpenAPIPaths()
    };
  }
  
  buildOpenAPIPaths() {
    const paths = {};
    
    this.endpoints.forEach(endpoint => {
      const pathKey = endpoint.path.replace(/:(\w+)/g, '{$1}');
      
      if (!paths[pathKey]) paths[pathKey] = {};
      paths[pathKey][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses
      };
    });
    
    return paths;
  }
  
  groupByTags() {
    const grouped = {};
    
    this.endpoints.forEach(endpoint => {
      const tag = endpoint.tags[0] || 'General';
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(endpoint);
    });
    
    return grouped;
  }
}
```

### Documentation Linter
```javascript
class DocLinter {
  constructor() {
    this.rules = [
      { id: 'HEADING-ORDER', check: this.checkHeadingOrder.bind(this) },
      { id: 'CODE-LANGUAGE', check: this.checkCodeLanguage.bind(this) },
      { id: 'LINK-TEXT', check: this.checkLinkText.bind(this) },
      { id: 'COMPLEXITY', check: this.checkComplexity.bind(this) },
      { id: 'ACTIVE-VOICE', check: this.checkActiveVoice.bind(this) }
    ];
  }
  
  lint(content, filePath) {
    const results = [];
    const lines = content.split('\n');
    
    this.rules.forEach(rule => {
      const issues = rule.check(content, lines, filePath);
      results.push(...issues);
    });
    
    return {
      file: filePath,
      issues: results,
      score: this.calculateScore(results)
    };
  }
  
  checkHeadingOrder(content, lines) {
    const issues = [];
    const headingLevels = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s/);
      if (match) {
        const level = match[1].length;
        if (level > headingLevels[headingLevels.length - 1] + 1) {
          issues.push({
            line: index + 1,
            rule: 'HEADING-ORDER',
            severity: 'warning',
            message: `Heading level jumps from H${headingLevels[headingLevels.length - 1]} to H${level}`
          });
        }
        headingLevels.push(level);
      }
    });
    
    return issues;
  }
  
  checkCodeLanguage(content, lines) {
    const issues = [];
    const codeBlockRegex = /```(\w+)?/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (!match[1]) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          line: lineNumber,
          rule: 'CODE-LANGUAGE',
          severity: 'suggestion',
          message: 'Code block missing language identifier'
        });
      }
    }
    
    return issues;
  }
  
  checkComplexity(content, lines) {
    const issues = [];
    const sentences = content.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.split(' ').length > 25);
    
    if (longSentences.length > sentences.length * 0.1) {
      issues.push({
        rule: 'COMPLEXITY',
        severity: 'suggestion',
        message: `${longSentences.length} sentences exceed 25 words. Consider breaking them up.`
      });
    }
    
    return issues;
  }
  
  checkActiveVoice(content) {
    const issues = [];
    const passivePatterns = [
      /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
      /\b(has|have|had)\s+been\s+\w+ed\b/gi
    ];
    
    passivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 3) {
        issues.push({
          rule: 'ACTIVE-VOICE',
          severity: 'suggestion',
          message: `Found ${matches.length} passive voice constructions. Consider active voice.`
        });
      }
    });
    
    return issues;
  }
  
  calculateScore(issues) {
    const weights = { error: 1, warning: 0.5, suggestion: 0.25 };
    const maxScore = 100;
    
    const penalty = issues.reduce(
      (sum, issue) => sum + (weights[issue.severity] || 0.5) * 5,
      0
    );
    
    return Math.max(0, maxScore - penalty);
  }
}
```

### Version Changelog Generator
```javascript
class ChangelogGenerator {
  constructor() {
    this.commits = [];
    this.breakingChanges = [];
    this.features = [];
    this.fixes = [];
    this.chores = [];
  }
  
  addCommits(commits, options = {}) {
    const parser = new CommitParser();
    
    commits.forEach(commit => {
      const parsed = parser.parse(commit.message);
      
      if (parsed.breaking) {
        this.breakingChanges.push({ commit, parsed });
      } else if (parsed.type === 'feat') {
        this.features.push({ commit, parsed });
      } else if (parsed.type === 'fix') {
        this.fixes.push({ commit, parsed });
      } else {
        this.chores.push({ commit, parsed });
      }
    });
    
    return this;
  }
  
  generateMarkdown(options = {}) {
    const version = options.version || this.generateVersion();
    const date = options.date || new Date().toISOString().split('T')[0];
    
    let md = `# Changelog\n\n`;
    md += `## [${version}] - ${date}\n\n`;
    
    if (this.breakingChanges.length > 0) {
      md += `### Breaking Changes\n\n`;
      this.breakingChanges.forEach(({ parsed }) => {
        md += `- ${parsed.description}`;
        if (parsed.breakingDescription) {
          md += `: ${parsed.breakingDescription}`;
        }
        md += '\n';
      });
      md += '\n';
    }
    
    if (this.features.length > 0) {
      md += `### New Features\n\n`;
      this.features.forEach(({ parsed }) => {
        md += `- ${parsed.description}\n`;
      });
      md += '\n';
    }
    
    if (this.fixes.length > 0) {
      md += `### Bug Fixes\n\n`;
      this.fixes.forEach(({ parsed }) => {
        md += `- ${parsed.description}\n`;
      });
      md += '\n';
    }
    
    if (this.chores.length > 0) {
      md += `### Maintenance\n\n`;
      this.chores.forEach(({ parsed }) => {
        md += `- ${parsed.description}\n`;
      });
    }
    
    return md;
  }
  
  generateVersion() {
    const hasBreaking = this.breakingChanges.length > 0;
    const hasFeatures = this.features.length > 0;
    const hasFixes = this.fixes.length > 0;
    
    const parts = [0, 0, 0];
    
    if (hasBreaking) {
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
    } else if (hasFeatures) {
      parts[1]++;
      parts[2] = 0;
    } else if (hasFixes) {
      parts[2]++;
    }
    
    return parts.join('.');
  }
}

class CommitParser {
  parse(message) {
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?!?:\s+(.+)$/;
    const match = message.match(conventionalRegex);
    
    if (!match) {
      return { type: 'other', description: message, breaking: false };
    }
    
    const [, type, scope, description] = match;
    const breaking = description.includes('BREAKING CHANGE');
    
    const breakingDescription = breaking 
      ? description.split('BREAKING CHANGE:')[1]?.trim()
      : null;
    
    return {
      type,
      scope,
      description: description.split('BREAKING CHANGE:')[0].trim(),
      breaking,
      breakingDescription
    };
  }
}
```

## Best Practices

1. Know your audience and write to their level
2. Use active voice and present tense
3. Write clear, concise sentences (under 25 words)
4. Use consistent terminology throughout
5. Provide context and examples for complex concepts
6. Structure documents with clear hierarchy
7. Keep code examples working and tested
8. Use tables for structured information
9. Include troubleshooting and common errors sections
10. Review and edit documentation regularly
