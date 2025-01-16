// events.js

(function(namespace) {

  // Ensure that the namespace exists
  if (!namespace) {
    console.error("Namespace 'MyExtension' is not defined.");
    return;
  }

  const { showAnnotationButton, normalizeText, hidePopup } = namespace;

  // Debugging statement to check if showAnnotationButton exists
  console.log("events.js loaded. showAnnotationButton:", showAnnotationButton);

  // Handle text selection and display the annotation button
  namespace.initializeSelectionListener = function() {
    document.addEventListener('mouseup', function (event) {
      const { isSavingAnnotation } = namespace;

      // If the event target is our own UI element, don't update selectedText
      if (event.target.closest('.my-extension-annotate-button') || event.target.closest('.annotation-popup')) {
        return;
      }

      // If we're currently saving an annotation, skip updating selectedText
      if (isSavingAnnotation) {
        namespace.isSavingAnnotation = false; // Reset the flag
        return;
      }

      setTimeout(() => {
        let selection = window.getSelection();
        namespace.selectedText = namespace.normalizeText(selection.toString());

        if (namespace.selectedText.length > 0) {
          // Get the bounding rectangle of the selection
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Calculate the position for the annotation button (upper right)
          const x = window.scrollX + rect.right;
          const y = window.scrollY + rect.top - 30; // Adjusted upwards by 30px for visibility

          // Store the position in the namespace
          namespace.mouseX = x;
          namespace.mouseY = y;

          // Show the annotation button near the selection
          if (typeof showAnnotationButton === 'function') {
            showAnnotationButton();
          } else {
            console.error("showAnnotationButton is not a function");
          }
        } else {
          // Remove the annotation button if no text is selected
          if (namespace.annotationButton) {
            namespace.annotationButton.remove();
            namespace.annotationButton = null;
          }
        }
      }, 100); // Slight delay to ensure text is still selected
    });

    // Hide the popup when clicking outside the highlighted text or popup
    document.addEventListener('click', function (event) {
      const { popup, currentHighlightedSpan } = namespace;
      if (popup && !popup.contains(event.target) && (!currentHighlightedSpan || !currentHighlightedSpan.contains(event.target))) {
        popup.remove();
        namespace.popup = null;
        namespace.currentHighlightedSpan = null;
      }
    });

    // Optional: Hide popup on ESC key press
    document.addEventListener('keydown', function(event) {
      if (event.key === "Escape") {
        const { popup } = namespace;
        if (popup) {
          popup.remove();
          namespace.popup = null;
          namespace.currentHighlightedSpan = null;
        }
      }
    });
  };

})(window.MyExtension);
