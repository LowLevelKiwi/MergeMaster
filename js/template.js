(function () {
  "use strict";
  var MM = window.MergeMaster;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeBrackets(open, close, defaultOpen, defaultClose) {
    var defO = defaultOpen != null ? defaultOpen : MM.DEFAULT_BRACKET_OPEN;
    var defC = defaultClose != null ? defaultClose : MM.DEFAULT_BRACKET_CLOSE;
    var o = typeof open === "string" && open.length > 0 ? open.slice(0, MM.BRACKET_MAX_LEN) : defO;
    var c = typeof close === "string" && close.length > 0 ? close.slice(0, MM.BRACKET_MAX_LEN) : defC;
    return { open: o, close: c };
  }

  function bracketPair(p) {
    return normalizeBrackets(p.variableBracketOpen, p.variableBracketClose);
  }

  function globalBracketPair(p) {
    return normalizeBrackets(
      p.globalVariableBracketOpen,
      p.globalVariableBracketClose,
      MM.DEFAULT_GLOBAL_BRACKET_OPEN,
      MM.DEFAULT_GLOBAL_BRACKET_CLOSE
    );
  }

  function mergeTemplateWithGlobals(template, globalValues, rowValues, p) {
    var row = bracketPair(p);
    var glob = globalBracketPair(p);
    var afterGlobal = MM.mergeTemplate(template, globalValues, glob.open, glob.close);
    return MM.mergeTemplate(afterGlobal, rowValues, row.open, row.close);
  }

  function variablePatternRegex(open, close) {
    var b = normalizeBrackets(open, close);
    return new RegExp(escapeRegExp(b.open) + "([\\s\\S]*?)" + escapeRegExp(b.close), "g");
  }

  function extractVariables(template, open, close) {
    var names = [];
    var seen = new Set();
    var re = variablePatternRegex(open, close);
    var m;
    while ((m = re.exec(template)) !== null) {
      var key = m[1].trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        names.push(key);
      }
    }
    return names;
  }

  function mergeTemplate(template, values, open, close) {
    var re = variablePatternRegex(open, close);
    return template.replace(re, function (_, rawName) {
      var name = rawName.trim();
      var v = values[name];
      return v != null ? String(v) : "";
    });
  }

  function csvDataRowToValues(header, row, p, fallbackInputs) {
    var br = bracketPair(p);
    var vars = extractVariables(p.template, br.open, br.close);
    var norm = function (s) {
      return s.trim().toLowerCase();
    };
    var headerNorm = header.map(norm);
    var values = {};
    vars.forEach(function (v) {
      var idx = headerNorm.indexOf(norm(v));
      if (idx >= 0) values[v] = row[idx] != null ? String(row[idx]).trim() : "";
      else if (fallbackInputs && fallbackInputs[v]) values[v] = fallbackInputs[v].value;
      else values[v] = "";
    });
    return values;
  }

  MM.escapeRegExp = escapeRegExp;
  MM.normalizeBrackets = normalizeBrackets;
  MM.bracketPair = bracketPair;
  MM.globalBracketPair = globalBracketPair;
  MM.mergeTemplateWithGlobals = mergeTemplateWithGlobals;
  MM.variablePatternRegex = variablePatternRegex;
  MM.extractVariables = extractVariables;
  MM.mergeTemplate = mergeTemplate;
  MM.csvDataRowToValues = csvDataRowToValues;
})();
