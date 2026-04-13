#!/bin/bash
# Google Sheets Plugin — OAuth Setup Script for Claude Code
# Share this entire folder with colleagues. They run this script to configure everything.

set -e

echo "=== Google Sheets Plugin — OAuth Setup ==="
echo ""

# Check prerequisites
if ! command -v uvx &> /dev/null && ! command -v uv &> /dev/null; then
    echo "ERROR: 'uv' is not installed. Install it first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  OR: pip install uv"
    exit 1
fi

echo "Prerequisites OK (uv/uvx found)"
echo ""

echo "This plugin uses OAuth — each user authenticates with their own Exotel"
echo "Google account. No service account sharing needed."
echo ""
echo "PREREQUISITE: You need an OAuth 2.0 Client ID JSON from Google Cloud Console."
echo ""
echo "If you don't have one yet:"
echo "  1. Go to https://console.cloud.google.com/"
echo "  2. Create a project (or use existing)"
echo "  3. Enable Google Sheets API and Google Drive API"
echo "  4. Go to APIs & Services > OAuth consent screen, configure as 'Internal'"
echo "  5. Go to APIs & Services > Credentials > Create Credentials > OAuth client ID"
echo "  6. Application type: Desktop app"
echo "  7. Download the JSON file"
echo ""

read -p "Path to your OAuth Client ID JSON file: " CREDS_PATH
CREDS_PATH="${CREDS_PATH/#\~/$HOME}"

if [ ! -f "$CREDS_PATH" ]; then
    echo "ERROR: File not found: $CREDS_PATH"
    exit 1
fi

# Token storage location
TOKEN_DIR="$HOME/.claude/google-sheets"
mkdir -p "$TOKEN_DIR"
TOKEN_PATH="$TOKEN_DIR/token.json"

echo ""
echo "--- Adding environment variables to your shell profile ---"

SHELL_PROFILE=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [ -n "$SHELL_PROFILE" ]; then
    # Remove any old service account config
    sed -i.bak '/# Google Sheets MCP/,/GOOGLE_DRIVE_FOLDER_ID/d' "$SHELL_PROFILE" 2>/dev/null || true
    sed -i.bak '/GOOGLE_SERVICE_ACCOUNT_PATH/d' "$SHELL_PROFILE" 2>/dev/null || true
    sed -i.bak '/GOOGLE_OAUTH_CREDENTIALS_PATH/d' "$SHELL_PROFILE" 2>/dev/null || true
    sed -i.bak '/GOOGLE_OAUTH_TOKEN_PATH/d' "$SHELL_PROFILE" 2>/dev/null || true

    echo "" >> "$SHELL_PROFILE"
    echo "# Google Sheets MCP (OAuth)" >> "$SHELL_PROFILE"
    echo "export GOOGLE_OAUTH_CREDENTIALS_PATH=\"$CREDS_PATH\"" >> "$SHELL_PROFILE"
    echo "export GOOGLE_OAUTH_TOKEN_PATH=\"$TOKEN_PATH\"" >> "$SHELL_PROFILE"
    echo "Added to $SHELL_PROFILE"
else
    echo "Could not find shell profile. Add these manually:"
    echo "  export GOOGLE_OAUTH_CREDENTIALS_PATH=\"$CREDS_PATH\""
    echo "  export GOOGLE_OAUTH_TOKEN_PATH=\"$TOKEN_PATH\""
fi

echo ""
echo "--- Adding MCP server to Claude Code ---"

MCP_FILE="$HOME/.claude/.mcp.json"
mkdir -p "$HOME/.claude"

if [ -f "$MCP_FILE" ]; then
    if grep -q '"google-sheets"' "$MCP_FILE"; then
        echo "google-sheets MCP server already configured in $MCP_FILE (skipping)"
    else
        python3 -c "
import json
with open('$MCP_FILE', 'r') as f:
    config = json.load(f)
config.setdefault('mcpServers', {})['google-sheets'] = {
    'type': 'stdio',
    'command': 'uvx',
    'args': ['mcp-google-sheets@latest'],
    'env': {
        'CREDENTIALS_PATH': '\${GOOGLE_OAUTH_CREDENTIALS_PATH}',
        'TOKEN_PATH': '\${GOOGLE_OAUTH_TOKEN_PATH}'
    }
}
with open('$MCP_FILE', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
" && echo "Added google-sheets to $MCP_FILE"
    fi
else
    cat > "$MCP_FILE" << 'MCPEOF'
{
  "mcpServers": {
    "google-sheets": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-google-sheets@latest"],
      "env": {
        "CREDENTIALS_PATH": "${GOOGLE_OAUTH_CREDENTIALS_PATH}",
        "TOKEN_PATH": "${GOOGLE_OAUTH_TOKEN_PATH}"
      }
    }
  }
}
MCPEOF
    echo "Created $MCP_FILE with google-sheets server"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Restart your terminal (or run: source $SHELL_PROFILE)"
echo "  2. Start Claude Code"
echo "  3. Try: 'List my spreadsheets'"
echo ""
echo "On first use, a browser window will open asking you to sign in with"
echo "your Exotel Google account and authorize the app. The auth token is"
echo "saved to $TOKEN_PATH for future sessions."
echo ""
