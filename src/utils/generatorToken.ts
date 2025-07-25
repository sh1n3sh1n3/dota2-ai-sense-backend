import { sign } from "jsonwebtoken";
import fs from "fs";
import config from "../config";

const privateKey = fs.readFileSync("private.pem", "utf8");

export const generatorToken = (user: any, expire = "24h") => {
  return sign(
    { userId: user._id.toString(), steamid: user.steamid },
    privateKey,
    {
      expiresIn: expire,
      notBefore: "0", // Cannot use before now, can be configured to be deferred
      algorithm: "RS256",
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    }
  );
};
