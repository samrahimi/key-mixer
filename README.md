# key-mixer getting started guide

## what is key-mixer?
A simple key manager and keystore that supports multiple keys per service, load balancing between keys to allow for consolidation of credit balances and free tier quotas. While there is no advanced security, its more secure than how most ppl use .env, and a heck of a lot more useful

## creating your initial keystore
1. Gather your API keys for various 3rd party services, the keys you probably currently have in .env
2. Create your keystore.json file, based on keystore.example.json - its really self explanatory.
3. Remove the environment variables from .env where the keys previously resided, and replace with just one: KEYSTORE_PATH, the complete path to your keystore.json (or whatever else you might have named it)
4. (TODO) if someone wants to make a utility that sweeps your .env for API keys and does the above steps automagically, do it and submit a PR

## using the key mixer, and migrating from process.env

Let's say you have a function like this:

```
... other code ...
const getChatCompletion = (prompt) => {
  const OpenAI = require("openai")
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
  ... call the api, etc ...
}
```

Assuming you used "OPENAI_API_KEY" as the service name in your keystore, the updated version is as follows:

```
const keyMixer = require('./keyMixer');
... other code ...
const getChatCompletion = (prompt) => {
  const OpenAI = require("openai")

 //keyMixer.get will round-robin thru the available keys for the requested service as it gets called repeatedly
 const openai = new OpenAI({apiKey: keyMixer.get("OPENAI_API_KEY")})
  ... call the api, etc ...
}
```

## everything else
is an exercise for the reader. Enjoy :)
