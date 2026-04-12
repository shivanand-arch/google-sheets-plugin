#!/bin/bash
# Google Sheets Plugin — Setup Script for Claude Code
# Share this entire folder with colleagues. They run this script to configure everything.

set -e

echo "=== Google Sheets Plugin for Claude Code ==="
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

# Prompt for service account path
read -p "Path to your Google service account JSON key file: " SA_PATH
SA_PATH="${SA_PATH/#\~/$HOME}"

if [ ! -f "$SA_PATH" ]; then
    echo "ERROR: File not found: $SA_PATH"
    exit 1
fi

# Optional: Drive folder ID
read -p "Google Drive folder ID (press Enter to skip): " FOLDER_ID

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
    echo "" >> "$SHELL_PROFILE"
    echo "# Google Sheets MCP (added by google-sheets plugin setup)" >> "$SHELL_PROFILE"
    echo "export GOOGLE_SERVICE_ACCOUNT_PATH=\"$SA_PATH\"" >> "$SHELL_PROFILE"
    if [ -n "$FOLDER_ID" ]; then
        echo "export GOOGLE_DRIVE_FOLDER_ID=\"$FOLDER_ID\"" >> "$SHELL_PROFILE"
    fi
    echo "Added to $SHELL_PROFILE"
else
    echo "Could not find shell profile. Add these manually:"
    echo "  export GOOGLE_SERVICE_ACCOUNT_PATH=\"$SA_PATH\""
    if [ -n "$FOLDER_ID" ]; then
        echo "  export GOOGLE_DRIVE_FOLDER_ID=\"$FOLDER_ID\""
    fi
fi

echo ""
echo "--- Adding MCP server to Claude Code ---"

MCP_FILE="$HOME/.claude/.mcp.json"
mkdir -p "$HOME/.claude"

if [ -f "$MCP_FILE" ]; then
    # Check if google-sheets already exists
    if grep -q '"google-sheets"' "$MCP_FILE"; then
        echo "google-sheets MCP server already configured in $MCP_FILE"
    else
        # Use python/node to merge JSON safely
        python3 -c "
import json, sys
with open('$MCP_FILE', 'r') as f:
    config = json.load(f)
config.setdefault('mcpServers', {})['google-sheets'] = {
    'type': 'stdio',
    'command': 'uvx',
    'args': ['mcp-google-sheets@latest'],
    'env': {
        'SERVICE_ACCOUNT_PATH': '\${GOOGLE_SERVICE_ACCOUNT_PATH}',
        'DRIVE_FOLDER_ID': '\${GOOGLE_DRIVE_FOLDER_ID}'
    }
}
with open('$MCP_FILE', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
" 2>/dev/null && echo "Added google-sheets to $MCP_FILE" || {
            echo "Could not auto-merge. Add this to $MCP_FILE manually under mcpServers:"
            echo '    "google-sheets": {'
            echo '      "type": "stdio",'
            echo '      "command": "uvx",'
            echo '      "args": ["mcp-google-sheets@latest"],'
            echo '      "env": {'
            echo '        "SERVICE_ACCOUNT_PATH": "${GOOGLE_SERVICE_ACCOUNT_PATH}",'
            echo '        "DRIVE_FOLDER_ID": "${GOOGLE_DRIVE_FOLDER_ID}"'
            echo '      }'
            echo '    }'
        }
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
        "SERVICE_ACCOUNT_PATH": "${GOOGLE_SERVICE_ACCOUNT_PATH}",
        "DRIVE_FOLDER_ID": "${GOOGLE_DRIVE_FOLDER_ID}"
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
echo "  2. Share your Google Sheets/Drive folder with the service account email"
echo "     (find it in your JSON key file under 'client_email')"
echo "  3. Start Claude Code and try: 'List my spreadsheets'"
echo ""
