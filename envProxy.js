//uses Proxy object to wrap process.env and sync keys between the keystore and the environment
//this is a unidirectional sync: reading process.env.KEY_NAME will return keymixer.getKey(KEY_NAME) if value(s) for that key are in the keystore
//but writing process.env.KEY_NAME will not affect the keystore...
function syncWithEnvironment(keymixer) {
    // Create a proxy that wraps the original process.env
    const envProxy = new Proxy(process.env, {
      get(target, service) {
        // Handle symbol and non-string keys
        if (typeof service === 'symbol' || typeof service !== 'string') {
          return target[service];
        }
        
        // If we have at least one key stored in our key mixer for the given environment variable,
        // return from the mixer... otherwise just return the normal environment variable
        if (keymixer.hasKeysFor(service)) {
            return keymixer.getKey(service)
        } else
            return target[service]
      },      
    });
  
    // Replace process.env with our proxied version
    process.env = envProxy;
  }

  module.exports= {syncWithEnvironment};