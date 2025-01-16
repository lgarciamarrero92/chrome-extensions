// variables.js

(function(namespace) {

    namespace.mouseX = 0;
    namespace.mouseY = 0;
    namespace.selectedText = '';
    namespace.isSavingAnnotation = false;
    namespace.highlightedSpans = [];
    namespace.annotationsProcessed = new Set();
  
  })(window.MyExtension);
  