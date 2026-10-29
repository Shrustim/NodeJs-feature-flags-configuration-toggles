const { FLAGS } = require('./registry');

function createFlagService(
  adapter,
  { log = () => {} } = {}
) {
  function evaluate(flagName, context) {
    const definition = FLAGS[flagName];

    if (!definition) {
      throw new Error(`Unknown feature flag: ${flagName}`);
    }

    let enabled = definition.default;
    let source = 'fallback';

    try {
      const result = adapter.evaluate(
        flagName,
        context
      );

      if (typeof result === 'boolean') {
        enabled = result;
        source = adapter.name;
      }
    } catch {
      // An unavailable provider must not break
      // the existing, safe application behavior.
      enabled = definition.default;
      source = 'fallback';
    }

    // Log exposure without raw user/tenant IDs.
    log({
      event: 'flag_evaluated',
      flag: flagName,
      enabled,
      source
    });

    return {
      enabled,
      source
    };
  }

  return { evaluate };
}

module.exports = {
  createFlagService
};
