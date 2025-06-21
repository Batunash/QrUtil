const { generateUniqueLink } = require('./src/linkGenerator');
const { generateQRCode } = require('./src/qrGenerator');
const Timer = require('./src/timer');

/**
 * Dynamic Link QR Generator for APIs
 */
class DynamicLinkQRGenerator {
  constructor(apiLink) {
    if (!apiLink) {
      throw new Error('API link is required');
    }
    
    this.apiLink = apiLink;
    this.currentDataURL = null;
    this.timer = new Timer();
  }
  
  /**
   * Generate QR code data URL
   */
  async generate() {
    const uniqueLink = generateUniqueLink(this.apiLink);
    const dataURL = await generateQRCode(uniqueLink);
    this.currentDataURL = dataURL;
    return dataURL;
  }
  
  /**
   * Start regeneration every 30 seconds
   */
  start() {
    this.timer.start(() => this.generate());
  }
  
  /**
   * Stop regeneration
   */
  stop() {
    this.timer.stop();
  }
  
  /**
   * Get current QR code data URL
   */
  getCurrent() {
    return this.currentDataURL;
  }
  
  /**
   * Clean up
   */
  destroy() {
    this.timer.stop();
    this.currentDataURL = null;
  }
}

// For one-time generation
DynamicLinkQRGenerator.generateOnce = async function(apiLink) {
  const uniqueLink = generateUniqueLink(apiLink);
  return await generateQRCode(uniqueLink);
};

module.exports = DynamicLinkQRGenerator;
