(function () {
  "use strict";
  var MM = window.MergeMaster;

  function uid() {
    return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function normalizeProfile(raw) {
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

  function loadProfiles() {
    try {
      var raw = localStorage.getItem(MM.STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .map(function (p) {
          return normalizeProfile(p);
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveProfiles(list) {
    localStorage.setItem(MM.STORAGE_KEY, JSON.stringify(list));
  }

  MM.uid = uid;
  MM.normalizeProfile = normalizeProfile;
  MM.loadProfiles = loadProfiles;
  MM.saveProfiles = saveProfiles;
})();
