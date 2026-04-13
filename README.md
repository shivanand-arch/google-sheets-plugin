# Google Sheets Plugin (Claude Code)

Access, read, write, analyze, and manage Google Sheets from Claude Code.

**Self-contained**: bundles its own Node MCP server under `servers/` — no `uvx`, no external Python packages, no service account.

**Auth**: OAuth 2.0. Each colleague signs in once with their own Exotel Google account. The plugin reuses a shared Exotel OAuth **app identity** (same Client ID as the `google-chat` plugin); your individual refresh token is stored locally in your shell profile.

---

## Install (Exotel Colleagues)

### Prerequisites
- **Node.js 18+** (`brew install node` on macOS)
- An Exotel Google account

### 1. Add the marketplace & install
```bash
# If you hit SSH auth errors when Claude clones the repo, rewrite SSH → HTTPS (uses your gh CLI auth)
git config --global url."https://github.com/".insteadOf "git@github.com:"

# Add the Exotel marketplace
claude plugin marketplace add shivanand-arch/google-sheets-plugin

# Install the plugin
claude plugin install google-sheets@exotel-plugins
```

### 2. Run the OAuth setup
```bash
cd ~/.claude/plugins/cache/exotel-plugins/google-sheets/0.3.0 && ./setup.sh
```
- Opens a Google OAuth URL in your terminal
- Sign in with your Exotel account, grant access, paste the code back
- The script writes `GOOGLE_SHEETS_REFRESH_TOKEN` to your `~/.zshrc` (or `~/.bashrc`)

### 3. Restart
```bash
source ~/.zshrc        # or open a new terminal
# then restart Claude Code
```

Try: **"List my Google spreadsheets"**

---

## Components

| Component  | Name              | Purpose |
|------------|-------------------|---------|
| MCP server | `google-sheets`   | Self-contained Node server (`servers/server.js`) calling Google Sheets + Drive APIs via `googleapis` |
| Skill      | `read-sheets`     | Read data, list spreadsheets, search, view formulas |
| Skill      | `write-sheets`    | Write cells, append rows, batch updates, formatting |
| Skill      | `manage-sheets`   | Create spreadsheets, add/rename tabs, share access |
| Skill      | `analyze-sheets`  | Summarize, trends, pivots, charts, comparisons |

## Tools (MCP server)

**Read**: `list_spreadsheets`, `search_spreadsheets`, `list_sheets`, `get_sheet_data`, `get_sheet_formulas`, `find_in_spreadsheet`

**Write**: `update_cells`, `append_rows`, `clear_range`, `batch_update_cells`, `format_cells`

**Manage**: `create_spreadsheet`, `add_sheet`, `delete_sheet`, `rename_sheet`, `duplicate_sheet`, `share_spreadsheet`

**Analyze**: `add_chart`

## Usage examples

- "List my spreadsheets"
- "Read the Sales Q1 sheet"
- "Add a row to the inventory spreadsheet"
- "Create a new spreadsheet called Budget 2026"
- "Bold the header row and color it light blue"
- "Add a bar chart for monthly sales"
- "Share the Budget sheet with alice@exotel.com as writer"

---

## How it works

1. `.mcp.json` points Claude at `${CLAUDE_PLUGIN_ROOT}/servers/server.js` (Node).
2. `server.js` is SDK-free — reads JSON-RPC messages over stdin (NDJSON), authenticates with `googleapis` using your refresh token, and calls the Sheets/Drive APIs directly.
3. `.mcp.json` references three env vars — `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_SHEETS_REFRESH_TOKEN` — all stored in your shell profile. Nothing sensitive is committed to the repo.

### Getting the Client ID / Secret
Exotel colleagues: reuse the same **Desktop OAuth client** you set up for the `google-chat` plugin — the plugin maintainer (Shivanand) can share the Client ID and Client Secret over an internal channel. Paste them into `setup.sh` when prompted.

Alternatively, create your own Desktop OAuth client in a GCP project with **Google Sheets API** and **Google Drive API** enabled and OAuth consent screen set to "Internal".

## Manual setup (if `setup.sh` fails)

```bash
cd ~/.claude/plugins/cache/exotel-plugins/google-sheets/0.3.0/servers
npm install
export GOOGLE_CLIENT_ID="<your client id>"
export GOOGLE_CLIENT_SECRET="<your client secret>"
node auth-setup.js
# Follow the URL, paste the code, copy the printed refresh token.
# Then add all three to ~/.zshrc:
#   export GOOGLE_SHEETS_CLIENT_ID="..."
#   export GOOGLE_SHEETS_CLIENT_SECRET="..."
#   export GOOGLE_SHEETS_REFRESH_TOKEN="1//0g..."
```

## Troubleshooting

- **`Missing GOOGLE_*` in Claude logs**: your `GOOGLE_SHEETS_REFRESH_TOKEN` isn't in the shell that launched Claude Code. Re-source your profile or restart the terminal/Claude.
- **`invalid_grant`**: token was revoked (re-auth by rerunning `./setup.sh`).
- **Node not found**: the plugin hardcodes `/usr/local/bin/node`. If yours is elsewhere (`which node`), edit `.mcp.json` in the plugin cache directory.

---

## Skills Reference

- **read-sheets**: "read spreadsheet", "get data from sheets", "list spreadsheets", "find a spreadsheet", "show formulas"
- **write-sheets**: "update spreadsheet", "write to sheets", "add rows", "format cells", "add a formula"
- **manage-sheets**: "create spreadsheet", "add a tab", "rename sheet", "share spreadsheet", "copy sheet"
- **analyze-sheets**: "analyze spreadsheet", "summarize data", "find trends", "pivot table", "compare sheets", "chart this data"
