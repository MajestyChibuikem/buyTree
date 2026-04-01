const cron = require('node-cron');
const aiService = require('../services/aiService');
const { Logger } = require('../utils/logger');

const logger = new Logger('BypassDetectionJob');

// Runs every 6 hours
function start() {
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Bypass detection job started');
    try {
      const results = await aiService.detectBypass();
      const high = results.filter(r => r.risk === 'high').length;
      logger.info('Bypass detection job completed', { total: results.length, high });
    } catch (error) {
      logger.error('Bypass detection job failed', error);
    }
  });

  logger.info('Bypass detection job scheduled (every 6 hours)');
}

module.exports = { start };
