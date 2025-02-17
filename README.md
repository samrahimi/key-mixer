

## User Guide

Installation: 
```sh
npm install @samrahimi/key-mixer
```


### Basic Usage

First, setup a `keystore.json` file for your project, and save it in your *project root* folder. This is usually the same as where you have your `package.json`, `README.md`, and / or `gitignore`. 

A keystore is very similar to a .env file, because it defines environment variables for your app to use... and its got superpowers: you can have *multiple values for each variable* that automatically cycle as they are read.

Why would you want such a thing? So as not to get myself into trouble with Sergei and Larry, I will show, rather than tell.

keystore.json:
```json
{
    "GOOGLE_AI_API_KEY": ["sk-my-regular-google-account", "sk-my-other-google-account", "sk-the-google-account-my-friend-made-for-me"],
    "SOME_OTHER_KEY": ["sk-or-v1-1234567890abcdef1234567890abcdef"]
}
```

app.js:
```javascript
const keyMixer = require('@samrahimi/key-mixer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

function askAI(prompt) {
    //process.env.GOOGLE_AI_API_KEY will contain a different key each time you access it, rotating thru your list of rate-limited, but totally free, keys obtained from aistudio.google.com
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
}

askAI("Why is the sky blue?")
//calls Gemini API with key "sk-my-regular-google-account"

askAI("If I have 8 qubits entangled with my friend's 8 qubits, and I collapse a few of my qubits, so that collapsed=0, not collapsed=1, can I send an ASCII character to my friend faster than the speed of light?")
//calls Gemini API with key "sk-the-google-account-my-friend-made-for-me" (the answer is no, by the way, you can't send information faster than light... but you can increase your rate limits by scaling free-tier API keys horizontally LMAO)
```

And thats all you need to know... Oh, so its FINE to use this in combination with dotenv and/or other ways of setting environment variables. When you try to read `process.env.SOMETHING` what happens is that first it will see if you've got any values for SOMETHING stored in your `keystore.json` and if so, it will use the KeyMixer... Otherwise, it will return to you the *actual* value of `process.env.SOMETHING` which was set via `.env`, the command line, `.bashrc` or whatever...

If there is a conflict (i.e. a key name in keystore matches the name of an actual environment variable), it will read from the keystore, and ignore the environment variable... If you want more nuanced control over this, add it yourself and submit a PR! 


The rest of this README covers more advanced use cases and customizations... 

### Loading the Keystore

By default, Key Mixer will look for a `keystore.json` file in the current working directory. You can specify a custom path by setting the `KEYMIXER_KEYSTORE_PATH` environment variable. 

Please note: this needs to be set directly as an environment variable (via .env or the shell, you know, KEYMIXER_KEYSTORE_PATH=ks.json npm run dev - not in the keystore itself, for obvious reasons)
```sh
export KEYMIXER_KEYSTORE_PATH=/path/to/your/keystore.json
```

### Getting a Key (The Old Way)

*Note: for most use cases, it is preferred to read keys from your keystore simply by accessing the value of  `process.env.KEY_NAME` as your code is probably already full of such references, as is the code of various 3rd party libraries you use, so why reinvent the wheel... but, if you wanna get specific, read one:

To get a key for a specific service, use the `getKey` method. This method will return keys in a round-robin fashion:

```javascript
const apiKey = keyMixer.getKey('OPENAI_API_KEY');
```

### Adding a Key

To add a new key to a service, use the `addKey` method:

```javascript
keyMixer.addKey('OPENAI_API_KEY', 'new-api-key');
```

*Note: you can also just add the key directly to your keystore.json - but then you must call keyMixer.refresh() to reload the keystore from disk*

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

// Get an API key for OpenAI (the old way)
const apiKey = keyMixer.getKey('OPENAI_API_KEY');
console.log(`Using API key: ${apiKey}`);

// Get another key for OpenAI (the new way)
const apiKey2 = process.env.OPENAI_API_KEY

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

Key Mixer is a simple yet powerful tool for managing multiple API keys for various services. With it, you can load balance calls to any service by using multiple keys, perhaps linked to multiple accounts, and up to a certain point you can scale your rate limits: in our testing, there's no problem cycling 5 Gemini API keys (all free tier, from 5 different google accounts) in a single application, on one server with one IP... 

Quite simply, in that scenario, you get 250 gemini pro requests per day, instead of 50 as you would with a single account, with no changes required to your code - just `require("@samrahimi/key-mixer")` and away you go. Rate limiting does not seem to kick in at this scale

Obviously there is a limit to the shenanigans you can get away with - if you're cycling thru 50 Google API keys, all linked to separate Google accounts you created solely for the purpose of increasing your Gemini rate limits, you'd better be cycling them thru at least 10 different IP addresses, which requires considerable engineering effort at a nonzero cost... Yes, it'll probably save you money vs paying for the requests, if you use $5 droplets, but there's still a possibility of getting banned depending on the security features of the API provider, and depending on how good your implementation is. 

Such things are out of scope for this library... but I'm happy to consult with you and help you build and scale your custom AI solutions, just email me `samrahimi420@gmail.com`

Peace!
