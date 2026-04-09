# Code Coverage

## Overview

Code Coverage is a measure of how much source code is executed during automated testing, expressed as a percentage. It helps developers understand test effectiveness, identify untested code paths, and assess the quality of test suites. High code coverage alone doesn't guarantee good tests, but it helps identify code that isn't tested at all.

## Description

Code coverage tools instrument code to track which lines, branches, functions, and statements are executed during tests. The main coverage criteria include statement coverage (every statement executed at least once), branch coverage (every conditional branch taken both true and false), function coverage (every function called), and path coverage (every possible path through code).

Modern coverage tools provide detailed reports showing exactly which lines were executed, which were missed, and which conditions were only partially exercised. They integrate with CI/CD pipelines to enforce coverage thresholds and track coverage trends over time. Coverage metrics should be used as a guide, not a mandate, as 100% coverage doesn't mean bug-free code.

## Prerequisites

- Understanding of software testing principles
- Familiarity with unit testing frameworks
- Knowledge of programming language basics
- Experience with command-line tools
- Understanding of CI/CD concepts

## Core Competencies

- Coverage criteria understanding (statement, branch, function, path, MC/DC)
- Coverage tool configuration and usage
- Interpreting coverage reports
- Integration with test frameworks
- CI/CD pipeline integration
- Coverage enforcement policies
- Identifying meaningful vs. vanity coverage
- Coverage trend analysis

## Implementation

### Python Coverage.py Integration

```python
import subprocess
import sys
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import re

class CoverageTool:
    COVERAGE_FILE = ".coverage"
    
    def __init__(self, source: List[str] = None, omit: List[str] = None):
        self.source = source or ["."]
        self.omit = omit or ["*/test*/", "*/venv*/", "*/__pycache__/*"]
        self.config_file = ".coveragerc"
    
    def run_with_coverage(self, args: List[str]) -> subprocess.CompletedProcess:
        env = os.environ.copy()
        env["COVERAGE_PROCESS_START"] = self.config_file
        
        return subprocess.run(
            [sys.executable, "-m", "coverage"] + args,
            env=env,
            capture_output=True,
            text=True
        )
    
    def run(self, args: List[str]) -> subprocess.CompletedProcess:
        cmd = [
            sys.executable, "-m", "coverage",
            "run",
            "--source", ",".join(self.source),
            "--omit", ",".join(self.omit),
        ] + args
        
        return subprocess.run(cmd, capture_output=True, text=True)
    
    def report(
        self,
        show_missing: bool = True,
        include: List[str] = None,
        omit: List[str] = None
    ) -> Tuple[str, int]:
        cmd = ["report", "--show-missing"]
        
        if include:
            cmd.extend(["--include", ",".join(include)])
        if omit:
            cmd.extend(["--omit", ",".join(omit)])
        
        result = self.run_with_coverage(cmd)
        return result.stdout, result.returncode
    
    def xml_report(self, output_file: str = "coverage.xml") -> subprocess.CompletedProcess:
        cmd = ["xml", "-o", output_file]
        return self.run_with_coverage(cmd)
    
    def html_report(self, output_dir: str = "htmlcov") -> subprocess.CompletedProcess:
        cmd = ["html", "-d", output_dir]
        return self.run_with_coverage(cmd)
    
    def json_report(self, output_file: str = "coverage.json") -> subprocess.CompletedProcess:
        cmd = ["json", "-o", output_file]
        return self.run_with_coverage(cmd)
    
    def erase(self) -> subprocess.CompletedProcess:
        return self.run_with_coverage(["erase"])
    
    def combine(self, data_paths: List[str] = None) -> subprocess.CompletedProcess:
        cmd = ["combine"]
        if data_paths:
            cmd.extend(data_paths)
        return self.run_with_coverage(cmd)
    
    def get_coverage_data(self) -> Dict:
        json_file = "coverage_summary.json"
        self.json_report(json_file)
        
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        os.remove(json_file)
        return data
    
    def check_coverage(
        self,
        branch: bool = False,
        line_threshold: float = 80.0,
        branch_threshold: float = 70.0
    ) -> Tuple[bool, str]:
        data = self.get_coverage_data()
        totals = data.get('totals', {})
        
        line_pct = totals.get('percent_covered', 0)
        branch_pct = 0
        
        if branch and 'branch_paths' in totals:
            total_branches = sum(
                len(paths) for paths in totals.get('branch_paths', {}).values()
            )
            covered_branches = sum(
                len([p for p in paths if p]) 
                for paths in totals.get('branch_paths', {}).values()
            )
            if total_branches > 0:
                branch_pct = (covered_branches / total_branches) * 100
        
        success = line_pct >= line_threshold
        if branch:
            success = success and branch_pct >= branch_threshold
        
        status = "PASSED" if success else "FAILED"
        message = (
            f"Coverage check {status}: "
            f"Lines {line_pct:.2f}% (threshold: {line_threshold}%)"
        )
        if branch:
            message += f", Branches {branch_pct:.2f}% (threshold: {branch_threshold}%)"
        
        return success, message


@dataclass
class CoverageMetrics:
    line_covered: int
    line_missing: int
    line_total: int
    line_percent: float
    branch_covered: int
    branch_missing: int
    branch_total: int
    branch_percent: float
    function_covered: int
    function_total: int
    function_percent: float


class CoverageAnalyzer:
    def __init__(self, xml_report_path: str = "coverage.xml"):
        self.xml_path = xml_report_path
    
    def parse_xml_report(self) -> CoverageMetrics:
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        
        packages = root.findall(".//packages/package")
        
        total_lines = covered_lines = missing_lines = 0
        total_branches = covered_branches = 0
        total_functions = covered_functions = 0
        
        for package in packages:
            for cls in package.findall("classes/class"):
                for line in cls.findall("lines/line"):
                    total_lines += 1
                    hits = int(line.get('hits', 0))
                    if hits > 0:
                        covered_lines += 1
                    else:
                        missing_lines += 1
                    
                    branch_type = line.get('branch', '')
                    if branch_type == 'true':
                        total_branches += 1
                        if hits > 0:
                            covered_branches += 1
                    elif branch_type == 'false':
                        total_branches += 1
                        if hits == 0:
                            covered_branches += 1
        
        line_percent = (covered_lines / total_lines * 100) if total_lines > 0 else 0
        branch_percent = (covered_branches / total_branches * 100) if total_branches > 0 else 0
        function_percent = (covered_functions / total_functions * 100) if total_functions > 0 else 0
        
        return CoverageMetrics(
            line_covered=covered_lines,
            line_missing=missing_lines,
            line_total=total_lines,
            line_percent=line_percent,
            branch_covered=covered_branches,
            branch_missing=total_branches - covered_branches,
            branch_total=total_branches,
            branch_percent=branch_percent,
            function_covered=covered_functions,
            function_total=total_functions,
            function_percent=function_percent
        )
    
    def find_uncovered_lines(self, file_path: str) -> List[int]:
        missing_lines = []
        
        if not os.path.exists(self.xml_path):
            return missing_lines
        
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        
        for package in root.findall(".//packages/package"):
            for cls in package.findall("classes/class"):
                if cls.get('filename') == file_path or cls.get('name') == file_path:
                    for line in cls.findall("lines/line"):
                        hits = int(line.get('hits', 0))
                        if hits == 0:
                            number = int(line.get('number'))
                            missing_lines.append(number)
                    break
        
        return missing_lines
    
    def get_Least_covered_files(self, limit: int = 10) -> List[Dict]:
        files = []
        
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        
        for package in root.findall(".//packages/package"):
            for cls in package.findall("classes/class"):
                file_info = {
                    "name": cls.get('name'),
                    "filename": cls.get('filename'),
                    "line_rate": float(cls.get('line-rate', 0)),
                    "branch_rate": float(cls.get('branch-rate', 0)),
                }
                files.append(file_info)
        
        files.sort(key=lambda x: x['line_rate'])
        return files[:limit]


class CoverageBadgeGenerator:
    def __init__(self, coverage_percent: float):
        self.percent = coverage_percent
    
    def generate_shield_io_url(self) -> str:
        color = self._get_color()
        percent_int = int(self.percent)
        return (
            f"https://img.shields.io/badge/coverage-{percent_int}%"
            f"-{color}.svg"
        )
    
    def _get_color(self) -> str:
        if self.percent >= 90:
            return "brightgreen"
        elif self.percent >= 80:
            return "green"
        elif self.percent >= 70:
            return "yellowgreen"
        elif self.percent >= 60:
            return "yellow"
        elif self.percent >= 50:
            return "orange"
        else:
            return "red"
    
    def generate_svg_badge(self) -> str:
        color = self._get_color()
        width = 120
        height = 20
        
        colors = {
            "brightgreen": "#4c1",
            "green": "#97ca00",
            "yellowgreen": "#a4aa61",
            "yellow": "#dfb317",
            "orange": "#fe7d37",
            "red": "#e05d44",
        }
        
        svg_color = colors.get(color, "#9f9f9f")
        label = "coverage"
        
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="round">
    <rect width="{width}" height="{height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="60" height="{height}" fill="#555"/>
    <rect x="60" width="{width - 60}" height="{height}" fill="{svg_color}"/>
    <rect width="{width}" height="{height}" fill="url(#smooth)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="30" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="30" y="14">{label}</text>
    <text x="{width - 30}" y="15" fill="#010101" fill-opacity=".3">{self.percent:.0f}%</text>
    <text x="{width - 30}" y="14">{self.percent:.0f}%</text>
  </g>
</svg>'''


class CoverageTrendTracker:
    def __init__(self, history_file: str = "coverage_history.json"):
        self.history_file = history_file
        self.history = self._load_history()
    
    def _load_history(self) -> List[Dict]:
        if os.path.exists(self.history_file):
            with open(self.history_file, 'r') as f:
                return json.load(f)
        return []
    
    def _save_history(self):
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def record_coverage(self, branch: str, coverage_percent: float, commit_sha: str):
        entry = {
            "date": datetime.now().isoformat(),
            "branch": branch,
            "coverage": coverage_percent,
            "commit": commit_sha,
        }
        self.history.append(entry)
        self._save_history()
    
    def get_trend(self, days: int = 30) -> Dict:
        cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
        recent = [e for e in self.history if e.get('date', '')]
        
        if not recent:
            return {"trend": "unknown", "change": 0, "current": 0, "previous": 0}
        
        recent.sort(key=lambda x: x.get('date', ''))
        current = recent[-1].get('coverage', 0)
        previous = recent[-2].get('coverage', 0) if len(recent) > 1 else current
        
        change = current - previous
        
        trend = "stable"
        if change > 1:
            trend = "improving"
        elif change < -1:
            trend = "declining"
        
        return {
            "trend": trend,
            "change": change,
            "current": current,
            "previous": previous,
            "data_points": len(recent),
        }
    
    def generate_trend_report(self) -> str:
        trend = self.get_trend()
        
        emoji = {
            "improving": "↑",
            "declining": "↓",
            "stable": "→",
            "unknown": "?",
        }
        
        return f"""Coverage Trend Report
=====================
Current: {trend['current']:.2f}%
Previous: {trend['previous']:.2f}%
Change: {trend['change']:+.2f}%
Trend: {trend['trend']} {emoji.get(trend['trend'], '?')}
Data Points: {trend['data_points']}
"""
```

### Go Implementation

```go
package coverage

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Source      []string
	Omit        []string
	OutputDir   string
	XMLFile     string
	JSONFile    string
	HTMLDir     string
	Threshold   float64
	BranchThreshold float64
}

type Report struct {
	Totals   CoverageTotals    `xml:"totals"`
	Packages []PackageReport   `xml:"packages>package"`
}

type CoverageTotals struct {
	LineCovered    int     `xml:"lines-covered"`
	LineTotal      int     `xml:"lines-valid"`
	LinePercent    float64 `xml:"lines-covered" attr:"percent"`
	BranchCovered  int     `xml:"branches-covered"`
	BranchTotal    int     `xml:"branches-valid"`
	BranchPercent  float64 `xml:"branches-covered" attr:"percent"`
}

type PackageReport struct {
	Name    string          `xml:"name,attr"`
	Classes []ClassReport   `xml:"classes>class"`
}

type ClassReport struct {
	Name      string     `xml:"name,attr"`
	Filename  string     `xml:"filename,attr"`
	LineRate  float64    `xml:"line-rate,attr"`
	BranchRate float64   `xml:"branch-rate,attr"`
	Lines     []LineInfo `xml:"lines>line"`
}

type LineInfo struct {
	Number   int     `xml:"number,attr"`
	Hits     int     `xml:"hits,attr"`
	Branch   string  `xml:"branch,attr"`
}

type Metrics struct {
	LineCovered     int
	LineTotal       int
	LinePercent     float64
	BranchCovered   int
	BranchTotal     int
	BranchPercent   float64
	FunctionsCovered int
	FunctionsTotal  int
	FunctionsPercent float64
}

type CoverageTool struct {
	config Config
}

func New(config Config) *CoverageTool {
	return &CoverageTool{config: config}
}

func (c *CoverageTool) Run(args []string) error {
	cmd := exec.Command("go", append([]string{"test", "-coverprofile=coverage.out"}, args...)...)
	cmd.Dir = c.getModuleRoot()
	
	if len(c.config.Source) > 0 {
		coverProfile := fmt.Sprintf("-coverprofile=%s", c.config.XMLFile)
		cmd = exec.Command("go", append([]string{"test", "-coverprofile=coverage.out"}, args...)...)
	}
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("coverage run failed: %v\n%s", err, output)
	}
	
	return nil
}

func (c *CoverageTool) Profile(pkg string) error {
	args := []string{pkg}
	
	if len(c.config.Source) > 0 {
		for _, s := range c.config.Source {
			args = append(args, fmt.Sprintf("-coverprofile=%s", s+".out"))
		}
	}
	
	cmd := exec.Command("go", args...)
	cmd.Dir = c.getModuleRoot()
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("coverage profile failed: %v\n%s", err, output)
	}
	
	return nil
}

func (c *CoverageTool) CoverProfile(output string) error {
	cmd := exec.Command("go", "tool", "cover", "-profile=coverage.out", "-o", output)
	cmd.Dir = c.getModuleRoot()
	
	outputBytes, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("cover profile failed: %v\n%s", err, outputBytes)
	}
	
	return nil
}

func (c *CoverageTool) HTML() error {
	cmd := exec.Command("go", "tool", "cover", "-html=coverage.out", "-o", c.config.HTMLDir)
	cmd.Dir = c.getModuleRoot()
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("HTML generation failed: %v\n%s", err, output)
	}
	
	return nil
}

func (c *CoverageTool) Func() error {
	cmd := exec.Command("go", "tool", "cover", "-func=coverage.out", "-o", "-")
	cmd.Dir = c.getModuleRoot()
	
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("func report failed: %v\n%s", err, output)
	}
	
	fmt.Println(string(output))
	return nil
}

func (c *CoverageTool) ParseXML() (*Report, error) {
	data, err := os.ReadFile(c.config.XMLFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read XML file: %w", err)
	}
	
	var report Report
	if err := xml.Unmarshal(data, &report); err != nil {
		return nil, fmt.Errorf("failed to parse XML: %w", err)
	}
	
	return &report, nil
}

func (c *CoverageTool) ParseReport() (*Metrics, error) {
	report, err := c.ParseXML()
	if err != nil {
		return nil, err
	}
	
	metrics := &Metrics{}
	
	for _, pkg := range report.Packages {
		for _, class := range pkg.Classes {
			metrics.FunctionsTotal++
			if class.LineRate > 0 {
				metrics.FunctionsCovered++
			}
			
			for _, line := range class.Lines {
				metrics.LineTotal++
				if line.Hits > 0 {
					metrics.LineCovered++
				}
				
				if line.Branch == "true" || line.Branch == "false" {
					metrics.BranchTotal++
					if line.Hits > 0 || line.Branch == "true" {
						metrics.BranchCovered++
					}
				}
			}
		}
	}
	
	if metrics.LineTotal > 0 {
		metrics.LinePercent = float64(metrics.LineCovered) / float64(metrics.LineTotal) * 100
	}
	if metrics.BranchTotal > 0 {
		metrics.BranchPercent = float64(metrics.BranchCovered) / float64(metrics.BranchTotal) * 100
	}
	if metrics.FunctionsTotal > 0 {
		metrics.FunctionsPercent = float64(metrics.FunctionsCovered) / float64(metrics.FunctionsTotal) * 100
	}
	
	return metrics, nil
}

func (c *CoverageTool) Check() (bool, error) {
	metrics, err := c.ParseReport()
	if err != nil {
		return false, err
	}
	
	if metrics.LinePercent < c.config.Threshold {
		return false, fmt.Errorf(
			"line coverage %.2f%% below threshold %.2f%%",
			metrics.LinePercent, c.config.Threshold,
		)
	}
	
	if metrics.BranchPercent < c.config.BranchThreshold {
		return false, fmt.Errorf(
			"branch coverage %.2f%% below threshold %.2f%%",
			metrics.BranchPercent, c.config.BranchThreshold,
		)
	}
	
	return true, nil
}

func (c *CoverageTool) getModuleRoot() string {
	if dir := os.Getenv("GOMODCACHE"); dir != "" {
		return dir
	}
	
	if dir := os.Getenv("PWD"); dir != "" {
		return dir
	}
	
	cwd, _ := os.Getwd()
	return cwd
}

func (c *CoverageTool) Combine(files []string, output string) error {
	args := []string{"tool", "cover", "-profile"}
	args = append(args, files...)
	args = append(args, "-o", output)
	
	cmd := exec.Command("go", args...)
	cmd.Dir = c.getModuleRoot()
	
	outputBytes, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("combine failed: %v\n%s", err, outputBytes)
	}
	
	return nil
}

func FindUncovered(filePath string, coverageXML string) ([]int, error) {
	data, err := os.ReadFile(coverageXML)
	if err != nil {
		return nil, err
	}
	
	var report Report
	if err := xml.Unmarshal(data, &report); err != nil {
		return nil, err
	}
	
	uncovered := []int{}
	
	for _, pkg := range report.Packages {
		for _, class := range pkg.Classes {
			if strings.Contains(class.Filename, filePath) {
				for _, line := range class.Lines {
					if line.Hits == 0 {
						uncovered = append(uncovered, line.Number)
					}
				}
				return uncovered, nil
			}
		}
	}
	
	return uncovered, nil
}

type FileCoverage struct {
	Name        string
	LineRate    float64
	BranchRate  float64
	Covered     int
	Total       int
	Percent     float64
}

func FindLeastCovered(xmlFile string, limit int) ([]FileCoverage, error) {
	data, err := os.ReadFile(xmlFile)
	if err != nil {
		return nil, err
	}
	
	var report Report
	if err := xml.Unmarshal(data, &report); err != nil {
		return nil, err
	}
	
	files := []FileCoverage{}
	
	for _, pkg := range report.Packages {
		for _, class := range pkg.Classes {
			covered := 0
			total := 0
			
			for _, line := range class.Lines {
				total++
				if line.Hits > 0 {
					covered++
				}
			}
			
			percent := float64(0)
			if total > 0 {
				percent = float64(covered) / float64(total) * 100
			}
			
			files = append(files, FileCoverage{
				Name:       class.Filename,
				LineRate:   class.LineRate,
				BranchRate: class.BranchRate,
				Covered:    covered,
				Total:      total,
				Percent:    percent,
			})
		}
	}
	
	sort.Slice(files, func(i, j int) bool {
		return files[i].Percent < files[j].Percent
	})
	
	if len(files) > limit {
		files = files[:limit]
	}
	
	return files, nil
}

type HistoryEntry struct {
	Date      time.Time `json:"date"`
	Branch    string    `json:"branch"`
	Coverage  float64   `json:"coverage"`
	Commit    string    `json:"commit"`
}

type TrendAnalysis struct {
	Trend     string
	Change    float64
	Current   float64
	Previous  float64
}

func LoadHistory(filePath string) ([]HistoryEntry, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return []HistoryEntry{}, nil
	}
	
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	
	var history []HistoryEntry
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, err
	}
	
	return history, nil
}

func SaveHistory(filePath string, history []HistoryEntry) error {
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return err
	}
	
	return os.WriteFile(filePath, data, 0644)
}

func AnalyzeTrend(history []HistoryEntry, days int) TrendAnalysis {
	cutoff := time.Now().AddDate(0, 0, -days)
	
	var recent []HistoryEntry
	for _, e := range history {
		if e.Date.After(cutoff) {
			recent = append(recent, e)
		}
	}
	
	if len(recent) == 0 {
		return TrendAnalysis{
			Trend:    "unknown",
			Change:   0,
			Current:  0,
			Previous: 0,
		}
	}
	
	sort.Slice(recent, func(i, j int) bool {
		return recent[i].Date.Before(recent[j].Date)
	})
	
	current := recent[len(recent)-1].Coverage
	previous := recent[0].Coverage
	change := current - previous
	
	trend := "stable"
	if change > 1 {
		trend = "improving"
	} else if change < -1 {
		trend = "declining"
	}
	
	return TrendAnalysis{
		Trend:    trend,
		Change:   change,
		Current:  current,
		Previous: previous,
	}
}
```

## Use Cases

- **Test Quality Assessment**: Evaluate whether test suites are exercising all code paths.

- **CI/CD Quality Gates**: Enforce minimum coverage thresholds in build pipelines.

- **Code Review Analysis**: Identify untested code changes that need coverage.

- **Refactoring Safety**: Ensure refactored code maintains test coverage.

- **Technical Debt Assessment**: Identify modules with low test coverage.

## Artifacts

- `CoverageTool` class: Coverage execution and reporting
- `CoverageAnalyzer` class: XML/JSON report parsing
- `CoverageMetrics` dataclass: Coverage metrics data structure
- `CoverageBadgeGenerator`: Badge generation for README files
- `CoverageTrendTracker`: Historical coverage tracking
- Go coverage tooling wrappers

## Related Skills

- Unit Testing: Writing tests that achieve coverage
- Test-Driven Development: TDD approach to coverage
- CI/CD Integration: Pipeline integration
- Mocking and Stubbing: Test isolation techniques
- Integration Testing: Broader coverage strategies
- Mutation Testing: Validating test quality
