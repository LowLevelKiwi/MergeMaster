(function () {
  "use strict";
  var MM = window.MergeMaster;

  function copyToClipboardWithFeedback(button, text, restoreLabel) {
    var restore = restoreLabel != null ? restoreLabel : button.textContent;
    return Promise.resolve()
      .then(function () {
        return navigator.clipboard.writeText(text);
      })
      .then(function () {
        button.textContent = "Copied!";
        setTimeout(function () {
          button.textContent = restore;
        }, 1500);
      })
      .catch(function () {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          button.textContent = "Copied!";
          setTimeout(function () {
            button.textContent = restore;
          }, 1500);
        } catch (e) {
          button.textContent = "Copy failed";
          setTimeout(function () {
            button.textContent = restore;
          }, 2000);
        }
      });
  }

  MM.copyToClipboardWithFeedback = copyToClipboardWithFeedback;
})();
