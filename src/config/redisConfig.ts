import dotenv from "dotenv";
dotenv.config();

export const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL // production (e.g., Render / Upstash)
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };
