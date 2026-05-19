(function () {
  "use strict";
  var MM = window.MergeMaster;

  function getDomRefs() {
    return {
      tabs: document.querySelectorAll(".tab"),
      panelTemplates: document.getElementById("panel-templates"),
      panelCompose: document.getElementById("panel-compose"),
      panelListCompose: document.getElementById("panel-list-compose"),
      panelHelp: document.getElementById("panel-help"),
      templateList: document.getElementById("template-list"),
      templateEditor: document.getElementById("template-editor"),
      templateEmpty: document.getElementById("template-empty"),
      editName: document.getElementById("edit-name"),
      editBracketOpen: document.getElementById("edit-bracket-open"),
      editBracketClose: document.getElementById("edit-bracket-close"),
      editGlobalBracketOpen: document.getElementById("edit-global-bracket-open"),
      editGlobalBracketClose: document.getElementById("edit-global-bracket-close"),
      editTemplate: document.getElementById("edit-template"),
      hintTemplateRegular: document.getElementById("hint-template-regular"),
      hintTemplateGlobal: document.getElementById("hint-template-global"),
      hintTemplateBodyLabel: document.getElementById("hint-template-body-label"),
      hintTemplateDetected: document.getElementById("hint-template-detected"),
      detectedInline: document.getElementById("detected-inline"),
      btnNew: document.getElementById("btn-new-template"),
      btnSave: document.getElementById("btn-save-template"),
      btnExport: document.getElementById("btn-export-template"),
      btnDelete: document.getElementById("btn-delete-template"),
      btnCancel: document.getElementById("btn-cancel-edit"),
      inputImport: document.getElementById("input-import-template"),
      composeTemplateHintLabel: document.getElementById("compose-template-hint-label"),
      composeSelect: document.getElementById("compose-template-select"),
      composeVariablesHeading: document.getElementById("compose-variables-heading"),
      composeFields: document.getElementById("compose-fields"),
      composeOutput: document.getElementById("compose-output"),
      multiRowNote: document.getElementById("multi-row-note"),
      inputCsv: document.getElementById("input-csv"),
      btnClearCsv: document.getElementById("btn-clear-csv"),
      btnCopy: document.getElementById("btn-copy"),
      listComposeSelect: document.getElementById("list-compose-template-select"),
      listComposeTemplateHeading: document.getElementById("list-compose-template-heading"),
      listComposeGlobalsHeading: document.getElementById("list-compose-globals-heading"),
      listComposeSourceHeading: document.getElementById("list-compose-source-heading"),
      listComposeGlobalFields: document.getElementById("list-compose-global-fields"),
      listInputCsv: document.getElementById("list-input-csv"),
      listBtnClear: document.getElementById("list-btn-clear"),
      listComposeEmpty: document.getElementById("list-compose-empty"),
      listComposeRows: document.getElementById("list-compose-rows"),
      btnListAddRow: document.getElementById("btn-list-add-row"),
    };
  }

  MM.getDomRefs = getDomRefs;
})();
