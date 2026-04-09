---
name: feature-engineering
description: Techniques for creating, transforming, and selecting features to improve machine learning model performance, including encoding, scaling, dimensionality reduction, and automated feature generation.
category: data-science
keywords:
  - feature-engineering
  - feature-selection
  - feature-creation
  - encoding
  - scaling
  - dimensionality-reduction
  - feature-extraction
  - feature-importance
difficulty: intermediate
related_skills:
  - pandas
  - numpy
  - scikit-learn
  - exploratory-data-analysis
---

# Feature Engineering

## What I do

I provide techniques for creating, transforming, and selecting features that improve machine learning model performance. I help you derive meaningful predictors from raw data, handle categorical variables, create interaction features, reduce dimensionality, and select the most informative features. Effective feature engineering is often more impactful than model choice.

## When to use me

- Converting raw data into meaningful predictors
- Handling categorical variables (encoding)
- Creating date/time features
- Generating interaction and polynomial features
- Scaling and normalizing features
- Reducing feature dimensionality
- Selecting most important features
- Handling missing values strategically

## Core Concepts

### Feature Types
- **Numerical**: Continuous, discrete, counts
- **Categorical**: Nominal (no order), ordinal (has order)
- **Temporal**: Dates, times, durations
- **Text**: Words, n-grams, embeddings
- **Derived**: Computed from other features

### Encoding Methods
- **One-Hot**: Binary columns for each category
- **Label Encoding**: Integer mapping for categories
- **Target Encoding**: Category mapped to target statistics
- **Frequency Encoding**: Category mapped to frequency
- **Embedding**: Dense vector representation

### Feature Transformations
- **Scaling**: Standardization, normalization, robust scaling
- **Log/Box-Cox**: Handle skewed distributions
- **Binning**: Convert continuous to categorical
- **Polynomial**: Capture non-linear relationships

### Feature Selection
- **Filter Methods**: Statistical tests, correlation
- **Wrapper Methods**: Forward/backward selection
- **Embedded Methods**: L1 regularization, tree importance
- **Permutation Importance**: Model-agnostic importance

### Dimensionality Reduction
- **PCA**: Principal Component Analysis
- **t-SNE/UMAP**: Non-linear manifold learning
- **Factor Analysis**: Latent factor discovery

## Code Examples (Python)

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    OneHotEncoder, LabelEncoder, OrdinalEncoder,
    PolynomialFeatures, KBinsDiscretizer
)
from sklearn.feature_selection import (
    SelectKBest, f_classif, mutual_info_classif,
    RFE, SelectFromModel, VarianceThreshold
)
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from scipy import stats

# Categorical encoding
# One-Hot Encoding
df = pd.DataFrame({'category': ['A', 'B', 'C', 'A', 'B']})
ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded = ohe.fit_transform(df[['category']])
ohe_df = pd.DataFrame(encoded, columns=ohe.get_feature_names_out())

# Label Encoding (for ordinal or tree-based models)
le = LabelEncoder()
df['category_encoded'] = le.fit_transform(df['category'])

# Frequency Encoding
freq = df['category'].value_counts(normalize=True)
df['category_freq'] = df['category'].map(freq)

# Target Encoding (with regularization to prevent leakage)
def target_encode(train_df, test_df, col, target, smoothing=10):
    global_mean = train_df[target].mean()
    agg = train_df.groupby(col)[target].agg(['mean', 'count'])
    smooth = (agg['count'] * agg['mean'] + smoothing * global_mean) / (agg['count'] + smoothing)
    train_encoded = train_df[col].map(smooth)
    test_encoded = test_df[col].map(smooth).fillna(global_mean)
    return train_encoded, test_encoded

# Ordinal Encoding
ordinal_map = {'low': 0, 'medium': 1, 'high': 2}
df['ordinal'] = df['category'].map(ordinal_map)

# Numerical transformations
# Standardization (z-score)
scaler = StandardScaler()
df_scaled = pd.DataFrame(
    scaler.fit_transform(df[['numeric_col']]),
    columns=['numeric_scaled']
)

# Min-Max Scaling (0-1)
scaler = MinMaxScaler()
df_normalized = pd.DataFrame(
    scaler.fit_transform(df[['numeric_col']]),
    columns=['numeric_normalized']
)

# Robust scaling (using IQR)
scaler = RobustScaler()
df_robust = pd.DataFrame(
    scaler.fit_transform(df[['numeric_col']]),
    columns=['numeric_robust']
)

# Log transformation (handle skewness)
df['log_value'] = np.log1p(df['value'])  # log(1+x) for non-negative values
df['log_value'] = np.log(df['value'].clip(lower=1))

# Box-Cox transformation
df['boxcox_value'], lambda_param = stats.boxcox(df['value'].clip(lower=1))

# Square root transformation
df['sqrt_value'] = np.sqrt(df['value'])

# Binning/Discretization
# Equal-width bins
df['binned_equal_width'] = pd.cut(df['value'], bins=5, labels=['VL', 'L', 'M', 'H', 'VH'])

# Quantile-based bins
df['binned_quantile'] = pd.qcut(df['value'], q=5, labels=False)

# K-bins with KBinsDiscretizer
discretizer = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='quantile')
df['binned_kbins'] = discretizer.fit_transform(df[['value']]).astype(int)

# Polynomial features
poly = PolynomialFeatures(degree=2, include_bias=False)
poly_features = poly.fit_transform(df[['x1', 'x2']])
poly_df = pd.DataFrame(poly_features, columns=poly.get_feature_names_out())

# Date/Time features
df['date'] = pd.to_datetime(df['date'])
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['day'] = df['date'].dt.day
df['day_of_week'] = df['date'].dt.dayofweek
df['quarter'] = df['date'].dt.quarter
df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6]).astype(int)
df['hour'] = df['date'].dt.hour
df['is_business_hours'] = df['hour'].between(9, 17).astype(int)
df['days_since_reference'] = (df['date'] - reference_date).dt.days
df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

# Text features
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer

# TF-IDF
tfidf = TfidfVectorizer(max_features=100, ngram_range=(1, 2))
tfidf_features = tfidf.fit_transform(df['text_column'])
tfidf_df = pd.DataFrame(tfidf_features.toarray(), columns=tfidf.get_feature_names_out())

# Count Vectorizer (Bag of Words)
count_vec = CountVectorizer(max_features=100)
count_features = count_vec.fit_transform(df['text_column'])

# Rolling/Aggregation features
df = df.sort_values('date')
df['rolling_mean_7d'] = df['value'].rolling(window=7, min_periods=1).mean()
df['rolling_std_7d'] = df['value'].rolling(window=7, min_periods=1).std()
df['rolling_max_7d'] = df['value'].rolling(window=7, min_periods=1).max()
df['expanding_mean'] = df['value'].expanding().mean()
df['diff_1d'] = df['value'].diff()
df['pct_change_1d'] = df['value'].pct_change()

# Grouped aggregation features
df['group_mean'] = df.groupby('category')['value'].transform('mean')
df['group_std'] = df.groupby('category')['value'].transform('std')
df['group_min'] = df.groupby('category')['value'].transform('min')
df['group_max'] = df.groupby('category')['value'].transform('max')
df['group_count'] = df.groupby('category')['value'].transform('count')
df['group_rank'] = df.groupby('category')['value'].rank(ascending=False)

# Interaction features
df['interaction'] = df['feature1'] * df['feature2']
df['ratio'] = df['feature1'] / (df['feature2'] + 1)  # Avoid division by zero

# Feature selection
# Variance threshold
var_selector = VarianceThreshold(threshold=0.1)
X_selected = var_selector.fit_transform(X)

# Correlation-based removal
def remove_correlated_features(df, threshold=0.95):
    corr_matrix = df.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
    return df.drop(columns=to_drop)

# Select K Best
selector = SelectKBest(score_func=f_classif, k=10)
X_selected = selector.fit_transform(X, y)
selected_features = X.columns[selector.get_support()]

# Mutual information
mi_scores = mutual_info_classif(X, y)
mi_df = pd.DataFrame({'feature': X.columns, 'mi_score': mi_scores})
mi_df = mi_df.sort_values('mi_score', ascending=False)

# Recursive Feature Elimination
from sklearn.ensemble import RandomForestClassifier
rfe = RFE(estimator=RandomForestClassifier(n_estimators=100), n_features_to_select=10)
rfe.fit(X, y)
selected = X.columns[rfe.support_]

# Tree-based feature importance
rf = RandomForestClassifier(n_estimators=100)
rf.fit(X, y)
importance_df = pd.DataFrame({
    'feature': X.columns,
    'importance': rf.feature_importances_
}).sort_values('importance', ascending=False)

# Select from model (threshold)
selector = SelectFromModel(rf, threshold='mean')
X_selected = selector.fit_transform(X, y)

# Dimensionality reduction
# PCA
pca = PCA(n_components=0.95)  # Keep 95% variance
X_pca = pca.fit_transform(X_scaled)
print(f"Reduced from {X.shape[1]} to {pca.n_components_} features")

# t-SNE for visualization
tsne = TSNE(n_components=2, random_state=42)
X_tsne = tsne.fit_transform(X_scaled[:1000])  # Sample for speed

# Feature importance from multiple models
def get_feature_importances(models, X, y):
    importances = {}
    for name, model in models.items():
        if hasattr(model, 'feature_importances_'):
            importances[name] = model.fit(X, y).feature_importances_
    return pd.DataFrame(importances, index=X.columns).mean(axis=1).sort_values(ascending=False)
```

## Best Practices

1. **Feature engineering over complex models**: Simple models with good features outperform complex models with poor features.

2. **Document transformations**: Keep track of all feature engineering steps for reproducibility.

3. **Use domain knowledge**: Create features that capture domain-specific patterns.

4. **Handle target leakage**: Never use information from the target when creating features.

5. **Create interpretable features**: Understandable features are easier to debug and maintain.

6. **Test features individually**: Evaluate feature usefulness before combining.

7. **Handle edge cases**: Division by zero, infinite values, extreme outliers.

8. **Automate feature engineering**: Use feature tools or AutoML for large-scale feature creation.

## Common Patterns

### Pattern 1: Automated Feature Engineering
```python
class FeatureEngineer:
    def __init__(self, df, target_col=None):
        self.df = df
        self.target_col = target_col
        self.features = []
    
    def add_numeric_features(self, cols):
        for col in cols:
            self.features.extend([
                f'{col}_log', 
                f'{col}_sqrt',
                f'{col}_square',
                f'{col}_reciprocal'
            ])
        return self
    
    def add_interaction_features(self, cols):
        for i, c1 in enumerate(cols):
            for c2 in cols[i+1:]:
                self.features.extend([
                    f'{c1}_x_{c2}',
                    f'{c1}_plus_{c2}',
                    f'{c1}_minus_{c2}',
                    f'{c1}_ratio_{c2}'
                ])
        return self
    
    def add_group_features(self, group_col, value_col):
        for agg in ['mean', 'std', 'min', 'max', 'count']:
            self.features.append(f'{value_col}_group_{group_col}_{agg}')
        return self
    
    def add_rolling_features(self, col, windows):
        for window in windows:
            self.features.extend([
                f'{col}_rolling_{window}_mean',
                f'{col}_rolling_{window}_std',
                f'{col}_rolling_{window}_min',
                f'{col}_rolling_{window}_max'
            ])
        return self
    
    def build(self):
        """Build all engineered features."""
        for feat in self.features:
            self.df[feat] = self._compute_feature(feat)
        return self.df
    
    def _compute_feature(self, feature_spec):
        """Compute a single feature based on specification."""
        # Parse feature_spec and compute
        pass
```

### Pattern 2: Feature Selection Pipeline
```python
def select_features(X, y, n_features=20):
    """Comprehensive feature selection."""
    # Step 1: Remove constant features
    var_selector = VarianceThreshold(threshold=0)
    X_var = var_selector.fit_transform(X)
    var_features = X.columns[var_selector.get_support()]
    
    # Step 2: Remove highly correlated
    X_corr = remove_correlated_features(X[var_features], threshold=0.95)
    
    # Step 3: Select K Best
    selector = SelectKBest(score_func=f_classif, k=min(n_features, len(X_corr.columns)))
    selector.fit(X_corr, y)
    kbest_features = X_corr.columns[selector.get_support()]
    
    # Step 4: Recursive Feature Elimination
    from sklearn.linear_model import LogisticRegression
    rfe = RFE(estimator=LogisticRegression(max_iter=1000), n_features_to_select=n_features)
    rfe.fit(X_corr[kbest_features], y)
    final_features = kbest_features[rfe.support_]
    
    return final_features
```

### Pattern 3: Categorical Feature Encoding Strategy
```python
def smart_encode(train_df, test_df, cat_cols, target_col, cardinality_threshold=10):
    """Choose encoding strategy based on cardinality."""
    encoded_train = train_df.copy()
    encoded_test = test_df.copy()
    
    for col in cat_cols:
        n_unique = train_df[col].nunique()
        
        if n_unique == 2:
            # Binary: Label encode
            le = LabelEncoder()
            combined = pd.concat([train_df[col], test_df[col]])
            le.fit(combined)
            encoded_train[col] = le.transform(train_df[col])
            encoded_test[col] = le.transform(test_df[col])
        
        elif n_unique <= cardinality_threshold:
            # Low cardinality: One-hot encode
            ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
            train_encoded = ohe.fit_transform(encoded_train[[col]])
            test_encoded = ohe.transform(encoded_test[[col]])
            
            train_encoded_df = pd.DataFrame(
                train_encoded, 
                columns=[f'{col}_{cat}' for cat in ohe.categories_[0]],
                index=encoded_train.index
            )
            test_encoded_df = pd.DataFrame(
                test_encoded,
                columns=[f'{col}_{cat}' for cat in ohe.categories_[0]],
                index=encoded_test.index
            )
            
            encoded_train = pd.concat([encoded_train, train_encoded_df], axis=1)
            encoded_test = pd.concat([encoded_test, test_encoded_df], axis=1)
            encoded_train = encoded_train.drop(col, axis=1)
            encoded_test = encoded_test.drop(col, axis=1)
        
        else:
            # High cardinality: Target encode
            train_encoded, test_encoded = target_encode(
                encoded_train, encoded_test, col, target_col, smoothing=10
            )
            encoded_train[f'{col}_target_enc'] = train_encoded
            encoded_test[f'{col}_target_enc'] = test_encoded
            encoded_train = encoded_train.drop(col, axis=1)
            encoded_test = encoded_test.drop(col, axis=1)
    
    return encoded_train, encoded_test
```
