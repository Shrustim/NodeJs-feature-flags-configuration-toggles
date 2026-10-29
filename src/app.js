const express = require('express');

const demoUsers = Object.freeze({
  alice: {
    userId: 'u-1',
    tenantId: 'tenant-a'
  },

  bob: {
    userId: 'u-2',
    tenantId: 'tenant-b'
  },

  charlie: {
    userId: 'u-3',
    tenantId: 'tenant-b'
  }
});

function createApp(flagService) {
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Demo-only user selection.
  app.use('/api', (req, res, next) => {
    const demoUser = req.get('X-Demo-User');

    const identity = demoUsers[demoUser];

    if (!identity) {
      return res.status(400).json({
        error: 'Provide a valid X-Demo-User header'
      });
    }

    // Trusted mapping inside the application.
    req.flagContext = identity;

    next();
  });

  // Feature 1: Checkout V2.
  app.get('/api/checkout', (req, res) => {
    const result = flagService.evaluate(
      'checkout_v2',
      req.flagContext
    );

    if (result.enabled) {
      return res.json({
        checkout: 'v2',
        message: 'New checkout flow'
      });
    }

    return res.json({
      checkout: 'classic',
      message: 'Existing checkout flow'
    });
  });

  // Feature 2: Dashboard V2.
  app.get('/api/dashboard', (req, res) => {
    const result = flagService.evaluate(
      'dashboard_v2',
      req.flagContext
    );

    if (result.enabled) {
      return res.json({
        dashboard: 'v2',
        message: 'New dashboard'
      });
    }

    return res.json({
      dashboard: 'classic',
      message: 'Existing dashboard'
    });
  });

  return app;
}

module.exports = { createApp };
