class Timer {
  constructor() {
    this.timer = null;
  }
  
  start(callback) {
    this.stop();
    
    // Execute immediately
    callback();
    
    // Then every 30 seconds
    this.timer = setInterval(callback, 30000);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = Timer;
