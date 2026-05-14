(function () {
  "use strict";
  var MM = window.MergeMaster;

  var el = MM.getDomRefs();

  var listComposeApi = MM.initListCompose(el);
  var composeApi = MM.initCompose(el, {
    refreshListComposeSelect: listComposeApi.refreshListComposeSelect,
  });
  var templatesApi = MM.initTemplatesUi(el, {
    refreshComposeSelect: composeApi.refreshComposeSelect,
  });

  function setTab(name) {
    el.tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    el.panelTemplates.classList.toggle("is-active", name === "templates");
    el.panelTemplates.hidden = name !== "templates";
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

  function seedFromTemplatesFolder() {
    return fetch("Templates/Test_Template.json")
      .then(function (res) {
        if (!res.ok) return;
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data.template === "string") {
          var seeded = MM.normalizeTemplateRecord({
            id: MM.uid(),
            name: typeof data.name === "string" ? data.name : "Test Template",
            template: data.template,
            variableBracketOpen: data.variableBracketOpen,
            variableBracketClose: data.variableBracketClose,
            globalVariableBracketOpen: data.globalVariableBracketOpen,
            globalVariableBracketClose: data.globalVariableBracketClose,
          });
          if (seeded) {
            MM.state.templates.push(seeded);
            MM.saveTemplates(MM.state.templates);
          }
        }
      })
      .catch(function () {
        /* ignore when opened as file:// or missing file */
      });
  }

  function init() {
    MM.state.templates = MM.loadTemplates();
    var storageUnset = localStorage.getItem(MM.STORAGE_KEY) === null;
    var afterLoad = function () {
      templatesApi.renderTemplateList();
      composeApi.refreshComposeSelect();
      templatesApi.closeEditor();
      el.templateEmpty.classList.remove("hidden");
    };
    if (storageUnset) {
      seedFromTemplatesFolder().then(afterLoad, afterLoad);
    } else {
      afterLoad();
    }
  }

  init();
})();
