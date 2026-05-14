(function () {
  "use strict";
  var MM = window.MergeMaster;

  function initTemplatesUi(el, hooks) {
    var refreshComposeSelect = hooks.refreshComposeSelect;
    var state = MM.state;

    function renderTemplateList() {
      el.templateList.innerHTML = "";
      state.templates.forEach(function (p) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = p.name || "Untitled";
        btn.classList.toggle("is-selected", p.id === state.editingId);
        btn.addEventListener("click", function () {
          openEditor(p.id);
        });
        li.appendChild(btn);
        el.templateList.appendChild(li);
      });
    }

    function updateBracketDescriptorTitles() {
      var b = MM.normalizeBrackets(el.editBracketOpen.value, el.editBracketClose.value);
      var g = MM.normalizeBrackets(
        el.editGlobalBracketOpen.value,
        el.editGlobalBracketClose.value,
        MM.DEFAULT_GLOBAL_BRACKET_OPEN,
        MM.DEFAULT_GLOBAL_BRACKET_CLOSE
      );
      if (el.hintTemplateRegular) {
        el.hintTemplateRegular.title =
          "Regular variables wrap each name with your open and close brackets. Example: " +
          b.open +
          "variableName" +
          b.close +
          ". In JSON export: variableBracketOpen and variableBracketClose. Defaults: {{ and }}.";
      }
      if (el.hintTemplateGlobal) {
        el.hintTemplateGlobal.title =
          "Globals use a separate bracket pair; the same value is used for every line in List compose. Example: " +
          g.open +
          "globalName" +
          g.close +
          ". In JSON: globalVariableBracketOpen and globalVariableBracketClose. Defaults: [[ and ]].";
      }
    }

    function updateDetectedVars() {
      var rowVars = MM.extractVariables(el.editTemplate.value, el.editBracketOpen.value, el.editBracketClose.value);
      var gVars = MM.extractVariables(
        el.editTemplate.value,
        el.editGlobalBracketOpen.value,
        el.editGlobalBracketClose.value
      );
      var rLine = rowVars.length ? rowVars.join(", ") : "—";
      var gLine = gVars.length ? gVars.join(", ") : "—";
      if (el.detectedInline) {
        el.detectedInline.textContent = "Regular: " + rLine + " · Global: " + gLine;
      }
      if (el.hintTemplateDetected) {
        el.hintTemplateDetected.title =
          "Names found in the template. Regular names map to source columns or per-line fields; globals are filled once for the whole list.";
      }
      updateBracketDescriptorTitles();
    }

    function showEditor(show) {
      el.templateEditor.classList.toggle("hidden", !show);
      el.templateEmpty.classList.toggle("hidden", show);
    }

    function openEditor(id) {
      var p = state.templates.find(function (x) {
        return x.id === id;
      });
      if (!p) return;
      state.editingId = id;
      el.editName.value = p.name;
      var br = MM.bracketPair(p);
      el.editBracketOpen.value = br.open;
      el.editBracketClose.value = br.close;
      var gbr = MM.globalBracketPair(p);
      el.editGlobalBracketOpen.value = gbr.open;
      el.editGlobalBracketClose.value = gbr.close;
      el.editTemplate.value = p.template;
      updateDetectedVars();
      showEditor(true);
      renderTemplateList();
    }

    function openNewTemplate() {
      var p = MM.normalizeTemplateRecord({
        id: MM.uid(),
        name: "New template",
        template: "Hello {{name}},",
      });
      if (!p) return;
      state.templates.push(p);
      MM.saveTemplates(state.templates);
      openEditor(p.id);
    }

    function closeEditor() {
      state.editingId = null;
      showEditor(false);
      renderTemplateList();
    }

    el.btnNew.addEventListener("click", openNewTemplate);

    el.editTemplate.addEventListener("input", updateDetectedVars);
    el.editBracketOpen.addEventListener("input", updateDetectedVars);
    el.editBracketClose.addEventListener("input", updateDetectedVars);
    el.editGlobalBracketOpen.addEventListener("input", updateDetectedVars);
    el.editGlobalBracketClose.addEventListener("input", updateDetectedVars);

    el.btnSave.addEventListener("click", function () {
      if (!state.editingId) return;
      var p = state.templates.find(function (x) {
        return x.id === state.editingId;
      });
      if (!p) return;
      var o = el.editBracketOpen.value.trim().slice(0, MM.BRACKET_MAX_LEN);
      var c = el.editBracketClose.value.trim().slice(0, MM.BRACKET_MAX_LEN);
      if (!o || !c) {
        alert("Regular open and close brackets must each be at least one character.");
        return;
      }
      if (o === c) {
        alert("Regular open and close brackets must be different from each other.");
        return;
      }
      var go = el.editGlobalBracketOpen.value.trim().slice(0, MM.BRACKET_MAX_LEN);
      var gc = el.editGlobalBracketClose.value.trim().slice(0, MM.BRACKET_MAX_LEN);
      if (!go || !gc) {
        alert("Global open and close brackets must each be at least one character.");
        return;
      }
      if (go === gc) {
        alert("Global open and close brackets must be different from each other.");
        return;
      }
      if (o === go && c === gc) {
        alert("Global brackets must use a different open/close pair than regular brackets.");
        return;
      }
      p.name = el.editName.value.trim() || "Untitled";
      p.template = el.editTemplate.value;
      p.variableBracketOpen = o;
      p.variableBracketClose = c;
      p.globalVariableBracketOpen = go;
      p.globalVariableBracketClose = gc;
      MM.saveTemplates(state.templates);
      renderTemplateList();
      refreshComposeSelect();
    });

    el.btnDelete.addEventListener("click", function () {
      if (!state.editingId) return;
      if (!confirm("Delete this template?")) return;
      state.templates = state.templates.filter(function (x) {
        return x.id !== state.editingId;
      });
      MM.saveTemplates(state.templates);
      closeEditor();
      refreshComposeSelect();
    });

    el.btnCancel.addEventListener("click", closeEditor);

    el.btnExport.addEventListener("click", function () {
      if (!state.editingId) return;
      var p = state.templates.find(function (x) {
        return x.id === state.editingId;
      });
      if (!p) return;
      var blob = new Blob(
        [
          JSON.stringify(
            {
              name: p.name,
              template: p.template,
              variableBracketOpen: p.variableBracketOpen,
              variableBracketClose: p.variableBracketClose,
              globalVariableBracketOpen: p.globalVariableBracketOpen,
              globalVariableBracketClose: p.globalVariableBracketClose,
            },
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (p.name || "template").replace(/[^\w\-]+/g, "_") + ".json";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    el.inputImport.addEventListener("change", function () {
      var file = el.inputImport.files && el.inputImport.files[0];
      el.inputImport.value = "";
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          var name = typeof data.name === "string" ? data.name : "Imported";
          var template = typeof data.template === "string" ? data.template : "";
          var p = MM.normalizeTemplateRecord({
            id: MM.uid(),
            name: name,
            template: template,
            variableBracketOpen: data.variableBracketOpen,
            variableBracketClose: data.variableBracketClose,
            globalVariableBracketOpen: data.globalVariableBracketOpen,
            globalVariableBracketClose: data.globalVariableBracketClose,
          });
          if (!p) {
            alert("Invalid template data in JSON.");
            return;
          }
          state.templates.push(p);
          MM.saveTemplates(state.templates);
          renderTemplateList();
          refreshComposeSelect();
          openEditor(p.id);
        } catch (e) {
          alert(
            "Invalid JSON file. Expected name, template, and optional bracket fields (regular and global)."
          );
        }
      };
      reader.readAsText(file);
    });

    return {
      renderTemplateList: renderTemplateList,
      closeEditor: closeEditor,
      showEditor: showEditor,
      openEditor: openEditor,
    };
  }

  MM.initTemplatesUi = initTemplatesUi;
})();
