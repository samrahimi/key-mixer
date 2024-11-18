# key-mixer getting started guide

## what is key-mixer?
A simple key manager and keystore that supports multiple keys per service, load balancing between keys to allow for consolidation of credit balances and free tier quotas. While there is no advanced security, its more secure than how most ppl use .env, and a heck of a lot more useful.

Key Mixer lets developers and non-profits scale up while using free or inexpensive subscriptions to the APIs they rely on. Just like how end users will often bypass rate limits on things like ChatGPT by creating multiple free accounts using multiple email addresses, now developers can do the exact same thing when building with APIs such as Gemini and Cohere - both of which are offered totally free, with all features enabled, but with heavy rate limiting for free accounts.

It goes without saying that service providers don't particularly like architectures where free tier resources are pooled in order to circumvent their rate limits, and we therefore advise you to use common sense - don't try and buy 1000 gmail accounts on fiverr and then create 1000 gemini API keys for your keystore... because you will quickly get your IP banned from gemini services altogether! 

But if you're a developer who's making 80 requests per day to Cohere, and 200 per day to Gemini, then you are perfectly fine setting up a keystore with 3 Cohere API keys, and 5 Gemini API keys, each key linked to a different free account with the provider. We advise you to be careful not to store anything you care about on the servers of a vendor which you're mixing keys from, because you always run a risk of having all of your accounts with that vendor getting shut down and deleted without warning. It almost certainly won't happen tho...

## how it works

Key Mixer is centered around the concept of a *keystore*.

A keystore is just a JSON object that improves on traditional environment variables by allowing each "service" (which is identified by a unique string, for instance, OPENAI_API_KEY) to have an unlimited number of "keys" (i.e. 'sk-123-...') that grant access to the service's resources. 

Here is an example of a simple keystore, which contains 2 OpenAI API keys, and 1 anthropic API key:

```json
{
    "OPENAI_API_KEY": ["sk-1234567890abcdef1234567890abcdef", "sk-hamster-dog-12345667"],
    "ANTHROPIC_API_KEY": ["sk-or-v1-1234567890abcdef1234567890abcdef"]
}
```

Use this example to get started: while you can name your services anything you like, we suggest keeping the names the same as the environment variables you're migrating away from - that way you can very easily get started by opening up your .env file, and copy pasting into your keystore.json file, which should be stored in your project root just like .env 

If you want multiple projects to share a keystore, or you want to call the file something else for security reasons, you can still use Key Mixer - set the KEYSTORE_PATH environment variable to the location of your keystore file: `set KEYSTORE_PATH=/path/to/my/keystore` 

*Note that it is not necessary to have a keystore file at all. key-mixer will just default to an empty keystore, which you can then add keys to programatically

## usage
### Installation
To install Key Mixer, use npm:
`npm install key-mixer`


### Basic Usage
First, require the Key Mixer module in your project:
`const keyMixer = require('key-mixer')`;

samrahimi: Please create a basic test script for the core functionality in this library and save it in tests folder

GitHub Copilot: ### test/keyMixer.test.js

Create a basic test script to test the core functionality of the KeyMixer library.

```javascript


const assert = require('assert');
const fs = require('fs');
const path = require('path');
const KeyMixer = require('../keyMixer');

const testKeystorePath = path.resolve(__dirname, 'testKeystore.json');
const testKeystore = {
  "TEST_SERVICE": ["test-key-1", "test-key-2"]
};

// Write a test keystore file
fs.writeFileSync(testKeystorePath, JSON.stringify(testKeystore, null, 2));

// Set the environment variable to use the test keystore
process.env.KEYSTORE_PATH = testKeystorePath;

// Reload the KeyMixer to use the test keystore
KeyMixer.refresh();

// Test getKey method
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'First key should be "test-key-1"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-2', 'Second key should be "test-key-2"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'Third key should be "test-key-1" again');

// Test addKey method
KeyMixer.addKey('TEST_SERVICE', 'test-key-3');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-2', 'Next key should be "test-key-2"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-3', 'Next key should be "test-key-3"');

// Test revokeKey method
KeyMixer.revokeKey('TEST_SERVICE', 'test-key-2');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'Next key should be "test-key-1"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-3', 'Next key should be "test-key-3"');

// Clean up test keystore file
fs.unlinkSync(testKeystorePath);

console.log('All tests passed!');
```

This script tests the core functionality of the KeyMixer library, including loading the keystore, getting keys in a round-robin fashion, adding keys, and revoking keys. Save this script in the `test` folder and run it to ensure the library works as expected.

Made changes.

samrahimi: awesome... can you add to the test script so that it tests saveToKeystore as well? 

GitHub Copilot: ### test/keyMixer.test.js

Add tests for the `saveToKeystore` method.

```javascript


const assert = require('assert');
const fs = require('fs');
const path = require('path');
const KeyMixer = require('../keyMixer');

const testKeystorePath = path.resolve(__dirname, 'testKeystore.json');
const testKeystore = {
  "TEST_SERVICE": ["test-key-1", "test-key-2"]
};

// Write a test keystore file
fs.writeFileSync(testKeystorePath, JSON.stringify(testKeystore, null, 2));

// Set the environment variable to use the test keystore
process.env.KEYSTORE_PATH = testKeystorePath;

// Reload the KeyMixer to use the test keystore
KeyMixer.refresh();

// Test getKey method
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'First key should be "test-key-1"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-2', 'Second key should be "test-key-2"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'Third key should be "test-key-1" again');

// Test addKey method
KeyMixer.addKey('TEST_SERVICE', 'test-key-3');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-2', 'Next key should be "test-key-2"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-3', 'Next key should be "test-key-3"');

// Test revokeKey method
KeyMixer.revokeKey('TEST_SERVICE', 'test-key-2');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-1', 'Next key should be "test-key-1"');
assert.strictEqual(KeyMixer.getKey('TEST_SERVICE'), 'test-key-3', 'Next key should be "test-key-3"');

// Test saveToKeystore method
const savePath = path.resolve(__dirname, 'savedKeystore.json');
KeyMixer.saveToKeystore(savePath);
const savedKeystore = JSON.parse(fs.readFileSync(savePath, 'utf8'));
assert.deepStrictEqual(savedKeystore, KeyMixer.keystore, 'Saved keystore should match the current keystore');

// Clean up test keystore files
fs.unlinkSync(testKeystorePath);
fs.unlinkSync(savePath);

console.log('All tests passed!');
```

This script now includes a test for the `saveToKeystore` method, ensuring that the keystore is saved correctly to a specified path. Save this script in the `test` folder and run it to ensure the library works as expected.

Made changes.

samrahimi: complete the README with comprehensive documentation on how to use the KeyMixer (its on npm, so most users will just do npm i key-mixer, and then const keyMixer = require("key-mixer")

GitHub Copilot: ### README.md

Complete the README with comprehensive documentation on how to use the KeyMixer.

```markdown


# key-mixer getting started guide

## what is key-mixer?
A simple key manager and keystore that supports multiple keys per service, load balancing between keys to allow for consolidation of credit balances and free tier quotas. While there is no advanced security, its more secure than how most ppl use .env, and a heck of a lot more useful.

In other words: it lets you circumvent rate limits on free tier accounts for APIs like Gemini, Cohere, and any other service where API calls are stateless and need not all come from the same account! Want 5x higher limits on Gemini? Well then log into Google AI Studio with 5 different gmail accounts and add the API keys for each into your keystore...

## how it works

Key Mixer is centered around the concept of a *keystore*.

A keystore is just a JSON object that improves on traditional environment variables by allowing each "service" (which is identified by a unique string, for instance, OPENAI_API_KEY) to have an unlimited number of "keys" (i.e. 'sk-123-...') that grant access to the service's resources. 

Here is an example of a simple keystore, which contains 2 OpenAI API keys, and 1 anthropic API key:

```json
{
    "OPENAI_API_KEY": ["sk-1234567890abcdef1234567890abcdef", "sk-hamster-dog-12345667"],
    "ANTHROPIC_API_KEY": ["sk-or-v1-1234567890abcdef1234567890abcdef"]
}
```

Use this example to get started: while you can name your services anything you like, we suggest keeping the names the same as the environment variables you're migrating away from - that way you can very easily get started by opening up your .env file, and copy pasting into your keystore.json file, which should be stored in your project root just like .env 

If you want multiple projects to share a keystore, or you want to call the file something else for security reasons, you can still use Key Mixer - set the KEYSTORE_PATH environment variable to the location of your keystore file: `set KEYSTORE_PATH=/path/to/my/keystore` 

*Note that it is not necessary to have a keystore file at all. key-mixer will just default to an empty keystore, which you can then add keys to programatically

## User Guide


### Basic Usage

First, require the Key Mixer module in your project:

```javascript
const keyMixer = require('key-mixer');
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