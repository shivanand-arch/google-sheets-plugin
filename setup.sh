#!/bin/bash
# Google Sheets Plugin — OAuth Setup (self-contained Node MCP server)
# Installs deps, runs the OAuth flow, writes credentials to your shell profile.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=== Google Sheets Plugin — OAuth Setup ==="
echo ""

# Check Node
if ! command -v node &> /dev/null; then
    echo "ERROR: 'node' is not installed. Install Node.js 18+ first."
    echo "  macOS:  brew install node"
    exit 1
fi
echo "Node found: $(node --version)"

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/servers/node_modules" ]; then
    echo ""
    echo "--- Installing server dependencies (googleapis) ---"
    (cd "$SCRIPT_DIR/servers" && npm install --production --silent)
fi

echo ""
echo "This plugin uses a shared Exotel OAuth app. You need:"
echo "  1. The OAuth Client ID and Client Secret (ask the plugin maintainer,"
echo "     or reuse the same values from your google-chat plugin setup)"
echo "  2. Your Exotel Google account (for the consent flow)"
echo ""
read -p "GOOGLE_SHEETS_CLIENT_ID: " CLIENT_ID
read -p "GOOGLE_SHEETS_CLIENT_SECRET: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "ERROR: Client ID and Secret are both required."
    exit 1
fi

export GOOGLE_CLIENT_ID="$CLIENT_ID"
export GOOGLE_CLIENT_SECRET="$CLIENT_SECRET"

echo ""
echo "--- Running OAuth2 flow ---"
echo ""
echo "A URL will appear below. Open it in your browser, sign in with your"
echo "Exotel Google account, grant access, then paste the code back here."
echo ""

# Run auth-setup.js interactively; it prints the refresh token at the end.
OUTPUT=$(node "$SCRIPT_DIR/servers/auth-setup.js" | tee /dev/tty)

REFRESH_TOKEN=$(echo "$OUTPUT" | grep 'GOOGLE_SHEETS_REFRESH_TOKEN=' | sed -E 's/.*GOOGLE_SHEETS_REFRESH_TOKEN="([^"]+)".*/\1/')

if [ -z "$REFRESH_TOKEN" ]; then
    echo ""
    echo "ERROR: Could not capture refresh token. Please re-run and check for errors."
    exit 1
fi

# Write credentials into shell profile
SHELL_PROFILE=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [ -n "$SHELL_PROFILE" ]; then
    # Clean up stale entries from older plugin versions
    sed -i.bak '/GOOGLE_OAUTH_CREDENTIALS_PATH/d;/GOOGLE_OAUTH_TOKEN_PATH/d;/GOOGLE_SHEETS_CLIENT_ID/d;/GOOGLE_SHEETS_CLIENT_SECRET/d;/GOOGLE_SHEETS_REFRESH_TOKEN/d' "$SHELL_PROFILE" 2>/dev/null || true
    echo "" >> "$SHELL_PROFILE"
    echo "# Google Sheets plugin (OAuth)" >> "$SHELL_PROFILE"
    echo "export GOOGLE_SHEETS_CLIENT_ID=\"$CLIENT_ID\"" >> "$SHELL_PROFILE"
    echo "export GOOGLE_SHEETS_CLIENT_SECRET=\"$CLIENT_SECRET\"" >> "$SHELL_PROFILE"
    echo "export GOOGLE_SHEETS_REFRESH_TOKEN=\"$REFRESH_TOKEN\"" >> "$SHELL_PROFILE"
    echo ""
    echo "Wrote Google Sheets OAuth env vars to $SHELL_PROFILE"
else
    echo ""
    echo "Add these to your shell profile manually:"
    echo "  export GOOGLE_SHEETS_CLIENT_ID=\"$CLIENT_ID\""
    echo "  export GOOGLE_SHEETS_CLIENT_SECRET=\"$CLIENT_SECRET\""
    echo "  export GOOGLE_SHEETS_REFRESH_TOKEN=\"$REFRESH_TOKEN\""
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Restart your terminal (or: source $SHELL_PROFILE)"
echo "  2. Restart Claude Code"
echo "  3. Try: 'List my Google spreadsheets'"
echo ""
