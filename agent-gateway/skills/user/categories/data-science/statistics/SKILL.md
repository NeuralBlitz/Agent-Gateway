---
name: Statistics
description: Comprehensive statistical analysis including descriptive statistics, hypothesis testing, regression analysis, ANOVA, and probability distributions for data analysis.
license: MIT
compatibility: python>=3.8
audience: data-scientists, analysts, researchers, engineers
category: mathematics
---

# Statistics

## What I Do

I provide comprehensive statistical analysis tools including descriptive statistics, hypothesis testing, regression analysis, ANOVA, confidence intervals, and distribution fitting for data-driven decision making.

## When to Use Me

- Analyzing experimental data
- A/B testing and hypothesis validation
- Building predictive models
- Understanding data distributions
- Correlation and regression analysis
- Statistical quality control

## Core Concepts

- **Descriptive Statistics**: Mean, median, mode, variance, skewness
- **Probability Distributions**: Normal, Poisson, binomial, chi-square
- **Hypothesis Testing**: t-tests, chi-square tests, ANOVA
- **Regression Analysis**: Linear, polynomial, logistic regression
- **Confidence Intervals**: Population parameter estimation
- **Correlation Analysis**: Pearson, Spearman correlations
- **ANOVA**: Analysis of variance for multiple groups
- **Non-parametric Tests**: Mann-Whitney, Wilcoxon, Kruskal-Wallis

## Code Examples

### Descriptive Statistics

```python
import numpy as np
from scipy import stats

data = np.array([23, 25, 28, 23, 21, 24, 28, 30, 22, 25])

mean = np.mean(data)
median = np.median(data)
std_dev = np.std(data, ddof=1)
variance = np.var(data, ddof=1)
skewness = stats.skew(data)
kurtosis = stats.kurtosis(data)

print(f"Mean: {mean:.2f}")
print(f"Median: {median:.2f}")
print(f"Std Dev: {std_dev:.2f}")
print(f"Skewness: {skewness:.3f}")
```

### Hypothesis Testing (t-test)

```python
sample1 = np.array([85, 87, 92, 88, 90, 85, 89, 91])
sample2 = np.array([78, 82, 80, 79, 81, 77, 83, 80])

t_stat, p_value = stats.ttest_ind(sample1, sample2)
print(f"t-statistic: {t_stat:.3f}")
print(f"p-value: {p_value:.4f}")

if p_value < 0.05:
    print("Reject null hypothesis - significant difference")
```

### Confidence Intervals

```python
data = np.random.normal(100, 15, 100)
confidence = 0.95

n = len(data)
mean = np.mean(data)
se = stats.sem(data)
ci = stats.t.interval(confidence, n-1, loc=mean, scale=se)

print(f"95% CI: [{ci[0]:.2f}, {ci[1]:.2f}]")
```

### Linear Regression

```python
from scipy.stats import linregress

x = np.array([1, 2, 3, 4, 5, 6, 7, 8])
y = np.array([2.1, 4.0, 5.8, 8.2, 9.9, 12.1, 14.0, 16.1])

slope, intercept, r_value, p_value, std_err = linregress(x, y)
r_squared = r_value ** 2

print(f"Slope: {slope:.3f}")
print(f"Intercept: {intercept:.3f}")
print(f"R-squared: {r_squared:.4f}")
```

### ANOVA Test

```python
group1 = np.array([85, 89, 92, 88, 90])
group2 = np.array([78, 82, 79, 81, 80])
group3 = np.array([70, 75, 72, 74, 73])

f_stat, p_value = stats.f_oneway(group1, group2, group3)
print(f"F-statistic: {f_stat:.3f}")
print(f"P-value: {p_value:.4f}")
```

## Best Practices

1. **Check Assumptions**: Verify normality, homogeneity of variance
2. **Sample Size**: Ensure adequate power for hypothesis tests
3. **Multiple Testing**: Adjust for family-wise error rate
4. **Effect Sizes**: Report practical significance, not just p-values
5. **Visualization**: Use plots to understand data distributions

## Common Patterns

```python
# Bootstrap confidence interval
def bootstrap_ci(data, statistic, n_bootstrap=10000, confidence=0.95):
    boot_stats = []
    n = len(data)
    for _ in range(n_bootstrap):
        sample = np.random.choice(data, n, replace=True)
        boot_stats.append(statistic(sample))
    alpha = (1 - confidence) / 2
    return np.percentile(boot_stats, [alpha*100, (1-alpha)*100])

# Outlier detection using IQR
def detect_outliers_iqr(data):
    Q1 = np.percentile(data, 25)
    Q3 = np.percentile(data, 75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return np.where((data < lower_bound) | (data > upper_bound))[0]
```

## Core Competencies

1. Descriptive and inferential statistics
2. Hypothesis testing and p-value interpretation
3. Regression analysis and model fitting
4. Confidence interval estimation
5. ANOVA and group comparison tests
