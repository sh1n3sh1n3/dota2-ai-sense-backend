import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { CustomError, IResponseError } from "../exceptions/customError";
import ApiError from "../errors/ApiError";
import config from "../config";
export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let { statusCode, message } = err;
  // if (config.env === 'production' && !err.isOperational) {
  statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  message = "Internal Server Error";
  // }

  res.locals["errorMessage"] = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  // if (config.env === 'development') {
  //   logger.error(err);
  // }

  res.status(statusCode).send(response);
};
