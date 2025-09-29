import { env } from "cloudflare:workers";

export const ALLOW_TWEET = env.ALLOW_TWEET || false;

export type TwitterCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export const fetchTwitterCredentials = () => {
  const apiKey = env.TWITTER_API_KEY;
  const apiSecret = env.TWITTER_API_SECRET;
  const accessToken = env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Missing Twitter API credentials");
  }

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  };
};
