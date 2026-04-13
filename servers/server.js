import { google } from "googleapis";

// ── Credentials (set via env vars) ──
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  process.stderr.write(
    "[google-sheets] ERROR: Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN env vars\n"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const sheets = google.sheets({ version: "v4", auth: oauth2Client });
const drive = google.drive({ version: "v3", auth: oauth2Client });

const log = (msg) => process.stderr.write(`[google-sheets] ${msg}\n`);
function sendResponse(obj) { process.stdout.write(JSON.stringify(obj) + "\n"); }

// ── Helpers ──
function parseA1Range(range) {
  // Returns { sheetName, a1 } — accepts "Sheet1!A1:B10" or "A1:B10"
  const m = range.match(/^(?:'([^']+)'|([^!]+))!(.+)$/);
  if (m) return { sheetName: m[1] || m[2], a1: m[3] };
  return { sheetName: null, a1: range };
}

async function resolveSheetId(spreadsheetId, sheetName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
  const found = (meta.data.sheets || []).find(s => s.properties.title === sheetName);
  if (!found) throw new Error(`Sheet "${sheetName}" not found`);
  return found.properties.sheetId;
}

// ── READ tools ──
async function listSpreadsheets({ pageSize = 50, query = "" } = {}) {
  const q = ["mimeType='application/vnd.google-apps.spreadsheet'", "trashed=false"];
  if (query) q.push(`name contains '${query.replace(/'/g, "\\'")}'`);
  const res = await drive.files.list({
    q: q.join(" and "),
    pageSize,
    fields: "files(id, name, modifiedTime, owners(displayName, emailAddress), webViewLink)",
    orderBy: "modifiedTime desc",
  });
  return res.data.files || [];
}

async function searchSpreadsheets({ query, pageSize = 25 }) {
  return await listSpreadsheets({ pageSize, query });
}

async function listSheets({ spreadsheetId }) {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  return (res.data.sheets || []).map(s => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount,
  }));
}

async function getSheetData({ spreadsheetId, range, valueRenderOption = "FORMATTED_VALUE" }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption,
  });
  return { range: res.data.range, values: res.data.values || [] };
}

async function getSheetFormulas({ spreadsheetId, range }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "FORMULA",
  });
  return { range: res.data.range, values: res.data.values || [] };
}

async function findInSpreadsheet({ spreadsheetId, query, sheetName = null }) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
  const targetSheets = sheetName
    ? (meta.data.sheets || []).filter(s => s.properties.title === sheetName)
    : meta.data.sheets || [];

  const matches = [];
  const lowerQuery = String(query).toLowerCase();
  for (const s of targetSheets) {
    const title = s.properties.title;
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${title.replace(/'/g, "''")}'`,
      });
      const rows = res.data.values || [];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const v = rows[r][c];
          if (v != null && String(v).toLowerCase().includes(lowerQuery)) {
            matches.push({
              sheet: title,
              cell: `${columnLetter(c)}${r + 1}`,
              value: v,
            });
          }
        }
      }
    } catch (e) {
      log(`  skip sheet ${title}: ${e.message}`);
    }
  }
  return { query, matchCount: matches.length, matches: matches.slice(0, 200) };
}

function columnLetter(idx) {
  let s = "";
  let n = idx;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// ── WRITE tools ──
async function updateCells({ spreadsheetId, range, values, valueInputOption = "USER_ENTERED" }) {
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption,
    requestBody: { values },
  });
  return {
    updatedRange: res.data.updatedRange,
    updatedRows: res.data.updatedRows,
    updatedColumns: res.data.updatedColumns,
    updatedCells: res.data.updatedCells,
  };
}

async function appendRows({ spreadsheetId, range, values, valueInputOption = "USER_ENTERED" }) {
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
  return {
    updates: res.data.updates,
    tableRange: res.data.tableRange,
  };
}

async function clearRange({ spreadsheetId, range }) {
  const res = await sheets.spreadsheets.values.clear({ spreadsheetId, range });
  return { clearedRange: res.data.clearedRange };
}

async function batchUpdateCells({ spreadsheetId, updates, valueInputOption = "USER_ENTERED" }) {
  // updates: [{ range, values }, ...]
  const res = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption,
      data: updates.map(u => ({ range: u.range, values: u.values })),
    },
  });
  return {
    totalUpdatedCells: res.data.totalUpdatedCells,
    totalUpdatedRows: res.data.totalUpdatedRows,
    responses: res.data.responses,
  };
}

async function formatCells({ spreadsheetId, range, format }) {
  // format: { backgroundColor: {red,green,blue}, textFormat: {bold, italic, fontSize, foregroundColor}, horizontalAlignment, numberFormat }
  const { sheetName, a1 } = parseA1Range(range);
  if (!sheetName) throw new Error("format_cells requires a range with sheet name, e.g. 'Sheet1!A1:B2'");
  const sheetId = await resolveSheetId(spreadsheetId, sheetName);
  const gridRange = a1ToGridRange(a1, sheetId);

  const fields = [];
  const cellFormat = {};
  if (format.backgroundColor) { cellFormat.backgroundColor = format.backgroundColor; fields.push("userEnteredFormat.backgroundColor"); }
  if (format.horizontalAlignment) { cellFormat.horizontalAlignment = format.horizontalAlignment; fields.push("userEnteredFormat.horizontalAlignment"); }
  if (format.verticalAlignment) { cellFormat.verticalAlignment = format.verticalAlignment; fields.push("userEnteredFormat.verticalAlignment"); }
  if (format.numberFormat) { cellFormat.numberFormat = format.numberFormat; fields.push("userEnteredFormat.numberFormat"); }
  if (format.textFormat) { cellFormat.textFormat = format.textFormat; fields.push("userEnteredFormat.textFormat"); }
  if (format.wrapStrategy) { cellFormat.wrapStrategy = format.wrapStrategy; fields.push("userEnteredFormat.wrapStrategy"); }

  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        repeatCell: {
          range: gridRange,
          cell: { userEnteredFormat: cellFormat },
          fields: fields.join(","),
        },
      }],
    },
  });
  return { ok: true, replies: res.data.replies?.length || 0 };
}

function a1ToGridRange(a1, sheetId) {
  // Convert "A1:B10" or "A1" into a GridRange (inclusive start, exclusive end)
  const m = a1.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
  if (!m) throw new Error(`Invalid A1 range: ${a1}`);
  const startCol = colToIdx(m[1]);
  const startRow = parseInt(m[2], 10) - 1;
  const endCol = m[3] ? colToIdx(m[3]) + 1 : startCol + 1;
  const endRow = m[4] ? parseInt(m[4], 10) : startRow + 1;
  return {
    sheetId,
    startRowIndex: startRow,
    endRowIndex: endRow,
    startColumnIndex: startCol,
    endColumnIndex: endCol,
  };
}

function colToIdx(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// ── MANAGE tools ──
async function createSpreadsheet({ title, sheetNames = ["Sheet1"] }) {
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: sheetNames.map(name => ({ properties: { title: name } })),
    },
  });
  return {
    spreadsheetId: res.data.spreadsheetId,
    spreadsheetUrl: res.data.spreadsheetUrl,
    title: res.data.properties?.title,
    sheets: (res.data.sheets || []).map(s => s.properties.title),
  };
}

async function addSheet({ spreadsheetId, title, rowCount = 1000, columnCount = 26 }) {
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        addSheet: { properties: { title, gridProperties: { rowCount, columnCount } } },
      }],
    },
  });
  const added = res.data.replies?.[0]?.addSheet?.properties;
  return { sheetId: added?.sheetId, title: added?.title };
}

async function deleteSheet({ spreadsheetId, sheetName }) {
  const sheetId = await resolveSheetId(spreadsheetId, sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ deleteSheet: { sheetId } }] },
  });
  return { ok: true, deleted: sheetName };
}

async function renameSheet({ spreadsheetId, sheetName, newTitle }) {
  const sheetId = await resolveSheetId(spreadsheetId, sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        updateSheetProperties: {
          properties: { sheetId, title: newTitle },
          fields: "title",
        },
      }],
    },
  });
  return { ok: true, sheetId, newTitle };
}

async function duplicateSheet({ spreadsheetId, sheetName, newTitle }) {
  const sheetId = await resolveSheetId(spreadsheetId, sheetName);
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        duplicateSheet: { sourceSheetId: sheetId, newSheetName: newTitle },
      }],
    },
  });
  const added = res.data.replies?.[0]?.duplicateSheet?.properties;
  return { sheetId: added?.sheetId, title: added?.title };
}

async function shareSpreadsheet({ spreadsheetId, emailAddress, role = "writer", sendNotificationEmail = false }) {
  const res = await drive.permissions.create({
    fileId: spreadsheetId,
    sendNotificationEmail,
    requestBody: { type: "user", role, emailAddress },
    fields: "id, role, emailAddress",
  });
  return res.data;
}

// ── ANALYZE tools ──
async function addChart({ spreadsheetId, sheetName, chartType = "COLUMN", title, dataRange, anchorCell = "E2" }) {
  // dataRange: "A1:B10" relative to sheetName; includes headers as first row
  const sheetId = await resolveSheetId(spreadsheetId, sheetName);
  const gr = a1ToGridRange(dataRange, sheetId);
  const anchor = a1ToGridRange(anchorCell, sheetId);

  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        addChart: {
          chart: {
            spec: {
              title,
              basicChart: {
                chartType,
                legendPosition: "BOTTOM_LEGEND",
                headerCount: 1,
                domains: [{
                  domain: {
                    sourceRange: {
                      sources: [{
                        sheetId,
                        startRowIndex: gr.startRowIndex,
                        endRowIndex: gr.endRowIndex,
                        startColumnIndex: gr.startColumnIndex,
                        endColumnIndex: gr.startColumnIndex + 1,
                      }],
                    },
                  },
                }],
                series: [{
                  series: {
                    sourceRange: {
                      sources: [{
                        sheetId,
                        startRowIndex: gr.startRowIndex,
                        endRowIndex: gr.endRowIndex,
                        startColumnIndex: gr.startColumnIndex + 1,
                        endColumnIndex: gr.endColumnIndex,
                      }],
                    },
                  },
                  targetAxis: "LEFT_AXIS",
                }],
              },
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId,
                  rowIndex: anchor.startRowIndex,
                  columnIndex: anchor.startColumnIndex,
                },
              },
            },
          },
        },
      }],
    },
  });
  const chartId = res.data.replies?.[0]?.addChart?.chart?.chartId;
  return { ok: true, chartId };
}

// ── Tool definitions ──
const TOOLS = [
  { name: "list_spreadsheets", description: "List Google Sheets in the user's Drive (most recently modified first). Optional name filter via `query`.",
    inputSchema: { type: "object", properties: { pageSize: { type: "number" }, query: { type: "string" } } } },
  { name: "search_spreadsheets", description: "Search spreadsheets by name fragment.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, pageSize: { type: "number" } }, required: ["query"] } },
  { name: "list_sheets", description: "List tabs (sheets) inside a spreadsheet.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" } }, required: ["spreadsheetId"] } },
  { name: "get_sheet_data", description: "Read cell values in A1 range, e.g. 'Sheet1!A1:D20'.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" }, valueRenderOption: { type: "string", enum: ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"] } }, required: ["spreadsheetId", "range"] } },
  { name: "get_sheet_formulas", description: "Read formulas (not computed values) for a range.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" } }, required: ["spreadsheetId", "range"] } },
  { name: "find_in_spreadsheet", description: "Search all cells for a substring across one or all tabs; returns cell addresses and values.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, query: { type: "string" }, sheetName: { type: "string" } }, required: ["spreadsheetId", "query"] } },

  { name: "update_cells", description: "Write a 2D array of values into a range. Use valueInputOption=USER_ENTERED to parse formulas like =SUM(A1:A5).",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" }, values: { type: "array" }, valueInputOption: { type: "string", enum: ["USER_ENTERED", "RAW"] } }, required: ["spreadsheetId", "range", "values"] } },
  { name: "append_rows", description: "Append rows to the bottom of a table/range.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" }, values: { type: "array" }, valueInputOption: { type: "string", enum: ["USER_ENTERED", "RAW"] } }, required: ["spreadsheetId", "range", "values"] } },
  { name: "clear_range", description: "Clear values in a range (formatting kept).",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" } }, required: ["spreadsheetId", "range"] } },
  { name: "batch_update_cells", description: "Write multiple ranges in one call. `updates` is [{range, values}, ...].",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, updates: { type: "array" }, valueInputOption: { type: "string" } }, required: ["spreadsheetId", "updates"] } },
  { name: "format_cells", description: "Apply cell formatting (background, text bold/italic/size/color, alignment, number format, wrap). `range` MUST include sheet name, e.g. 'Sheet1!A1:B2'.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, range: { type: "string" }, format: { type: "object" } }, required: ["spreadsheetId", "range", "format"] } },

  { name: "create_spreadsheet", description: "Create a new spreadsheet with the given title and optional initial sheet names.",
    inputSchema: { type: "object", properties: { title: { type: "string" }, sheetNames: { type: "array", items: { type: "string" } } }, required: ["title"] } },
  { name: "add_sheet", description: "Add a new tab (sheet) to an existing spreadsheet.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, title: { type: "string" }, rowCount: { type: "number" }, columnCount: { type: "number" } }, required: ["spreadsheetId", "title"] } },
  { name: "delete_sheet", description: "Delete a tab from a spreadsheet.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string" } }, required: ["spreadsheetId", "sheetName"] } },
  { name: "rename_sheet", description: "Rename a tab.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string" }, newTitle: { type: "string" } }, required: ["spreadsheetId", "sheetName", "newTitle"] } },
  { name: "duplicate_sheet", description: "Duplicate a tab and give it a new title.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string" }, newTitle: { type: "string" } }, required: ["spreadsheetId", "sheetName", "newTitle"] } },
  { name: "share_spreadsheet", description: "Share a spreadsheet with a user by email. role=reader|commenter|writer.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, emailAddress: { type: "string" }, role: { type: "string", enum: ["reader", "commenter", "writer"] }, sendNotificationEmail: { type: "boolean" } }, required: ["spreadsheetId", "emailAddress"] } },

  { name: "add_chart", description: "Add a basic chart (COLUMN, BAR, LINE, PIE, SCATTER, AREA) backed by `dataRange` (first column=domain/labels, other columns=series). `dataRange` includes a header row.",
    inputSchema: { type: "object", properties: { spreadsheetId: { type: "string" }, sheetName: { type: "string" }, chartType: { type: "string" }, title: { type: "string" }, dataRange: { type: "string" }, anchorCell: { type: "string" } }, required: ["spreadsheetId", "sheetName", "dataRange"] } },
];

// ── JSON-RPC handler ──
async function handleMessage(msg) {
  const { id, method, params } = msg;
  log(`<< ${method} (id=${id})`);

  if (method === "initialize") {
    const clientVersion = params?.protocolVersion || "2024-11-05";
    sendResponse({ jsonrpc: "2.0", id, result: { protocolVersion: clientVersion, capabilities: { tools: {} }, serverInfo: { name: "google-sheets", version: "0.3.0" } } });
    return;
  }
  if (method?.startsWith("notifications/")) return;
  if (method === "ping") { sendResponse({ jsonrpc: "2.0", id, result: {} }); return; }
  if (method === "tools/list") { sendResponse({ jsonrpc: "2.0", id, result: { tools: TOOLS } }); return; }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    log(`   tool=${toolName}`);
    try {
      let result;
      switch (toolName) {
        case "list_spreadsheets":   result = await listSpreadsheets(args); break;
        case "search_spreadsheets": result = await searchSpreadsheets(args); break;
        case "list_sheets":         result = await listSheets(args); break;
        case "get_sheet_data":      result = await getSheetData(args); break;
        case "get_sheet_formulas":  result = await getSheetFormulas(args); break;
        case "find_in_spreadsheet": result = await findInSpreadsheet(args); break;
        case "update_cells":        result = await updateCells(args); break;
        case "append_rows":         result = await appendRows(args); break;
        case "clear_range":         result = await clearRange(args); break;
        case "batch_update_cells":  result = await batchUpdateCells(args); break;
        case "format_cells":        result = await formatCells(args); break;
        case "create_spreadsheet":  result = await createSpreadsheet(args); break;
        case "add_sheet":           result = await addSheet(args); break;
        case "delete_sheet":        result = await deleteSheet(args); break;
        case "rename_sheet":        result = await renameSheet(args); break;
        case "duplicate_sheet":     result = await duplicateSheet(args); break;
        case "share_spreadsheet":   result = await shareSpreadsheet(args); break;
        case "add_chart":           result = await addChart(args); break;
        default: throw new Error(`Unknown tool: ${toolName}`);
      }
      sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } });
      log(`   >> ${toolName} OK`);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Error: ${detail}` }], isError: true } });
      log(`   >> ${toolName} ERROR: ${detail}`);
    }
    return;
  }

  if (method === "resources/list") { sendResponse({ jsonrpc: "2.0", id, result: { resources: [] } }); return; }
  if (method === "prompts/list")   { sendResponse({ jsonrpc: "2.0", id, result: { prompts: [] } }); return; }
  sendResponse({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
}

// ── Stdio framing: NDJSON ──
let buf = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (true) {
    const idx = buf.indexOf(10);
    if (idx === -1) break;
    let line = buf.subarray(0, idx).toString("utf8");
    buf = buf.subarray(idx + 1);
    line = line.replace(/\r$/, "");
    if (!line) continue;
    try { const msg = JSON.parse(line); handleMessage(msg).catch((e) => log(`Error: ${e.stack}`)); }
    catch (e) { log(`Parse error: ${e.message}`); }
  }
});
process.stdin.on("end", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("uncaughtException", (e) => log(`Uncaught: ${e.stack}`));
process.on("unhandledRejection", (e) => log(`Rejection: ${e}`));
log("server started (v0.3.0 — SDK-free NDJSON, googleapis OAuth2)");
