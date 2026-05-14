(function () {
  "use strict";
  var MM = window.MergeMaster;

  function initListCompose(el) {
    var state = MM.state;
    var listComposeCsvData = null;
    var listComposeGlobalInputs = {};

    function refreshListComposeSelect() {
      var sel = el.listComposeSelect;
      if (!sel) return;
      var prev = state.listComposeTemplateId;
      sel.innerHTML = "";
      if (state.templates.length === 0) {
        var o = document.createElement("option");
        o.value = "";
        o.textContent = "No templates — create one first";
        sel.appendChild(o);
        sel.disabled = true;
        state.listComposeTemplateId = null;
        return;
      }
      sel.disabled = false;
      state.templates.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name || "Untitled";
        sel.appendChild(opt);
      });
      if (
        prev &&
        state.templates.some(function (p) {
          return p.id === prev;
        })
      ) {
        sel.value = prev;
        state.listComposeTemplateId = prev;
      } else if (
        state.composeTemplateId &&
        state.templates.some(function (p) {
          return p.id === state.composeTemplateId;
        })
      ) {
        sel.value = state.composeTemplateId;
        state.listComposeTemplateId = state.composeTemplateId;
      } else {
        sel.value = state.templates[0].id;
        state.listComposeTemplateId = state.templates[0].id;
      }
    }

    function setListComposeRowVisibility(hasRows) {
      el.listComposeEmpty.classList.toggle("hidden", hasRows);
    }

    function updateListComposeEmptyFromDom() {
      setListComposeRowVisibility(el.listComposeRows.children.length > 0);
    }

    function readListComposeGlobalValues() {
      var out = {};
      Object.keys(listComposeGlobalInputs).forEach(function (k) {
        out[k] = listComposeGlobalInputs[k].value;
      });
      return out;
    }

    function rebuildListComposeGlobalFields(p) {
      if (!el.listComposeGlobalFields) return;
      el.listComposeGlobalFields.innerHTML = "";
      listComposeGlobalInputs = {};
      if (!p) return;
      var gbr = MM.globalBracketPair(p);
      var gnames = MM.extractVariables(p.template, gbr.open, gbr.close);
      gnames.forEach(function (name) {
        var label = document.createElement("label");
        label.className = "field";
        var span = document.createElement("span");
        span.textContent = name;
        var input = document.createElement("input");
        input.type = "text";
        input.autocomplete = "off";
        listComposeGlobalInputs[name] = input;
        label.appendChild(span);
        label.appendChild(input);
        el.listComposeGlobalFields.appendChild(label);
      });
    }

    function removeListComposeCsvRows() {
      el.listComposeRows.querySelectorAll(".list-row-csv").forEach(function (n) {
        n.remove();
      });
    }

    function appendListComposeCsvCards(header, dataRows) {
      var p = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
      if (!p || dataRows.length === 0) return;
      var globalVals = readListComposeGlobalValues();
      removeListComposeCsvRows();
      dataRows.forEach(function (row, i) {
        var values = MM.csvDataRowToValues(header, row, p, null);
        var text = MM.mergeTemplateWithGlobals(p.template, globalVals, values, p);
        var card = document.createElement("div");
        card.className = "list-row card list-row-csv";
        var head = document.createElement("div");
        head.className = "list-row-head";
        var title = document.createElement("span");
        title.className = "list-row-title";
        title.textContent = "Row " + (i + 1);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-primary btn-small";
        btn.textContent = "Copy";
        var pre = document.createElement("pre");
        pre.className = "list-row-preview";
        pre.textContent = text;
        btn.addEventListener("click", function () {
          MM.copyToClipboardWithFeedback(btn, pre.textContent, "Copy");
        });
        head.appendChild(title);
        head.appendChild(btn);
        card.appendChild(head);
        card.appendChild(pre);
        el.listComposeRows.appendChild(card);
      });
      setListComposeRowVisibility(el.listComposeRows.children.length > 0);
    }

    function refreshAllListComposeOutputs() {
      if (listComposeCsvData) {
        appendListComposeCsvCards(listComposeCsvData.header, listComposeCsvData.rows);
      }
      el.listComposeRows.querySelectorAll(".list-row-manual").forEach(function (card) {
        if (typeof card._mmRefresh === "function") card._mmRefresh();
      });
    }

    function clearListComposeUI() {
      el.listComposeRows.innerHTML = "";
      if (el.listInputCsv) el.listInputCsv.value = "";
      listComposeCsvData = null;
      setListComposeRowVisibility(false);
    }

    function renderListComposeFromCsv(header, dataRows) {
      var p = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
      if (!p || dataRows.length === 0) return;
      listComposeCsvData = { header: header, rows: dataRows };
      appendListComposeCsvCards(header, dataRows);
    }

    function appendManualListRow() {
      var p = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
      if (!p) {
        alert("Choose a template first.");
        return;
      }
      var br = MM.bracketPair(p);
      var vars = MM.extractVariables(p.template, br.open, br.close);
      var card = document.createElement("div");
      card.className = "list-row card list-row-manual";

      var head = document.createElement("div");
      head.className = "list-row-head";
      var title = document.createElement("span");
      title.className = "list-row-title";
      title.textContent = "Manual row";
      var actions = document.createElement("div");
      actions.className = "list-row-actions";

      var btnCopy = document.createElement("button");
      btnCopy.type = "button";
      btnCopy.className = "btn btn-primary btn-small";
      btnCopy.textContent = "Copy";

      var btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "btn btn-ghost btn-small";
      btnRemove.textContent = "Remove";

      var pre = document.createElement("pre");
      pre.className = "list-row-preview";

      var fieldMap = {};

      function refreshPreview() {
        var cur = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
        if (!cur) {
          pre.textContent = "";
          return;
        }
        var b = MM.bracketPair(cur);
        var vnames = MM.extractVariables(cur.template, b.open, b.close);
        var values = {};
        vnames.forEach(function (v) {
          values[v] = fieldMap[v] ? fieldMap[v].value : "";
        });
        var globalVals = readListComposeGlobalValues();
        pre.textContent = MM.mergeTemplateWithGlobals(cur.template, globalVals, values, cur);
      }

      btnCopy.addEventListener("click", function () {
        MM.copyToClipboardWithFeedback(btnCopy, pre.textContent, "Copy");
      });

      btnRemove.addEventListener("click", function () {
        card.remove();
        updateListComposeEmptyFromDom();
      });

      actions.appendChild(btnCopy);
      actions.appendChild(btnRemove);
      head.appendChild(title);
      head.appendChild(actions);
      card.appendChild(head);

      if (vars.length > 0) {
        var fieldsWrap = document.createElement("div");
        fieldsWrap.className = "list-row-manual-fields";
        vars.forEach(function (name) {
          var label = document.createElement("label");
          label.className = "field";
          var span = document.createElement("span");
          span.textContent = name;
          var input = document.createElement("input");
          input.type = "text";
          input.autocomplete = "off";
          input.addEventListener("input", refreshPreview);
          fieldMap[name] = input;
          label.appendChild(span);
          label.appendChild(input);
          fieldsWrap.appendChild(label);
        });
        card.appendChild(fieldsWrap);
      }

      card.appendChild(pre);
      card._mmRefresh = refreshPreview;
      refreshPreview();
      el.listComposeRows.appendChild(card);
      setListComposeRowVisibility(true);
    }

    function refreshListCompose() {
      refreshListComposeSelect();
      if (state.templates.length === 0) {
        clearListComposeUI();
        rebuildListComposeGlobalFields(null);
        if (el.listComposeTemplateHeading) {
          el.listComposeTemplateHeading.title = "Create a template first, then import a source file here.";
        }
        return;
      }
      var p = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
      rebuildListComposeGlobalFields(p);
      if (p && el.listComposeTemplateHeading) {
        var br = MM.bracketPair(p);
        var gbr = MM.globalBracketPair(p);
        el.listComposeTemplateHeading.title =
          "Source header = regular variable names (not \"" +
          br.open +
          '" or "' +
          br.close +
          '"). Globals use "' +
          gbr.open +
          '" … "' +
          gbr.close +
          '" — fill those once in Globals (same for every list row). Add row = hand-filled regular variables only.';
      }
      if (listComposeCsvData) {
        appendListComposeCsvCards(listComposeCsvData.header, listComposeCsvData.rows);
      }
    }

    if (el.listComposeGlobalFields && !el.listComposeGlobalFields.dataset.mmInputBound) {
      el.listComposeGlobalFields.dataset.mmInputBound = "1";
      el.listComposeGlobalFields.addEventListener("input", refreshAllListComposeOutputs);
    }

    el.listComposeSelect.addEventListener("change", function () {
      state.listComposeTemplateId = el.listComposeSelect.value || null;
      clearListComposeUI();
      refreshListCompose();
    });

    el.listInputCsv.addEventListener("change", function () {
      var file = el.listInputCsv.files && el.listInputCsv.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var rows = MM.parseCSV(String(reader.result));
        if (rows.length < 2) {
          alert("The source file needs a header row and at least one data row.");
          el.listInputCsv.value = "";
          return;
        }
        var header = rows[0];
        var dataRows = rows.slice(1);
        var p2 = state.listComposeTemplateId ? MM.getTemplateById(state.listComposeTemplateId) : null;
        if (!p2) {
          alert("Choose a template first.");
          el.listInputCsv.value = "";
          return;
        }
        renderListComposeFromCsv(header, dataRows);
      };
      reader.readAsText(file);
    });

    el.listBtnClear.addEventListener("click", function () {
      clearListComposeUI();
    });

    if (el.btnListAddRow) {
      el.btnListAddRow.addEventListener("click", function () {
        appendManualListRow();
      });
    }

    return { refreshListComposeSelect: refreshListComposeSelect, refreshListCompose: refreshListCompose };
  }

  MM.initListCompose = initListCompose;
})();
