import { ApiRequestError, ApiResponseError, TwitterApi } from "twitter-api-v2";
import type {
  SendTweetV2Params,
  TweetV2PostTweetResult,
  TwitterApiReadWrite,
} from "twitter-api-v2";

import { buildProductUrl } from "../booth/products";

export const createTwitterClient = ({
  tokens,
}: {
  tokens: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
}) => {
  const baseClient = new TwitterApi({
    appKey: tokens.apiKey,
    appSecret: tokens.apiSecret,
    accessToken: tokens.accessToken,
    accessSecret: tokens.accessTokenSecret,
  });

  const rwClientV2 = baseClient.readWrite.v2;

  return rwClientV2;
};

type CreateMultipleTweets = (
  client: TwitterApiReadWrite["v2"],
  params: readonly Parameters<CreateTweet>[1][],
) => Promise<
  (
    | {
        type: "success";
        id: string;
        rateLimit:
          | {
              limit: number;
              remaining: number;
              reset: number;
              day?: { limit: number; remaining: number; reset: number };
            }
          | undefined;
      }
    | { type: "error"; error: Error }
  )[]
>;
export const createMultipleTweets: CreateMultipleTweets = async (
  client,
  params,
) => {
  const tweetResultList = await Promise.allSettled(
    params.map(async (param) => {
      const result = await createTweet(client, param);
      return result;
    }),
  );

  const results: (
    | {
        type: "success";
        id: string;
        rateLimit:
          | {
              limit: number;
              remaining: number;
              reset: number;
              day?: { limit: number; remaining: number; reset: number };
            }
          | undefined;
      }
    | { type: "error"; error: Error }
  )[] = tweetResultList.map((result) => {
    switch (result.status) {
      case "fulfilled": {
        return {
          type: "success",
          id: result.value.id,
          rateLimit: result.value.rateLimit,
        };
      }
      case "rejected": {
        return { type: "error", error: result.reason as Error };
      }
      default: {
        const _exhaustiveCheck: never = result;
        throw new Error("unreachable:", _exhaustiveCheck);
      }
    }
  });

  return results;
};

type CreateTweet = (
  client: TwitterApiReadWrite["v2"],
  params: {
    productName: string;
    productId: number;
    hashtags: `#${string}`[];
  },
) => Promise<{
  id: string;
  rateLimit:
    | {
        limit: number;
        remaining: number;
        reset: number;
        day?: { limit: number; remaining: number; reset: number };
      }
    | undefined;
}>;
export const createTweet: CreateTweet = async (
  client,
  { productName, productId, hashtags },
) => {
  const text = buildTweetText({ productName, productId, hashtags });
  const result = await sendTweet({ client, text });
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
  const urlLine = buildProductUrl({ productId: productId });

  return `${productNameLine}\n${hashtagsLine}\n${urlLine}` as const;
};

type SendTweet = (params: {
  client: TwitterApiReadWrite["v2"];
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
        day?: { limit: number; remaining: number; reset: number };
      }
    | undefined;
}>;
const sendTweet: SendTweet = async ({ client, text }) => {
  const payload: SendTweetV2Params = {
    text: text,
  };

  try {
    const response = await client.post<TweetV2PostTweetResult>(
      "tweets",
      payload,
      {
        fullResponse: true,
      },
    );

    return {
      data: response.data.data,
      rateLimit: response.rateLimit,
    };
  } catch (error: unknown) {
    // twitter-api-v2 のエラーハンドリング: https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/errors.md

    // リクエストエラー
    if (error instanceof ApiRequestError) {
      throw new Error(`Twitter API Request Error: ${error.message}`, {
        cause: error.requestError,
      });
    }

    // レスポンスエラー
    if (error instanceof ApiResponseError) {
      if (error.isAuthError) {
        throw new Error(`Twitter API Auth Error: ${error.message}`, {
          cause: error.errors,
        });
      }

      if (error.rateLimitError) {
        throw new Error(`Twitter API Rate Limit Error: ${error.message}`, {
          cause: error.errors,
        });
      }

      throw new Error(`Twitter API Response Error: ${error.message}`, {
        cause: error.errors,
      });
    }

    // 不明なエラー
    throw new Error("An unknown error occurred while sending the tweet.", {
      cause: error,
    });
  }
};
