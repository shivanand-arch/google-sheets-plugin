---
name: manage-sheets
description: >
  Create and manage Google Spreadsheets. Use when the user asks to
  "create a new spreadsheet", "make a new sheet", "add a tab",
  "rename a sheet", "copy a sheet", "share a spreadsheet",
  "delete a sheet tab", or wants to organize spreadsheet structure.
metadata:
  version: "0.1.0"
---

# Managing Google Spreadsheets

Use the `google-sheets` MCP server tools to create, organize, and share spreadsheets.

## Creating Spreadsheets

- Use `create_spreadsheet` to create a new spreadsheet:
  - `title` (required — name of the spreadsheet)
  - `sheets` (optional — list of sheet/tab names to create)
  - `folder_id` (optional — Drive folder to create in; defaults to configured folder)

When creating a spreadsheet for the user:
1. Ask for the spreadsheet name if not provided.
2. Ask what sheets/tabs they need.
3. After creation, report the spreadsheet ID and sharing instructions.

## Managing Sheets (Tabs)

- Use `create_sheet` to add a new tab:
  - `spreadsheet_id` (required)
  - `sheet_name` (required)

- Use `rename_sheet` to rename an existing tab:
  - `spreadsheet_id` (required)
  - `old_name` (required)
  - `new_name` (required)

- Use `copy_sheet` to duplicate a tab (within or across spreadsheets):
  - `source_spreadsheet_id` (required)
  - `source_sheet_name` (required)
  - `destination_spreadsheet_id` (optional — omit to copy within same spreadsheet)

## Sharing

- Use `share_spreadsheet` to grant access:
  - `spreadsheet_id` (required)
  - `email` (required — recipient's email)
  - `role` (required — `reader`, `writer`, or `commenter`)

When sharing, confirm the email address and permission level with the user before executing.

## Browsing Folders

- Use `list_folders` to see Drive folders accessible to the service account.
- Use `list_spreadsheets` to see all spreadsheets in the configured folder.

## Best Practices

- After creating a spreadsheet, share the spreadsheet ID so the user can reference it later.
- When the user says "new sheet", clarify if they mean a new spreadsheet or a new tab within an existing one.
- For template-style creation, create the spreadsheet, add sheets, then populate headers using `update_cells`.
