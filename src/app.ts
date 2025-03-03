import express from "express";
// import { json } from "body-parser";
import bodyParser from "body-parser";
import routes from "./routes";
import httpStatus from "http-status";
import compression from "compression";
import cors from "cors";
import { ApiError, errorConverter, errorHandler } from "./errors";
// import { errorHandler } from "./middleware/errorHandler";
import config from "./config";

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.get("/", function (_, res) {
  res.send("Welcome to API v");
});
// Add the routes with the base prefix
app.use("/" + config.prefix, routes);

app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// Add error handling
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
