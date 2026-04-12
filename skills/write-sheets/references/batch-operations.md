# Batch Operations Reference

Common `batch_update` request patterns for the Google Sheets API.

## Formatting Cells

### Bold Header Row

```json
{
  "repeatCell": {
    "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1},
    "cell": {
      "userEnteredFormat": {
        "textFormat": {"bold": true},
        "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 0.9}
      }
    },
    "fields": "userEnteredFormat(textFormat,backgroundColor)"
  }
}
```

### Set Column Width

```json
{
  "updateDimensionProperties": {
    "range": {"sheetId": 0, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
    "properties": {"pixelSize": 200},
    "fields": "pixelSize"
  }
}
```

### Number Format (Currency)

```json
{
  "repeatCell": {
    "range": {"sheetId": 0, "startRowIndex": 1, "startColumnIndex": 2, "endColumnIndex": 3},
    "cell": {
      "userEnteredFormat": {
        "numberFormat": {"type": "CURRENCY", "pattern": "$#,##0.00"}
      }
    },
    "fields": "userEnteredFormat.numberFormat"
  }
}
```

## Conditional Formatting

### Highlight cells above a threshold

```json
{
  "addConditionalFormatRule": {
    "rule": {
      "ranges": [{"sheetId": 0, "startRowIndex": 1, "startColumnIndex": 1, "endColumnIndex": 2}],
      "booleanRule": {
        "condition": {"type": "NUMBER_GREATER", "values": [{"userEnteredValue": "100"}]},
        "format": {"backgroundColor": {"red": 0.8, "green": 1, "blue": 0.8}}
      }
    },
    "index": 0
  }
}
```

## Merging Cells

```json
{
  "mergeCells": {
    "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": 3},
    "mergeType": "MERGE_ALL"
  }
}
```

## Freezing Rows/Columns

```json
{
  "updateSheetProperties": {
    "properties": {
      "sheetId": 0,
      "gridProperties": {"frozenRowCount": 1}
    },
    "fields": "gridProperties.frozenRowCount"
  }
}
```

## Data Validation (Dropdown)

```json
{
  "setDataValidation": {
    "range": {"sheetId": 0, "startRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": 1},
    "rule": {
      "condition": {
        "type": "ONE_OF_LIST",
        "values": [
          {"userEnteredValue": "Option A"},
          {"userEnteredValue": "Option B"},
          {"userEnteredValue": "Option C"}
        ]
      },
      "showCustomUi": true,
      "strict": true
    }
  }
}
```
