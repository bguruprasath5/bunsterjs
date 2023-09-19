import * as winston from "winston";
import winstonDailyRotateFile from "winston-daily-rotate-file";
import { v4 as uuidv4 } from "uuid";

const timestampFormat = winston.format.timestamp({
  format: "YYYY-MM-DD HH:mm:ss",
});

const customFormat = winston.format.printf((info) => {
  return `${info.timestamp} [${info.level}] ${info.message}`;
});

const transports = {
  console: new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      timestampFormat,
      winston.format.colorize({
        colors: {
          info: "blue",
          debug: "yellow",
          error: "red",
        },
      }),
      customFormat
    ),
  }),
  combinedFile: new winstonDailyRotateFile({
    dirname: "logs",
    filename: "combined",
    extension: ".log",
    level: "info",
    format: winston.format.combine(timestampFormat, customFormat),
    maxFiles: "30d",
    maxSize: "20m",
    json: false,
  }),
};

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [transports.combinedFile, transports.console],
});

class BunsterLogger {
  private requestId: string;
  constructor() {
    this.requestId = uuidv4();
  }

  info(msg: string) {
    logger.info(`[${this.requestId}]  ${msg}`);
  }

  error(msg: string) {
    logger.error(`[${this.requestId}]  ${msg}`);
  }

  debug(msg: string) {
    logger.debug(`[${this.requestId}]  ${msg}`);
  }

  warn(msg: string) {
    logger.warn(`[${this.requestId}]  ${msg}`);
  }
}

export default BunsterLogger;
