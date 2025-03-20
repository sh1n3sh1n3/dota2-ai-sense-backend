// Add dotenv for environment variables
import * as dotenv from "dotenv";
dotenv.config();

const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "JWT_SECRET",
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
  },
  port: process.env.PORT || 3000,
  prefix: process.env.API_PREFIX || "api",
  databaseUri: process.env.MONGODB_URI,
  env: process.env.NODE_ENV,
  domain: process.env.DOMAIN,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  steamApiKey: process.env.STEAM_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  openAIApiKey: process.env.OPENAI_API_KEY,
};

export default config;
