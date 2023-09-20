import * as winston from "winston";
import winstonDailyRotateFile from "winston-daily-rotate-file";

const timestampFormat = winston.format.timestamp({
  format: "YYYY-MM-DD HH:mm:ss",
});

const customFormat = winston.format.printf((info) => {
  return `${info.timestamp} [${info.level}] ${info.message}`;
});

export interface BunsterLoggerConfig {
  logLevel?: "info" | "debug" | "error" | "warn";
  logToConsole?: boolean;
  logToFile?: boolean;
  enableDailyRotation?: boolean;
  logDirectory?: string;
  maxLogFiles?: string;
  maxLogSize?: string;
  logFormat?: "json" | "plain";
}

class BunsterLogger {
  private logger: winston.Logger;

  private defaultConfig: BunsterLoggerConfig = {
    logLevel: "info",
    logToConsole: true,
    logToFile: true,
    enableDailyRotation: true,
    logDirectory: "logs",
    maxLogFiles: "30d",
    maxLogSize: "20m",
    logFormat: "json",
  };

  constructor(config: BunsterLoggerConfig = {}) {
    this.logger = this.setupLogger(config);
  }

  private setupLogger(config: BunsterLoggerConfig) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const transportsList = [];
    const format =
      mergedConfig.logFormat === "json" ? winston.format.json() : customFormat;

    if (mergedConfig.logToFile) {
      const fileTransportOptions = {
        dirname: mergedConfig.logDirectory,
        filename: "combined",
        extension: ".log",
        level: mergedConfig.logLevel,
        format: winston.format.combine(timestampFormat, format),
        json: false,
      };

      if (mergedConfig.enableDailyRotation) {
        transportsList.push(
          new winstonDailyRotateFile({
            ...fileTransportOptions,
            maxFiles: mergedConfig.maxLogFiles,
            maxSize: mergedConfig.maxLogSize,
          })
        );
      } else {
        transportsList.push(new winston.transports.File(fileTransportOptions));
      }
    }

    if (mergedConfig.logToConsole) {
      transportsList.push(
        new winston.transports.Console({
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
        })
      );
    }

    return winston.createLogger({
      transports: transportsList,
    });
  }

  log(level: "info" | "debug" | "error" | "warn", msg: string) {
    this.logger[level](msg);
  }

  info(msg: string) {
    this.log("info", msg);
  }

  error(msg: string) {
    this.log("error", msg);
  }

  debug(msg: string) {
    this.log("debug", msg);
  }

  warn(msg: string) {
    this.log("warn", msg);
  }
}

export default BunsterLogger;
