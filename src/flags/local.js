const { createHash } = require('node:crypto');

function rolloutBucket(flagName, context) {
  const key = [
    flagName,
    context.tenantId,
    context.userId
  ].join(':');

  const hash = createHash('sha256')
    .update(key)
    .digest();

  const number = hash.readUInt32BE(0);

  return (number / 2 ** 32) * 100;
}

function validateRules(rules, definitions) {
  if (
    !rules ||
    typeof rules !== 'object' ||
    Array.isArray(rules)
  ) {
    throw new Error('Invalid local flags configuration');
  }

  for (const name of Object.keys(rules)) {
    if (!Object.hasOwn(definitions, name)) {
      throw new Error(`Unknown configured flag: ${name}`);
    }
  }

  for (const name of Object.keys(definitions)) {
    const rule = rules[name];

    if (!rule || typeof rule !== 'object') {
      throw new Error(`Missing configuration: ${name}`);
    }

    const allowed = [
      'enabled',
      'tenantIds',
      'userIds',
      'rolloutPercent'
    ];

    if (
      Object.keys(rule).some(
        (key) => !allowed.includes(key)
      ) ||
      typeof rule.enabled !== 'boolean' ||
      !Array.isArray(rule.tenantIds) ||
      !Array.isArray(rule.userIds) ||
      ![...rule.tenantIds, ...rule.userIds].every(
        (id) => typeof id === 'string' && id.length > 0
      ) ||
      !Number.isInteger(rule.rolloutPercent) ||
      rule.rolloutPercent < 0 ||
      rule.rolloutPercent > 100
    ) {
      throw new Error(`Invalid rule for flag: ${name}`);
    }
  }
}

function createLocalAdapter(rules, definitions) {
  validateRules(rules, definitions);

  return {
    name: 'local',

    evaluate(flagName, context) {
      const rule = rules[flagName];

      if (!rule || !rule.enabled) {
        return false;
      }

      if (
        rule.tenantIds.includes(context.tenantId) ||
        rule.userIds.includes(context.userId)
      ) {
        return true;
      }

      if (!context.userId || !context.tenantId) {
        return false;
      }

      return (
        rolloutBucket(flagName, context) <
        rule.rolloutPercent
      );
    },

    async close() {}
  };
}

module.exports = {
  createLocalAdapter,
  validateRules,
  rolloutBucket
};
