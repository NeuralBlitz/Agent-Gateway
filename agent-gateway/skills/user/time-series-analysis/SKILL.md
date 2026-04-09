---
name: time-series-analysis
description: Time series analysis and forecasting
license: MIT
compatibility: opencode
metadata:
  audience: data-analysts
  category: artificial-intelligence
---

## What I do

- Analyze temporal data patterns
- Build forecasting models
- Detect trends and seasonality
- Handle temporal dependencies
- Create time series features
- Evaluate forecast accuracy

## When to use me

Use me when:
- Predicting future values
- Analyzing trends over time
- Detecting seasonality
- Anomaly detection in time series
- Resource planning and forecasting

## Key Concepts

### Time Series Components
```python
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose

# Decomposition
decomposition = seasonal_decompose(ts, model='additive', period=12)
decomposition.plot()
plt.show()

# Components:
# - Trend: Long-term direction
# - Seasonality: Repeating patterns
# - Cyclical: Longer-term oscillations
# - Residual: Random noise
```

### Forecasting Models
```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from prophet import Prophet

# ARIMA
model = ARIMA(train, order=(1, 1, 1))
fitted = model.fit()
forecast = fitted.forecast(steps=30)

# SARIMA (with seasonality)
model = SARIMAX(train, order=(1,1,1), seasonal_order=(1,1,1,12))
fitted = model.fit()

# Prophet (Facebook)
model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
model.fit(df[['ds', 'y']])
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)
```

### Feature Engineering
```python
def create_time_features(df):
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    df['dayofweek'] = df['date'].dt.dayofweek
    df['quarter'] = df['date'].dt.quarter
    df['is_weekend'] = df['date'].dt.dayofweek >= 5
    
    # Lag features
    for lag in [1, 7, 14, 30]:
        df[f'lag_{lag}'] = df['value'].shift(lag)
    
    # Rolling features
    df['rolling_mean_7'] = df['value'].rolling(7).mean()
    df['rolling_std_7'] = df['value'].rolling(7).std()
    
    return df
```

### Evaluation Metrics
- MAE (Mean Absolute Error)
- RMSE (Root Mean Square Error)
- MAPE (Mean Absolute Percentage Error)
- MASE (Mean Absolute Scaled Error)
