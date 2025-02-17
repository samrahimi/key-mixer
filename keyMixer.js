const fs = require('fs');
const path = require('path');
const envProxy = require('./envProxy')
const KeyMixer = (function() {
  class KeyMixer {
    constructor() {
      this.keystore = {};
      this.counters = {};
      if (!process.env.DISABLE_KEYMIXER_SYNC || process.env.DISABLE_KEYMIXER_SYNC == 0) {
        envProxy.syncWithEnvironment(this)
      }

      this.appId = process.env.KEYMIXER_APP_ID || 'default';
      this.logFile = process.env.KEYMIXER_LOGFILE || path.resolve(process.cwd(), ".keymixerlog.csv")
      this.loadKeystore();

    }

    //check if we have keys for the given service
    //i.e. if (yourKeystore.hasKeysFor("OPENAI_API_KEY"))
    //        createAIWaifu(yourKeystore.getKey("OPENAI_API_KEY"))
    //     else
    //        alert("Error: could not find OPENAI_API_KEY")
    hasKeysFor(service) {
      return (this.keystore[service] && 
        this.keystore[service].length > 0)
    }
    //check if a specific key is in the keystore for the given service
    //i.e. isInKeystore("OPENAI_API_KEY", "sk-12345")
    isInKeystore(service, keyValue) {
      return (this.hasKeysFor(service) && 
      this.keystore.service.includes(key))
    }
    loadKeystore(customPath = null) {
      if (customPath) {
        this.keystorePath = customPath;
      } else {
        this.keystorePath = process.env.KEYMIXER_KEYSTORE_PATH || path.resolve(process.cwd(), 'keystore.json');    
      }

      if (!fs.existsSync(this.keystorePath)) {
        this.logEvent({type: "init_keystore", appId: this.appId, message: `No keystore was found on disk, so an empty one has been created in memory`})
        this.keystore={};
      } else {
        try {
          const data = fs.readFileSync(path.resolve(this.keystorePath), 'utf8');
          this.keystore = JSON.parse(data);
          this.logEvent({type: "load_keystore", appId: this.appId, keystorePath: this.keystorePath})
        } catch (error) {
          this.logEvent({type: "error", appId: this.appId, message: "load_failed"})
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

      //Basic round-robin key rotation
      const keys = this.keystore[service];
      const currentIndex = this.counters[service] % keys.length;
      const chosenKey = keys[currentIndex];
      
      // Ensure counter stays within array bounds
      this.counters[service] = (this.counters[service] + 1) % keys.length;
      
      this.logEvent({type:"access", appId: this.appId, service: service, redactedKey: this.redactKey(chosenKey)})
      return chosenKey;
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
        // Don't reset counter when adding a key
        this.logEvent({type:"add_key", appId: this.appId, service: service, redactedKey: this.redactKey(key)})
      }
    }

    revokeKey(service, key) {
      if (this.keystore[service]) {
        const index = this.keystore[service].indexOf(key);
        if (index !== -1) {
          this.keystore[service].splice(index, 1);
          this.counters[service] = 0; // Reset counter for the service
          this.logEvent({type:"revoke_key", appId: this.appId, service: service, redactedKey: this.redactKey(key)})
        }
      }
    }

    saveToKeystore(customPath = null) {
      const savePath = customPath || this.keystorePath;
      try {
        fs.writeFileSync(path.resolve(savePath), JSON.stringify(this.keystore, null, 2));
        this.logEvent({type:"write_keystore", appId: this.appId, keystorePath: savePath})

      } catch (error) {
        this.logEvent({type: "error", appId: this.appId, message: "write_failed"})
        throw new Error(`Failed to save keystore: ${error.message}`);
      }
    }
    logEvent(event) {
      if (process.env.DISABLE_KEYMIXER_LOGGING == 1) {
        return
      }
      // Add timestamp to event
      const timestamp = new Date().toISOString();
      
      // Format event data as CSV
      const eventData = {
        timestamp,
        ...event
      };
      
      // Convert to CSV line
      const csvLine = Object.values(eventData)
        .map(value => `"${value}"`)
        .join(',') + '\n';
      
      try {
        // Append to log file
        fs.appendFileSync(this.logFile, csvLine);
      } catch (error) {
        console.error(`Failed to write to log file: ${error.message}`);
      }
    }

    redactKey(key) {
      if (!key) return '';
      if (key.length <= 7) return "*****"
      return key.slice(0, 6)+"..."

      // Handle different key formats
      const patterns = {
        // OpenAI style: sk-1234567890abcdef
        '^(sk-)[a-zA-Z0-9]{16,}$': (k) => {
          const prefix = k.slice(0, 3); // 'sk-'
          const rest = k.slice(3);      // '1234567890abcdef'
          return `${prefix}${rest.slice(0, 2)}${'*'.repeat(11)}${rest.slice(-3)}`; // Exactly 11 asterisks
        },
        // GitHub style: ghp_longtokenhere123
        '^(ghp_)[a-zA-Z0-9]{16,}$': (k) => {
          const prefix = k.slice(0, 4); // 'ghp_'
          const rest = k.slice(4);      // 'longtokenhere123'
          return `${prefix}${rest.slice(0, 2)}${'*'.repeat(9)}${rest.slice(-3)}`; // Exactly 9 asterisks
        },
        // Generic API key: any alphanumeric string
        '^[a-zA-Z0-9_-]{16,}$': (k) => {
          return `${k.slice(0, 4)}${'*'.repeat(9)}${k.slice(-3)}`; // Exactly 9 asterisks for consistency
        }
      };

      // Find matching pattern and apply redaction
      for (const [pattern, redactor] of Object.entries(patterns)) {
        if (new RegExp(pattern).test(key)) {
          return redactor(key);
        }
      }

      // Default redaction for shorter keys
      if (key.length > 8) {
        return `${key.slice(0, 3)}${'*'.repeat(key.length - 6)}${key.slice(-3)}`;
      }
      
      // For very short keys, just show length
      return '*'.repeat(key.length);
    }
  }

  return new KeyMixer();
})();

module.exports = KeyMixer;
