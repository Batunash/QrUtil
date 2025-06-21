const QRCode = require('qrcode');

/**
 * Generate QR code data URL from a link
 * @param {string} link - The link to encode
 * @returns {Promise<string>} QR code data URL
 */
async function generateQRCode(link) {
  const options = {
    type: 'image/png',
    width: 256,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  try {
    const dataURL = await QRCode.toDataURL(link, options);
    return dataURL;
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
}

module.exports = { generateQRCode };