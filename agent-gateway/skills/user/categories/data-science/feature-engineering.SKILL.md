---
name: feature-engineering
description: Creating and transforming features to improve machine learning model performance
category: data-science
skills:
  - feature creation
  - feature transformation
  - feature selection
  - encoding categorical variables
  - handling missing data
---

# Feature Engineering

## What I do

I am feature engineering, the process of creating, transforming, and selecting features (input variables) to improve machine learning model performance. I represent one of the most impactful steps in the ML pipeline, often determining whether a model succeeds or fails more than the choice of algorithm itself. Feature engineering involves deriving new features from raw data through mathematical transformations, domain knowledge encoding, and creative combinations, as well as cleaning and preparing existing features for model consumption. Effective feature engineering requires understanding both the data domain and the algorithms that will consume the features. Mastery of feature engineering separates good models from great ones and often provides more performance improvement than algorithm tuning.

## When to use me

Use feature engineering whenever you're building machine learning models and want to improve their performance. Apply feature engineering early in your workflow after initial EDA reveals patterns in your data. Use feature engineering when raw features don't capture the underlying patterns well enough for accurate predictions. Use feature engineering when you have domain knowledge that can inform how to combine or transform features. Use feature engineering when dealing with categorical variables, missing values, outliers, or skewed distributions. Use feature engineering when you need to reduce dimensionality or select the most relevant features. Do not overuse feature engineering when simpler approaches would suffice, or when the added complexity doesn't improve performance sufficiently. Avoid feature engineering without first understanding what your models need and what patterns exist in your data.

## Core Concepts

**Feature Creation**: Deriving new features from raw data through mathematical operations, aggregations, or domain-specific transformations. Created features should capture underlying patterns more effectively than raw inputs. Good feature creation combines domain knowledge with creativity.

**Feature Transformation**: Applying mathematical functions to change feature distributions or scales. Log and power transformations help with skewed data, polynomial features capture interactions, and discretization converts continuous variables to bins. Different models have different transformation requirements.

**Categorical Encoding**: Converting categorical variables to numeric representations. One-hot encoding creates binary columns for each category, ordinal encoding preserves order, target encoding uses the target variable, and embedding learns dense representations. Choose based on cardinality and algorithm.

**Feature Selection**: Reducing the feature set to the most predictive subset. Filter methods rank features by statistical measures, wrapper methods use model performance, and embedded methods like L1 regularization select features during training. Reduces overfitting and improves interpretability.

**Handling Missing Data**: Strategies for dealing with missing values include deletion (listwise or pairwise), imputation (mean, median, mode, KNN, model-based), and treating missingness as a feature. The best approach depends on the missing data mechanism.

**Temporal Features**: Extracting time-based components (hour, day, week, month), computing lags and rolling statistics, detecting trends and seasonality, and capturing temporal patterns through cyclical encoding. Essential for time series and any data with timestamps.

**Interaction Features**: Products, ratios, or combinations of existing features that capture joint effects. Polynomial features generate all interactions up to a degree, while custom interactions encode domain-specific combinations that simple algorithms can't learn.

## Code Examples

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures, StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA

# Temporal feature engineering
def create_temporal_features(df):
    df = df.copy()
    
    # Basic time components
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['day_of_month'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month
    df['quarter'] = df['timestamp'].dt.quarter
    df['year'] = df['timestamp'].dt.year
    df['week_of_year'] = df['timestamp'].dt.isocalendar().week
    
    # Cyclical encoding for periodic features
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    # Time-based aggregations
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_business_hours'] = ((df['hour'] >= 9) & (df['hour'] <= 17)).astype(int)
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
    
    # Time since reference point
    reference_date = pd.Timestamp('2020-01-01')
    df['days_since_reference'] = (df['timestamp'] - reference_date).dt.days
    
    return df

# Applying temporal features
df = pd.DataFrame({'timestamp': pd.date_range('2023-01-01', periods=1000, freq='H')})
df = create_temporal_features(df)
```

```python
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pandas as pd
import numpy as np

# Comprehensive categorical encoding strategies
def encode_categoricals(df):
    df = df.copy()
    
    # Label encoding (for ordinal or high-cardinality)
    le = LabelEncoder()
    df['category_label'] = le.fit_transform(df['category'])
    
    # Ordinal encoding with explicit order
    ordinal_map = {'Low': 0, 'Medium': 1, 'High': 2}
    df['priority_ordinal'] = df['priority'].map(ordinal_map)
    
    # One-hot encoding for low-cardinality nominal
    onehot_cols = pd.get_dummies(df['region'], prefix='region')
    df = pd.concat([df, onehot_cols], axis=1)
    
    # Target encoding (mean encoding) - use with regularization
    target_mean = df.groupby('category')['target'].mean()
    df['category_target_mean'] = df['category'].map(target_mean)
    
    # Frequency encoding
    freq = df['category'].value_counts(normalize=True)
    df['category_frequency'] = df['category'].map(freq)
    
    # Count encoding
    counts = df['category'].value_counts()
    df['category_count'] = df['category'].map(counts)
    
    return df

# Advanced: Feature interaction creation
def create_interactions(df):
    df = df.copy()
    
    # Ratio features
    df['revenue_per_user'] = df['revenue'] / (df['users'] + 1)
    df['cost_per_transaction'] = df['cost'] / (df['transactions'] + 1)
    
    # Polynomial features for key variables
    df['age_squared'] = df['age'] ** 2
    df['log_income'] = np.log1p(df['income'])
    
    # Interaction between categorical and continuous
    df['income_x_education'] = df['income'] * df['education_level']
    
    # Aggregations within groups
    df['user_avg_transaction'] = df.groupby('user_id')['transaction_amount'].transform('mean')
    df['user_total_spending'] = df.groupby('user_id')['transaction_amount'].transform('sum')
    df['user_transaction_count'] = df.groupby('user_id')['transaction_amount'].transform('count')
    df['user_std_transaction'] = df.groupby('user_id')['transaction_amount'].transform('std')
    
    return df
```

```python
from sklearn.feature_selection import SelectKBest, chi2, RFE, RFECV, mutual_info_classif
from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import numpy as np

# Feature selection methods
def select_features(X, y):
    X = X.select_dtypes(include=[np.number])  # Use numeric features only
    
    # Filter methods
    # Univariate statistical tests
    selector_univariate = SelectKBest(chi2, k=10)
    X_univariate = selector_univariate.fit_transform(X, y)
    selected_features = X.columns[selector_univariate.get_support()]
    
    # Mutual information
    mi_scores = mutual_info_classif(X, y)
    mi_df = pd.DataFrame({'feature': X.columns, 'mi_score': mi_scores})
    mi_df = mi_df.sort_values('mi_score', ascending=False)
    
    # Wrapper methods
    # Recursive Feature Elimination with CV
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rfecv = RFECV(rf, step=1, cv=5, scoring='accuracy', n_jobs=-1)
    rfecv.fit(X, y)
    
    # Feature importance from tree-based models
    rf.fit(X, y)
    importance_df = pd.DataFrame({
        'feature': X.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)
    
    return {
        'univariate_features': selected_features,
        'mi_scores': mi_df,
        'rfecv_features': X.columns[rfecv.support_],
        'rfecv_optimal': rfecv.n_features_,
        'importance_ranking': importance_df
    }

# Automated Feature Engineering with Featuretools
import featuretools as ft

def automated_feature_engineering(entityset, entity_id, index, cutoff_time):
    # Create features automatically
    features, feature_defs = ft.dfs(
        entityset=entityset,
        target_entity=entity_id,
        agg_primitives=['count', 'sum', 'mean', 'std', 'min', 'max'],
        trans_primitives=['month', 'hour', 'day', 'year'],
        max_depth=2,
        features_only=False
    )
    
    return features, feature_defs
```

## Best Practices

Understand your data thoroughly before engineering features through exploratory data analysis, including distributions, correlations, and domain-specific patterns. Create features with interpretability in mind when stakeholders need to understand model decisions; complex derived features may hurt interpretability. Use domain knowledge to guide feature creation, consulting with subject matter experts to understand what transformations might capture meaningful patterns. Start simple with basic transformations and aggregations before moving to complex engineered features, as simple features often outperform complex ones. Be careful with target leakage in feature creation, especially when using target statistics like mean encoding, which require careful regularization like cross-validation folds or target statistics. Consider feature interactions, as many relationships are multiplicative or involve combinations of variables rather than individual effects alone. Regularly validate that engineered features improve actual model performance rather than just correlating with the target on training data. Use feature importance and selection to remove noise features that can cause overfitting. Document feature creation logic for reproducibility and to help others understand what each feature represents. Monitor feature distributions in production to detect data drift that may require feature engineering updates. Iterate on feature engineering as you iterate on models, treating it as an ongoing process rather than a one-time step.
