import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import axios from "axios";

import { ApiError } from "../errors";
import { User } from "../models/user";
import { CustomRequest } from "../middleware/checkJwt";
import { generatorToken } from "../utils/generatorToken";
import config from "../config";
import UserController from "./UserController";
class AuthController {
  static verifySteam = async (req: Request, res: Response) => {
    /* This code snippet is a method named `verifySteam` inside the `AuthController` class. Here's a
  breakdown of what it does: */
    try {
      const { steamid } = req.body;
      if (!steamid) {
        return res
          .status(400)
          .json({ error: "steamid is required in the request body." });
      }
      const apiKey = config.steamApiKey;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "Steam API key is not configured." });
      }
      // Construct the Steam Web API URL for GetPlayerSummaries
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamid}`;
      // Call the Steam API
      const response = await axios.get(url);
      const data = response.data;
      // Check if the response contains player data
      if (
        data &&
        data.response &&
        data.response.players &&
        data.response.players.length > 0
      ) {
        const player = data.response.players[0];
        const { steamid, personaname } = player;
        const user = await UserController.newUser({
          steamid,
          name: personaname,
        });
        const accessToken = generatorToken(user);
        // Respond with the player data as verification
        return res.json({
          success: true,
          accessToken,
          user: { ...player, ...user },
        });
      } else {
        return res.status(404).json({
          success: false,
          error: "No player data found for the provided steamId.",
        });
      }
    } catch (error: any) {
      console.error("Error verifying steamId:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  static authme = async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as CustomRequest).token.payload.userId;
    const user = await User.findById(id);
    if (user) {
      res.send({ user });
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, "The user doesn't exist!");
    }
  };
}

export default AuthController;
