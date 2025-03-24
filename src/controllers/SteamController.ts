import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import axios from "axios";

import OpenAI from "openai";

import { ApiError } from "../errors";
import { CustomRequest } from "../middleware/checkJwt";
import { processErrors } from "../utils/errorProcessing";
import config from "../config";
import { dataFormat } from "../utils/dataFormat";
import { IQA, QA } from "../models/qa";
import { ActionLog } from "../models/actionlog";
import { IActionLog } from "../models/actionlog";
import { PreQuestion } from "../models/prequestion";
import { IPreQuestion } from "../models/prequestion";
import { checkMonthlyLimit } from "../middleware/checkAPILimit";
const openai = new OpenAI({ apiKey: config.openAIApiKey });
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
    const { message, chatId, steamid, defaultQuestion } = req.body;
    try {
      await checkMonthlyLimit(steamid);
    } catch (error) {
      return res.status(429).json({ error: error });
    }
    try {
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
          this is dota2 match details.Analyze only my match detail.
          ${defaultQuestion}
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

  static saveQA = async (req: Request, res: Response) => {
    const { data } = req.body;
    const qa = QA.build(data as IQA);
    const result = await qa.save();
    res.send(result);
  };

  static getQA = async (req: Request, res: Response) => {
    const { steamid } = req.body;
    const results = await QA.find({ steamid });
    res.send({ results });
  };

  static saveActionLog = async (req: Request, res: Response) => {
    const { data } = req.body;
    if (data) {
      const actionlog = ActionLog.build(data as IActionLog);
      try {
        await actionlog.save();
        res.send({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed save action!" });
      }
    }
  };

  static savePreQuestion = async (req: Request, res: Response) => {
    const { data } = req.body;

    if (data) {
      const prequestion = PreQuestion.build(data as IPreQuestion);
      try {
        await prequestion.save();
        const results = await PreQuestion.find();
        res.send({ results });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed save pre-question!" });
      }
    }
  };
  static editPreQuestion = async (req: Request, res: Response) => {
    const { data } = req.body;

    if (data) {
      const prequestion = await PreQuestion.findById(data.id);
      if (prequestion) {
        prequestion.question = data.question;
        await prequestion.save();
        const results = await PreQuestion.find();
        res.send({ results });
      } else {
        res.status(404).send({ error: "Not found pre question." });
      }
    } else {
      res.status(400).send({
        error:
          "The server cannot or will not process the request due to an apparent client error.",
      });
    }
  };

  static deletePreQuestion = async (req: Request, res: Response) => {
    const { data } = req.body;
    try {
      await PreQuestion.findOneAndDelete({ id: data.id });
      const results = await PreQuestion.find();
      res.send({ results });
    } catch (error) {
      throw new ApiError(httpStatus.NOT_FOUND, "Not found question!");
    }
  };

  static getPrequestion = async (req: Request, res: Response) => {
    const results = await PreQuestion.find();
    res.send({ results });
  };
}

export default SteamController;
