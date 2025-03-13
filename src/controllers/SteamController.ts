import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import axios from "axios";

import OpenAI from "openai";

import { ApiError } from "../errors";
import { CustomRequest } from "../middleware/checkJwt";
import { processErrors } from "../utils/errorProcessing";
import config from "../config";
import { dataFormat } from "../utils/dataFormat";
import { heroIds } from "../utils/heroIds";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const userConversations: {
  [userId: string]: { role: string; content: string }[];
} = {};
class SteamController {
  static getMatchDetails = async (matchId: string) => {
    const url = `https://api.opendota.com/api/matches/${matchId}`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return null;
    }
  };
  static getItems = async () => {
    const url = `https://api.opendota.com/api/constants/items`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return null;
    }
  };
  static getHeroes = async () => {
    const url = `https://api.opendota.com/api/constants/heroes`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  static getAIResponse = async (req: Request, res: Response) => {
    try {
      const { message, chatId, steamid } = req.body;
      let userId;
      dataFormat;
      if (!message) {
        return res.status(400).json({ error: "Questions are required" });
      }

      if (!chatId) {
        const matchDetails = await this.getMatchDetails(message);
        const heroes = await this.getHeroes();
        const heroLists = Object.entries(heroes).map(
          ([name, data]: [string, any]) => ({
            name: data.localized_name,
            id: data.id,
          })
        );
        const items = await this.getItems();
        const itemLists = Object.entries(items).map(
          ([name, data]: [string, any]) => ({
            id: data.id,
            name,
          })
        );
        const accountId = this.getOpenDotaAccountID(steamid);

        if (matchDetails) {
          const prompt = `
          My account id is ${accountId}. If my Dota 2 account is in this match,
          Latest hero IDs:  ${JSON.stringify(heroLists)}
          If my account ID is not in the match, don't analyze the result.
          Use the following data to analyze items: ${JSON.stringify(itemLists)}
          ${JSON.stringify(matchDetails)}
          this is dota2 match details.
          analyze the match and provide a detailed breakdown in this format:
          ${dataFormat}
        `;
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800, // Adjust response length as needed
          });
          const aiResponse =
            completion.choices[0]?.message?.content || "No response";
          userId = Date.now();
          if (!userConversations[userId]) {
            userConversations[userId] = [];
          }
          userConversations[userId].push({ role: "user", content: prompt });
          userConversations[userId].push({
            role: "assistant",
            content: aiResponse,
          });
          res.json({ result: aiResponse, userId });
        } else {
          res.send({ result: "Type again match Id!" });
        }
      } else {
        userId = chatId;
        if (!userConversations[userId]) {
          userConversations[userId] = [];
        }

        // Add user message to conversation history
        userConversations[userId].push({ role: "user", content: message });

        // Call OpenAI API with full conversation history
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: userConversations[
            userId
          ] as OpenAI.ChatCompletionMessageParam[],
          max_tokens: 800, // Adjust response length as needed
        });

        // Get AI response and add to history
        const aiResponse =
          completion.choices[0]?.message?.content || "No response";
        userConversations[userId].push({
          role: "assistant",
          content: aiResponse,
        });

        // Return AI response
        res.json({ result: aiResponse, userId });
      }

      // Initialize conversation history if not exists
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Failed to fetch AI response" });
    }
  };

  static getOpenDotaAccountID = (steamID64: any) => {
    const base = BigInt("76561197960265728");
    return BigInt(steamID64) - base;
  };
}

export default SteamController;
