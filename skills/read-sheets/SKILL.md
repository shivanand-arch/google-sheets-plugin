---
name: read-sheets
description: >
  Read and retrieve data from Google Sheets. Use when the user asks to
  "read a spreadsheet", "get data from sheets", "show me the sheet",
  "pull data from Google Sheets", "list my spreadsheets", "what sheets do I have",
  "find a spreadsheet", or wants to view cell values, ranges, or formulas.
metadata:
  version: "0.1.0"
---

# Reading Google Sheets Data

Use the `google-sheets` MCP server tools to read spreadsheet data.

## Listing & Finding Spreadsheets

- Use `list_spreadsheets` to show all accessible spreadsheets in the configured Drive folder.
- Use `search_spreadsheets` with a query string to find spreadsheets by name.
- Use `list_sheets` with a `spreadsheet_id` to show all tabs/sheets within a spreadsheet.
- Use `list_folders` to browse Drive folder structure.

## Reading Data

- Use `get_sheet_data` to read a specific range or entire sheet. Parameters:
  - `spreadsheet_id` (required)
  - `sheet_name` (optional — defaults to first sheet)
  - `range` (optional — A1 notation like `A1:D10`, or omit for all data)
- Use `get_multiple_sheet_data` to read from multiple sheets/ranges in one call.
- Use `get_multiple_spreadsheet_summary` to get an overview of multiple spreadsheets at once.

## Reading Formulas

- Use `get_sheet_formulas` to retrieve the formulas in cells (not computed values).
  - `spreadsheet_id` (required)
  - `sheet_name` (optional)
  - `range` (optional)

## Searching Within a Spreadsheet

- Use `find_in_spreadsheet` to search for text across all sheets in a spreadsheet.
  - `spreadsheet_id` (required)
  - `query` (required — the text to search for)

## Best Practices

- Always confirm the spreadsheet ID with the user if ambiguous — list spreadsheets first.
- When the user says "my sheet" or "the spreadsheet", ask which one or search by name.
- For large sheets, read specific ranges rather than the entire sheet.
- Present tabular data in markdown table format for readability.
- When showing data, include the sheet name and range for context.
