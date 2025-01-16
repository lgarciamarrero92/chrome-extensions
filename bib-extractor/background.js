chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractDOI') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: extractDOIFromPage, // Function to extract the DOI from the page
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              sendResponse({ doi: results[0].result });
            } else {
              sendResponse({ doi: null });
            }
          }
        );
      });
      return true; // Required to keep the message channel open for async sendResponse
    }
  });
  
  // Function to extract the DOI from the current webpage
  function extractDOIFromPage() {
    const doiRegex = /10.\d{4,9}\/[-._;()/:A-Za-z0-9]+/;
    const bodyText = document.body.innerText;
    const doiMatch = bodyText.match(doiRegex);
    return doiMatch ? doiMatch[0] : null;
  }
  