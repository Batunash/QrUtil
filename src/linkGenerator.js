const { v4: uuidv4 } = require('uuid');

function generateUniqueLink(baseLink) {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const separator = baseLink.includes('?') ? '&' : '?';
  const uniqueLink = `${baseLink}${separator}ts=${timestamp}&uuid=${uuid}`;
  console.log(uniqueLink)
  return uniqueLink;
}
module.exports = { generateUniqueLink };