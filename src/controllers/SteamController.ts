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

  static getAIResponse = async (req: Request, res: Response) => {
    try {
      const { message, chatId } = req.body;
      const steamid = (req as CustomRequest).token.payload.steamid;
      let userId;
      dataFormat;
      if (!message) {
        return res.status(400).json({ error: "Questions are required" });
      }

      if (!chatId) {
        const data = await this.getMatchDetails(message);
        console.log("data: ", data);
        if (data) {
          const prompt = `${JSON.stringify(
            data
          )} \n ${steamid} \n this is my steamid. \n Analyze the following Dota 2 match and provide a detailed performance breakdown in the following format: \n ${dataFormat} \n And this is latest hero ids : ${heroIds}`;
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
}

export default SteamController;
