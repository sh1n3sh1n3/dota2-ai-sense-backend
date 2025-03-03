import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Use TransformableInfo from winston for better type compatibility
import { TransformableInfo } from "logform";

const enumerateErrorFormat = winston.format((info: TransformableInfo) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.printf(
      (info: TransformableInfo) => `${info.level} : ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
    new DailyRotateFile({
      dirname: "logs",
      filename: "%DATE%.log",
      datePattern: "YYYYMMDD_HH-MM",
      zippedArchive: true,
      maxSize: "5m",
      maxFiles: "5d",
    }),
    // Uncomment and configure file transport if needed
    // new winston.transports.File({ filename: 'logs/%DATE%.log.log' })
  ],
});

export default logger;
