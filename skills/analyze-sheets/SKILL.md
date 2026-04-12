---
name: analyze-sheets
description: >
  Analyze and summarize Google Sheets data. Use when the user asks to
  "analyze this spreadsheet", "summarize the data", "find trends",
  "create a pivot table", "compare sheets", "show statistics",
  "what are the key insights", "chart this data", or wants
  data analysis, aggregation, or visualization from spreadsheet data.
metadata:
  version: "0.1.0"
---

# Analyzing Google Sheets Data

Combine `google-sheets` MCP tools with analytical reasoning to deliver insights from spreadsheet data.

## Analysis Workflow

1. **Retrieve data** — Use `get_sheet_data` or `get_multiple_sheet_data` to pull the relevant ranges.
2. **Understand structure** — Identify headers, data types, row count, and any gaps.
3. **Analyze** — Apply the appropriate analysis technique (see below).
4. **Present findings** — Summarize insights in markdown with tables and key takeaways.
5. **Optionally write back** — If the user wants results in the sheet, use `update_cells` or `add_rows`.

## Analysis Techniques

### Summary Statistics
For numeric columns, calculate and present:
- Count, sum, average, min, max
- Identify outliers (values > 2 standard deviations from mean)

### Trend Detection
- Compare values across time-ordered rows
- Calculate period-over-period changes (absolute and percentage)
- Identify upward/downward trends and inflection points

### Pivot-Style Aggregation
When the user asks to "pivot" or "group by":
1. Identify the group-by column(s) and value column(s)
2. Compute aggregations (sum, count, average) per group
3. Present as a summary table
4. Offer to write the pivot result to a new sheet

### Cross-Sheet Comparison
When comparing data across sheets or spreadsheets:
1. Pull data from all sources using `get_multiple_sheet_data`
2. Align by common key columns
3. Highlight differences, additions, and removals
4. Present a reconciliation summary

### Data Quality Check
When asked to "validate" or "check" data:
- Identify blank/null cells in required columns
- Find duplicate rows by key columns
- Flag data type inconsistencies (text in numeric columns)
- Check for outlier values

## Adding Charts

- Use `add_chart` to create a chart in the spreadsheet:
  - `spreadsheet_id` (required)
  - `sheet_name` (required)
  - `chart_type` (required — `BAR`, `LINE`, `PIE`, `COLUMN`, `AREA`, `SCATTER`)
  - `title` (required)
  - `data_range` (required — A1 notation covering headers + data)
  - Refer to `references/chart-guide.md` for chart selection guidance.

## Best Practices

- Always show raw numbers alongside percentages for context.
- When data is large (>100 rows), summarize rather than displaying everything.
- Ask the user what they want to learn before diving into generic analysis.
- Offer to write analysis results back to a new sheet tab for future reference.
- For recurring analysis, suggest creating formulas in the sheet itself.
