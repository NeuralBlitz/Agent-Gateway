---
name: Project Management
description: Planning, executing, and delivering projects successfully through structured methodologies and stakeholder communication
license: MIT
compatibility: universal
audience: developers, team leads, project managers
category: interdisciplinary
---

# Project Management

## What I Do

I organize and coordinate project activities to deliver outcomes on time, within budget, and to quality standards. I establish processes, manage risks, facilitate communication, and keep projects moving toward their goals.

## When to Use Me

- Planning project scope, timeline, and resources
- Managing team coordination and communication
- Tracking progress and identifying blockers
- Mitigating risks and handling changes
- Running effective meetings and ceremonies
- Balancing constraints (scope, time, cost, quality)

## Core Concepts

1. **Project Lifecycle**: Initiation, Planning, Execution, Monitoring, Closure
2. **Scope Management**: Defining and controlling what is in/out of scope
3. **Work Breakdown Structure**: Decomposing work into manageable units
4. **Critical Path Analysis**: Identifying longest task sequence
5. **Risk Management**: Identifying, assessing, and mitigating risks
6. **Stakeholder Management**: Identifying and engaging stakeholders
7. **Agile vs Waterfall**: Choosing appropriate methodologies
8. **Resource Allocation**: Assigning people and tools effectively
9. **Earned Value Management**: Integrated scope, schedule, cost tracking
10. **Retrospectives**: Continuous improvement through reflection

## Code Examples

### Project Scheduler
```javascript
class ProjectScheduler {
  constructor(project) {
    this.project = project;
    this.tasks = project.tasks || [];
    this.resources = project.resources || [];
    this.dependencies = project.dependencies || [];
    this.constraints = project.constraints || {};
  }
  
  buildWBS() {
    const wbs = {
      id: this.project.id,
      name: this.project.name,
      deliverables: []
    };
    
    let workPackageId = 0;
    
    this.project.phases?.forEach(phase => {
      const phaseNode = {
        id: `WP-${phase.id}`,
        name: phase.name,
        deliverables: [],
        estimatedHours: 0,
        actualHours: 0
      };
      
      phase.workPackages?.forEach(wp => {
        const wpNode = {
          id: `WP-${workPackageId++}`,
          name: wp.name,
          tasks: wp.tasks.map(t => ({
            id: t.id,
            name: t.name,
            hours: t.estimatedHours,
            resource: t.assignedTo,
            dependencies: t.dependsOn || [],
            status: 'pending'
          })),
          estimatedHours: wp.tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
        };
        
        phaseNode.deliverables.push(wpNode);
        phaseNode.estimatedHours += wpNode.estimatedHours;
      });
      
      wbs.deliverables.push(phaseNode);
    });
    
    return wbs;
  }
  
  calculateCriticalPath() {
    const taskMap = new Map();
    this.tasks.forEach(task => {
      task.earliestStart = 0;
      task.earliestFinish = 0;
      task.latestStart = Infinity;
      task.latestFinish = Infinity;
      taskMap.set(task.id, task);
    });
    
    const forwardPass = () => {
      const sorted = [...this.tasks].sort((a, b) => 
        (a.dependencies?.length || 0) - (b.dependencies?.length || 0)
      );
      
      sorted.forEach(task => {
        const deps = (task.dependencies || [])
          .map(id => taskMap.get(id))
          .filter(Boolean);
        
        task.earliestStart = deps.length > 0
          ? Math.max(...deps.map(d => d.earliestFinish))
          : 0;
        task.earliestFinish = task.earliestStart + task.duration;
      });
    };
    
    const backwardPass = () => {
      const sorted = [...this.tasks].sort((a, b) => 
        (b.dependencies?.length || 0) - (a.dependencies?.length || 0)
      );
      
      const projectDuration = Math.max(...this.tasks.map(t => t.earliestFinish));
      
      sorted.forEach(task => {
        const dependents = this.findDependents(task.id);
        
        task.latestFinish = dependents.length > 0
          ? Math.min(...dependents.map(d => d.latestStart))
          : projectDuration;
        task.latestStart = task.latestFinish - task.duration;
        task.slack = task.latestStart - task.earliestStart;
      });
    };
    
    forwardPass();
    backwardPass();
    
    return this.tasks.filter(t => t.slack === 0);
  }
  
  findDependents(taskId) {
    return this.tasks.filter(t => 
      t.dependencies?.includes(taskId)
    );
  }
  
  generateSchedule(options = {}) {
    const criticalPath = this.calculateCriticalPath();
    const schedule = {
      project: this.project.name,
      startDate: options.startDate || new Date(),
      endDate: null,
      duration: 0,
      tasks: this.tasks.map(t => ({
        id: t.id,
        name: t.name,
        start: t.earliestStart,
        finish: t.earliestFinish,
        duration: t.duration,
        isCritical: t.slack === 0,
        resources: t.assignedTo
      })),
      milestones: this.project.milestones?.map(m => ({
        id: m.id,
        name: m.name,
        date: m.date,
        dependencies: m.dependencies
      }))
    };
    
    schedule.endDate = this.addWorkingDays(
      schedule.startDate,
      Math.max(...schedule.tasks.map(t => t.finish))
    );
    schedule.duration = Math.max(...schedule.tasks.map(t => t.finish));
    
    return schedule;
  }
  
  addWorkingDays(startDate, days) {
    const result = new Date(startDate);
    let added = 0;
    
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        added++;
      }
    }
    
    return result;
  }
}
```

### Risk Register Manager
```javascript
class RiskManager {
  constructor(project) {
    this.project = project;
    this.risks = [];
    this.mitigationStrategies = {
      avoid: 'Change project plan to eliminate threat',
      mitigate: 'Reduce probability or impact',
      transfer: 'Shift responsibility to third party',
      accept: 'Acknowledge and monitor'
    };
  }
  
  addRisk(identification) {
    const risk = {
      id: this.generateId(),
      description: identification.description,
      category: identification.category,
      probability: identification.probability || 'medium',
      impact: identification.impact || 'medium',
      detected: new Date(),
      detectedBy: identification.reporter,
      status: 'identified',
      mitigation: null,
      contingency: null,
      owner: null,
      history: [{
        date: new Date(),
        action: 'Risk identified',
        actor: identification.reporter
      }]
    };
    
    risk.score = this.calculateScore(risk);
    risk.level = this.determineLevel(risk.score);
    
    this.risks.push(risk);
    return risk;
  }
  
  calculateScore(risk) {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[risk.probability] * scores[risk.impact];
  }
  
  determineLevel(score) {
    if (score >= 9) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
  
  assignMitigation(riskId, strategy, plan) {
    const risk = this.findRisk(riskId);
    if (!risk) throw new Error('Risk not found');
    
    risk.mitigation = {
      strategy,
      plan,
      owner: plan.owner,
      dueDate: plan.dueDate,
      status: 'in-progress'
    };
    
    risk.owner = plan.owner;
    this.addHistory(risk, 'Mitigation plan assigned', plan.owner);
    
    if (strategy === 'avoid') {
      risk.status = 'closed';
      risk.outcome = 'avoided';
    }
    
    return risk;
  }
  
  updateStatus(riskId, status, actor) {
    const risk = this.findRisk(riskId);
    if (!risk) throw new Error('Risk not found');
    
    const oldStatus = risk.status;
    risk.status = status;
    risk.lastUpdated = new Date();
    
    this.addHistory(risk, `Status changed: ${oldStatus} -> ${status}`, actor);
    
    if (status === 'occurred') {
      risk.actualImpact = this.assessActualImpact(risk);
      this.triggerContingencyPlan(risk);
    }
    
    return risk;
  }
  
  assessActualImpact(risk) {
    return {
      scheduleDelay: risk.scheduleDelay || 0,
      costOverrun: risk.costOverrun || 0,
      scopeChange: risk.scopeChange || false,
      qualityImpact: risk.qualityImpact || false,
      teamImpact: risk.teamImpact || false
    };
  }
  
  triggerContingencyPlan(risk) {
    if (!risk.contingency) {
      return { triggered: false, reason: 'No contingency plan defined' };
    }
    
    risk.contingency.status = 'triggered';
    risk.contingency.triggerDate = new Date();
    
    return {
      triggered: true,
      plan: risk.contingency,
      actions: risk.contingency.actions
    };
  }
  
  generateRiskReport() {
    const byCategory = this.groupByCategory();
    byLevel = this.groupByLevel();
    
    return {
      summary: {
        totalRisks: this.risks.length,
        openRisks: this.risks.filter(r => r.status !== 'closed').length,
        criticalCount: this.risks.filter(r => r.level === 'critical').length,
        highCount: this.risks.filter(r => r.level === 'high').length
      },
      byCategory,
      byLevel,
      topRisks: this.risks
        .filter(r => r.status !== 'closed')
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
      mitigationProgress: this.calculateMitigationProgress()
    };
  }
  
  calculateMitigationProgress() {
    const active = this.risks.filter(r => 
      r.mitigation && r.status !== 'closed'
    );
    
    const completed = active.filter(r => 
      r.mitigation.status === 'completed'
    );
    
    return {
      total: active.length,
      completed: completed.length,
      inProgress: active.length - completed.length,
      percentage: active.length > 0 
        ? Math.round((completed.length / active.length) * 100)
        : 100
    };
  }
}
```

### Sprint Metrics Dashboard
```javascript
class SprintMetrics {
  constructor(sprint) {
    this.sprint = sprint;
    this.stories = sprint.stories || [];
    this.completedPoints = 0;
    this.totalPoints = 0;
  }
  
  calculateVelocity() {
    const completed = this.stories.filter(s => s.status === 'completed');
    this.completedPoints = completed.reduce((sum, s) => sum + s.points, 0);
    this.totalPoints = this.stories.reduce((sum, s) => sum + s.points, 0);
    
    return {
      committed: this.totalPoints,
      completed: this.completedPoints,
      completionRate: this.totalPoints > 0 
        ? this.completedPoints / this.totalPoints 
        : 0,
      averagePointsPerStory: this.stories.length > 0
        ? this.completedPoints / completed.length
        : 0
    };
  }
  
  calculateBurndown() {
    const dailyData = this.sprint.dailySnapshots || [];
    
    const burndown = dailyData.map(day => ({
      date: day.date,
      remaining: day.remainingPoints,
      completed: day.completedPoints,
      ideal: this.calculateIdealBurndown(day.date)
    }));
    
    return {
      data: burndown,
      variance: this.calculateVariance(burndown),
      projectedCompletion: this.projectCompletionDate(burndown),
      trend: this.analyzeTrend(burndown)
    };
  }
  
  calculateIdealBurndown(currentDate) {
    const sprintStart = new Date(this.sprint.startDate);
    const sprintEnd = new Date(this.sprint.endDate);
    const totalDays = this.getWorkingDays(sprintStart, sprintEnd);
    const daysElapsed = this.getWorkingDays(sprintStart, currentDate);
    
    return Math.max(0, this.totalPoints - 
      (this.totalPoints / totalDays) * daysElapsed
    );
  }
  
  getWorkingDays(start, end) {
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
  
  analyzeTrend(burndown) {
    const recent = burndown.slice(-5);
    
    if (recent.length < 2) return 'insufficient-data';
    
    const velocities = recent.map(d => 
      d.completed - (burndown[recent.indexOf(d) - 1]?.completed || 0)
    );
    
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    
    if (avgVelocity > 5) return 'ahead';
    if (avgVelocity < 2) return 'behind';
    return 'on-track';
  }
  
  generateSprintReport() {
    this.calculateVelocity();
    const burndown = this.calculateBurndown();
    
    return {
      sprint: this.sprint.name,
      velocity: {
        committed: this.totalPoints,
        completed: this.completedPoints,
        rate: this.completedPoints / this.totalPoints
      },
      quality: this.calculateQualityMetrics(),
      team: this.calculateTeamMetrics(),
      risks: this.identifySprintRisks(),
      recommendations: this.generateRecommendations()
    };
  }
  
  calculateQualityMetrics() {
    const completed = this.stories.filter(s => s.status === 'completed');
    
    const withBugs = completed.filter(s => s.bugsCreated > 0);
    const withRework = completed.filter(s => s.reworkHours > 0);
    
    return {
      defectRate: completed.length > 0 
        ? withBugs.length / completed.length 
        : 0,
      reworkRate: completed.length > 0 
        ? withRework.length / completed.length 
        : 0,
      averageBugsPerStory: withBugs.length > 0
        ? withBugs.reduce((sum, s) => sum + s.bugsCreated, 0) / withBugs.length
        : 0
    };
  }
}
```

## Best Practices

1. Define clear, measurable objectives before starting
2. Break work into small, manageable increments
3. Communicate proactively about blockers and risks
4. Track progress against baselines regularly
5. Manage stakeholder expectations continuously
6. Adapt plans based on feedback and changes
7. Hold effective, action-oriented meetings
8. Document decisions and their rationale
9. Retrospect and improve processes continuously
10. Focus on outcomes, not just outputs
