

## User Guide

Installation: 
```sh
npm install @samrahimi/key-mixer
```



### Basic Usage

First, require the Key Mixer module in your project:

```javascript
const keyMixer = require('@samrahimi/key-mixer');
```

### Loading the Keystore

By default, Key Mixer will look for a `keystore.json` file in the current working directory. You can specify a custom path by setting the `KEYSTORE_PATH` environment variable:

```sh
export KEYSTORE_PATH=/path/to/your/keystore.json
```

### Getting a Key

To get a key for a specific service, use the `getKey` method. This method will return keys in a round-robin fashion:

```javascript
const apiKey = keyMixer.getKey('OPENAI_API_KEY');
```

### Adding a Key

To add a new key to a service, use the `addKey` method:

```javascript
keyMixer.addKey('OPENAI_API_KEY', 'new-api-key');
```

### Revoking a Key

To revoke a key from a service, use the `revokeKey` method:

```javascript
keyMixer.revokeKey('OPENAI_API_KEY', 'api-key-to-revoke');
```

### Saving the Keystore

To save the current state of the keystore to a file, use the `saveToKeystore` method. You can specify a custom path or use the default path:

```javascript
keyMixer.saveToKeystore(); // Saves to the default path
keyMixer.saveToKeystore('/path/to/custom/keystore.json'); // Saves to a custom path
```

### Refreshing the Keystore

To reload the keystore from the file, use the `refresh` method:

```javascript
keyMixer.refresh();
```

## Example

Here is a complete example of how to use Key Mixer in a project:

```javascript
const keyMixer = require('key-mixer');

// Get an API key for OpenAI
const apiKey = keyMixer.getKey('OPENAI_API_KEY');
console.log(`Using API key: ${apiKey}`);

// Add a new API key for OpenAI
keyMixer.addKey('OPENAI_API_KEY', 'new-openai-api-key');

// Revoke an API key for OpenAI
keyMixer.revokeKey('OPENAI_API_KEY', 'old-openai-api-key');

// Save the keystore to a custom path
keyMixer.saveToKeystore('/path/to/custom/keystore.json');

// Refresh the keystore from the file
keyMixer.refresh();
```

## Conclusion

Key Mixer is a simple yet powerful tool for managing multiple API keys for various services. It helps you balance the load between keys and makes it easy to switch from using environment variables to a more flexible keystore system. Enjoy using Key Mixer in your projects!
