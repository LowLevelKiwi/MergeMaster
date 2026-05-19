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

  function normalizeVariableName(s) {
    return String(s).trim().toLowerCase();
  }

  function formatVariableDisplayName(s) {
    var t = String(s).trim();
    if (!t) return t;
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  function lookupVariableValue(values, name) {
    if (!values) return undefined;
    if (Object.prototype.hasOwnProperty.call(values, name)) return values[name];
    var want = normalizeVariableName(name);
    var keys = Object.keys(values);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (normalizeVariableName(k) === want) return values[k];
    }
    return undefined;
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
      var keyNorm = normalizeVariableName(key);
      if (key && !seen.has(keyNorm)) {
        seen.add(keyNorm);
        names.push(formatVariableDisplayName(key));
      }
    }
    return names;
  }

  function mergeTemplate(template, values, open, close) {
    var re = variablePatternRegex(open, close);
    return template.replace(re, function (_, rawName) {
      var name = rawName.trim();
      var v = lookupVariableValue(values, name);
      return v !== undefined && v !== null ? String(v) : "";
    });
  }

  function csvDataRowToValues(header, row, p, fallbackInputs) {
    var br = bracketPair(p);
    var vars = extractVariables(p.template, br.open, br.close);
    var headerNorm = header.map(normalizeVariableName);
    var values = {};
    vars.forEach(function (v) {
      var idx = headerNorm.indexOf(normalizeVariableName(v));
      if (idx >= 0) values[v] = row[idx] != null ? String(row[idx]).trim() : "";
      else if (fallbackInputs) {
        var fbKey = Object.keys(fallbackInputs).find(function (k) {
          return normalizeVariableName(k) === normalizeVariableName(v);
        });
        values[v] = fbKey ? fallbackInputs[fbKey].value : "";
      } else values[v] = "";
    });
    return values;
  }

  MM.escapeRegExp = escapeRegExp;
  MM.normalizeVariableName = normalizeVariableName;
  MM.formatVariableDisplayName = formatVariableDisplayName;
  MM.lookupVariableValue = lookupVariableValue;
  MM.normalizeBrackets = normalizeBrackets;
  MM.bracketPair = bracketPair;
  MM.globalBracketPair = globalBracketPair;
  MM.mergeTemplateWithGlobals = mergeTemplateWithGlobals;
  MM.variablePatternRegex = variablePatternRegex;
  MM.extractVariables = extractVariables;
  MM.mergeTemplate = mergeTemplate;
  MM.csvDataRowToValues = csvDataRowToValues;
})();
