const FLAGS = Object.freeze({
  checkout_v2: Object.freeze({
    default: false,
    type: 'release',
    owner: 'Checkout Team',
    description: 'Enable the new checkout flow',
    reviewBy: '2026-12-15'
  }),

  dashboard_v2: Object.freeze({
    default: false,
    type: 'release',
    owner: 'Dashboard Team',
    description: 'Enable the new dashboard layout',
    reviewBy: '2026-12-31'
  })
});

module.exports = { FLAGS };
