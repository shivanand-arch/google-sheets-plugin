/**
 * One-time OAuth2 setup for the google-sheets plugin.
 * Run with: node auth-setup.js
 * Follow the URL prompt, paste the code, and copy the refresh token into your environment.
 */

import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nMissing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.\n" +
      "Set them first, then run: node auth-setup.js\n"
  );
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("\n=== Google Sheets OAuth2 Setup ===\n");
console.log("1. Open this URL in your browser:\n");
console.log("   " + authUrl);
console.log("\n2. Sign in with your Exotel Google account and grant access.");
console.log("3. Copy the authorisation code and paste it below.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Authorisation code: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\n=== Success! ===\n");
    console.log("Add this to your shell profile (~/.zshrc or ~/.bashrc):\n");
    console.log(`export GOOGLE_SHEETS_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
    console.log(
      "Then restart your terminal and Claude Code. The plugin will connect automatically.\n"
    );
  } catch (err) {
    console.error("Failed to exchange code:", err.message);
  }
});
