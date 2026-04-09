---
name: scikit-learn
description: Machine learning library providing simple and efficient tools for predictive data analysis including classification, regression, clustering, dimensionality reduction, model selection, and preprocessing.
category: data-science
keywords:
  - scikit-learn
  - machine learning
  - classification
  - regression
  - clustering
  - model selection
  - preprocessing
  - pipeline
  - cross-validation
difficulty: intermediate
related_skills:
  - numpy
  - pandas
  - statistics
  - feature-engineering
---

# Scikit-learn

## What I do

I provide comprehensive machine learning capabilities for building predictive models. I offer tools for supervised learning (classification, regression), unsupervised learning (clustering, dimensionality reduction), model evaluation, selection, and preprocessing. My consistent API design makes it easy to experiment with different algorithms and build production-ready ML pipelines.

## When to use me

- Building classification models (logistic regression, SVM, random forest, neural networks)
- Building regression models (linear, ridge, lasso, tree-based, ensemble)
- Clustering data (k-means, hierarchical, DBSCAN, GMM)
- Dimensionality reduction (PCA, t-SNE, UMAP, factor analysis)
- Feature selection and extraction
- Model evaluation with cross-validation
- Hyperparameter tuning
- Building reproducible ML pipelines

## Core Concepts

### Estimators
- **Supervised**: `Classifier` (predicts class labels) and `Regressor` (predicts continuous values)
- **Unsupervised**: `Clusterer` (groups data), `DimensionalityReducer` (reduces features)
- **Consistent API**: `fit()`, `predict()`, `transform()` methods

### Model Selection
- **Cross-validation**: K-fold, stratified, leave-one-out
- **Splitting**: `train_test_split()`, `KFold`, `StratifiedKFold`
- **Hyperparameter tuning**: `GridSearchCV`, `RandomizedSearchCV`
- **Metrics**: Accuracy, precision, recall, F1, ROC-AUC, MSE, R²

### Preprocessing
- **Scaling**: `StandardScaler`, `MinMaxScaler`, `RobustScaler`
- **Encoding**: `OneHotEncoder`, `LabelEncoder`, `OrdinalEncoder`
- **Imputation**: `SimpleImputer`, `KNNImputer`, `IterativeImputer`
- **Feature extraction**: `CountVectorizer`, `TfidfVectorizer`

### Pipelines
- **Pipeline**: Chain transformations and model
- **ColumnTransformer**: Apply different transforms to different columns
- **FeatureUnion**: Concatenate features from multiple transformers

### Ensemble Methods
- **Bagging**: `BaggingClassifier`, `RandomForest`
- **Boosting**: `AdaBoost`, `GradientBoosting`, `XGBoost` integration
- **Voting/Stacking**: `VotingClassifier`, `StackingClassifier`

## Code Examples (Python)

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, roc_auc_score, confusion_matrix,
                             mean_squared_error, r2_score, classification_report)

from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (RandomForestClassifier, RandomForestRegressor,
                             GradientBoostingClassifier, AdaBoostClassifier)
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.manifold import TSNE

# Data preparation
X = df.drop('target', axis=1)
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Preprocessing pipeline
numeric_features = ['age', 'income', 'score']
categorical_features = ['category', 'city']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

# Create pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Fit and predict
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

# Evaluation
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')
f1 = f1_score(y_test, y_pred, average='weighted')
roc_auc = roc_auc_score(y_test, y_proba)
cm = confusion_matrix(y_test, y_pred)
print(classification_report(y_test, y_pred))

# Cross-validation
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')

# Hyperparameter tuning
param_grid = {
    'classifier__n_estimators': [100, 200],
    'classifier__max_depth': [5, 10, None],
    'classifier__min_samples_split': [2, 5]
}
grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)
print(f"Best params: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_}")

# Regression example
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
regression_pipeline = Pipeline([
    ('preprocessor', StandardScaler()),
    ('regressor', Ridge(alpha=1.0))
])
regression_pipeline.fit(X_train, y_train)
y_pred = regression_pipeline.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

# Clustering
kmeans = KMeans(n_clusters=3, random_state=42)
clusters = kmeans.fit_predict(X_scaled)
silhouette = silhouette_score(X_scaled, clusters)

# Dimensionality reduction
pca = PCA(n_components=0.95)  # Keep 95% variance
X_pca = pca.fit_transform(X_scaled)

# Using different classifiers
classifiers = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Decision Tree': DecisionTreeClassifier(max_depth=5),
    'Random Forest': RandomForestClassifier(n_estimators=100),
    'SVM': SVC(kernel='rbf', probability=True),
    'KNN': KNeighborsClassifier(n_neighbors=5),
    'Naive Bayes': GaussianNB()
}

for name, clf in classifiers.items():
    clf.fit(X_train_scaled, y_train)
    score = clf.score(X_test_scaled, y_test)
    print(f"{name}: {score:.4f}")
```

## Best Practices

1. **Always split data**: Use `train_test_split` before any preprocessing to avoid data leakage.

2. **Use pipelines**: Encapsulate preprocessing and modeling to prevent leakage and ensure reproducibility.

3. **Scale appropriately**: Normalize/standardize features for distance-based algorithms (SVM, KNN, neural networks).

4. **Handle class imbalance**: Use `class_weight='balanced'`, SMOTE, or appropriate metrics.

5. **Cross-validate**: Use CV for robust performance estimation, not single train-test split.

6. **Feature engineering**: Engineer features before feeding to models; pipelines make this easier.

7. **Avoid data leakage**: Never use test data for feature selection or model selection.

8. **Use appropriate metrics**: Accuracy is misleading for imbalanced data; use precision, recall, F1, AUC.

## Common Patterns

### Pattern 1: Complete ML Workflow
```python
def train_ml_model(X, y, model_type='classifier'):
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Create pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('imputer', SimpleImputer(strategy='median')),
        ('classifier', RandomForestClassifier(n_estimators=100))
    ])
    
    # Cross-validation
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5)
    
    # Fit and evaluate
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    
    metrics = {
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std(),
        'test_accuracy': accuracy_score(y_test, y_pred),
        'test_f1': f1_score(y_test, y_pred, average='weighted')
    }
    
    return pipeline, metrics
```

### Pattern 2: Model Selection with Multiple Algorithms
```python
def compare_models(X_train, y_train, X_test, y_test):
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100),
        'Gradient Boosting': GradientBoostingClassifier(),
        'SVM': SVC(probability=True)
    }
    
    results = []
    for name, model in models.items():
        # CV score
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        
        # Fit and test
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        results.append({
            'model': name,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'test_accuracy': accuracy_score(y_test, y_pred)
        })
    
    return pd.DataFrame(results).sort_values('cv_mean', ascending=False)
```

### Pattern 3: Hyperparameter Tuning with Grid Search
```python
def tune_hyperparameters(X, y):
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(random_state=42))
    ])
    
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__max_depth': [5, 10, 15, None],
        'classifier__min_samples_split': [2, 5, 10],
        'classifier__min_samples_leaf': [1, 2, 4]
    }
    
    grid_search = GridSearchCV(
        pipeline, param_grid, cv=5, 
        scoring='f1_weighted', n_jobs=-1, verbose=1
    )
    grid_search.fit(X, y)
    
    return grid_search.best_estimator_, grid_search.best_params_
```
