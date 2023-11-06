const winston = require('winston');
const winstonCloudWatch = require('winston-cloudwatch');
 
// cloud watch option for winston cloud watch, with console level attach to debug mode
var options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true,
  },
};
 
// creating the winston logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console),
    new winstonCloudWatch({
      logGroupName: 'csye6225',
      logStreamName: 'webapp',
      awsRegion: 'us-east-1',
      retentionInDays: 1,
    }),
  ],
  // do not exit if there is an error
  exitOnError: false,
});
 
logger.level = 'silly';
 
// setting the logger stream
logger.stream = {
  write: function (message, encoding) {
    logger.info(message);
  },
};
 
module.exports = logger;
