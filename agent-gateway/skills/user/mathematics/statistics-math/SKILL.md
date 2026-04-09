---
name: statistics-math
description: Statistical analysis fundamentals including hypothesis testing, regression analysis, ANOVA, and probability distributions for data analysis.
category: mathematics
tags:
  - mathematics
  - statistics
  - hypothesis-testing
  - regression
  - anova
  - data-analysis
  - statistical-inference
difficulty: intermediate
author: neuralblitz
---

# Statistics

## What I do

I provide comprehensive expertise in statistical analysis, the science of collecting, analyzing, interpreting, and presenting data. I enable you to perform descriptive statistics, conduct hypothesis tests, build regression models, analyze variance, estimate confidence intervals, and make data-driven decisions. My knowledge spans from basic statistical measures to advanced techniques like multiple regression and ANOVA, essential for scientific research, data science, business analytics, and evidence-based decision making.

## When to use me

Use statistics when you need to: analyze experimental results and determine significance, build predictive models from observational data, compare groups or treatments for differences, estimate population parameters from samples, detect patterns and relationships in datasets, perform A/B testing for product decisions, conduct quality control analysis, or communicate uncertainty in findings to stakeholders.

## Core Concepts

- **Descriptive Statistics**: Summarizing data through measures of central tendency (mean, median, mode) and dispersion (variance, standard deviation, range).
- **Sampling and Estimation**: Methods for selecting representative samples and estimating population parameters from sample statistics.
- **Confidence Intervals**: Ranges providing plausible values for unknown parameters with specified confidence levels.
- **Hypothesis Testing**: Formal procedures for making decisions about population parameters using sample data.
- **Regression Analysis**: Modeling relationships between dependent and independent variables for prediction and inference.
- **Analysis of Variance (ANOVA)**: Statistical methods for comparing means across multiple groups simultaneously.
- **Correlation and Association**: Measures quantifying the strength and direction of relationships between variables.
- **Statistical Power**: The probability of detecting an effect when it truly exists, influencing experimental design.
- **Residual Analysis**: Examining model residuals to validate regression assumptions and detect violations.
- **Multiple Comparisons**: Adjusting significance levels when conducting multiple statistical tests to control error rates.

## Code Examples

### Descriptive Statistics and Data Summaries

```python
import numpy as np
import pandas as pd
from scipy import stats

# Generate sample data
np.random.seed(42)
data = np.random.normal(loc=50, scale=10, size=1000)
data_with_outliers = np.concatenate([data, [100, 110, 120]])

# Central tendency measures
mean_val = np.mean(data)
median_val = np.median(data)
mode_result = stats.mode(data, keepdims=True)

print(f"Mean: {mean_val:.2f}")
print(f"Median: {median_val:.2f}")
print(f"Mode: {mode_result.mode[0]:.2f}")

# Dispersion measures
variance_val = np.var(data, ddof=1)
std_val = np.std(data, ddof=1)
iqr_val = np.percentile(data, 75) - np.percentile(data, 25)
range_val = np.max(data) - np.min(data)

print(f"Variance: {variance_val:.2f}")
print(f"Standard Deviation: {std_val:.2f}")
print(f"IQR: {iqr_val:.2f}")
print(f"Range: {range_val:.2f}")

# Shape measures
skewness = stats.skew(data)
kurtosis = stats.kurtosis(data)
print(f"Skewness: {skewness:.4f} (0 = symmetric)")
print(f"Kurtosis: {kurtosis:.4f} (0 = normal)")

# Five-number summary
five_num = np.percentile(data, [0, 25, 50, 75, 100])
print(f"Five-number summary: {five_num}")

# Using pandas for comprehensive summary
df = pd.DataFrame({'values': data})
print(df.describe())
```

### Hypothesis Testing

```python
import numpy as np
from scipy import stats

# One-sample t-test
np.random.seed(42)
sample = np.random.normal(loc=102, scale=15, size=30)  # Population mean = 100
pop_mean = 100

# Two-sided t-test
t_stat, p_value = stats.ttest_1samp(sample, pop_mean)
print(f"One-sample t-test:")
print(f"  t-statistic: {t_stat:.4f}")
print(f"  p-value: {p_value:.4f}")
print(f"  Reject H0 at α=0.05: {p_value < 0.05}")

# Two-sample t-test (independent samples)
np.random.seed(42)
group1 = np.random.normal(loc=50, scale=10, size=30)
group2 = np.random.normal(loc=55, scale=10, size=30)

t_stat2, p_value2, dof = stats.ttest_ind(group1, group2, equal_var=True)
print(f"\nTwo-sample t-test:")
print(f"  t-statistic: {t_stat2:.4f}")
print(f"  p-value: {p_value2:.4f}")
print(f"  Degrees of freedom: {dof}")

# Welch's t-test (unequal variances)
t_stat_welch, p_value_welch = stats.ttest_ind(group1, group2, equal_var=False)
print(f"\nWelch's t-test:")
print(f"  t-statistic: {t_stat_welch:.4f}")
print(f"  p-value: {p_value_welch:.4f}")

# Paired t-test
pre_scores = [85, 90, 78, 92, 88, 76, 95, 89]
post_scores = [89, 92, 82, 96, 90, 80, 98, 93]
t_paired, p_paired = stats.ttest_rel(pre_scores, post_scores)
print(f"\nPaired t-test:")
print(f"  t-statistic: {t_paired:.4f}")
print(f"  p-value: {p_paired:.4f}")

# Chi-square test for independence
contingency_table = np.array([[30, 20], [20, 30]])
chi2, p_chi, dof_chi, expected = stats.chi2_contingency(contingency_table)
print(f"\nChi-square test:")
print(f"  χ² statistic: {chi2:.4f}")
print(f"  p-value: {p_chi:.4f}")

# Effect size (Cohen's d)
pooled_std = np.sqrt(((len(group1)-1)*np.var(group1, ddof=1) + 
                       (len(group2)-1)*np.var(group2, ddof=1)) / 
                      (len(group1) + len(group2) - 2))
cohens_d = (np.mean(group1) - np.mean(group2)) / pooled_std
print(f"\nEffect size (Cohen's d): {cohens_d:.4f}")
```

### Confidence Intervals

```python
import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportion_confint

# One-sample confidence interval for mean
np.random.seed(42)
sample = np.random.normal(loc=100, scale=15, size=50)
sample_mean = np.mean(sample)
sample_std = np.std(sample, ddof=1)
n = len(sample)
confidence_level = 0.95

t_critical = stats.t.ppf((1 + confidence_level) / 2, df=n-1)
margin_of_error = t_critical * sample_std / np.sqrt(n)
ci_lower = sample_mean - margin_of_error
ci_upper = sample_mean + margin_of_error

print(f"95% Confidence Interval for mean:")
print(f"  Sample mean: {sample_mean:.2f}")
print(f"  CI: [{ci_lower:.2f}, {ci_upper:.2f}]")

# Using bootstrap for confidence intervals
def bootstrap_ci(data, statistic=np.mean, n_bootstrap=10000, confidence_level=0.95):
    np.random.seed(42)
    bootstrap_stats = []
    n = len(data)
    
    for _ in range(n_bootstrap):
        sample_boot = np.random.choice(data, size=n, replace=True)
        bootstrap_stats.append(statistic(sample_boot))
    
    alpha = (1 - confidence_level) / 2
    return np.percentile(bootstrap_stats, [alpha*100, (1-alpha)*100])

ci_bootstrap = bootstrap_ci(sample)
print(f"Bootstrap 95% CI: [{ci_bootstrap[0]:.2f}, {ci_bootstrap[1]:.2f}]")

# Confidence interval for proportion
n_successes = 45
n_trials = 100
ci_prop = proportion_confint(n_successes, n_trials, method='wilson')
print(f"\n95% CI for proportion (45/100): [{ci_prop[0]:.4f}, {ci_prop[1]:.4f}]")

# Difference of means confidence interval
np.random.seed(42)
sample1 = np.random.normal(loc=100, scale=15, size=30)
sample2 = np.random.normal(loc=105, scale=15, size=35)

mean_diff = np.mean(sample1) - np.mean(sample2)
se_diff = np.sqrt(np.var(sample1, ddof=1)/len(sample1) + np.var(sample2, ddof=1)/len(sample2))
dof = len(sample1) + len(sample2) - 2
t_crit_diff = stats.t.ppf((1 + confidence_level) / 2, df=dof)
ci_diff_lower = mean_diff - t_crit_diff * se_diff
ci_diff_upper = mean_diff + t_crit_diff * se_diff

print(f"\n95% CI for difference of means: [{ci_diff_lower:.2f}, {ci_diff_upper:.2f}]")
```

### Regression Analysis

```python
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

# Simple linear regression
np.random.seed(42)
X = np.linspace(0, 10, 100)
true_slope = 2.5
true_intercept = 1.0
noise = np.random.normal(0, 2, 100)
y = true_slope * X + true_intercept + noise

# Using scipy for simple regression
slope, intercept, r_value, p_value, std_err = stats.linregress(X, y)

print("Simple Linear Regression (scipy):")
print(f"  Slope: {slope:.4f} (true: {true_slope})")
print(f"  Intercept: {intercept:.4f} (true: {true_intercept})")
print(f"  R-squared: {r_value**2:.4f}")
print(f"  p-value: {p_value:.2e}")
print(f"  Standard error: {std_err:.4f}")

# Multiple linear regression with sklearn
np.random.seed(42)
n_samples = 100
X1 = np.random.normal(0, 1, n_samples)
X2 = np.random.normal(0, 1, n_samples)
X3 = np.random.normal(0, 1, n_samples)
noise = np.random.normal(0, 0.5, n_samples)
y = 1 + 2*X1 + 3*X2 + 0.5*X3 + noise

X_multi = np.column_stack([X1, X2, X3])
model = LinearRegression()
model.fit(X_multi, y)

print("\nMultiple Linear Regression (sklearn):")
print(f"  Intercept: {model.intercept_:.4f}")
print(f"  Coefficients: {model.coef_}")
print(f"  R-squared: {model.score(X_multi, y):.4f}")

# Predictions and residuals
y_pred = model.predict(X_multi)
residuals = y - y_pred

# Residual analysis
print(f"\nResidual Statistics:")
print(f"  Mean of residuals: {np.mean(residuals):.6f} (should be ~0)")
print(f"  Std of residuals: {np.std(residuals):.4f}")

# Polynomial regression
X_poly = np.linspace(-3, 3, 50)
y_poly = 0.5 * X_poly**3 - 2 * X_poly**2 + X_poly + np.random.normal(0, 2, 50)

from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline

poly_model = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())
poly_model.fit(X_poly.reshape(-1, 1), y_poly)
y_poly_pred = poly_model.predict(X_poly.reshape(-1, 1))

print(f"\nPolynomial Regression (degree=3):")
print(f"  R-squared: {r2_score(y_poly, y_poly_pred):.4f}")
```

### ANOVA and Group Comparisons

```python
import numpy as np
from scipy import stats
from scipy.stats import f_oneway, kruskal

# One-way ANOVA
np.random.seed(42)
group1 = np.random.normal(loc=70, scale=10, size=30)
group2 = np.random.normal(loc=75, scale=10, size=30)
group3 = np.random.normal(loc=80, scale=10, size=30)

f_stat, p_anova = f_oneway(group1, group2, group3)

print("One-way ANOVA:")
print(f"  F-statistic: {f_stat:.4f}")
print(f"  p-value: {p_anova:.4f}")
print(f"  Significant difference at α=0.05: {p_anova < 0.05}")

# Effect size (eta-squared)
ss_between = sum(len(g) * (np.mean(g) - np.mean(np.concatenate([group1, group2, group3])))**2 
                  for g in [group1, group2, group3])
ss_total = sum((np.concatenate([group1, group2, group3]) - np.mean(np.concatenate([group1, group2, group3])))**2)
eta_squared = ss_between / ss_total
print(f"  Effect size (η²): {eta_squared:.4f}")

# Post-hoc test (Tukey's HSD)
from scipy.stats import tukey_hsd

result = tukey_hsd(group1, group2, group3)
print(f"\nTukey's HSD results:")
print(f"  group1 vs group2: p={result.pvalue[0,1]:.4f}")
print(f"  group1 vs group3: p={result.pvalue[0,2]:.4f}")
print(f"  group2 vs group3: p={result.pvalue[1,2]:.4f}")

# Kruskal-Wallis test (non-parametric alternative)
h_stat, p_kruskal = kruskal(group1, group2, group3)
print(f"\nKruskal-Wallis test:")
print(f"  H-statistic: {h_stat:.4f}")
print(f"  p-value: {p_kruskal:.4f}")

# Two-way ANOVA (simplified using regression)
np.random.seed(42)
factor_a = np.repeat([0, 1], 50)
factor_b = np.tile(np.repeat([0, 1], 25), 2)
interaction = factor_a * factor_b
y_two_way = 50 + 5*factor_a + 3*factor_b + 2*interaction + np.random.normal(0, 5, 100)

# Using statsmodels for proper ANOVA
import statsmodels.api as sm
from statsmodels.formula.api import ols

data_anova = pd.DataFrame({
    'y': y_two_way,
    'A': factor_a,
    'B': factor_b
})
model_anova = ols('y ~ C(A) + C(B) + C(A):C(B)', data=data_anova).fit()
anova_table = sm.stats.anova_lm(model_anova, typ=2)
print("\nTwo-way ANOVA table:")
print(anova_table)
```

## Best Practices

- Always check assumptions (normality, equal variances, independence) before applying statistical tests and use robust alternatives when violations are detected.
- Report effect sizes alongside p-values to communicate practical significance, not just statistical significance.
- Use confidence intervals instead of or alongside hypothesis tests to convey uncertainty in estimates.
- Adjust for multiple comparisons using Bonferroni, Holm, or FDR methods to control family-wise error rate.
- Distinguish between correlation and causation; correlation does not imply causal relationships.
- Validate regression models through residual analysis, checking for heteroscedasticity and non-linearity.
- Consider statistical power during experimental design to ensure adequate sample sizes for detecting meaningful effects.
- Use bootstrapping for confidence intervals when distributional assumptions cannot be met.
- Report data preprocessing steps and any data exclusions that might affect generalizability.
- Use appropriate visualizations (box plots, QQ plots, residual plots) to complement statistical analyses.

