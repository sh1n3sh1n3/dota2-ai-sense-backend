import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config"; // Your config file

export const verifyToken = (token: string): boolean => {
  try {
    jwt.verify(token, config.jwt.secret!);
    return true; // Token is valid
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      console.log("Token is expired.");
      return false;
    }
    console.log("Invalid token.");
    return false;
  }
};
