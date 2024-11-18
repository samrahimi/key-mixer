const fs = require('fs');
const path = require('path');

const KeyMixer = (function() {
  class KeyMixer {
    constructor() {
      this.keystore = {};
      this.counters = {};
      this.loadKeystore();
    }

    loadKeystore(customPath = null) {
      if (customPath) {
        this.keystorePath = customPath;
      } else {
        this.keystorePath = process.env.KEYSTORE_PATH || path.resolve(process.cwd(), 'keystore.json');    
      }

      if (!fs.existsSync(this.keystorePath)) {
        console.warn(`Keystore not found: ${this.keystorePath}, using new keystore. You can add keys by calling addKey, or load an existing keystore by setting environment variable KEYSTORE_PATH to the path of the keystore file.`);
        this.keystore={};
      } else {
        try {
          const data = fs.readFileSync(path.resolve(this.keystorePath), 'utf8');
          this.keystore = JSON.parse(data);
          console.info(`Keystore loaded from: ${this.keystorePath}`);
        } catch (error) {
          throw new Error(`Failed to load keystore: ${error.message}`);
        }
      }
      this.resetCounters();
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
      process.env.DEBUG && console.log(`Getting keys for service: ${service}`);
      process.env.DEBUG && console.log(`${JSON.stringify(this.keystore[service], null, 2)}`);


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
        this.counters[service] = 0;
      }
      if (!this.keystore[service].includes(key)) {
        this.keystore[service].push(key);
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

  return new KeyMixer();
})();

module.exports = KeyMixer;
