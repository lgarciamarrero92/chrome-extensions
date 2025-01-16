// popup.js

document.addEventListener('DOMContentLoaded', function () {
  let currentTab;
  let pageKey;
  let annotationsList = document.getElementById('annotations-list');
  let searchInput = document.getElementById('search-input');
  let allAnnotations = [];

  // Get the current tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentTab = tabs[0];
    let currentPage = new URL(currentTab.url);
    pageKey = currentPage.origin + currentPage.pathname; // Normalized URL

    // Retrieve annotations for the current page
    chrome.storage.sync.get(pageKey, function (data) {
      allAnnotations = data[pageKey] || [];

      if (allAnnotations.length === 0) {
        annotationsList.innerHTML = '<p class="no-annotations">No annotations found for this page.</p>';
        return;
      }

      // Clear the annotations list
      annotationsList.innerHTML = '';

      // Render annotations
      renderAnnotations(allAnnotations);
    });
  });

  function renderAnnotations(annotations) {
    // Clear the annotations list
    annotationsList.innerHTML = '';
  
    annotations.forEach(function (annotationData) {
      let annotationDiv = document.createElement('div');
      annotationDiv.classList.add('annotation');
  
      let annotationText = document.createElement('div');
      annotationText.classList.add('annotation-text');
      annotationText.textContent = annotationData.text;
  
      let annotationNote = document.createElement('div');
      annotationNote.classList.add('annotation-note');
      annotationNote.textContent = annotationData.annotation;
  
      let timestampDiv = document.createElement('div');
      timestampDiv.classList.add('annotation-timestamp');
      let date = new Date(annotationData.timestamp);
      timestampDiv.textContent = date.toLocaleString();
  
      // Create buttons container
      let buttonsDiv = document.createElement('div');
      buttonsDiv.classList.add('annotation-buttons');
  
      // Create Edit button
      let editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.title = 'Edit Annotation';
      editButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent triggering parent click events
        editAnnotation(annotationData, annotationNote, timestampDiv);
      });
  
      // Create Delete button
      let deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.title = 'Delete Annotation';
      deleteButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent triggering parent click events
        deleteAnnotation(annotationData, annotationDiv);
      });
  
      buttonsDiv.appendChild(editButton);
      buttonsDiv.appendChild(deleteButton);
  
      // Append elements to annotationDiv in the desired order
      annotationDiv.appendChild(annotationText);
      annotationDiv.appendChild(annotationNote);
      annotationDiv.appendChild(timestampDiv);
      annotationDiv.appendChild(buttonsDiv); // Append buttons at the end
  
      // Add click event to highlight annotation on page
      annotationDiv.addEventListener('click', function () {
        chrome.tabs.sendMessage(currentTab.id, { action: 'highlightAnnotation', annotationId: annotationData.id });
      });
  
      annotationsList.appendChild(annotationDiv);
    });
  }

  // Function to edit an annotation
  function editAnnotation(annotationData, annotationNoteElement, timestampElement) {
    let newAnnotation = prompt('Edit your annotation:', annotationData.annotation);
    if (newAnnotation !== null) {
      annotationData.annotation = newAnnotation;
      annotationData.timestamp = Date.now(); // Update timestamp

      // Update storage
      chrome.storage.sync.get(pageKey, function (data) {
        let annotations = data[pageKey] || [];
        // Find the annotation by id and update it
        let index = annotations.findIndex((a) => a.id === annotationData.id);
        if (index !== -1) {
          annotations[index].annotation = newAnnotation;
          annotations[index].timestamp = annotationData.timestamp;
          chrome.storage.sync.set({ [pageKey]: annotations }, function () {
            // Update the annotation note element
            annotationNoteElement.textContent = newAnnotation;
            // Update the timestamp
            let date = new Date(annotationData.timestamp);
            timestampElement.textContent = date.toLocaleString();
          });
        }
      });
    }
  }

  // Function to delete an annotation
  function deleteAnnotation(annotationData, annotationDivElement) {
    if (confirm('Are you sure you want to delete this annotation?')) {
      chrome.storage.sync.get(pageKey, function (data) {
        let annotations = data[pageKey] || [];
        // Remove the annotation from the array
        annotations = annotations.filter((a) => a.id !== annotationData.id);
        // Save the updated array
        chrome.storage.sync.set({ [pageKey]: annotations }, function () {
          // Remove the annotation div element from the DOM
          annotationDivElement.remove();
          // Update the allAnnotations array
          allAnnotations = annotations;
          // If no annotations left, show message
          if (annotations.length === 0) {
            annotationsList.innerHTML = '<p class="no-annotations">No annotations found for this page.</p>';
          }
        });
      });
    }
  }

  // Search and filter annotations
  searchInput.addEventListener('input', function (event) {
    let query = event.target.value.toLowerCase();
    let filteredAnnotations = allAnnotations.filter(function (annotationData) {
      let textContent = (annotationData.text + ' ' + annotationData.annotation).toLowerCase();
      return textContent.includes(query);
    });
    renderAnnotations(filteredAnnotations);
    // If no annotations match the search, show message
    if (filteredAnnotations.length === 0) {
      annotationsList.innerHTML = '<p class="no-annotations">No matching annotations found.</p>';
    }
  });
});
