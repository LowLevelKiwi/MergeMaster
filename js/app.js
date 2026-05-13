(function () {
  "use strict";
  var MM = window.MergeMaster;

  var el = MM.getDomRefs();

  var listComposeApi = MM.initListCompose(el);
  var composeApi = MM.initCompose(el, {
    refreshListComposeSelect: listComposeApi.refreshListComposeSelect,
  });
  var profilesApi = MM.initProfilesUi(el, {
    refreshComposeSelect: composeApi.refreshComposeSelect,
  });

  function setTab(name) {
    el.tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    el.panelProfiles.classList.toggle("is-active", name === "profiles");
    el.panelProfiles.hidden = name !== "profiles";
    el.panelCompose.classList.toggle("is-active", name === "compose");
    el.panelCompose.hidden = name !== "compose";
    el.panelListCompose.classList.toggle("is-active", name === "list-compose");
    el.panelListCompose.hidden = name !== "list-compose";
    if (name === "compose") composeApi.refreshCompose();
    if (name === "list-compose") listComposeApi.refreshListCompose();
  }

  el.tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      setTab(t.dataset.tab);
    });
  });

  function seedFromProfilesFolder() {
    return fetch("Profiles/Test_Profile.json")
      .then(function (res) {
        if (!res.ok) return;
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data.template === "string") {
          var seeded = MM.normalizeProfile({
            id: MM.uid(),
            name: typeof data.name === "string" ? data.name : "Test Profile",
            template: data.template,
            variableBracketOpen: data.variableBracketOpen,
            variableBracketClose: data.variableBracketClose,
            globalVariableBracketOpen: data.globalVariableBracketOpen,
            globalVariableBracketClose: data.globalVariableBracketClose,
          });
          if (seeded) {
            MM.state.profiles.push(seeded);
            MM.saveProfiles(MM.state.profiles);
          }
        }
      })
      .catch(function () {
        /* ignore when opened as file:// or missing file */
      });
  }

  function init() {
    MM.state.profiles = MM.loadProfiles();
    var storageUnset = localStorage.getItem(MM.STORAGE_KEY) === null;
    var afterLoad = function () {
      profilesApi.renderProfileList();
      composeApi.refreshComposeSelect();
      profilesApi.closeEditor();
      el.profileEmpty.classList.remove("hidden");
    };
    if (storageUnset) {
      seedFromProfilesFolder().then(afterLoad, afterLoad);
    } else {
      afterLoad();
    }
  }

  init();
})();
