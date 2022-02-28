import { MB_50 } from "@core/core.constants";
import { TransformableInfo } from "logform";
import * as winston from "winston";

const consoleFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.colorize(),
  winston.format.timestamp({ format: "YY-MM-DD HH:mm:ss" }),
  winston.format.printf((info: TransformableInfo) => {
    const { timestamp, namespace, level, message, ...meta } = info;
    const _namespace = namespace !== undefined ? JSON.stringify(namespace) : "";
    const _timestamp = timestamp !== undefined ? JSON.stringify(timestamp) : "";
    return `${_timestamp} [${level}] ${_namespace}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
    }`;
  })
);

const transports = () => {
  const fileTransport = new winston.transports.File({
    filename: "logs/app.log",
    level: process.env["LOG_LEVEL"],
    maxsize: MB_50,
    maxFiles: 1,
  });
  const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
  });

  return [fileTransport, consoleTransport];
};

const parentLogger = winston.createLogger({
  level: process.env["LOG_LEVEL"],
  transports: transports(),
});

export const Logger = (namespace?: string) => {
  // child logger that allows including namespace metadata
  if (namespace) {
    return parentLogger.child({ namespace });
  }
  return parentLogger;
};
