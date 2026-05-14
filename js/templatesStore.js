(function () {
  "use strict";
  var MM = window.MergeMaster;

  var LEGACY_STORAGE_KEY = "mergemaster_profiles";

  function uid() {
    return "t_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function migrateFromLegacyStorage() {
    try {
      if (localStorage.getItem(MM.STORAGE_KEY)) return;
      var legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(MM.STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (e) {
      /* ignore quota or privacy mode */
    }
  }

  function normalizeTemplateRecord(raw) {
    if (!raw || typeof raw.template !== "string") return null;
    if (!raw.id || typeof raw.id !== "string") return null;
    var b = MM.normalizeBrackets(raw.variableBracketOpen, raw.variableBracketClose);
    var gb = MM.normalizeBrackets(
      raw.globalVariableBracketOpen,
      raw.globalVariableBracketClose,
      MM.DEFAULT_GLOBAL_BRACKET_OPEN,
      MM.DEFAULT_GLOBAL_BRACKET_CLOSE
    );
    return {
      id: raw.id,
      name: typeof raw.name === "string" ? raw.name : "Untitled",
      template: raw.template,
      variableBracketOpen: b.open,
      variableBracketClose: b.close,
      globalVariableBracketOpen: gb.open,
      globalVariableBracketClose: gb.close,
    };
  }

  function loadTemplates() {
    migrateFromLegacyStorage();
    try {
      var raw = localStorage.getItem(MM.STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .map(function (p) {
          return normalizeTemplateRecord(p);
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveTemplates(list) {
    localStorage.setItem(MM.STORAGE_KEY, JSON.stringify(list));
  }

  MM.uid = uid;
  MM.normalizeTemplateRecord = normalizeTemplateRecord;
  MM.loadTemplates = loadTemplates;
  MM.saveTemplates = saveTemplates;
})();
