const {
  initialize,
  destroy
} = require('unleash-client');

function createUnleashAdapter({
  url,
  token,
  appName,
  maxStaleMs = 60000
}) {
  if (!url || !token || !appName) {
    throw new Error(
      'Missing required Unleash configuration'
    );
  }

  let lastSyncAt = 0;

  // Initialize only once per application process.
  const client = initialize({
    url,
    appName,

    customHeaders: {
      Authorization: token
    },

    refreshInterval: 5000,
    timeout: 3000
  });

  function recordSync() {
    lastSyncAt = Date.now();
  }

  // Successful configuration synchronization.
  client.on('synchronized', recordSync);
  client.on('changed', recordSync);
  client.on('unchanged', recordSync);

  client.on('error', (error) => {
    console.error(
      'Unleash SDK error:',
      error.message
    );
  });

  client.on('warn', (message) => {
    console.warn('Unleash warning:', message);
  });

  return {
    name: 'unleash',

    evaluate(flagName, context) {
      const stale =
        lastSyncAt === 0 ||
        Date.now() - lastSyncAt > maxStaleMs;

      if (stale) {
        // Our flag service applies the safe default.
        return undefined;
      }

      const unleashContext = {
        userId: context.userId,

        properties: {
          tenantId: context.tenantId
        }
      };

      return client.isEnabled(
        flagName,
        unleashContext
      );
    },

    async close() {
      destroy();
    }
  };
}

module.exports = {
  createUnleashAdapter
};
