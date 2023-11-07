const StatsD = require('node-statsd');

const client = new StatsD({
  host: '127.0.0.1',
  port: 8125,
});

module.exports = client;