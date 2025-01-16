// main.js

(function(namespace) {
  // Ensure that the namespace exists
  if (!namespace) {
    console.error("Namespace 'MyExtension' is not defined.");
    return;
  }

  function initialize() {
    namespace.initializeSelectionListener();
    namespace.initializeDeleteAllButton();
    namespace.loadAnnotations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // The document is already ready
    initialize();
  }

})(window.MyExtension);
