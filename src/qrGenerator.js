const QRCode = require('qrcode');

async function generateQRCode(link, options={}) {
  try {
    const dataURL = await QRCode.toDataURL(link);
    console.log(dataURL)
    return dataURL;
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
}
module.exports = { generateQRCode };