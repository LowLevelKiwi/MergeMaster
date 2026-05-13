(function () {
  "use strict";
  var MM = window.MergeMaster;

  function parseCSV(text) {
    var rows = [];
    var i = 0;
    var len = text.length;

    function parseRow() {
      var cells = [];
      var cur = "";
      var inQuotes = false;
      while (i < len) {
        var c = text[i];
        if (inQuotes) {
          if (c === '"') {
            if (text[i + 1] === '"') {
              cur += '"';
              i += 2;
              continue;
            }
            inQuotes = false;
            i++;
            continue;
          }
          cur += c;
          i++;
          continue;
        }
        if (c === '"') {
          inQuotes = true;
          i++;
          continue;
        }
        if (c === ",") {
          cells.push(cur);
          cur = "";
          i++;
          continue;
        }
        if (c === "\r") {
          i++;
          continue;
        }
        if (c === "\n") {
          i++;
          cells.push(cur);
          return cells;
        }
        cur += c;
        i++;
      }
      cells.push(cur);
      return cells;
    }

    while (i < len) {
      var row = parseRow();
      if (row.length === 1 && row[0] === "" && i >= len) break;
      if (row.some(function (c) {
        return c.trim() !== "";
      }))
        rows.push(row);
    }
    return rows;
  }

  MM.parseCSV = parseCSV;
})();
