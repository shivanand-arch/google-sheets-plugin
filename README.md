# Google Sheets Plugin

Access, read, write, analyze, and manage Google Sheets from Claude Code or Claude Cowork.

**Auth**: OAuth 2.0 — each user signs in with their own Exotel Google account on first use. No service account sharing or IT involvement needed.

## Quick Install (For Exotel Colleagues)

### Prerequisites

- `uv` installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- An OAuth 2.0 Client ID JSON from Google Cloud Console (see "Getting OAuth Credentials" below)

### Install the Plugin

```bash
# 1. If you hit SSH auth errors, rewrite GitHub SSH URLs to HTTPS (uses gh CLI auth)
git config --global url."https://github.com/".insteadOf "git@github.com:"

# 2. Add the Exotel plugins marketplace
claude plugin marketplace add shivanand-arch/google-sheets-plugin

# 3. Install the plugin
claude plugin install google-sheets@exotel-plugins
```

### Configure OAuth

```bash
cd ~/.claude/plugins/cache/exotel-plugins/google-sheets/0.1.0 && ./setup.sh
```

Restart Claude Code. On first query, a browser window will open asking you to sign in with your Exotel account. The auth token persists for future sessions.

## Getting OAuth Credentials

One-time GCP setup (required per user, or one shared credential can work for the whole org):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable **Google Sheets API** and **Google Drive API**
4. Go to **APIs & Services > OAuth consent screen**
   - User Type: **Internal** (restricts to exotel.com users only)
   - Fill in app name (e.g., "Claude Google Sheets Plugin")
5. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Desktop app**
   - Download the JSON file
6. Run `./setup.sh` and point it at the downloaded JSON

**Tip**: If you want to share a single OAuth Client ID across all Exotel colleagues, create it once in a shared GCP project under exotel.com and distribute the `client_secret.json` file. Each colleague still authenticates with their own Google account on first use — they just use the same OAuth app identity.

## Components

| Component | Name | Purpose |
|-----------|------|---------|
| MCP Server | `google-sheets` | Connects to Google Sheets API via `mcp-google-sheets` |
| Skill | `read-sheets` | Read data, list spreadsheets, search, view formulas |
| Skill | `write-sheets` | Write cells, append rows, batch updates, formatting |
| Skill | `manage-sheets` | Create spreadsheets, add/rename tabs, share access |
| Skill | `analyze-sheets` | Summarize data, detect trends, pivot, chart, compare |

## Usage

Once installed, use natural language:

- "List my spreadsheets"
- "Read the Sales Q1 sheet"
- "Add a row to the inventory spreadsheet"
- "Create a new spreadsheet called Budget 2026"
- "Analyze trends in the revenue sheet"
- "Add a bar chart for monthly sales"

## Manual Configuration (Alternative)

If `setup.sh` doesn't work for you, configure manually:

**a) Add to your `~/.zshrc` or `~/.bashrc`:**

```bash
export GOOGLE_OAUTH_CREDENTIALS_PATH="/path/to/client_secret.json"
export GOOGLE_OAUTH_TOKEN_PATH="$HOME/.claude/google-sheets/token.json"
```

**b) Add to `~/.claude/.mcp.json` under `mcpServers`:**

```json
"google-sheets": {
  "type": "stdio",
  "command": "uvx",
  "args": ["mcp-google-sheets@latest"],
  "env": {
    "CREDENTIALS_PATH": "${GOOGLE_OAUTH_CREDENTIALS_PATH}",
    "TOKEN_PATH": "${GOOGLE_OAUTH_TOKEN_PATH}"
  }
}
```

**c) Restart your terminal and Claude Code.**

## Skills Reference

- **read-sheets**: "read spreadsheet", "get data from sheets", "list spreadsheets", "find a spreadsheet", "show formulas"
- **write-sheets**: "update spreadsheet", "write to sheets", "add rows", "format cells", "add a formula"
- **manage-sheets**: "create spreadsheet", "add a tab", "rename sheet", "share spreadsheet", "copy sheet"
- **analyze-sheets**: "analyze spreadsheet", "summarize data", "find trends", "pivot table", "compare sheets", "chart this data"
