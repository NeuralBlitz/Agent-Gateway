---
name: scikit-learn
description: Machine learning library for Python with simple and efficient tools for data mining and analysis
category: data-science
skills:
  - classification
  - regression
  - clustering
  - model selection
  - preprocessing
  - feature extraction
---

# Scikit-Learn

## What I do

I am scikit-learn, the go-to machine learning library for Python that provides simple and efficient tools for data mining and data analysis. Built on NumPy, SciPy, and matplotlib, I offer a consistent interface to a wide range of supervised and unsupervised learning algorithms, preprocessing methods, and model evaluation tools. My design philosophy emphasizes accessibility for beginners while providing the flexibility and power needed by practitioners. I excel at traditional machine learning tasks including classification, regression, clustering, dimensionality reduction, and model selection, making me ideal for building production-ready ML pipelines when deep learning isn't required.

## When to use me

Use scikit-learn for traditional machine learning tasks where interpretability, simplicity, and structured data are priorities. I'm ideal for tabular data with clear feature representations, classification problems with labeled data including spam detection, fraud identification, and customer churn prediction, regression tasks predicting continuous values like house prices or demand forecasts, clustering unlabeled data to discover patterns and groupings, dimensionality reduction for visualization or feature compression, and building complete ML pipelines with preprocessing, feature engineering, and model selection. Do not use scikit-learn for deep learning tasks with unstructured data like images, audio, or text sequences where neural networks excel, for very large-scale distributed training requiring frameworks like Spark MLlib, or for reinforcement learning scenarios.

## Core Concepts

**Estimators**: The base class for all machine learning models in scikit-learn. All estimators implement `fit(X, y)` for training, with supervised estimators also implementing `predict(X)` or `predict_proba(X)` for predictions. Understanding this interface enables you to swap algorithms easily.

**Pipeline**: A composite estimator that chains multiple transformations and a final estimator. Pipelines ensure that all transformations are applied consistently during both training and prediction, preventing data leakage and reducing boilerplate code.

**Cross-Validation**: Model evaluation technique that splits data into multiple folds, training on some folds and validating on others. Provides more reliable performance estimates than a single train-test split and helps detect overfitting.

**Hyperparameter Tuning**: Finding optimal model configuration through systematic search. GridSearchCV exhaustively searches parameter combinations, while RandomizedSearchCV samples from distributions, with both using cross-validation for evaluation.

**Feature Scaling**: Normalization and standardization of features to similar scales, essential for many algorithms. StandardScaler performs z-score normalization, MinMaxScaler scales to a range, and RobustScaler uses medians and quantiles for outlier robustness.

**Encoding Categorical Variables**: Converting categorical features to numeric representations. LabelEncoder for ordinal categories, OneHotEncoder for nominal categories, and OrdinalEncoder for more flexible ordinal encoding.

**Metrics**: Evaluation functions for model assessment including accuracy, precision, recall, F1 score for classification, and MSE, MAE, R² for regression. Different metrics emphasize different aspects of model performance.

## Code Examples

```python
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import numpy as np
import pandas as pd

# Loading and preparing data
from sklearn.datasets import load_iris
iris = load_iris()
X, y = iris.data, iris.target

# Train-test split with stratification
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Creating preprocessing pipeline
preprocessor = Pipeline([
    ('scaler', StandardScaler())
])

# Building classification pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(max_iter=1000, random_state=42))
])

# Cross-validation
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

# Training and evaluation
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
print(f"Test Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Multiple model comparison
models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42),
    'KNN': KNeighborsClassifier(),
    'Gradient Boosting': GradientBoostingClassifier(random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
    print(f"{name}: Accuracy={accuracy_score(y_test, y_pred):.3f}")

# Hyperparameter tuning with GridSearchCV
param_grid = {
    'classifier__n_estimators': [50, 100, 200],
    'classifier__max_depth': [3, 5, 7, None],
    'classifier__min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(
    pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1, verbose=1
)
grid_search.fit(X, y)
print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.3f}")

# Using RandomizedSearchCV for larger search spaces
from scipy.stats import randint, uniform
param_dist = {
    'classifier__n_estimators': randint(50, 500),
    'classifier__max_depth': randint(3, 20),
    'classifier__learning_rate': uniform(0.01, 0.3)
}

random_search = RandomizedSearchCV(
    pipeline, param_dist, n_iter=30, cv=5, scoring='accuracy', random_state=42
)
random_search.fit(X, y)
```

```python
from sklearn.preprocessing import PolynomialFeatures, LabelEncoder, OneHotEncoder
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.feature_selection import SelectKBest, chi2, RFE, RFECV
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer, KNNImputer
import numpy as np

# Handling missing values
X_with_nan = np.array([[1, 2, np.nan], [3, np.nan, 6], [7, 8, 9], [np.nan, 11, 12]])
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X_with_nan)

# KNN imputation for more sophisticated missing value handling
knn_imputer = KNNImputer(n_neighbors=3)
X_knn_imputed = knn_imputer.fit_transform(X_with_nan)

# Polynomial features for capturing interactions
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(np.array([[1, 2], [3, 4], [5, 6]]))

# Dimensionality reduction with PCA
pca = PCA(n_components=0.95)  # Keep 95% of variance
X_pca = pca.fit_transform(X)

# Truncated SVD for sparse matrices
from scipy.sparse import csr_matrix
sparse_matrix = csr_matrix(np.random.randn(100, 500))
svd = TruncatedSVD(n_components=50)
X_svd = svd.fit_transform(sparse_matrix)

# Feature selection
from sklearn.datasets import make_classification
X_sel, y_sel = make_classification(n_samples=1000, n_features=20, n_informative=5, random_state=42)

# Univariate feature selection
selector = SelectKBest(chi2, k=10)
X_selected = selector.fit_transform(X_sel, y_sel)

# Recursive Feature Elimination with CV
rfecv = RFECV(
    estimator=RandomForestClassifier(n_estimators=50, random_state=42),
    step=1, cv=5, scoring='accuracy', min_features_to_select=3
)
rfecv.fit(X_sel, y_sel)
print(f"Optimal number of features: {rfecv.n_features_}")
print(f"Feature rankings: {rfecv.ranking_}")
```

## Best Practices

Always split your data into training and test sets before any modeling, keeping the test set completely untouched until final evaluation to prevent data leakage and overly optimistic performance estimates. Use stratification in train_test_split when working with imbalanced classification problems to maintain class proportions across splits. Standardize or normalize features before using distance-based algorithms like SVM, KNN, and neural networks, though tree-based models like Random Forests are generally invariant to feature scaling. Build pipelines for all preprocessing and modeling steps to ensure consistent application of transformations during cross-validation and to make your code reproducible. Use cross-validation for model evaluation, preferring 5 or 10 folds over 3 for more reliable estimates, and use stratified k-fold for classification tasks. Start with simple, interpretable models like logistic regression before moving to complex ensembles, which helps establish a performance baseline and aids in debugging. Use GridSearchCV for small hyperparameter spaces and RandomizedSearchCV for larger spaces where exhaustive search is impractical. Be mindful of data leakage in preprocessing: fit transformers only on training data, then transform validation/test data with the fitted transformer. Use appropriate metrics for your problem: accuracy is misleading for imbalanced datasets where precision, recall, F1, or AUC-ROC provide better insights into model performance. Consider computational budget when choosing algorithms, as some like SVM and KNN scale poorly to very large datasets compared to linear models or tree-based methods.
