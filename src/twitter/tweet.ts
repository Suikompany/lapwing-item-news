import type { SendTweetV2Params, TweetV2PostTweetResult } from "twitter-api-v2";
import { client } from "./client";
import { buildProductUrl } from "../booth/products";

type SendTweetParams = {
  text: string;
};

type SendTweetRet = {
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
};

/** ツイートを送信する */
export const sendTweet = async ({
  text,
}: SendTweetParams): Promise<SendTweetRet> => {
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

type BuildTweetTextParams = {
  productName: string;
  productId: number;
  hashtags: `#${string}`[];
};

export const buildTweetText = ({
  productName,
  productId,
  hashtags,
}: BuildTweetTextParams) => {
  const productNameLine = productName;
  const hashtagsLine = hashtags.join(" ");
  const urlLine = buildProductUrl(productId);

  return `${productNameLine}\n${hashtagsLine}\n${urlLine}` as const;
};
