import { TwitterApi } from "twitter-api-v2";

import { fetchTwitterApiTokens } from "../param/ssmParam";

const initTwitterClient = async () => {
  const tokens = await fetchTwitterApiTokens();

  const baseClient = new TwitterApi({
    appKey: tokens.apiKey,
    appSecret: tokens.apiKeySecret,
    accessToken: tokens.accessToken,
    accessSecret: tokens.accessTokenSecret,
  });

  const rwClientV2 = baseClient.readWrite.v2;

  return rwClientV2;
};

export const client = await initTwitterClient();
