---
name: write-sheets
description: >
  Write, update, and format data in Google Sheets. Use when the user asks to
  "update a spreadsheet", "write to sheets", "add data to the sheet",
  "append rows", "format cells", "add a formula", "update cells",
  "change values in the sheet", or wants to modify spreadsheet content.
metadata:
  version: "0.1.0"
---

# Writing & Formatting Google Sheets

Use the `google-sheets` MCP server tools to modify spreadsheet data and formatting.

## Updating Cells

- Use `update_cells` to write values to a specific range:
  - `spreadsheet_id` (required)
  - `sheet_name` (required)
  - `range` (required — A1 notation, e.g., `A1:C3`)
  - `values` (required — 2D array of values, e.g., `[["Name", "Age"], ["Alice", 30]]`)

## Batch Operations

- Use `batch_update_cells` to update multiple non-contiguous ranges in one call:
  - `spreadsheet_id` (required)
  - `updates` (required — array of `{sheet_name, range, values}` objects)

- Use `batch_update` for advanced operations (formatting, merging, conditional rules):
  - `spreadsheet_id` (required)
  - `requests` (required — array of Google Sheets API request objects)
  - Refer to `references/batch-operations.md` for common request patterns.

## Adding Rows & Columns

- Use `add_rows` to append rows at the bottom of a sheet:
  - `spreadsheet_id` (required)
  - `sheet_name` (required)
  - `values` (required — 2D array of row data)

- Use `add_columns` to add columns to a sheet:
  - `spreadsheet_id` (required)
  - `sheet_name` (required)
  - `values` (required — 2D array of column data)

## Writing Formulas

- Write formulas as string values starting with `=`:
  - e.g., `[["=SUM(A1:A10)"], ["=AVERAGE(B1:B10)"]]`
- Use `get_sheet_formulas` first to understand existing formula structure before modifying.

## Best Practices

- Always read the current data first before overwriting — confirm with the user.
- When appending data, use `add_rows` rather than calculating the next empty row manually.
- For bulk updates across different ranges, use `batch_update_cells` for efficiency.
- When the user says "add a row", clarify whether they mean append at the bottom or insert at a position.
- Present a preview of changes before applying when modifying existing data.
- Never overwrite data without confirming with the user first.
