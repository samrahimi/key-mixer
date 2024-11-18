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

// Test singleton behavior
const KeyMixer1 = require('../keyMixer');
const KeyMixer2 = require('../keyMixer');

assert.strictEqual(KeyMixer1, KeyMixer2, 'KeyMixer instances should be the same');

// Modify state using KeyMixer1
KeyMixer1.addKey('SERVICE_2', 'singleton-test-key');

assert.strictEqual(KeyMixer1, KeyMixer2, 'KeyMixer instances should be the same');
assert.equal(KeyMixer1.getKey('SERVICE_2'), 'singleton-test-key', 'KeyMixer2 should have the updated state');

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
