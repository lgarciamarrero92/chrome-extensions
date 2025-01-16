// ui.js

(function(namespace) {

  // Ensure that the namespace exists
  if (!namespace) {
    console.error("Namespace 'MyExtension' is not defined.");
    return;
  }

  // Initialize the annotation button variable
  namespace.annotationButton = null;

  // Function to create a small button near the selection
  // Function to create a small button near the selection
  namespace.showAnnotationButton = function() {
    console.log("showAnnotationButton called"); // Debugging statement

    const { UI_Z_INDEX } = namespace;

    // Remove any existing annotation button
    if (namespace.annotationButton) {
      namespace.annotationButton.remove();
      namespace.annotationButton = null;
    }

    // Create the annotation button
    let annotationButton = document.createElement("button");
    namespace.annotationButton = annotationButton; // Attach to namespace

    // Set innerHTML to SVG icon (pencil) with fill="currentColor"
    annotationButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.146.146a.5.5 0 011.708 0l1.292 1.293a.5.5 0 010 .708l-1.292 1.293-1.707-1.708L12.146.146zM11.5 1.793L1.854 11.439a.5.5 0 00-.128.21l-.884 3.541a.25.25 0 00.316.316l3.54-.884a.5.5 0 00.211-.128L14.207 4.5 11.5 1.793z"/>
      </svg>
    `;

    // Apply inline styles to the button
    Object.assign(annotationButton.style, {
      position: "absolute",
      zIndex: UI_Z_INDEX,
      width: "32px",
      height: "32px",
      backgroundColor: "#007bff",
      borderRadius: "50%",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "white",
      padding: "0",
    });

    // Append the button to the body
    document.body.appendChild(annotationButton);

    // Position the button based on the selection's bounding rectangle
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Adjust for scroll position
      annotationButton.style.top = `${window.scrollY + rect.top - 40}px`; // Adjusted position above the selection
      annotationButton.style.left = `${window.scrollX + rect.right}px`; // To the right of the selection
    }

    // Add a click event listener to the annotation button
    annotationButton.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent click from bubbling up

      console.log("Annotation button clicked");

      // Highlight the selected text
      namespace.highlightSelectedText();

      // Show the annotation input box
      namespace.showAnnotationInput(namespace.mouseX, namespace.mouseY);

      // Remove the annotation button after clicking
      if (namespace.annotationButton) {
        namespace.annotationButton.remove();
        namespace.annotationButton = null;
      }
    });
  };

  // Function to show the annotation input box
  namespace.showAnnotationInput = function(x, y) {
    const {
      UI_Z_INDEX,
      CLASS_ANNOTATION_POPUP,
      CLASS_ANNOTATION_INPUT,
      CLASS_SAVE_BUTTON,
      generateUUID,
      isSavingAnnotation,
      highlightedSpans,
      selectedText,
      saveAnnotation,
      removeTemporaryHighlights
    } = namespace;

    // Flag to check if annotation was saved
    let isAnnotationSaved = false;

    // Remove the button after click
    if (namespace.annotationButton) {
      namespace.annotationButton.remove();
      namespace.annotationButton = null;
    }

    // Create the annotation input box
    let annotationDiv = document.createElement("div");
    annotationDiv.classList.add(CLASS_ANNOTATION_POPUP);
    annotationDiv.style.position = "absolute";
    annotationDiv.style.top = `${y + 10}px`; // Slight offset for better visibility
    annotationDiv.style.left = `${x}px`;
    annotationDiv.style.zIndex = UI_Z_INDEX;
    annotationDiv.style.padding = "10px";
    annotationDiv.style.backgroundColor = "white";
    annotationDiv.style.border = "1px solid #ccc";
    annotationDiv.style.borderRadius = "3px";
    annotationDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
    annotationDiv.style.width = "250px";

    // Add a text input for the annotation
    let annotationInput = document.createElement("textarea");
    annotationInput.placeholder = "Add your annotation...";
    annotationInput.style.width = "100%";
    annotationInput.style.height = "80px";
    annotationInput.style.marginBottom = "10px";
    annotationInput.classList.add(CLASS_ANNOTATION_INPUT);
    annotationDiv.appendChild(annotationInput);

    // Add a button to confirm the annotation
    let saveButton = document.createElement("button");
    saveButton.innerText = "Save Annotation";
    saveButton.style.width = "100%";
    saveButton.style.backgroundColor = "#007bff";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.padding = "8px";
    saveButton.style.cursor = "pointer";
    saveButton.classList.add(CLASS_SAVE_BUTTON);
    annotationDiv.appendChild(saveButton);

    // Append the annotation input and button to the body
    document.body.appendChild(annotationDiv);

    // Handle saving the annotation
    saveButton.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log("Save annotation button clicked");

      let annotation = annotationInput.value.trim();
      if (annotation && highlightedSpans.length > 0) {
        namespace.isSavingAnnotation = true;
        const annotationId = generateUUID();

        highlightedSpans.forEach(span => {
          span.setAttribute('data-annotation-id', annotationId);
          span.setAttribute('data-annotation', annotation);
          // Remove temporary class since it's now a saved annotation
          span.classList.remove('temporary-highlight');
        });

        // Save the annotation using the original selected text
        namespace.saveAnnotation(annotationId, selectedText, annotation);
        annotationDiv.remove();
        namespace.isSavingAnnotation = false;
        isAnnotationSaved = true; // Set the flag to true since we saved
      } else {
        alert("Please enter an annotation.");
        namespace.isSavingAnnotation = false;
      }
    });

    // Prevent clicks inside the annotation input box from propagating
    annotationDiv.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent the click from triggering the document's click listener
    });

    // Close the annotation input if clicked outside
    document.addEventListener('click', function handleClickOutside(event) {
      if (!annotationDiv.contains(event.target)) {
        annotationDiv.remove();
        document.removeEventListener('click', handleClickOutside);

        // If the annotation was not saved, remove the temporary highlights
        if (!isAnnotationSaved) {
          namespace.removeTemporaryHighlights();
        }
      }
    });
  };

  // Function to remove temporary highlights
  namespace.removeTemporaryHighlights = function() {
    const { highlightedSpans } = namespace;
    highlightedSpans.forEach(span => {
      if (span.classList.contains('temporary-highlight')) {
        span.replaceWith(span.textContent);
      }
    });
    highlightedSpans.length = 0; // Clear the array
  };

  // Function to show the popup with annotation and buttons when clicking on highlighted text
  namespace.showPopup = function(event, spanElement) {
    const {
      UI_Z_INDEX,
      CLASS_ANNOTATION_POPUP,
      CLASS_EDIT_BUTTON,
      CLASS_DELETE_BUTTON,
      editAnnotation,
      deleteAnnotation
    } = namespace;

    // Close the previous popup if there is one
    if (namespace.popup) {
      namespace.popup.remove();
      namespace.popup = null;
    }

    let annotation = spanElement.getAttribute('data-annotation');
    namespace.currentHighlightedSpan = spanElement;

    // Create the popup element
    namespace.popup = document.createElement("div");
    namespace.popup.className = CLASS_ANNOTATION_POPUP;
    namespace.popup.innerHTML = `<div>${annotation}</div>`;
    namespace.popup.style.position = "absolute";
    namespace.popup.style.backgroundColor = "#fff";
    namespace.popup.style.border = "1px solid #ccc";
    namespace.popup.style.padding = "10px";
    namespace.popup.style.borderRadius = "3px";
    namespace.popup.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
    namespace.popup.style.zIndex = UI_Z_INDEX;

    // Position the popup near the text
    namespace.popup.style.left = `${event.pageX + 10}px`;
    namespace.popup.style.top = `${event.pageY + 10}px`;

    // Create Edit button
    let editButton = document.createElement("button");
    editButton.innerText = "Edit";
    editButton.style.marginTop = "10px";
    editButton.style.marginRight = "10px";
    editButton.style.padding = "5px";
    editButton.style.cursor = "pointer";
    editButton.classList.add(CLASS_EDIT_BUTTON);
    namespace.popup.appendChild(editButton);

    // Create Delete button
    let deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.style.marginTop = "10px";
    deleteButton.style.padding = "5px";
    deleteButton.style.cursor = "pointer";
    deleteButton.classList.add(CLASS_DELETE_BUTTON);
    namespace.popup.appendChild(deleteButton);

    // Append the popup to the body
    document.body.appendChild(namespace.popup);

    // Add event listeners to the popup to prevent it from closing when interacting with it
    namespace.popup.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent the click from propagating to the document's click listener
    });

    // Edit button functionality
    editButton.addEventListener("click", function(e) {
      e.stopPropagation();
      namespace.editAnnotation(spanElement); // Call via namespace
      namespace.popup.remove();
      namespace.popup = null;
    });

    // Delete button functionality
    deleteButton.addEventListener("click", function(e) {
      e.stopPropagation();
      namespace.deleteAnnotation(spanElement); // Call via namespace
      namespace.popup.remove();
      namespace.popup = null;
    });
  };

  // Function to hide the popup
  namespace.hidePopup = function() {
    if (namespace.popup) {
      namespace.popup.remove();
      namespace.popup = null;
    }
  };

  // Function to show or hide the "Delete All" button depending on the presence of annotations
  namespace.updateDeleteAllButton = function() {
    const { deleteAllButton } = namespace;
    let currentPage = window.location.href;

    chrome.storage.sync.get(currentPage, function (data) {
      let annotations = data[currentPage] || [];

      if (annotations.length > 0) {
        deleteAllButton.style.display = 'block'; // Show the button if annotations exist
      } else {
        deleteAllButton.style.display = 'none'; // Hide the button if no annotations exist
      }
    });
  };

  // Initialize the delete all annotations button
  namespace.initializeDeleteAllButton = function() {
    const { CLASS_DELETE_ALL_BUTTON, UI_Z_INDEX } = namespace;

    // Create the Delete All button if it doesn't exist
    if (!namespace.deleteAllButton) {
      let deleteAllButton = document.createElement("button");
      deleteAllButton.innerText = "Delete All Annotations";
      deleteAllButton.classList.add(CLASS_DELETE_ALL_BUTTON);
      deleteAllButton.style.position = "fixed";
      deleteAllButton.style.bottom = "10px";
      deleteAllButton.style.right = "10px";
      deleteAllButton.style.padding = "10px";
      deleteAllButton.style.backgroundColor = "#dc3545";
      deleteAllButton.style.color = "white";
      deleteAllButton.style.border = "none";
      deleteAllButton.style.borderRadius = "3px";
      deleteAllButton.style.cursor = "pointer";
      deleteAllButton.style.zIndex = UI_Z_INDEX;
      deleteAllButton.style.display = 'none'; // Initially hidden

      // Append the button to the body
      document.body.appendChild(deleteAllButton);

      // Add functionality to delete all annotations when clicked
      deleteAllButton.addEventListener("click", function(e) {
        e.stopPropagation(); // Prevent the click from triggering the document's click listener
        namespace.deleteAllAnnotations();
      });

      // Attach the button to the namespace
      namespace.deleteAllButton = deleteAllButton;
    }
  };

})(window.MyExtension);
