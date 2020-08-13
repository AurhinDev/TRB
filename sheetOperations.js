module.exports = function() {
  const operations = {};

  let sheets;
  let auth;
  require('./googleAuth.js')().then((googleAuth) => {
    sheets = googleAuth.google.sheets('v4');
    auth = googleAuth.auth;
  });
  const utils = require('./utils.js')();

  /**
  * Returns a promise that resolves with sheet data of sheet
  * @param {number|string} sheet - A sheet ID or sheet name
  */
  operations.getSheet = function(sheet) {
    return new Promise(async function(resolve, reject) {
      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: sheet,
        auth: auth
      }
      let response = await sheets.spreadsheets.values.get(request);
      resolve(response.data.values);
    });
  };

  operations.sendRequests = function(requests) {
    return new Promise(async function(resolve, reject) {
      sheets.spreadsheets.batchUpdate(utils.genBatchUpdateBody(auth, requests), (err, res) => {
        if (err) {
          console.error(err);
          reject();
        }
        else resolve();
      });
    });
  };

  /**
  * Gets a value for a character.
  * @param {Array} table - The table to operate on
  * @param {string} charName - A character's name
  * @param {string} valueName - The name of the value to query
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getValue = function(table, columnName, value, valueName, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const rowIndex = operations.getRowWithValue(table, columnName, value, prefix)
    if (rowIndex === -1) return null;
    return table[rowIndex][valueColIndex];
  };

  /**
  * Gets the row index of the first row with value in the valueName column.
  * @param {Array} table - The table to operate on
  * @param {string} valueName - The column header
  * @param {string} value - The value
  * @param {boolean} [prefix] - A flag to designate checking for prefix instead of matching
  */
  operations.getRowWithValue = function(table, columnName, value, prefix) {
    const valueColIndex = table[HEADER_ROW].indexOf(columnName);
    const colArray = table.map(row => row[valueColIndex]);
    if (!prefix) return colArray.indexOf(value);
    return colArray.reduce((ret, val, index) => {
      if (ret !== -1) return ret;
      if (val.toUpperCase().startsWith(value.toUpperCase())) return index;
      return -1;
    }, -1);
  };

  /**
  * Gets the row index of the last row with value in the valueName column.
  * @param {Array} table - The table to operate on
  * @param {string} valueName - The column header
  * @param {string} value - The value
  */
  operations.getLastRowWithValue = function(table, valueName, value) {
    const valueColIndex = table[HEADER_ROW].indexOf(valueName);
    const colArray = table.map(row => row[valueColIndex]);
    return colArray.lastIndexOf(value);
  };

  operations.authorizedCharacter = function(table, message, char) {
    const playerId = message.member.user.id;
    const charPlayerId = operations.getValue(table, ID_COLUMN, char, CHAR_COLUMN, true);
    return parseInt(playerId) === parseInt(charPlayerId);
  }

  return operations;
};
