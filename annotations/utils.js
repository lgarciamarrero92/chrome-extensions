// utils.js

(function(namespace) {
  
  // Function to normalize text by trimming whitespace and replacing multiple spaces with a single space
  namespace.normalizeText = function(text) {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  };

  // Function to generate a UUID
  namespace.generateUUID = function() {
    // Simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

})(window.MyExtension);
