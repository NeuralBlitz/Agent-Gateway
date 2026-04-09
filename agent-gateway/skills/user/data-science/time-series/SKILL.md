---
name: time-series
description: Time series analysis techniques for analyzing and forecasting temporal data, including decomposition, smoothing, ARIMA models, and deep learning approaches.
category: data-science
keywords:
  - time-series
  - forecasting
  - arima
  - prophet
  - decomposition
  - seasonal
  - trend
  - stationarity
  - autocorrelation
  - lstm
difficulty: advanced
related_skills:
  - pandas
  - numpy
  - statistics
  - scikit-learn
---

# Time Series

## What I do

I provide techniques for analyzing and forecasting temporal data. I enable decomposition of time series into trend, seasonal, and residual components, testing for stationarity, building statistical and machine learning forecasting models, and evaluating forecast performance. Time series analysis is essential for demand forecasting, financial prediction, and anomaly detection.

## When to use me

- Forecasting sales, demand, or resource utilization
- Analyzing trends and seasonal patterns
- Detecting anomalies and regime changes
- Understanding autocorrelation in data
- Building predictive models for temporal data
- Capacity planning and resource allocation
- Financial time series analysis
- Sensor data and IoT analytics

## Core Concepts

### Time Series Components
- **Trend**: Long-term movement in data
- **Seasonality**: Repeating patterns at fixed intervals
- **Cyclical**: Irregular long-term cycles
- **Residual**: Random variation after decomposition

### Stationarity
- **Definition**: Constant mean, variance, and autocorrelation
- **Types**: Trend-stationary vs. difference-stationary
- **Tests**: ADF test, KPSS test
- **Transformations**: Differencing, log transformation

### Decomposition
- **Additive**: Y = Trend + Seasonal + Residual
- **Multiplicative**: Y = Trend × Seasonal × Residual
- **Methods**: Classical, STL, X-13

### Autocorrelation
- **ACF**: Autocorrelation Function
- **PACF**: Partial Autocorrelation Function
- **Interpretation**: Identify MA and AR orders
- **Uses**: Model identification, lag selection

### Forecasting Models
- **Statistical**: ARIMA, SARIMA, Exponential Smoothing
- **Machine Learning**: Random Forest, Gradient Boosting
- **Deep Learning**: LSTM, GRU, Transformer
- **Probabilistic**: Prophet, Bayesian methods

## Code Examples (Python)

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose, STL
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from pmdarima import auto_arima
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings
warnings.filterwarnings('ignore')

# Basic time series operations
df['date'] = pd.to_datetime(df['date'])
df = df.set_index('date')
df = df.sort_index()

# Resampling
monthly = df.resample('M').sum()
quarterly = df.resample('Q').mean()
daily = df.resample('D').sum()

# Forward fill missing dates
complete_idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
df = df.reindex(complete_idx)

# Fill missing values
df = df.asfreq('D')
df = df.ffill()  # Forward fill
df = df.bfill()  # Backward fill
df = df.interpolate(method='linear')

# Stationarity testing
def test_stationarity(series):
    # ADF Test
    adf_result = adfuller(series.dropna(), autolag='AIC')
    print(f"ADF Statistic: {adf_result[0]:.4f}")
    print(f"p-value: {adf_result[1]:.4f}")
    print(f"Critical Values: {adf_result[4]}")
    
    # KPSS Test
    kpss_result = kpss(series.dropna(), regression='ct', nlags='auto')
    print(f"\nKPSS Statistic: {kpss_result[0]:.4f}")
    print(f"p-value: {kpss_result[1]:.4f}")
    
    return adf_result[1] < 0.05  # ADF: reject null = stationary

# Decomposition
# Classical decomposition
decomposition = seasonal_decompose(df['value'], model='additive', period=12)
trend = decomposition.trend
seasonal = decomposition.seasonal
residual = decomposition.resid

# STL decomposition (more robust)
stl = STL(df['value'], period=12, robust=True)
result = stl.fit()
trend = result.trend
seasonal = result.seasonal
residual = result.resid

# ACF and PACF analysis
plot_acf(df['value'].dropna(), lags=40)
plot_pacf(df['value'].dropna(), lags=40)

# Calculate ACF/PACF values
acf_values = acf(df['value'].dropna(), nlags=40)
pacf_values = pacf(df['value'].dropna(), nlags=40)

# ARIMA modeling
# Manual ARIMA
model = ARIMA(df['value'], order=(1, 1, 1))
fitted_model = model.fit()
print(fitted_model.summary())

# Automatic ARIMA selection
auto_model = auto_arima(
    df['value'],
    start_p=0, start_q=0,
    max_p=5, max_q=5,
    m=12,  # Monthly seasonality
    start_P=0, seasonal=True,
    d=None, D=None,
    trace=True,
    error_action='ignore',
    suppress_warnings=True,
    stepwise=True
)
print(auto_model.summary())

# SARIMA (Seasonal ARIMA)
sarima_model = auto_arima(
    df['value'],
    seasonal=True,
    m=12,
    stepwise=True,
    suppress_warnings=True
)

# Exponential Smoothing
# Holt-Winters (with trend and seasonality)
hw_model = ExponentialSmoothing(
    df['value'],
    trend='add',
    seasonal='add',
    seasonal_periods=12,
    damped_trend=True
).fit()

# Simple Exponential Smoothing
ses_model = SimpleExpSmoothing(df['value']).fit()

# Holt's method (trend, no seasonality)
holt_model = Holt(df['value'], damped_trend=True).fit()

# Prophet forecasting
from prophet import Prophet

prophet_df = df.reset_index()[['date', 'value']].rename(
    columns={'date': 'ds', 'value': 'y'}
)

prophet_model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='multiplicative'
)
prophet_model.fit(prophet_df)

future = prophet_model.make_future_dataframe(periods=90)
forecast = prophet_model.predict(future)

# Machine Learning for Time Series
def create_lag_features(df, target_col, lags):
    """Create lag features for ML models."""
    result = df.copy()
    for lag in lags:
        result[f'lag_{lag}'] = result[target_col].shift(lag)
    return result

def create_rolling_features(df, target_col, windows):
    """Create rolling window features."""
    result = df.copy()
    for window in windows:
        result[f'rolling_mean_{window}'] = result[target_col].shift(1).rolling(window).mean()
        result[f'rolling_std_{window}'] = result[target_col].shift(1).rolling(window).std()
    return result

# Feature engineering for time series ML
df_features = df.copy()
df_features = create_lag_features(df_features, 'value', [1, 7, 14, 28])
df_features = create_rolling_features(df_features, 'value', [7, 14, 30])
df_features['day_of_week'] = df_features.index.dayofweek
df_features['month'] = df_features.index.month
df_features['quarter'] = df_features.index.quarter
df_features = df_features.dropna()

# Prepare features and target
X = df_features.drop('value', axis=1)
y = df_features['value']

# Train ML model
from sklearn.ensemble import GradientBoostingRegressor

model = GradientBoostingRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1
)
model.fit(X, y)

# Deep Learning with LSTM
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator

# Scale data
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df['value'].values.reshape(-1, 1))

# Create sequences
look_back = 30
generator = TimeseriesGenerator(scaled_data, scaled_data, 
                                 length=look_back, batch_size=32)

# Build LSTM model
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(look_back, 1)),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(25),
    Dense(1)
])

model.compile(optimizer='adam', loss='mse')
model.fit(generator, epochs=50, verbose=0)

# Forecasting
# Multi-step ahead forecasting
def forecast_arima(model, steps=30):
    forecast = model.forecast(steps=steps)
    return forecast

# Rolling forecast with confidence intervals
def rolling_forecast(df, model_class, train_size, horizon=30):
    """Perform rolling origin forecasting."""
    predictions = []
    intervals = []
    
    for i in range(0, len(df) - train_size - horizon + 1, horizon):
        train = df.iloc[:train_size + i]
        test = df.iloc[train_size + i:train_size + i + horizon]
        
        model = model_class(train, seasonal=True, m=12)
        fitted = model.fit()
        
        forecast = fitted.forecast(steps=horizon)
        pred = forecast.iloc[0]
        predictions.append(pred)
        
        # Get confidence intervals
        ci = fitted.get_forecast(steps=horizon).conf_int()
        intervals.append(ci)
    
    return predictions, intervals

# Evaluation metrics
def evaluate_forecast(actual, predicted):
    mae = mean_absolute_error(actual, predicted)
    rmse = np.sqrt(mean_squared_error(actual, predicted))
    mape = np.mean(np.abs((actual - predicted) / actual)) * 100
    mase = mae / np.mean(np.abs(np.diff(actual)))
    return {'MAE': mae, 'RMSE': rmse, 'MAPE': mape, 'MASE': mase}

# Anomaly detection
def detect_anomalies(df, column, threshold=3):
    """Detect anomalies using z-score."""
    z_scores = (df[column] - df[column].mean()) / df[column].std()
    anomalies = df[np.abs(z_scores) > threshold]
    return anomalies

# Change point detection
from ruptures import Pelt

# Using ruptures for change point detection
model = Pelt(model="rbf", min_size=3, jump=1).fit(df['value'].values)
breakpoints = model.predict(pen=10)
```

## Best Practices

1. **Understand the data frequency**: Match modeling approach to data characteristics.

2. **Check stationarity**: Transform non-stationary data (differencing, log) before modeling.

3. **Use appropriate seasonal periods**: Monthly (12), weekly (52), daily (7), quarterly (4).

4. **Validate temporally**: Use time-aware cross-validation (no future data in training).

5. **Combine methods**: Ensemble statistical and ML models for robust forecasts.

6. **Monitor drift**: Track forecast accuracy over time; retrain as needed.

7. **Use confidence intervals**: Report uncertainty, not just point estimates.

8. **Handle holidays**: Include special events (holidays, promotions) as regressors.

## Common Patterns

### Pattern 1: Complete Time Series Analysis Pipeline
```python
def time_series_analysis_pipeline(df, target_col, freq='D', periods=365):
    """Complete time series analysis and forecasting pipeline."""
    
    # 1. Prepare data
    df = df.set_index('date').sort_index()
    df = df.asfreq(freq).fillna(method='ffill')
    
    # 2. Decomposition
    decomp = STL(df[target_col], period=periods).fit()
    trend = decomp.trend
    seasonal = decomp.seasonal
    resid = decomp.resid
    
    # 3. Stationarity test
    is_stationary = test_stationarity(df[target_col])
    
    # 4. Model selection
    auto_model = auto_arima(
        df[target_col],
        seasonal=True,
        m=periods,
        stepwise=True,
        suppress_warnings=True
    )
    
    # 5. Forecast
    forecast = auto_model.predict(n_periods=90)
    
    # 6. Evaluate
    train_size = int(len(df) * 0.8)
    train, test = df[target_col][:train_size], df[target_col][train_size:]
    
    eval_model = auto_arima(train, seasonal=True, m=periods)
    predictions = eval_model.predict(n_periods=len(test))
    metrics = evaluate_forecast(test.values, predictions)
    
    return {
        'decomposition': {'trend': trend, 'seasonal': seasonal, 'residual': resid},
        'model': auto_model,
        'forecast': forecast,
        'metrics': metrics,
        'stationary': is_stationary
    }
```

### Pattern 2: Feature Engineering for Time Series ML
```python
def advanced_ts_features(df, target_col):
    """Create comprehensive time series features."""
    df = df.copy()
    
    # Time-based features
    df['hour'] = df.index.hour
    df['day'] = df.index.day
    df['dayofweek'] = df.index.dayofweek
    df['month'] = df.index.month
    df['quarter'] = df.index.quarter
    df['year'] = df.index.year
    df['weekofyear'] = df.index.isocalendar().week
    
    # Cyclical encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['day_sin'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['dayofweek'] / 7)
    
    # Lag features
    for lag in [1, 2, 3, 7, 14, 21, 28]:
        df[f'lag_{lag}'] = df[target_col].shift(lag)
    
    # Rolling statistics
    for window in [7, 14, 30]:
        df[f'rolling_mean_{window}'] = df[target_col].shift(1).rolling(window).mean()
        df[f'rolling_std_{window}'] = df[target_col].shift(1).rolling(window).std()
        df[f'rolling_min_{window}'] = df[target_col].shift(1).rolling(window).min()
        df[f'rolling_max_{window}'] = df[target_col].shift(1).rolling(window).max()
    
    # Exponential moving averages
    for span in [7, 14, 30]:
        df[f'ema_{span}'] = df[target_col].shift(1).ewm(span=span).mean()
    
    # Differences
    df['diff_1'] = df[target_col].diff(1)
    df['diff_7'] = df[target_col].diff(7)
    df['pct_change_1'] = df[target_col].pct_change(1)
    
    # Rolling differences
    df['rolling_diff_7'] = df[target_col].diff(7).rolling(7).mean()
    
    # Ratios
    df['ratio_to_rolling_7'] = df[target_col] / (df[target_col].shift(1).rolling(7).mean() + 1)
    df['ratio_to_rolling_30'] = df[target_col] / (df[target_col].shift(1).rolling(30).mean() + 1)
    
    # Same period last year
    df['same_period_last_year'] = df[target_col].shift(365)
    df['same_period_last_week'] = df[target_col].shift(7)
    
    return df.dropna()
```

### Pattern 3: Model Ensemble for Robust Forecasting
```python
def ensemble_forecast(df, target_col, forecast_horizon=30):
    """Combine multiple forecasting models."""
    forecasts = {}
    
    # ARIMA
    arima_model = auto_arima(df[target_col], seasonal=True, m=12, stepwise=True)
    forecasts['arima'] = arima_model.predict(n_periods=forecast_horizon)
    
    # Exponential Smoothing
    hw_model = ExponentialSmoothing(
        df[target_col], trend='add', seasonal='add', seasonal_periods=12
    ).fit()
    forecasts['hw'] = hw_model.forecast(forecast_horizon)
    
    # Prophet
    prophet_df = df.reset_index()[['date', target_col]].rename(
        columns={'date': 'ds', target_col: 'y'}
    )
    prophet_model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
    prophet_model.fit(prophet_df)
    future = prophet_model.make_future_dataframe(periods=forecast_horizon)
    prophet_forecast = prophet_model.predict(future)['yhat'].iloc[-forecast_horizon:]
    forecasts['prophet'] = prophet_forecast.values
    
    # ML model
    X, y = prepare_features(df, target_col)
    X_train, y_train = X[:-forecast_horizon], y[:-forecast_horizon]
    X_test = X[-forecast_horizon:]
    
    ml_model = GradientBoostingRegressor(n_estimators=100, max_depth=5)
    ml_model.fit(X_train, y_train)
    forecasts['ml'] = ml_model.predict(X_test)
    
    # Weighted ensemble
    weights = {'arima': 0.25, 'hw': 0.25, 'prophet': 0.25, 'ml': 0.25}
    ensemble = sum(weights[k] * forecasts[k] for k in weights)
    
    # Confidence intervals (using quantile method)
    forecast_df = pd.DataFrame(forecasts)
    ensemble_ci = {
        'lower': forecast_df.quantile(0.05, axis=1),
        'upper': forecast_df.quantile(0.95, axis=1)
    }
    
    return {
        'point_forecast': ensemble,
        'individual_forecasts': forecasts,
        'confidence_interval': ensemble_ci,
        'weights': weights
    }
```
