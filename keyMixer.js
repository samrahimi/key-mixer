const fs = require('fs');
const path = require('path');

class KeyMixer {
  constructor() {
    this.keystore = {};
    this.counters = {};
    this.keystorePath = process.env.KEYSTORE_PATH;
    this.loadKeystore();
  }

  loadKeystore() {
    if (!this.keystorePath) {
      throw new Error('KEYSTORE_PATH environment variable is not set');
    }

    try {
      const data = fs.readFileSync(path.resolve(this.keystorePath), 'utf8');
      this.keystore = JSON.parse(data);
      this.resetCounters();
    } catch (error) {
      throw new Error(`Failed to load keystore: ${error.message}`);
    }
  }

  resetCounters() {
    for (const service in this.keystore) {
      this.counters[service] = 0;
    }
  }

  getKey(service) {
    if (!this.keystore[service] || this.keystore[service].length === 0) {
      throw new Error(`No keys found for service: ${service}`);
    }

    const keys = this.keystore[service];
    const index = this.counters[service] % keys.length;
    this.counters[service] = (this.counters[service] + 1) % keys.length;

    return keys[index];
  }

  refresh() {
    this.loadKeystore();
    this.resetCounters();
  }

  addKey(service, key) {
    if (!this.keystore[service]) {
      this.keystore[service] = [];
    }
    if (!this.keystore[service].includes(key)) {
      this.keystore[service].push(key);
      this.counters[service] = 0; // Reset counter for the service
    }
  }

  revokeKey(service, key) {
    if (this.keystore[service]) {
      const index = this.keystore[service].indexOf(key);
      if (index !== -1) {
        this.keystore[service].splice(index, 1);
        this.counters[service] = 0; // Reset counter for the service
      }
    }
  }

  saveToKeystore(customPath = null) {
    const savePath = customPath || this.keystorePath;
    try {
      fs.writeFileSync(path.resolve(savePath), JSON.stringify(this.keystore, null, 2));
    } catch (error) {
      throw new Error(`Failed to save keystore: ${error.message}`);
    }
  }
}

module.exports = new KeyMixer();
