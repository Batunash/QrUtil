const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique API link with timestamp and UUID
 * @param {string} apiLink - The API endpoint URL
 * @returns {string} The unique link with timestamp and UUID
 */
function generateUniqueLink(apiLink) {
  if (!apiLink) {
    throw new Error('API link is required');
  }
  
  const url = new URL(apiLink);
  const params = new URLSearchParams(url.search);
  
  // Always add timestamp and UUID
  params.set('timestamp', Date.now().toString());
  params.set('uuid', uuidv4());
  
  url.search = params.toString();
  return url.toString();
}

module.exports = { generateUniqueLink };