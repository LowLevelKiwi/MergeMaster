(function () {
  "use strict";
  var MM = window.MergeMaster;

  function initCompose(el, hooks) {
    var refreshListComposeSelect = hooks.refreshListComposeSelect;
    var state = MM.state;

    function refreshComposeSelect() {
      var sel = el.composeSelect;
      var prev = state.composeTemplateId;
      sel.innerHTML = "";
      if (state.templates.length === 0) {
        var o = document.createElement("option");
        o.value = "";
        o.textContent = "No templates — create one first";
        sel.appendChild(o);
        sel.disabled = true;
        state.composeTemplateId = null;
        refreshListComposeSelect();
        return;
      }
      sel.disabled = false;
      state.templates.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name || "Untitled";
        sel.appendChild(opt);
      });
      if (prev && state.templates.some(function (p) {
        return p.id === prev;
      })) {
        sel.value = prev;
        state.composeTemplateId = prev;
      } else {
        sel.value = state.templates[0].id;
        state.composeTemplateId = state.templates[0].id;
      }
      refreshListComposeSelect();
    }

    function readValuesFromInputs() {
      var out = {};
      Object.keys(state.composeInputs).forEach(function (k) {
        out[k] = state.composeInputs[k].value;
      });
      return out;
    }

    function readComposeGlobalValues() {
      var out = {};
      if (!state.composeGlobalInputs) return out;
      Object.keys(state.composeGlobalInputs).forEach(function (k) {
        out[k] = state.composeGlobalInputs[k].value;
      });
      return out;
    }

    function runMerge() {
      var p = state.composeTemplateId ? MM.getTemplateById(state.composeTemplateId) : null;
      if (!p) {
        el.composeOutput.value = "";
        el.btnCopy.disabled = true;
        el.multiRowNote.textContent = "";
        return;
      }
      var br = MM.bracketPair(p);
      var gbr = MM.globalBracketPair(p);
      var rowVars = MM.extractVariables(p.template, br.open, br.close);
      var globalVars = MM.extractVariables(p.template, gbr.open, gbr.close);
      if (rowVars.length === 0 && globalVars.length === 0) {
        el.composeOutput.value = p.template;
        el.btnCopy.disabled = false;
        el.multiRowNote.textContent = "";
        return;
      }
      var globalVals = readComposeGlobalValues();
      var values = readValuesFromInputs();
      el.composeOutput.value = MM.mergeTemplateWithGlobals(p.template, globalVals, values, p);
      el.btnCopy.disabled = el.composeOutput.value.length === 0;
      el.multiRowNote.textContent = "";
    }

    function applyCsvRows(header, dataRows) {
      var p = state.composeTemplateId ? MM.getTemplateById(state.composeTemplateId) : null;
      if (!p || dataRows.length === 0) return;

      var br = MM.bracketPair(p);
      var vars = MM.extractVariables(p.template, br.open, br.close);
      var globalVals = readComposeGlobalValues();
      var norm = function (s) {
        return s.trim().toLowerCase();
      };
      var headerNorm = header.map(norm);

      if (dataRows.length === 1) {
        var row = dataRows[0];
        vars.forEach(function (v) {
          var idx = headerNorm.indexOf(norm(v));
          if (idx >= 0 && state.composeInputs[v]) state.composeInputs[v].value = row[idx] != null ? String(row[idx]) : "";
        });
        runMerge();
        el.multiRowNote.textContent = "Filled fields from the first source row.";
        return;
      }

      var blocks = dataRows.map(function (row) {
        return MM.mergeTemplateWithGlobals(
          p.template,
          globalVals,
          MM.csvDataRowToValues(header, row, p, state.composeInputs),
          p
        );
      });
      el.composeOutput.value = blocks.join("\n\n---\n\n");
      el.btnCopy.disabled = el.composeOutput.value.length === 0;
      el.multiRowNote.textContent =
        "Multiple source rows: " + dataRows.length + " merged blocks (separated by ---). Edit in the result if needed.";
    }

    function updateComposeCsvHint(p) {
      if (!el.composeVariablesHeading) return;
      var br = MM.bracketPair(p);
      var gbr = MM.globalBracketPair(p);
      el.composeVariablesHeading.title =
        "Fill fields or use a source file. Headers = regular variable names only (not \"" +
        br.open +
        '" or "' +
        br.close +
        '"). Globals use "' +
        gbr.open +
        '" … "' +
        gbr.close +
        '" — set those in the form, not from the source file.';
    }

    function buildComposeFields() {
      el.composeFields.innerHTML = "";
      state.composeInputs = {};
      state.composeGlobalInputs = {};
      var p = state.composeTemplateId ? MM.getTemplateById(state.composeTemplateId) : null;
      if (!p) {
        if (el.composeTemplateHintLabel) {
          el.composeTemplateHintLabel.title = "Create a template first.";
        }
        el.composeOutput.value = "";
        el.btnCopy.disabled = true;
        return;
      }
      if (el.composeTemplateHintLabel) {
        el.composeTemplateHintLabel.title =
          "Fill regular and global variables, or load a source file whose columns match regular variable names.";
      }
      updateComposeCsvHint(p);
      var br = MM.bracketPair(p);
      var gbr = MM.globalBracketPair(p);
      var rowVars = MM.extractVariables(p.template, br.open, br.close);
      var globalVars = MM.extractVariables(p.template, gbr.open, gbr.close);
      if (rowVars.length === 0 && globalVars.length === 0) {
        var pNote = document.createElement("h4");
        pNote.className = "section-title-hint";
        pNote.textContent = "No placeholders";
        pNote.title =
          "No placeholders: regular " +
          br.open +
          "…" +
          br.close +
          " or global " +
          gbr.open +
          "…" +
          gbr.close +
          ". The full template is copied as-is.";
        el.composeFields.appendChild(pNote);
        runMerge();
        return;
      }
      if (globalVars.length > 0) {
        var gHead = document.createElement("h4");
        gHead.className = "section-title-hint";
        gHead.textContent = "Global variables";
        gHead.title = "Same value for every row when the source has multiple rows and in List compose.";
        el.composeFields.appendChild(gHead);
        globalVars.forEach(function (name) {
          var label = document.createElement("label");
          label.className = "field";
          var span = document.createElement("span");
          span.textContent = name;
          var input = document.createElement("input");
          input.type = "text";
          input.autocomplete = "off";
          input.dataset.globalVar = name;
          input.addEventListener("input", runMerge);
          label.appendChild(span);
          label.appendChild(input);
          el.composeFields.appendChild(label);
          state.composeGlobalInputs[name] = input;
        });
      }
      if (rowVars.length > 0) {
        var rHead = document.createElement("h4");
        rHead.className = "section-title-hint";
        rHead.textContent = "Regular variables";
        rHead.title = "One value per line; source columns map to these names.";
        el.composeFields.appendChild(rHead);
        rowVars.forEach(function (name) {
          var label = document.createElement("label");
          label.className = "field";
          var span = document.createElement("span");
          span.textContent = name;
          var input = document.createElement("input");
          input.type = "text";
          input.autocomplete = "off";
          input.dataset.var = name;
          input.addEventListener("input", runMerge);
          label.appendChild(span);
          label.appendChild(input);
          el.composeFields.appendChild(label);
          state.composeInputs[name] = input;
        });
      } else {
        var pRow = document.createElement("h4");
        pRow.className = "section-title-hint";
        pRow.textContent = "No regular fields";
        pRow.title =
          "No regular placeholders (" + br.open + "…" + br.close + ") in this template — only globals.";
        el.composeFields.appendChild(pRow);
      }
      runMerge();
    }

    function refreshCompose() {
      refreshComposeSelect();
      if (state.templates.length === 0) {
        el.composeFields.innerHTML = "";
        state.composeInputs = {};
        state.composeGlobalInputs = {};
        el.composeOutput.value = "";
        el.btnCopy.disabled = true;
        if (el.composeTemplateHintLabel) {
          el.composeTemplateHintLabel.title = "No templates yet. Create one under Templates.";
        }
        if (el.composeVariablesHeading) {
          el.composeVariablesHeading.title =
            "Fill each field, or use a source file below. Column headers should match regular variable names.";
        }
        return;
      }
      if (!state.composeTemplateId) state.composeTemplateId = state.templates[0].id;
      el.composeSelect.value = state.composeTemplateId;
      buildComposeFields();
    }

    el.inputCsv.addEventListener("change", function () {
      var file = el.inputCsv.files && el.inputCsv.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var rows = MM.parseCSV(String(reader.result));
        if (rows.length < 2) {
          alert("The source file needs a header row and at least one data row.");
          return;
        }
        var header = rows[0];
        var dataRows = rows.slice(1);
        applyCsvRows(header, dataRows);
      };
      reader.readAsText(file);
    });

    el.btnClearCsv.addEventListener("click", function () {
      el.inputCsv.value = "";
      runMerge();
      el.multiRowNote.textContent = "";
    });

    el.composeSelect.addEventListener("change", function () {
      state.composeTemplateId = el.composeSelect.value || null;
      buildComposeFields();
    });

    el.btnCopy.addEventListener("click", function () {
      var text = el.composeOutput.value;
      if (!text) return;
      MM.copyToClipboardWithFeedback(el.btnCopy, text, "Copy to clipboard");
    });

    return { refreshComposeSelect: refreshComposeSelect, refreshCompose: refreshCompose };
  }

  MM.initCompose = initCompose;
})();
