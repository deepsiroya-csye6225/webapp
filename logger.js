const winston = require('winston');
const winstonCloudWatch = require('winston-cloudwatch');

const fileFormat = winston.format.combine(
  winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ssZ'
  }),
  winston.format.printf(info => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);
 
// cloud watch option for winston cloud watch, with console level attach to debug mode
var options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true,
  },
  file: {
      level: 'debug',
      filename: '/opt/webapp/csye6225.log',
      handleExceptions: true,
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
      colorize: false,
      format: fileFormat,
  },
};
 
// creating the winston logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console),
    new winston.transports.File(options.file),
    new winstonCloudWatch({
      logGroupName: 'csye6225',
      logStreamName: 'webapp',
      awsRegion: 'us-east-1',
      jsonMessage: false,
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
