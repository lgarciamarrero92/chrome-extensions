// annotations.js

(function(namespace) {

  // Attach popup and currentHighlightedSpan to the namespace
  namespace.popup = null;
  namespace.currentHighlightedSpan = null;

  // Function to highlight the selected text and wrap it in <span> elements
  namespace.highlightSelectedText = function() {
    namespace.highlightedSpans.length = 0; // Reset the array of highlighted spans
    let selection = window.getSelection();
    if (selection.rangeCount === 0) {
      console.log("No ranges found in selection.");
      return;
    }

    let range = selection.getRangeAt(0);
    namespace.selectedText = namespace.normalizeText(selection.toString());

    if (namespace.selectedText.length === 0) {
      console.log("No text selected.");
      return;
    }

    // Check if the selection already includes annotated spans
    let containsAnnotated = false;
    const annotatedSpans = range.cloneContents().querySelectorAll('span[data-annotation-id]');
    if (annotatedSpans.length > 0) {
      containsAnnotated = true;
      console.log("Selection contains already annotated spans.");
    }

    if (containsAnnotated) {
      alert("Selected text already has annotations. Please select unannotated text to add a new annotation.");
      return;
    }

    // Get all text nodes within the range
    let textNodes = namespace.getTextNodesInRange(range);

    if (textNodes.length === 0) {
      console.log("No text nodes found in the selected range.");
      return;
    }

    textNodes.forEach(textNode => {
      // Calculate the overlap between textNode and range
      let nodeStart = 0;
      let nodeEnd = textNode.nodeValue.length;

      if (range.startContainer === textNode) {
        nodeStart = range.startOffset;
      }

      if (range.endContainer === textNode) {
        nodeEnd = range.endOffset;
      }

      let beforeText = textNode.nodeValue.substring(0, nodeStart);
      let selectedTextPart = textNode.nodeValue.substring(nodeStart, nodeEnd);
      let afterText = textNode.nodeValue.substring(nodeEnd);

      let parent = textNode.parentNode;

      // Insert before text if any
      if (beforeText.length > 0) {
        parent.insertBefore(document.createTextNode(beforeText), textNode);
      }

      // Create a span for the selected text
      let span = document.createElement("span");
      span.style.backgroundColor = "lightblue";
      span.style.cursor = "pointer"; // Change cursor to pointer
      span.textContent = selectedTextPart;
      span.classList.add(namespace.CLASS_ANNOTATION_SPAN);
      // Add a temporary class to distinguish unsaved highlights
      span.classList.add('temporary-highlight');

      // Add event listener for click to show popup
      span.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent the click from propagating to the document
        namespace.showPopup(event, span);
      });

      parent.insertBefore(span, textNode);

      namespace.highlightedSpans.push(span);

      // Insert after text if any
      if (afterText.length > 0) {
        parent.insertBefore(document.createTextNode(afterText), textNode);
      }

      // Remove the original text node
      parent.removeChild(textNode);
    });

    // Clear the selection
    selection.removeAllRanges();
  };

  // Helper function to get all text nodes within a range
  namespace.getTextNodesInRange = function(range) {
    const textNodes = [];
    let root = range.commonAncestorContainer;

    // If the commonAncestorContainer is a text node and intersects with the range, include it
    if (root.nodeType === Node.TEXT_NODE) {
      if (range.intersectsNode(root)) {
        textNodes.push(root);
      }
    } else {
      // If it's not a text node, use TreeWalker to find all text nodes within the range
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            if (range.intersectsNode(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        },
        false
      );

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        textNodes.push(currentNode);
      }
    }

    return textNodes;
  };

  // Function to edit the annotation
  namespace.editAnnotation = function(spanElement) {
    const newAnnotation = prompt("Edit your annotation:", spanElement.getAttribute("data-annotation"));
    if (newAnnotation) {
      const annotationId = spanElement.getAttribute('data-annotation-id');

      // Update all spans with the same annotation ID
      let spans = document.querySelectorAll(`span[data-annotation-id='${annotationId}']`);
      spans.forEach(span => {
        span.setAttribute('data-annotation', newAnnotation);
      });

      // Update the annotation in storage
      namespace.updateAnnotationInStorage(annotationId, newAnnotation);
    }
  };

  // Function to update the annotation in storage
  namespace.updateAnnotationInStorage = function(annotationId, newAnnotation) {
    let currentPage = window.location.href;

    chrome.storage.sync.get(currentPage, function (data) {
      let annotations = data[currentPage] || [];
      const annotationIndex = annotations.findIndex(a => a.id === annotationId);

      if (annotationIndex !== -1) {
        annotations[annotationIndex].annotation = newAnnotation;

        chrome.storage.sync.set({ [currentPage]: annotations }, function () {
          console.log('Annotation updated in storage.');
        });
      }
    });
  };

  // Function to delete a specific annotation
  namespace.deleteAnnotation = function(spanElement) {

    if (confirm("Are you sure you want to delete this annotation?")) {
      const annotationId = spanElement.getAttribute('data-annotation-id');

      // Remove all spans with this annotation ID
      let spans = document.querySelectorAll(`span[data-annotation-id='${annotationId}']`);
      spans.forEach(span => {
        span.replaceWith(span.textContent);
      });

      namespace.removeAnnotationFromStorage(annotationId);
      namespace.updateDeleteAllButton(); // Ensure calling via namespace
    }
  };

  // Save the highlighted text and annotation in chrome.storage.sync with exact matching
  namespace.saveAnnotation = function(annotationId, selectedText, annotation) {
    console.log("Saving annotation:", { annotationId, selectedText, annotation });

    let currentPage = window.location.href;

    let annotationData = {
      id: annotationId,
      text: selectedText,
      annotation: annotation,
      url: currentPage,
      timestamp: Date.now()
    };

    chrome.storage.sync.get(currentPage, function(data) {
      let annotations = data[currentPage] || [];
      annotations.push(annotationData);

      chrome.storage.sync.set({ [currentPage]: annotations }, function() {
        console.log('Annotation saved.');
        namespace.updateDeleteAllButton(); // Ensure calling via namespace
      });
    });
  };

  // Function to remove a specific annotation by its ID from chrome.storage.sync
  namespace.removeAnnotationFromStorage = function(annotationId) {
    let currentPage = window.location.href;

    chrome.storage.sync.get(currentPage, function (data) {
      let annotations = data[currentPage] || [];
      const filteredAnnotations = annotations.filter(a => a.id !== annotationId);

      chrome.storage.sync.set({ [currentPage]: filteredAnnotations }, function () {
        console.log('Annotation deleted from storage.');
        namespace.updateDeleteAllButton(); // Ensure calling via namespace
      });
    });
  };

  // Function to delete all annotations from the current page
  namespace.deleteAllAnnotations = function() {
    if (confirm("Are you sure you want to delete all annotations on this page?")) {
      let currentPage = window.location.href;

      // Clear all annotations from chrome.storage
      chrome.storage.sync.remove(currentPage, function () {
        console.log("All annotations deleted from storage for this page.");
        namespace.updateDeleteAllButton(); // Ensure calling via namespace
      });

      // Remove all highlighted <span> elements with annotations from the DOM
      let spans = document.querySelectorAll('span[data-annotation-id]');
      spans.forEach(span => {
        span.replaceWith(span.textContent);
      });
    }
  };

  // Function to highlight existing text on page load with exact matching
  namespace.highlightExistingText = function(textToHighlight, annotation, annotationId) {
    if (namespace.annotationsProcessed.has(annotationId)) {
      console.log(`Annotation with ID ${annotationId} already processed.`);
      return false; // Already processed
    }
  
    console.log("Attempting to highlight existing text:", textToHighlight);
  
    const normalizedTarget = namespace.normalizeText(textToHighlight);
    
    // Use XPath to search for text nodes matching the normalized target text
    const iterator = document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const nodeText = namespace.normalizeText(node.nodeValue);
          if (nodeText.includes(normalizedTarget)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      },
      false
    );
  
    let textNode;
    let found = false;
  
    while ((textNode = iterator.nextNode())) {
      const nodeText = textNode.nodeValue;
      const normalizedNodeText = namespace.normalizeText(nodeText);
  
      let startIndex = normalizedNodeText.indexOf(normalizedTarget);
  
      if (startIndex !== -1) {
        // Create a range to select the matched text
        const range = document.createRange();
        range.setStart(textNode, startIndex);
        range.setEnd(textNode, startIndex + normalizedTarget.length);
  
        let span = document.createElement("span");
        span.style.backgroundColor = "lightblue";
        span.style.cursor = "pointer";
        span.setAttribute('data-annotation-id', annotationId);
        span.setAttribute('data-annotation', annotation);
        span.classList.add(namespace.CLASS_ANNOTATION_SPAN);
  
        // Add event listener for click to show popup
        span.addEventListener('click', function(event) {
          event.stopPropagation();
          namespace.showPopup(event, span);
        });
  
        try {
          range.surroundContents(span);
          namespace.highlightedSpans.push(span);
          console.log("Annotation span created:", span);
          found = true;
          break; // Stop after finding the first match
        } catch (e) {
          console.error("Error highlighting text during page load:", e);
          return false; // Stop processing if an error occurs
        }
      }
    }
  
    if (!found) {
      console.log("Text to highlight not found:", textToHighlight);
      return false; // Text not found
    }
  
    namespace.annotationsProcessed.add(annotationId); // Mark as processed
    return true; // Text was successfully highlighted
  };

  // Function to load annotations on page load and highlight text
  namespace.loadAnnotations = function() {
    namespace.annotationsProcessed.clear(); // Reset before loading
    let currentPage = window.location.href;
    console.log("Loading annotations for:", currentPage);

    // Directly use chrome.storage.sync.get
    chrome.storage.sync.get(currentPage, function(data) {
      let annotations = data[currentPage] || [];

      if (annotations.length === 0) {
        console.log("No annotations found for this page.");
        namespace.updateDeleteAllButton();
        return;
      }

      // Highlight the saved annotations
      annotations.forEach(function(annotationData) {
        namespace.highlightExistingText(annotationData.text, annotationData.annotation, annotationData.id);
      });
      namespace.updateDeleteAllButton();
    });
  };

  // Function to flatten the text and traverse the DOM for better matching
  namespace.flattenTextWithOffsets = function(node, offset = 0) {
    let textFragments = [];
    let walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let textNode;
    let textLength = offset;

    // Traverse the DOM tree and build a flat text string
    while ((textNode = walker.nextNode())) {
      const nodeText = textNode.nodeValue.replace(/\s+/g, " "); // Normalize spaces
      textFragments.push({ text: nodeText, node: textNode, offset: textLength });
      textLength += nodeText.length;
    }

    return { text: textFragments.map(f => f.text).join(" "), fragments: textFragments };
  };

})(window.MyExtension);
