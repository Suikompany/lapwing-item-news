import { TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params, TweetV2PostTweetResult } from "twitter-api-v2";

import { fetchTwitterApiTokens } from "../param/ssmParam";
import { buildProductUrl } from "../booth/products";

const initTwitterClient = async () => {
  const tokens = await fetchTwitterApiTokens();

  const baseClient = new TwitterApi({
    appKey: tokens.apiKey,
    appSecret: tokens.apiSecret,
    accessToken: tokens.accessToken,
    accessSecret: tokens.accessTokenSecret,
  });

  const rwClientV2 = baseClient.readWrite.v2;

  return rwClientV2;
};

const client = await initTwitterClient();

type CreateTweet = (params: {
  productName: string;
  productId: number;
  hashtags: `#${string}`[];
}) => Promise<{
  id: string;
  rateLimit:
    | {
        limit: number;
        remaining: number;
        reset: number;
      }
    | undefined;
}>;
export const createTweet: CreateTweet = async ({
  productName,
  productId,
  hashtags,
}) => {
  const text = buildTweetText({ productName, productId, hashtags });
  const result = await sendTweet({ text });
  return { id: result.data.id, rateLimit: result.rateLimit };
};

type BuildTweetText = (params: {
  productName: string;
  productId: number;
  hashtags: `#${string}`[];
}) => string;
const buildTweetText: BuildTweetText = ({
  productName,
  productId,
  hashtags,
}) => {
  const productNameLine = productName;
  const hashtagsLine = hashtags.join(" ");
  const urlLine = buildProductUrl(productId);

  return `${productNameLine}\n${hashtagsLine}\n${urlLine}` as const;
};

type SendTweet = (params: {
  text: string;
}) => Promise<{
  data: {
    id: string;
    text: string;
  };
  rateLimit:
    | {
        limit: number;
        remaining: number;
        reset: number;
      }
    | undefined;
}>;
const sendTweet: SendTweet = async ({ text }) => {
  const payload: SendTweetV2Params = {
    text: text,
  };

  const response = await client.post<TweetV2PostTweetResult>(
    "tweets",
    payload,
    {
      fullResponse: true,
    },
  );

  if (response.data.errors) {
    throw new Error("Failed to create a tweet", {
      cause: response.data.errors,
    });
  }

  return {
    data: response.data.data,
    rateLimit: response.rateLimit,
  };
};
