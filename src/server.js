const { createApp } = require('./app');

const { FLAGS } = require('./flags/registry');

const {
  createLocalAdapter
} = require('./flags/local');

const {
  createUnleashAdapter
} = require('./flags/unleash');

const {
  createFlagService
} = require('./flags/service');

async function main() {
  const provider = process.env.FLAG_PROVIDER || 'local';

  let adapter;

  if (provider === 'local') {
    const rules = require('../flags.local.json');

    adapter = createLocalAdapter(rules, FLAGS);
  } else if (provider === 'unleash') {
    adapter = createUnleashAdapter({
      url: process.env.UNLEASH_URL,
      token: process.env.UNLEASH_API_TOKEN,

      appName:
        process.env.UNLEASH_APP_NAME ||
        'node09-feature-practice',

      maxStaleMs: Number(
        process.env.FLAG_MAX_STALE_MS || 60000
      )
    });
  } else {
    throw new Error(
      `Unsupported feature flag provider: ${provider}`
    );
  }

  const flagService = createFlagService(adapter, {
    log: (event) => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event
      }));
    }
  });

  const app = createApp(flagService);

  const port = Number(process.env.PORT || 3000);

  const server = app.listen(port, () => {
    console.log(
      `API running at http://localhost:${port}`
    );

    console.log(
      `Feature flag provider: ${provider}`
    );
  });

  let stopping = false;

  async function shutdown() {
    if (stopping) return;
    stopping = true;

    try {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      await adapter.close();

      process.exitCode = 0;
    } catch (error) {
      console.error(
        'Shutdown failed:',
        error.message
      );

      process.exitCode = 1;
    }
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exitCode = 1;
});
