(function () {
  "use strict";
  var MM = window.MergeMaster;

  function getTemplateById(id) {
    return MM.state.templates.find(function (p) {
      return p.id === id;
    });
  }

  MM.getTemplateById = getTemplateById;
})();
