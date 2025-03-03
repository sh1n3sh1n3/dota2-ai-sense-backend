import mongoose, { ConnectOptions } from "mongoose";
import app from "./app";

// Middleware
import config from "./config";

mongoose
  .connect(
    config.databaseUri!,
    // Pass the options as ConnectOptions to avoid TS errors
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions
  )
  .then((res) => {
    console.log("Connected to Database - Initial Connection");
    // Listen only if DB connection works
    app.listen(config.port, () => {
      console.log(`server is listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.log(`Initial Database connection error occured -`, err);
  });
