import type { Handler } from "aws-lambda";

import { scrapeProductList } from "./booth/products";
import {
  buildTweetText,
  createMultipleTweets,
  createTwitterClient,
} from "./twitter/twitter";
import { getScrapedData, putScrapedData, putLog } from "./db/s3";
import { fetchTwitterCredentials } from "./param/ssmParam";
import { truncateUnderMin } from "./util/truncateUnderMin";
import { getEnv } from "./param/envParam";

const env = getEnv(process.env);

export const handler: Handler = async (event, context) => {
  const startScrapedAt = truncateUnderMin(new Date());

  // 今回の商品一覧（最新が1番目）を取得
  const productList = await scrapeProductList();
  console.debug("productList:", JSON.stringify(productList, null, 2));

  // 前回の商品一覧を取得
  const prevScrapedData = await getScrapedData(env.BUCKET_NAME);
  const prevProductIdList = prevScrapedData?.product_ids ?? [];
  console.debug("prevProductIdList:", prevProductIdList);

  // 最新の商品が非公開にされたとき直前（51件目）の商品が新作判定されるのを避けるため、少し余裕を持たせて30件で比較している
  const newProducts = productList
    .slice(0, 30)
    .filter((product) => !prevProductIdList.includes(product.id));
  console.debug("newProducts:", JSON.stringify(newProducts, null, 2));

  // 新しい商品が一つもない場合は早期終了
  if (newProducts.length < 1) {
    return;
  }

  // 今回の商品一覧で更新
  await putScrapedData(
    env.BUCKET_NAME,
    startScrapedAt,
    productList.map(({ id }) => id),
  );

  // ブロックサブドメインの商品をフィルタ
  const filteredNewProducts = newProducts.filter(
    (product) => !env.BLOCKED_SUBDOMAINS.includes(product.shopSubdomain),
  );

  // フィルタされて残った商品がない場合はツイート前に早期終了
  if (filteredNewProducts.length < 1) {
    return;
  }

  // 時系列通りにツイートするため、公開日時の昇順にしたパラメータを作成
  const tweetParams = filteredNewProducts
    .map((product) => ({
      productName: product.name,
      productId: product.id,
      shopName: product.shopName,
      hashtags: [],
      // hashtags: ["#Lapwing"], 試験運用中はタグなし
    }))
    .reverse();

  const tweetIdList = await make_tweets(tweetParams);

  // ログを保存
  await putLog(
    env.BUCKET_NAME,
    startScrapedAt,
    filteredNewProducts.map((product, index) => ({
      product_id: product.id,
      tweet_id: tweetIdList.at(index) ?? null,
    })),
  );

  return context.logStreamName;
};

const make_tweets = async (
  params: {
    productName: string;
    productId: number;
    shopName: string;
    hashtags: `#${string}`[];
  }[],
) => {
  if (!env.ALLOW_TWEET) {
    console.info(
      "Skipping tweet creation due to the environment variable `ALLOW_TWEET`.",
    );
    return [];
  }

  const twitterClient = createTwitterClient({
    tokens: await fetchTwitterCredentials(env.STAGE),
  });

  const tweetTexts = params.map(
    ({ productName, productId, shopName, hashtags }) =>
      buildTweetText({ productName, productId, shopName, hashtags }),
  );

  const tweetResultList = await createMultipleTweets(twitterClient, tweetTexts);
  console.debug("tweetResults:", JSON.stringify(tweetResultList, null, 2));

  // 公開日時が降順の newProductIdList に併せて tweetIdList も降順にする
  const tweetIdList = tweetResultList
    .map((result) => {
      if (result.type === "success") {
        return result.id;
      }
      return null;
    })
    .reverse();
  console.debug("tweetIds:", JSON.stringify(tweetIdList, null, 2));

  return tweetIdList;
};
