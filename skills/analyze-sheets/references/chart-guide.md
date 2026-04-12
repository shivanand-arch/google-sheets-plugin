# Chart Selection Guide

Choose the right chart type based on what the user wants to communicate.

## Chart Type Decision Matrix

| Goal | Chart Type | When to Use |
|------|-----------|-------------|
| Compare categories | `BAR` or `COLUMN` | Sales by region, scores by team |
| Show trends over time | `LINE` | Monthly revenue, daily active users |
| Show composition/proportions | `PIE` | Market share, budget allocation (< 7 categories) |
| Show distribution | `COLUMN` | Frequency distribution, histogram-style |
| Show correlation | `SCATTER` | Price vs. demand, hours vs. output |
| Show cumulative totals | `AREA` | Cumulative revenue, stacked contributions |

## Guidelines

- **PIE charts**: Only use with fewer than 7 categories. If more, use BAR.
- **LINE charts**: Require time-ordered x-axis. Don't use for categorical data.
- **Stacked charts**: Good for part-to-whole over time, but avoid more than 5 series.
- **Labels**: Always include a descriptive title and axis labels.

## Data Range Format

The `data_range` should include:
- First row = headers (used as series labels)
- First column = categories or x-axis values
- Remaining columns = data series

Example: `A1:C13` where A = months, B = revenue, C = expenses.
