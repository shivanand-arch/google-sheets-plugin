# Google Sheets Plugin

Access, read, write, analyze, and manage Google Sheets from Claude Code or Claude Cowork.

## Quick Install (For Exotel Colleagues)

Run these 3 commands in your terminal:

```bash
# 1. If you hit SSH auth errors, rewrite GitHub SSH URLs to HTTPS (uses gh CLI auth)
git config --global url."https://github.com/".insteadOf "git@github.com:"

# 2. Add the Exotel plugins marketplace
claude plugin marketplace add shivanand-arch/google-sheets-plugin

# 3. Install the plugin
claude plugin install google-sheets@exotel-plugins
```

Then configure your Google credentials:

```bash
cd ~/.claude/plugins/cache/exotel-plugins/google-sheets/0.1.0 && ./setup.sh
```

Restart Claude Code and try: *"List my spreadsheets"*

## Components

| Component | Name | Purpose |
|-----------|------|---------|
| MCP Server | `google-sheets` | Connects to Google Sheets API via `mcp-google-sheets` |
| Skill | `read-sheets` | Read data, list spreadsheets, search, view formulas |
| Skill | `write-sheets` | Write cells, append rows, batch updates, formatting |
| Skill | `manage-sheets` | Create spreadsheets, add/rename tabs, share access |
| Skill | `analyze-sheets` | Summarize data, detect trends, pivot, chart, compare |

## Setup

### Prerequisites

- **Python 3.10+** and **uvx** (install via `pip install uv` or `pipx install uv`)
- A **Google Cloud project** with the Google Sheets API and Google Drive API enabled
- A **Service Account** with a JSON key file

### Step 1: Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API** and **Google Drive API**
4. Go to **IAM & Admin > Service Accounts** and create a new service account
5. Create a JSON key for the service account and download it
6. Note the service account email (e.g., `my-sa@project-id.iam.gserviceaccount.com`)

### Step 2: Share Your Sheets

Share any spreadsheets (or a Drive folder) with the service account email address, granting **Editor** access.

### Step 3: Quick Setup (Recommended)

Run the setup script — it handles env vars and MCP config automatically:

```bash
cd google-sheets
./setup.sh
```

### Step 3 (Manual Alternative): Set Up Yourself

**a) Set environment variables** in your `~/.zshrc` or `~/.bashrc`:

```bash
export GOOGLE_SERVICE_ACCOUNT_PATH="/path/to/your/service-account-key.json"
export GOOGLE_DRIVE_FOLDER_ID="your_drive_folder_id"  # optional
```

**b) Add the MCP server** to `~/.claude/.mcp.json` (merge into existing `mcpServers`):

```json
"google-sheets": {
  "type": "stdio",
  "command": "uvx",
  "args": ["mcp-google-sheets@latest"],
  "env": {
    "SERVICE_ACCOUNT_PATH": "${GOOGLE_SERVICE_ACCOUNT_PATH}",
    "DRIVE_FOLDER_ID": "${GOOGLE_DRIVE_FOLDER_ID}"
  }
}
```

**c) Restart your terminal** and start Claude Code.

### Step 4: Install Skills (Optional — for Cowork)

Install the `.plugin` file in Claude Cowork for guided skill support. In Claude Code, the MCP server alone gives you full access — the skills are a bonus for structured workflows.

## Usage

Once installed, you can use natural language:

- "List my spreadsheets"
- "Read the Sales Q1 sheet"
- "Add a row to the inventory spreadsheet"
- "Create a new spreadsheet called Budget 2026"
- "Analyze trends in the revenue sheet"
- "Share the report spreadsheet with alice@company.com"
- "Add a bar chart for monthly sales"

## Skills Reference

### read-sheets
Triggers on: "read spreadsheet", "get data from sheets", "list spreadsheets", "find a spreadsheet", "show formulas"

### write-sheets
Triggers on: "update spreadsheet", "write to sheets", "add rows", "format cells", "add a formula"

### manage-sheets
Triggers on: "create spreadsheet", "add a tab", "rename sheet", "share spreadsheet", "copy sheet"

### analyze-sheets
Triggers on: "analyze spreadsheet", "summarize data", "find trends", "pivot table", "compare sheets", "chart this data"
