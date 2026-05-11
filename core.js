(function () {
  "use strict";

  const STORAGE_KEY = "mergemaster_profiles";
  const DEFAULT_BRACKET_OPEN = "{{";
  const DEFAULT_BRACKET_CLOSE = "}}";
  const BRACKET_MAX_LEN = 32;

  /**
   * @typedef {{
   *   id: string,
   *   name: string,
   *   template: string,
   *   variableBracketOpen: string,
   *   variableBracketClose: string
   * }} Profile
   */

  function uid() {
    return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeBrackets(open, close) {
    const o =
      typeof open === "string" && open.length > 0 ? open.slice(0, BRACKET_MAX_LEN) : DEFAULT_BRACKET_OPEN;
    const c =
      typeof close === "string" && close.length > 0 ? close.slice(0, BRACKET_MAX_LEN) : DEFAULT_BRACKET_CLOSE;
    return { open: o, close: c };
  }

  /** @param {*} raw */
  function normalizeProfile(raw) {
    if (!raw || typeof raw.template !== "string") return null;
    if (!raw.id || typeof raw.id !== "string") return null;
    const b = normalizeBrackets(raw.variableBracketOpen, raw.variableBracketClose);
    return {
      id: raw.id,
      name: typeof raw.name === "string" ? raw.name : "Untitled",
      template: raw.template,
      variableBracketOpen: b.open,
      variableBracketClose: b.close,
    };
  }

  /** @param {Profile} p */
  function bracketPair(p) {
    return normalizeBrackets(p.variableBracketOpen, p.variableBracketClose);
  }

  function loadProfiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map((p) => normalizeProfile(p)).filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveProfiles(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function variablePatternRegex(open, close) {
    const b = normalizeBrackets(open, close);
    return new RegExp(escapeRegExp(b.open) + "([\\s\\S]*?)" + escapeRegExp(b.close), "g");
  }

  function extractVariables(template, open, close) {
    const names = [];
    const seen = new Set();
    const re = variablePatternRegex(open, close);
    let m;
    while ((m = re.exec(template)) !== null) {
      const key = m[1].trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        names.push(key);
      }
    }
    return names;
  }

  function mergeTemplate(template, values, open, close) {
    const re = variablePatternRegex(open, close);
    return template.replace(re, (_, rawName) => {
      const name = rawName.trim();
      const v = values[name];
      return v != null ? String(v) : "";
    });
  }

  /**
   * Map one CSV data row to template variable values using header names.
   * @param {string[]} header
   * @param {string[]} row
   * @param {Profile} p
   * @param {Record<string, HTMLInputElement> | null | undefined} fallbackInputs
   */
  function csvDataRowToValues(header, row, p, fallbackInputs) {
    const br = bracketPair(p);
    const vars = extractVariables(p.template, br.open, br.close);
    const norm = (s) => s.trim().toLowerCase();
    const headerNorm = header.map(norm);
    const values = {};
    vars.forEach((v) => {
      const idx = headerNorm.indexOf(norm(v));
      if (idx >= 0) values[v] = row[idx] != null ? String(row[idx]).trim() : "";
      else if (fallbackInputs && fallbackInputs[v]) values[v] = fallbackInputs[v].value;
      else values[v] = "";
    });
    return values;
  }

  function parseCSV(text) {
    const rows = [];
    let i = 0;
    const len = text.length;

    function parseRow() {
      const cells = [];
      let cur = "";
      let inQuotes = false;
      while (i < len) {
        const c = text[i];
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
      const row = parseRow();
      if (row.length === 1 && row[0] === "" && i >= len) break;
      if (row.some((c) => c.trim() !== "")) rows.push(row);
    }
    return rows;
  }

  /** @type {Profile[]} */
  let profiles = loadProfiles();
  /** @type {string | null} */
  let editingId = null;
  /** @type {string | null} */
  let composeProfileId = null;
  /** @type {string | null} */
  let listComposeProfileId = null;

  const el = {
    tabs: document.querySelectorAll(".tab"),
    panelProfiles: document.getElementById("panel-profiles"),
    panelCompose: document.getElementById("panel-compose"),
    panelListCompose: document.getElementById("panel-list-compose"),
    profileList: document.getElementById("profile-list"),
    profileEditor: document.getElementById("profile-editor"),
    profileEmpty: document.getElementById("profile-empty"),
    editName: document.getElementById("edit-name"),
    editBracketOpen: document.getElementById("edit-bracket-open"),
    editBracketClose: document.getElementById("edit-bracket-close"),
    editBracketExample: document.getElementById("edit-bracket-example"),
    editTemplate: document.getElementById("edit-template"),
    detectedVars: document.getElementById("detected-vars"),
    composeCsvHint: document.getElementById("compose-csv-hint"),
    btnNew: document.getElementById("btn-new-profile"),
    btnSave: document.getElementById("btn-save-profile"),
    btnExport: document.getElementById("btn-export-profile"),
    btnDelete: document.getElementById("btn-delete-profile"),
    btnCancel: document.getElementById("btn-cancel-edit"),
    inputImport: document.getElementById("input-import-profile"),
    composeSelect: document.getElementById("compose-profile-select"),
    composeFields: document.getElementById("compose-fields"),
    composeOutput: document.getElementById("compose-output"),
    composeHint: document.getElementById("compose-hint"),
    multiRowNote: document.getElementById("multi-row-note"),
    inputCsv: document.getElementById("input-csv"),
    btnClearCsv: document.getElementById("btn-clear-csv"),
    btnCopy: document.getElementById("btn-copy"),
    listComposeSelect: document.getElementById("list-compose-profile-select"),
    listComposeHint: document.getElementById("list-compose-hint"),
    listInputCsv: document.getElementById("list-input-csv"),
    listBtnClear: document.getElementById("list-btn-clear"),
    listComposeEmpty: document.getElementById("list-compose-empty"),
    listComposeRows: document.getElementById("list-compose-rows"),
    btnListAddRow: document.getElementById("btn-list-add-row"),
  };

  function setTab(name) {
    el.tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    el.panelProfiles.classList.toggle("is-active", name === "profiles");
    el.panelProfiles.hidden = name !== "profiles";
    el.panelCompose.classList.toggle("is-active", name === "compose");
    el.panelCompose.hidden = name !== "compose";
    el.panelListCompose.classList.toggle("is-active", name === "list-compose");
    el.panelListCompose.hidden = name !== "list-compose";
    if (name === "compose") refreshCompose();
    if (name === "list-compose") refreshListCompose();
  }

  /**
   * @param {HTMLButtonElement} button
   * @param {string} text
   * @param {string} [restoreLabel]
   */
  async function copyToClipboardWithFeedback(button, text, restoreLabel) {
    const restore = restoreLabel != null ? restoreLabel : button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = restore;
      }, 1500);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = restore;
        }, 1500);
      } catch {
        button.textContent = "Copy failed";
        setTimeout(() => {
          button.textContent = restore;
        }, 2000);
      }
    }
  }

  el.tabs.forEach((t) => {
    t.addEventListener("click", () => setTab(t.dataset.tab));
  });

  function renderProfileList() {
    el.profileList.innerHTML = "";
    profiles.forEach((p) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p.name || "Untitled";
      btn.classList.toggle("is-selected", p.id === editingId);
      btn.addEventListener("click", () => openEditor(p.id));
      li.appendChild(btn);
      el.profileList.appendChild(li);
    });
  }

  function updateBracketExample() {
    const b = normalizeBrackets(el.editBracketOpen.value, el.editBracketClose.value);
    el.editBracketExample.textContent = b.open + "variableName" + b.close;
  }

  function updateDetectedVars() {
    const vars = extractVariables(el.editTemplate.value, el.editBracketOpen.value, el.editBracketClose.value);
    el.detectedVars.textContent =
      vars.length === 0 ? "Variables in template: none" : "Variables in template: " + vars.join(", ");
    updateBracketExample();
  }

  function showEditor(show) {
    el.profileEditor.classList.toggle("hidden", !show);
    el.profileEmpty.classList.toggle("hidden", show);
  }

  function openEditor(id) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    editingId = id;
    el.editName.value = p.name;
    const br = bracketPair(p);
    el.editBracketOpen.value = br.open;
    el.editBracketClose.value = br.close;
    el.editTemplate.value = p.template;
    updateDetectedVars();
    showEditor(true);
    renderProfileList();
  }

  function openNewProfile() {
    const p = normalizeProfile({
      id: uid(),
      name: "New profile",
      template: "Hello {{name}},",
    });
    if (!p) return;
    profiles.push(p);
    saveProfiles(profiles);
    openEditor(p.id);
  }

  function closeEditor() {
    editingId = null;
    showEditor(false);
    renderProfileList();
  }

  el.btnNew.addEventListener("click", openNewProfile);

  el.editTemplate.addEventListener("input", updateDetectedVars);
  el.editBracketOpen.addEventListener("input", updateDetectedVars);
  el.editBracketClose.addEventListener("input", updateDetectedVars);

  el.btnSave.addEventListener("click", () => {
    if (!editingId) return;
    const p = profiles.find((x) => x.id === editingId);
    if (!p) return;
    const o = el.editBracketOpen.value.trim().slice(0, BRACKET_MAX_LEN);
    const c = el.editBracketClose.value.trim().slice(0, BRACKET_MAX_LEN);
    if (!o || !c) {
      alert("Open and close brackets must each be at least one character.");
      return;
    }
    if (o === c) {
      alert("Open and close brackets must be different from each other.");
      return;
    }
    p.name = el.editName.value.trim() || "Untitled";
    p.template = el.editTemplate.value;
    p.variableBracketOpen = o;
    p.variableBracketClose = c;
    saveProfiles(profiles);
    renderProfileList();
    refreshComposeSelect();
  });

  el.btnDelete.addEventListener("click", () => {
    if (!editingId) return;
    if (!confirm("Delete this profile?")) return;
    profiles = profiles.filter((x) => x.id !== editingId);
    saveProfiles(profiles);
    closeEditor();
    refreshComposeSelect();
  });

  el.btnCancel.addEventListener("click", closeEditor);

  el.btnExport.addEventListener("click", () => {
    if (!editingId) return;
    const p = profiles.find((x) => x.id === editingId);
    if (!p) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            name: p.name,
            template: p.template,
            variableBracketOpen: p.variableBracketOpen,
            variableBracketClose: p.variableBracketClose,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (p.name || "profile").replace(/[^\w\-]+/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  el.inputImport.addEventListener("change", () => {
    const file = el.inputImport.files && el.inputImport.files[0];
    el.inputImport.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const name = typeof data.name === "string" ? data.name : "Imported";
        const template = typeof data.template === "string" ? data.template : "";
        const p = normalizeProfile({
          id: uid(),
          name,
          template,
          variableBracketOpen: data.variableBracketOpen,
          variableBracketClose: data.variableBracketClose,
        });
        if (!p) {
          alert("Invalid profile data in JSON.");
          return;
        }
        profiles.push(p);
        saveProfiles(profiles);
        renderProfileList();
        refreshComposeSelect();
        openEditor(p.id);
      } catch {
        alert(
          "Invalid JSON file. Expected name, template, and optional variableBracketOpen / variableBracketClose."
        );
      }
    };
    reader.readAsText(file);
  });

  function refreshComposeSelect() {
    const sel = el.composeSelect;
    const prev = composeProfileId;
    sel.innerHTML = "";
    if (profiles.length === 0) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No profiles — create one first";
      sel.appendChild(o);
      sel.disabled = true;
      composeProfileId = null;
      refreshListComposeSelect();
      return;
    }
    sel.disabled = false;
    profiles.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name || "Untitled";
      sel.appendChild(o);
    });
    if (prev && profiles.some((p) => p.id === prev)) {
      sel.value = prev;
      composeProfileId = prev;
    } else {
      sel.value = profiles[0].id;
      composeProfileId = profiles[0].id;
    }
    refreshListComposeSelect();
  }

  function refreshListComposeSelect() {
    const sel = el.listComposeSelect;
    if (!sel) return;
    const prev = listComposeProfileId;
    sel.innerHTML = "";
    if (profiles.length === 0) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No profiles — create one first";
      sel.appendChild(o);
      sel.disabled = true;
      listComposeProfileId = null;
      return;
    }
    sel.disabled = false;
    profiles.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name || "Untitled";
      sel.appendChild(o);
    });
    if (prev && profiles.some((p) => p.id === prev)) {
      sel.value = prev;
      listComposeProfileId = prev;
    } else if (composeProfileId && profiles.some((p) => p.id === composeProfileId)) {
      sel.value = composeProfileId;
      listComposeProfileId = composeProfileId;
    } else {
      sel.value = profiles[0].id;
      listComposeProfileId = profiles[0].id;
    }
  }

  function setListComposeRowVisibility(hasRows) {
    el.listComposeEmpty.classList.toggle("hidden", hasRows);
  }

  function updateListComposeEmptyFromDom() {
    setListComposeRowVisibility(el.listComposeRows.children.length > 0);
  }

  function clearListComposeUI() {
    el.listComposeRows.innerHTML = "";
    if (el.listInputCsv) el.listInputCsv.value = "";
    setListComposeRowVisibility(false);
  }

  function renderListComposeFromCsv(header, dataRows) {
    const p = listComposeProfileId ? getProfileById(listComposeProfileId) : null;
    if (!p || dataRows.length === 0) return;
    const br = bracketPair(p);
    el.listComposeRows.innerHTML = "";
    dataRows.forEach((row, i) => {
      const values = csvDataRowToValues(header, row, p, null);
      const text = mergeTemplate(p.template, values, br.open, br.close);
      const card = document.createElement("div");
      card.className = "list-row card";
      const head = document.createElement("div");
      head.className = "list-row-head";
      const title = document.createElement("span");
      title.className = "list-row-title";
      title.textContent = "Row " + (i + 1);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary btn-small";
      btn.textContent = "Copy";
      btn.addEventListener("click", () => copyToClipboardWithFeedback(btn, text, "Copy"));
      const pre = document.createElement("pre");
      pre.className = "list-row-preview";
      pre.textContent = text;
      head.appendChild(title);
      head.appendChild(btn);
      card.appendChild(head);
      card.appendChild(pre);
      el.listComposeRows.appendChild(card);
    });
    setListComposeRowVisibility(true);
  }

  function appendManualListRow() {
    const p = listComposeProfileId ? getProfileById(listComposeProfileId) : null;
    if (!p) {
      alert("Choose a profile first.");
      return;
    }
    const br = bracketPair(p);
    const vars = extractVariables(p.template, br.open, br.close);
    const card = document.createElement("div");
    card.className = "list-row card list-row-manual";

    const head = document.createElement("div");
    head.className = "list-row-head";
    const title = document.createElement("span");
    title.className = "list-row-title";
    title.textContent = "Manual row";
    const actions = document.createElement("div");
    actions.className = "list-row-actions";

    const btnCopy = document.createElement("button");
    btnCopy.type = "button";
    btnCopy.className = "btn btn-primary btn-small";
    btnCopy.textContent = "Copy";

    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn btn-ghost btn-small";
    btnRemove.textContent = "Remove";

    const pre = document.createElement("pre");
    pre.className = "list-row-preview";

    /** @type {Record<string, HTMLInputElement>} */
    const fieldMap = {};

    function refreshPreview() {
      const cur = listComposeProfileId ? getProfileById(listComposeProfileId) : null;
      if (!cur) {
        pre.textContent = "";
        return;
      }
      const b = bracketPair(cur);
      const vnames = extractVariables(cur.template, b.open, b.close);
      const values = {};
      vnames.forEach((v) => {
        values[v] = fieldMap[v] ? fieldMap[v].value : "";
      });
      pre.textContent = mergeTemplate(cur.template, values, b.open, b.close);
    }

    btnCopy.addEventListener("click", () => copyToClipboardWithFeedback(btnCopy, pre.textContent, "Copy"));

    btnRemove.addEventListener("click", () => {
      card.remove();
      updateListComposeEmptyFromDom();
    });

    actions.appendChild(btnCopy);
    actions.appendChild(btnRemove);
    head.appendChild(title);
    head.appendChild(actions);
    card.appendChild(head);

    if (vars.length > 0) {
      const fieldsWrap = document.createElement("div");
      fieldsWrap.className = "list-row-manual-fields";
      vars.forEach((name) => {
        const label = document.createElement("label");
        label.className = "field";
        const span = document.createElement("span");
        span.textContent = name;
        const input = document.createElement("input");
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
    refreshPreview();
    el.listComposeRows.appendChild(card);
    setListComposeRowVisibility(true);
  }

  function refreshListCompose() {
    refreshListComposeSelect();
    if (profiles.length === 0) {
      clearListComposeUI();
      if (el.listComposeHint) {
        el.listComposeHint.textContent = "Create a profile first, then import a CSV here.";
      }
      return;
    }
    const p = listComposeProfileId ? getProfileById(listComposeProfileId) : null;
    if (p && el.listComposeHint) {
      const br = bracketPair(p);
      el.listComposeHint.textContent =
        "CSV: first row = variable names (not \"" +
        br.open +
        '" or "' +
        br.close +
        '"). Each data row is one list row. Use Add row for a single hand-filled row.';
    }
  }

  /** @type {Record<string, HTMLInputElement>} */
  let composeInputs = {};

  function getProfileById(id) {
    return profiles.find((p) => p.id === id) || null;
  }

  function readValuesFromInputs() {
    const out = {};
    Object.keys(composeInputs).forEach((k) => {
      out[k] = composeInputs[k].value;
    });
    return out;
  }

  function runMerge() {
    const p = composeProfileId ? getProfileById(composeProfileId) : null;
    if (!p) {
      el.composeOutput.value = "";
      el.btnCopy.disabled = true;
      el.multiRowNote.textContent = "";
      return;
    }
    const br = bracketPair(p);
    const vars = extractVariables(p.template, br.open, br.close);
    if (vars.length === 0) {
      el.composeOutput.value = p.template;
      el.btnCopy.disabled = false;
      el.multiRowNote.textContent = "";
      return;
    }
    const values = readValuesFromInputs();
    el.composeOutput.value = mergeTemplate(p.template, values, br.open, br.close);
    el.btnCopy.disabled = el.composeOutput.value.length === 0;
    el.multiRowNote.textContent = "";
  }

  function applyCsvRows(header, dataRows) {
    const p = composeProfileId ? getProfileById(composeProfileId) : null;
    if (!p || dataRows.length === 0) return;

    const br = bracketPair(p);
    const vars = extractVariables(p.template, br.open, br.close);
    const norm = (s) => s.trim().toLowerCase();
    const headerNorm = header.map(norm);

    if (dataRows.length === 1) {
      const row = dataRows[0];
      vars.forEach((v) => {
        const idx = headerNorm.indexOf(norm(v));
        if (idx >= 0 && composeInputs[v]) composeInputs[v].value = row[idx] != null ? String(row[idx]) : "";
      });
      runMerge();
      el.multiRowNote.textContent = "Filled fields from first CSV row.";
      return;
    }

    const blocks = dataRows.map((row) =>
      mergeTemplate(p.template, csvDataRowToValues(header, row, p, composeInputs), br.open, br.close)
    );
    el.composeOutput.value = blocks.join("\n\n---\n\n");
    el.btnCopy.disabled = el.composeOutput.value.length === 0;
    el.multiRowNote.textContent =
      "Multiple rows: " + dataRows.length + " merged blocks (separated by ---). Edit in the result if needed.";
  }

  el.inputCsv.addEventListener("change", () => {
    const file = el.inputCsv.files && el.inputCsv.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result));
      if (rows.length < 2) {
        alert("CSV needs a header row and at least one data row.");
        return;
      }
      const header = rows[0];
      const dataRows = rows.slice(1);
      applyCsvRows(header, dataRows);
    };
    reader.readAsText(file);
  });

  el.btnClearCsv.addEventListener("click", () => {
    el.inputCsv.value = "";
    runMerge();
    el.multiRowNote.textContent = "";
  });

  function updateComposeCsvHint(p) {
    if (!el.composeCsvHint) return;
    const br = bracketPair(p);
    el.composeCsvHint.textContent =
      "Fill each field, or use CSV below. Headers = variable names only (not \"" +
      br.open +
      '" or "' +
      br.close +
      '").';
  }

  function buildComposeFields() {
    el.composeFields.innerHTML = "";
    composeInputs = {};
    const p = composeProfileId ? getProfileById(composeProfileId) : null;
    if (!p) {
      el.composeHint.textContent = "Create a profile first.";
      el.composeOutput.value = "";
      el.btnCopy.disabled = true;
      return;
    }
    el.composeHint.textContent = "Fill variables or load a CSV whose headers match the variable names.";
    updateComposeCsvHint(p);
    const br = bracketPair(p);
    const vars = extractVariables(p.template, br.open, br.close);
    if (vars.length === 0) {
      const pNote = document.createElement("p");
      pNote.className = "hint small";
      pNote.textContent =
        "This template has no placeholders using " + br.open + "…" + br.close + ". The full template is copied as-is.";
      el.composeFields.appendChild(pNote);
      runMerge();
      return;
    }
    vars.forEach((name) => {
      const label = document.createElement("label");
      label.className = "field";
      const span = document.createElement("span");
      span.textContent = name;
      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.dataset.var = name;
      input.addEventListener("input", runMerge);
      label.appendChild(span);
      label.appendChild(input);
      el.composeFields.appendChild(label);
      composeInputs[name] = input;
    });
    runMerge();
  }

  function refreshCompose() {
    refreshComposeSelect();
    if (profiles.length === 0) {
      el.composeFields.innerHTML = "";
      el.composeOutput.value = "";
      el.btnCopy.disabled = true;
      el.composeHint.textContent = "No profiles yet.";
      if (el.composeCsvHint) {
        el.composeCsvHint.textContent =
          "Fill each field, or use CSV below. Column headers should match variable names.";
      }
      return;
    }
    if (!composeProfileId) composeProfileId = profiles[0].id;
    el.composeSelect.value = composeProfileId;
    buildComposeFields();
  }

  el.composeSelect.addEventListener("change", () => {
    composeProfileId = el.composeSelect.value || null;
    buildComposeFields();
  });

  el.btnCopy.addEventListener("click", () => {
    const text = el.composeOutput.value;
    if (!text) return;
    copyToClipboardWithFeedback(el.btnCopy, text, "Copy to clipboard");
  });

  el.listComposeSelect.addEventListener("change", () => {
    listComposeProfileId = el.listComposeSelect.value || null;
    clearListComposeUI();
    refreshListCompose();
  });

  el.listInputCsv.addEventListener("change", () => {
    const file = el.listInputCsv.files && el.listInputCsv.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result));
      if (rows.length < 2) {
        alert("CSV needs a header row and at least one data row.");
        el.listInputCsv.value = "";
        return;
      }
      const header = rows[0];
      const dataRows = rows.slice(1);
      const p = listComposeProfileId ? getProfileById(listComposeProfileId) : null;
      if (!p) {
        alert("Choose a profile first.");
        el.listInputCsv.value = "";
        return;
      }
      renderListComposeFromCsv(header, dataRows);
    };
    reader.readAsText(file);
  });

  el.listBtnClear.addEventListener("click", () => {
    clearListComposeUI();
  });

  if (el.btnListAddRow) {
    el.btnListAddRow.addEventListener("click", () => {
      appendManualListRow();
    });
  }

  async function seedFromProfilesFolder() {
    try {
      const res = await fetch("Profiles/Test_Profile.json");
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.template === "string") {
        const seeded = normalizeProfile({
          id: uid(),
          name: typeof data.name === "string" ? data.name : "Test Profile",
          template: data.template,
          variableBracketOpen: data.variableBracketOpen,
          variableBracketClose: data.variableBracketClose,
        });
        if (seeded) {
          profiles.push(seeded);
          saveProfiles(profiles);
        }
      }
    } catch {
      /* ignore when opened as file:// or missing file */
    }
  }

  async function init() {
    profiles = loadProfiles();
    const storageUnset = localStorage.getItem(STORAGE_KEY) === null;
    if (storageUnset) await seedFromProfilesFolder();
    renderProfileList();
    refreshComposeSelect();
    showEditor(false);
    el.profileEmpty.classList.remove("hidden");
  }

  init();
})();
