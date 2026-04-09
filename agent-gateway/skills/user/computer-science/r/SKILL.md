---
name: R
description: Statistical programming language and environment for statistical computing, data analysis, and graphical representation.
license: GPL v2
compatibility: R 4.0+
audience: Data scientists, statisticians, bioinformaticians, researchers
category: Programming Languages
---

# R

## What I do

I am a language and environment for statistical computing and graphics, developed by Ross Ihaka and Robert Gentleman in 1993. I was designed by statisticians for statisticians, excelling at data manipulation, calculation, and graphical display. I offer a vast ecosystem of packages for statistical analysis, machine learning, data visualization, and bioinformatics. I am widely used in academic research, clinical trials, finance, and any domain requiring sophisticated statistical analysis and visualization.

## When to use me

Use R when performing statistical analysis and hypothesis testing, data visualization and exploratory data analysis, machine learning and predictive modeling, bioinformatics and genomic analysis, reporting with R Markdown, or when you need specialized statistical packages not available elsewhere.

## Core Concepts

- **Vectors as Basic Unit**: Most operations are vectorized, operating on entire vectors at once.
- **Data Frames**: Tabular data structure with rows and columns, similar to spreadsheets or database tables.
- **Factors**: Categorical data with ordered or unordered levels for statistical modeling.
- **S3/S4/OOP Systems**: Multiple object-oriented systems with S3 being most common and informal.
- **Tidyverse**: Collection of packages (dplyr, tidyr, ggplot2, readr) for consistent data science workflows.
- **Tibbles**: Modern reimagining of data frames with better printing and subsetting behavior.
- **Pipes ( %>% / |> )**: Chain operations together for readable data transformation pipelines.
- **Statistical Modeling**: Built-in lm(), glm(), and extensive packages for statistical inference.
- **Functional Programming**: First-class functions, lapply/sapply/map family, and closure-based abstractions.
- **Lazy Evaluation**: Arguments are evaluated only when needed, enabling efficient computation.

## Code Examples

**Data Manipulation with Tidyverse:**
```r
library(tidyverse)

# Create a tibble
people <- tibble(
  id = 1:5,
  name = c("Alice", "Bob", "Charlie", "Diana", "Eve"),
  age = c(25, 30, 35, 28, 32),
  department = c("Engineering", "Sales", "Engineering", "Marketing", "Sales"),
  salary = c(75000, 60000, 85000, 65000, 70000)
)

# Filter rows
engineers <- people |> 
  filter(department == "Engineering")

# Select columns
name_salary <- people |> 
  select(name, salary)

# Create new columns
people_with_bonus <- people |>
  mutate(bonus = salary * 0.1,
         total_comp = salary + bonus)

# Summarize data
avg_salary_by_dept <- people |>
  group_by(department) |>
  summarise(avg_salary = mean(salary),
            count = n(),
            .groups = "drop")

# Arrange rows
sorted_by_age <- people |>
  arrange(desc(age))

# Join data
departments <- tibble(
  department = c("Engineering", "Sales", "Marketing"),
  budget = c(500000, 300000, 200000)
)

joined <- people |>
  left_join(departments, by = "department")

# Reshape data
long_data <- people |>
  pivot_longer(cols = c(age, salary),
               names_to = "metric",
               values_to = "value")

wide_data <- long_data |>
  pivot_wider(names_from = metric,
              values_from = value)
```

**Statistical Analysis:**
```r
# Generate sample data
set.seed(42)
control <- rnorm(50, mean = 100, sd = 15)
treatment <- rnorm(50, mean = 110, sd = 15)

# Descriptive statistics
summary(control)
sd(control)
mean(control)
median(control)

# Hypothesis testing
t_result <- t.test(control, treatment, var.equal = TRUE)
print(t_result)

# Correlation
x <- 1:100
y <- 2 * x + rnorm(100, 0, 20)
cor(x, y)

# Linear regression
model <- lm(y ~ x)
summary(model)

# ANOVA
group1 <- c(5, 6, 7, 8, 9)
group2 <- c(3, 4, 5, 6, 7)
group3 <- c(2, 3, 4, 5, 6)

df <- data.frame(
  value = c(group1, group2, group3),
  group = rep(c("A", "B", "C"), each = 5)
)

anova_result <- aov(value ~ group, data = df)
summary(anova_result)

# Confidence intervals
sample <- rnorm(30, mean = 50, sd = 10)
t.test(sample, conf.level = 0.95)

# Chi-square test
observed <- matrix(c(50, 30, 25, 45), nrow = 2)
chisq.test(observed)
```

**Data Visualization with ggplot2:**
```r
library(ggplot2)

# Scatter plot
ggplot(mtcars, aes(x = mpg, y = hp, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "MPG vs Horsepower",
       x = "Miles per Gallon",
       y = "Horsepower",
       color = "Cylinders") +
  theme_minimal()

# Box plot
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot(fill = "lightblue") +
  labs(title = "MPG Distribution by Cylinders",
       x = "Number of Cylinders",
       y = "Miles per Gallon")

# Histogram
ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 10, fill = "steelblue", color = "black") +
  labs(title = "MPG Distribution",
       x = "Miles per Gallon",
       y = "Count")

# Faceted plot
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm") +
  facet_wrap(~ factor(cyl)) +
  labs(title = "MPG vs Weight by Cylinders")

# Heatmap
correlation_matrix <- cor(mtcars)
heatmap(correlation_matrix,
        col = heat.colors(256),
        main = "Correlation Matrix")
```

**Functions and Control Flow:**
```r
# Function with default arguments
calculate_stats <- function(data, na.rm = TRUE) {
  if (!is.numeric(data)) {
    stop("Data must be numeric")
  }
  
  mean_val <- mean(data, na.rm = na.rm)
  sd_val <- sd(data, na.rm = na.rm)
  median_val <- median(data, na.rm = na.rm)
  
  list(
    mean = mean_val,
    sd = sd_val,
    median = median_val,
    n = sum(!is.na(data))
  )
}

# Apply family functions
data <- list(
  a = rnorm(100, 0, 1),
  b = rnorm(100, 1, 1),
  c = rnorm(100, 2, 1)
)

results <- lapply(data, calculate_stats)
str(results)

# Map functions from purrr
library(purrr)
results_map <- map(data, ~ calculate_stats(.x))
map_dbl(data, ~ mean(.x, na.rm = TRUE))

# Conditional execution
grade_student <- function(score) {
  if (score >= 90) {
    "A"
  } else if (score >= 80) {
    "B"
  } else if (score >= 70) {
    "C"
  } else if (score >= 60) {
    "D"
  } else {
    "F"
  }
}

# Vectorized conditional
scores <- c(95, 85, 75, 65, 55)
grades <- ifelse(scores >= 90, "A",
         ifelse(scores >= 80, "B",
         ifelse(scores >= 70, "C",
         ifelse(scores >= 60, "D", "F"))))
```

## Best Practices

1. **Use Tidyverse Packages**: Prefer tidyverse (dplyr, tidyr, ggplot2) over base R for data manipulation and visualization.
2. **Use Tibbles Over Data Frames**: Tibbles have better printing and subsetting behavior.
3. **Use Pipes for Readability**: Chain operations with |> or %>% for readable data transformation pipelines.
4. **Use Vectorization**: Avoid loops; use vectorized operations for better performance and readability.
5. **Use Functional Programming**: Use map functions from purrr instead of for loops and lapply.
6. **Document with Roxygen2**: Document functions with roxygen2 comments for automatic help pages.
7. **Use testthat for Testing**: Write unit tests with testthat package for reproducible code.
8. **Use R Projects**: Use RStudio projects for self-contained, reproducible analyses.
9. **Use renv for Dependency Management**: Use renv for project-specific package versions.
10. **Follow Style Guide**: Use consistent naming (snake_case), spacing, and code organization.
