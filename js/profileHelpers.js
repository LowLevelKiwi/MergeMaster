(function () {
  "use strict";
  var MM = window.MergeMaster;

  function getProfileById(id) {
    return MM.state.profiles.find(function (p) {
      return p.id === id;
    }) || null;
  }

  MM.getProfileById = getProfileById;
})();
