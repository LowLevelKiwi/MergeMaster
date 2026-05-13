(function () {
  "use strict";
  var MM = window.MergeMaster;

  function getDomRefs() {
    return {
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
      editGlobalBracketOpen: document.getElementById("edit-global-bracket-open"),
      editGlobalBracketClose: document.getElementById("edit-global-bracket-close"),
      editTemplate: document.getElementById("edit-template"),
      hintProfileRegular: document.getElementById("hint-profile-regular"),
      hintProfileGlobal: document.getElementById("hint-profile-global"),
      hintProfileTemplateLabel: document.getElementById("hint-profile-template-label"),
      hintProfileDetected: document.getElementById("hint-profile-detected"),
      detectedInline: document.getElementById("detected-inline"),
      btnNew: document.getElementById("btn-new-profile"),
      btnSave: document.getElementById("btn-save-profile"),
      btnExport: document.getElementById("btn-export-profile"),
      btnDelete: document.getElementById("btn-delete-profile"),
      btnCancel: document.getElementById("btn-cancel-edit"),
      inputImport: document.getElementById("input-import-profile"),
      composeProfileHintLabel: document.getElementById("compose-profile-hint-label"),
      composeSelect: document.getElementById("compose-profile-select"),
      composeVariablesHeading: document.getElementById("compose-variables-heading"),
      composeFields: document.getElementById("compose-fields"),
      composeOutput: document.getElementById("compose-output"),
      multiRowNote: document.getElementById("multi-row-note"),
      inputCsv: document.getElementById("input-csv"),
      btnClearCsv: document.getElementById("btn-clear-csv"),
      btnCopy: document.getElementById("btn-copy"),
      listComposeSelect: document.getElementById("list-compose-profile-select"),
      listComposeProfileHeading: document.getElementById("list-compose-profile-heading"),
      listComposeGlobalsHeading: document.getElementById("list-compose-globals-heading"),
      listComposeCsvHeading: document.getElementById("list-compose-csv-heading"),
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
