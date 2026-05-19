(function () {
  "use strict";
  var MM = (window.MergeMaster = window.MergeMaster || {});
  MM.STORAGE_KEY = "mergemaster_templates";
  MM.DEFAULT_BRACKET_OPEN = "{{";
  MM.DEFAULT_BRACKET_CLOSE = "}}";
  MM.DEFAULT_GLOBAL_BRACKET_OPEN = "[[";
  MM.DEFAULT_GLOBAL_BRACKET_CLOSE = "]]";
  MM.BRACKET_MAX_LEN = 32;
  MM.VARIABLE_NAME_HELP =
    "Variable names are case-insensitive (name, Name, and NAME are the same). Labels are shown with a capital first letter (Name). Source column headers match the same way.";
})();
