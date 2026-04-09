---
name: statistics
description: Statistical analysis fundamentals including descriptive statistics, hypothesis testing, regression analysis, ANOVA, and probability distributions for data analysis.
category: data-science
keywords:
  - statistics
  - hypothesis testing
  - regression
  - ANOVA
  - probability
  - distributions
  - statistical inference
  - t-test
  - chi-square
  - confidence intervals
difficulty: intermediate
related_skills:
  - numpy
  - pandas
  - scikit-learn
---

# Statistics

## What I do

I provide comprehensive statistical analysis capabilities for data science workflows. I enable you to understand data distributions, test hypotheses, identify relationships between variables, make predictions, and draw valid conclusions from data. I cover both descriptive and inferential statistics, probability theory, and statistical modeling techniques essential for evidence-based decision making.

## When to use me

- Analyzing datasets to understand central tendency, dispersion, and shape of distributions
- Testing hypotheses about population parameters (A/B testing, clinical trials, A/B testing)
- Identifying correlations and relationships between variables
- Comparing groups (t-tests, ANOVA, chi-square tests)
- Building predictive models (linear regression, logistic regression)
- Estimating confidence intervals for population parameters
- Performing power analysis to determine sample sizes
- Validating assumptions before using statistical methods

## Core Concepts

### Descriptive Statistics
- **Measures of Central Tendency**: Mean, median, mode
- **Measures of Dispersion**: Variance, standard deviation, range, IQR
- **Measures of Shape**: Skewness, kurtosis
- **Frequency Distributions**: Histograms, frequency tables

### Probability Distributions
- **Continuous**: Normal, t, chi-square, F, exponential, uniform
- **Discrete**: Binomial, Poisson, geometric, hypergeometric
- **Sampling Distributions**: Central Limit Theorem applications

### Inferential Statistics
- **Hypothesis Testing**: Null/alternative hypotheses, p-values, significance levels
- **Confidence Intervals**: Construction and interpretation
- **Parametric Tests**: t-tests, ANOVA, z-tests
- **Non-Parametric Tests**: Mann-Whitney, Wilcoxon, Kruskal-Wallis
- **Correlation Analysis**: Pearson, Spearman, Kendall's tau

### Regression Analysis
- **Simple Linear Regression**: One predictor, one response
- **Multiple Linear Regression**: Multiple predictors
- **Logistic Regression**: Binary classification
- **Polynomial Regression**: Non-linear relationships
- **Regularization**: Ridge, Lasso, Elastic Net

## Code Examples (Python)

```python
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import pearsonr, spearmanr, ttest_ind, f_oneway
import statsmodels.api as sm

# Descriptive statistics
data = np.array([23, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50])
mean = np.mean(data)
median = np.median(data)
std_dev = np.std(data, ddof=1)
variance = np.var(data, ddof=1)
skewness = stats.skew(data)
kurtosis = stats.kurtosis(data)

# Hypothesis testing - one-sample t-test
sample = np.random.normal(50, 10, 100)
t_stat, p_value = stats.ttest_1samp(sample, 52)

# Two-sample t-test (independent samples)
group1 = np.random.normal(100, 15, 50)
group2 = np.random.normal(110, 15, 50)
t_stat, p_value = ttest_ind(group1, group2)

# ANOVA (Analysis of Variance)
groups = [
    np.random.normal(70, 10, 30),
    np.random.normal(75, 10, 30),
    np.random.normal(80, 10, 30)
]
f_stat, p_value = f_oneway(*groups)

# Correlation analysis
x = np.array([1, 2, 3, 4, 5, 6, 7, 8])
y = np.array([2, 4, 5, 4, 5, 6, 7, 9])
pearson_r, pearson_p = pearsonr(x, y)
spearman_r, spearman_p = spearmanr(x, y)

# Linear regression with statsmodels
X = np.array([1, 2, 3, 4, 5, 6, 7, 8])
y = np.array([2, 3.5, 4, 4.5, 5.5, 6, 7, 8])
X_with_const = sm.add_constant(X)
model = sm.OLS(y, X_with_const).fit()
print(model.summary())

# Confidence interval for mean
sample = np.random.normal(100, 15, 100)
confidence = 0.95
mean = np.mean(sample)
sem = stats.sem(sample)
ci = stats.t.interval(confidence, len(sample)-1, loc=mean, scale=sem)

# Chi-square test for independence
contingency_table = np.array([[30, 20], [15, 35]])
chi2, p, dof, expected = stats.chi2_contingency(contingency_table)

# Power analysis
from statsmodels.stats.power import TTestIndPower
analysis = TTestIndPower()
effect_size = 0.5
sample_size = analysis.solve_power(effect_size=effect_size, power=0.8)
```

## Best Practices

1. **Always check assumptions**: Many statistical tests assume normality, equal variances, and independence. Verify these before applying tests.

2. **Report effect sizes**: P-values tell you if results are significant, but effect sizes indicate practical importance.

3. **Correct for multiple comparisons**: When performing many tests, use Bonferroni, Benjamini-Hochberg, or other correction methods to control family-wise error rate.

4. **Use appropriate sample sizes**: Conduct power analysis before experiments to ensure adequate sample sizes.

5. **Distinguish correlation from causation**: Statistical association does not imply causal relationships.

6. **Report uncertainty**: Always include confidence intervals, not just point estimates.

7. **Consider practical significance**: Statistical significance does not always mean practical or business importance.

8. **Document assumptions and limitations**: Be transparent about what assumptions were made and the limitations of your analysis.

## Common Patterns

### Pattern 1: Exploratory Statistical Analysis
```python
def exploratory_analysis(df, target_col):
    # Descriptive statistics
    desc = df.describe()
    
    # Distribution analysis
    for col in df.select_dtypes(include=[np.number]).columns:
        _, p = stats.normaltest(df[col].dropna())
        is_normal = p > 0.05
    
    # Correlation with target
    correlations = df.corr()[target_col].sort_values(ascending=False)
    
    # Group comparisons
    groups = df.groupby('category')[target_col]
    f_stat, p_value = f_oneway(*[g for name, g in groups])
    
    return desc, correlations, f_stat, p_value
```

### Pattern 2: A/B Test Analysis
```python
def ab_test_analysis(control, treatment, alpha=0.05):
    # Normality test
    _, p_control = stats.normaltest(control)
    _, p_treatment = stats.normaltest(treatment)
    
    # Equal variance test
    _, p_var = stats.levene(control, treatment)
    
    # Two-sample t-test
    t_stat, p_value = ttest_ind(control, treatment, equal_var=(p_var > alpha))
    
    # Effect size (Cohen's d)
    pooled_std = np.sqrt(((len(control)-1)*np.var(control) + 
                          (len(treatment)-1)*np.var(treatment)) / 
                         (len(control) + len(treatment) - 2))
    cohens_d = (np.mean(treatment) - np.mean(control)) / pooled_std
    
    # Confidence interval
    ci = stats.t.interval(1-alpha, len(control)+len(treatment)-2, 
                          loc=np.mean(treatment)-np.mean(control),
                          scale=pooled_std*np.sqrt(1/len(control)+1/len(treatment)))
    
    significant = p_value < alpha
    return {'significant': significant, 'p_value': p_value, 
            'cohens_d': cohens_d, 'ci': ci}
```

### Pattern 3: Building and Evaluating Linear Models
```python
def build_regression_model(X, y):
    # Add constant for intercept
    X_const = sm.add_constant(X)
    
    # Fit model
    model = sm.OLS(y, X_const).fit()
    
    # Model diagnostics
    residuals = model.resid
    
    # Normality of residuals
    _, p_norm = stats.normaltest(residuals)
    
    # Homoscedasticity
    _, p_homo = stats.het_breuschpagan(residuals, X_const)
    
    # Multicollinearity (VIF)
    vif = pd.DataFrame()
    vif["VIF Factor"] = [sm.stats.variance_inflation_factor(X.values, i) 
                         for i in range(X.shape[1])]
    vif["features"] = X.columns
    
    print(model.summary())
    return model, vif, {'residual_normality': p_norm, 'homoscedasticity': p_homo}
```
