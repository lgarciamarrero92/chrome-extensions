document.addEventListener('DOMContentLoaded', () => {
  const bibtexOutput = document.getElementById('bibtex-output');
  const hiddenTextarea = document.getElementById('hidden-textarea');
  const copyButton = document.getElementById('copy-btn');
  const loadingSpinner = document.getElementById('loading');

  // Show the loading spinner while fetching data
  loadingSpinner.style.display = 'block'; // Show the loading spinner
  bibtexOutput.textContent = ''; // Clear any previous BibTeX
  copyButton.style.display = 'none'; // Hide the copy button initially

  // Send message to background script to get the DOI from the current page
  chrome.runtime.sendMessage({ action: 'extractDOI' }, (response) => {
    if (response && response.doi) {
      const doi = response.doi;
      fetchBibTex(doi).then((bibtex) => {
        // Remove underscores and format the BibTeX content with line breaks
        const formattedBibtex = formatBibtexContent(formatBibtexKey(bibtex));

        // Display the formatted BibTeX in the code block
        bibtexOutput.textContent = formattedBibtex.trim();
        hiddenTextarea.value = formattedBibtex.trim(); // Set BibTeX in hidden textarea for copying

        // Hide the loading spinner and show the copy button
        loadingSpinner.style.display = 'none';
        copyButton.style.display = 'block';
      });
    } else {
      bibtexOutput.textContent = 'DOI not found or error fetching BibTeX.';
      loadingSpinner.style.display = 'none'; // Hide the loading spinner
    }
  });

  // Copy functionality
  copyButton.addEventListener('click', () => {
    hiddenTextarea.style.display = 'block';
    hiddenTextarea.select();
    document.execCommand('copy');
    hiddenTextarea.style.display = 'none'; // Hide textarea after copying
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy Code';
    }, 2000); // Reset button text after 2 seconds
  });
});

// Function to fetch the BibTeX from the DOI
function fetchBibTex(doi) {
  const apiUrl = `https://api.crossref.org/works/${doi}/transform/application/x-bibtex`;

  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Error fetching BibTeX');
      }
      return response.text();
    })
    .catch(error => {
      console.error('Error fetching BibTeX:', error);
      return 'Error fetching BibTeX';
    });
}

// Function to remove underscores from the BibTeX key
function formatBibtexKey(bibtex) {
  const lines = bibtex.split('\n');
  let keyLine = lines[0];

  // Remove underscores from the key (first line of the BibTeX)
  keyLine = keyLine.replace(/_/g, '');

  // Replace the first line with the modified key and return the formatted BibTeX
  lines[0] = keyLine;
  return lines.join('\n');
}

// Function to format the BibTeX content with proper indentation and line breaks
function formatBibtexContent(bibtex) {
  // Remove any existing newlines to start fresh
  bibtex = bibtex.replace(/\n/g, '');

  // Add line breaks after each comma that is followed by a key
  bibtex = bibtex.replace(/,\s*(\w+\s*=)/g, ',\n$1');

  // Add a line break before the closing brace
  bibtex = bibtex.replace(/}\s*$/, '\n}');

  // Split the bibtex into lines
  let lines = bibtex.split('\n');

  // Trim whitespace from each line
  lines = lines.map(line => line.trim());

  // Indent lines that are not the first or last line
  for (let i = 1; i < lines.length - 1; i++) {
    lines[i] = '  ' + lines[i]; // Add two spaces instead of four
  }

  // Reassemble the lines
  return lines.join('\n');
}



















