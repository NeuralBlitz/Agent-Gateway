---
name: machine-learning
description: Machine learning best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: domain-specific
---
## What I do
- Design and implement ML pipelines
- Handle data preprocessing and feature engineering
- Select appropriate models for the problem
- Evaluate models with proper metrics
- Prevent overfitting and ensure generalization
- Deploy models to production
- Monitor model performance (MLOps)
- Implement hyperparameter tuning

## When to use me
When implementing machine learning solutions or ML pipelines.

## ML Pipeline Structure
```
ml/
├── data/
│   ├── raw/              # Raw data files
│   ├── processed/        # Processed features
│   └── features/        # Feature definitions
├── models/              # Saved models
├── notebooks/           # Jupyter notebooks
├── src/
│   ├── data/
│   │   ├── loaders.py
│   │   ├── preprocessing.py
│   │   └── feature_engineering.py
│   ├── models/
│   │   ├── base.py
│   │   ├── classifier.py
│   │   └── regressor.py
│   ├── training/
│   │   ├── trainer.py
│   │   ├── evaluation.py
│   │   └── hyperparameter_tuning.py
│   └── serving/
│       ├── inference.py
│       └── deployment.py
├── tests/
│   ├── test_data.py
│   ├── test_models.py
│   └── test_training.py
├── configs/
│   ├── model_config.yaml
│   └── training_config.yaml
└── requirements-ml.txt
```

## Data Loading and Preprocessing
```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from typing import Tuple, List


class DataLoader:
    """Handle data loading and initial preprocessing."""
    
    def __init__(self, data_path: str) -> None:
        self.data_path = data_path
    
    def load_data(self) -> pd.DataFrame:
        """Load data from file."""
        if self.data_path.endswith('.csv'):
            return pd.read_csv(self.data_path)
        elif self.data_path.endswith('.parquet'):
            return pd.read_parquet(self.data_path)
        else:
            raise ValueError(f"Unsupported file format: {self.data_path}")
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values and outliers."""
        df = df.copy()
        
        # Missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            df[col] = df[col].fillna(df[col].mode()[0])
        
        # Outliers (IQR method)
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            df[col] = df[col].clip(Q1 - 1.5 * IQR, Q3 + 1.5 * IQR)
        
        return df
    
    def train_val_test_split(
        self,
        df: pd.DataFrame,
        target_col: str,
        test_size: float = 0.2,
        val_size: float = 0.1,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, ...]:
        """
        Stratified split into train, validation, and test sets.
        """
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            stratify=y,
            random_state=random_state,
        )
        
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train,
            test_size=val_size / (1 - test_size),
            stratify=y_train,
            random_state=random_state,
        )
        
        return X_train, X_val, X_test, y_train, y_val, y_test
```

## Feature Engineering
```python
from sklearn.base import BaseEstimator, TransformerMixin


class FeatureEngineer(BaseEstimator, TransformerMixin):
    """Custom feature engineering pipeline."""
    
    def __init__(self) -> None:
        self.numeric_features = None
        self.categorical_features = None
        self.label_encoders = {}
    
    def fit(self, X: pd.DataFrame, y=None) -> 'FeatureEngineer':
        """Learn feature-specific transformations."""
        self.numeric_features = X.select_dtypes(
            include=['int64', 'float64']
        ).columns.tolist()
        
        self.categorical_features = X.select_dtypes(
            include=['object', 'category']
        ).columns.tolist()
        
        for col in self.categorical_features:
            le = LabelEncoder()
            le.fit(X[col].astype(str))
            self.label_encoders[col] = le
        
        return self
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Apply feature transformations."""
        X = X.copy()
        
        # Encode categorical variables
        for col in self.categorical_features:
            X[col] = X[col].astype(str)
            X[col] = self.label_encoders[col].transform(X[col])
        
        # Create interaction features
        X = self._create_interactions(X)
        
        # Create polynomial features for top features
        X = self._create_polynomial_features(X)
        
        return X
    
    def _create_interactions(self, X: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features."""
        if len(self.numeric_features) >= 2:
            top_features = self.numeric_features[:5]
            
            for i, f1 in enumerate(top_features):
                for f2 in top_features[i+1:]:
                    X[f'{f1}_x_{f2}'] = X[f1] * X[f2]
        
        return X
    
    def _create_polynomial_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Create polynomial features for key variables."""
        for col in self.numeric_features[:3]:
            X[f'{col}_squared'] = X[col] ** 2
        
        return X
```

## Model Training
```python
import mlflow
import mlflow.sklearn
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
from typing import Dict, Any


class ModelTrainer:
    """Train and evaluate ML models with MLflow tracking."""
    
    def __init__(
        self,
        experiment_name: str,
        model_type: str = 'classifier'
    ) -> None:
        self.experiment_name = experiment_name
        self.model_type = model_type
        self.best_model = None
        self.best_score = 0
    
    def train(
        self,
        model,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
        params: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Train model with logging to MLflow.
        """
        mlflow.set_experiment(self.experiment_name)
        
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params(params)
            
            # Train
            model.fit(X_train, y_train)
            
            # Evaluate
            train_metrics = self.evaluate(model, X_train, y_train, 'train')
            val_metrics = self.evaluate(model, X_val, y_val, 'val')
            
            # Log metrics
            for metric, value in train_metrics.items():
                mlflow.log_metric(f'{metric}_train', value)
            for metric, value in val_metrics.items():
                mlflow.log_metric(f'{metric}_val', value)
            
            # Log model
            mlflow.sklearn.log_model(model, 'model')
            
            # Track best model
            if val_metrics['f1'] > self.best_score:
                self.best_score = val_metrics['f1']
                self.best_model = model
            
            return val_metrics
    
    def evaluate(
        self,
        model,
        X: pd.DataFrame,
        y: pd.Series,
        prefix: str = ''
    ) -> Dict[str, float]:
        """Calculate evaluation metrics."""
        y_pred = model.predict(X)
        y_proba = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None
        
        metrics = {
            'accuracy': accuracy_score(y, y_pred),
            'precision': precision_score(y, y_pred, average='weighted'),
            'recall': recall_score(y, y_pred, average='weighted'),
            'f1': f1_score(y, y_pred, average='weighted'),
        }
        
        if y_proba is not None:
            metrics['roc_auc'] = roc_auc_score(y, y_proba)
        
        return metrics
    
    def cross_validate(
        self,
        model,
        X: pd.DataFrame,
        y: pd.Series,
        cv: int = 5
    ) -> Dict[str, float]:
        """Perform cross-validation."""
        scores = cross_val_score(model, X, y, cv=cv, scoring='f1_weighted')
        
        return {
            'cv_mean': scores.mean(),
            'cv_std': scores.std(),
        }
```

## Hyperparameter Tuning
```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import uniform, randint


def tune_hyperparameters(
    model,
    param_distributions: Dict[str, Any],
    X: pd.DataFrame,
    y: pd.Series,
    n_iter: int = 50,
    cv: int = 5,
    scoring: str = 'f1_weighted'
) -> GridSearchCV:
    """
    Random search for hyperparameter optimization.
    """
    search = RandomizedSearchCV(
        model,
        param_distributions=param_distributions,
        n_iter=n_iter,
        cv=cv,
        scoring=scoring,
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )
    
    search.fit(X, y)
    
    print(f"Best score: {search.best_score_:.4f}")
    print(f"Best params: {search.best_params_}")
    
    return search.best_estimator_, search.best_params_, search.best_score_


# Example parameter distributions
param_distributions = {
    'n_estimators': randint(100, 500),
    'max_depth': randint(3, 15),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'learning_rate': uniform(0.01, 0.3),
    'subsample': uniform(0.6, 0.4),
    'colsample_bytree': uniform(0.6, 0.4),
}
```

## Model Serving
```python
import joblib
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List


app = FastAPI(title='ML Model API')


class PredictionRequest(BaseModel):
    features: List[float]


class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    confidence: float


# Load model at startup
model = joblib.load('models/best_model.pkl')
scaler = joblib.load('models/scaler.pkl')


@app.post('/predict', response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make a single prediction."""
    try:
        features = np.array(request.features).reshape(1, -1)
        features = scaler.transform(features)
        
        prediction = int(model.predict(features)[0])
        probability = float(model.predict_proba(features)[0][prediction])
        
        confidence = float(max(model.predict_proba(features)[0]))
        
        return PredictionResponse(
            prediction=prediction,
            probability=probability,
            confidence=confidence,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/health')
async def health():
    """Health check endpoint."""
    return {'status': 'healthy'}
```
