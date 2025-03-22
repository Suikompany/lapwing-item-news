import type { Handler } from "aws-lambda";

import { scrapeProductList } from "./booth/products";
import { createMultipleTweets } from "./twitter/twitter";
import { saveScrapedLog } from "./db/dynamodb";
import { fetchLatestProductId, putLatestProductId } from "./param/ssmParam";
import { truncateUnderMin } from "./util/truncateUnderMin";

export const handler: Handler = async (event, context) => {
  const startScrapedAt = truncateUnderMin(new Date());

  // 商品一覧（最新が1番目）を取得
  const productList = await scrapeProductList();

  // 前回スクレイピング時の最新商品 ID を取得
  const latestProductId = await fetchLatestProductId();
  console.debug("latestProductId:", latestProductId);

  // 前回のを差し引いて新しい商品のみ求める
  const latestInPrevProductIdIndex = productList.findIndex(
    (product) => product.id === latestProductId,
  );
  const newProductList = productList.slice(0, latestInPrevProductIdIndex);
  console.debug("newProducts:", newProductList);

  // 新しい商品がない場合は早期終了
  if (newProductList.length < 1) {
    return;
  }
  // biome-ignore lint/style/noUselessElse: <1の条件が削除された場合、早期リターンが削除されるため
  else {
    // 最新の商品 ID を保存
    await putLatestProductId(newProductList[0].id);
  }

  // 時系列通りにツイートするため、公開日時の昇順にしたパラメータを作成
  const tweetParams = newProductList.toReversed().map((product) => ({
    productName: product.name,
    productId: product.id,
    hashtags: [],
    // hashtags: ["#Lapwing"], 試験運用中はタグなし
  }));
  const tweetResultList = await createMultipleTweets(tweetParams);
  const latestRateLimit = tweetResultList.findLast(
    (result) => result.type === "success",
  )?.rateLimit;
  console.debug("rateLimit:", latestRateLimit);

  // 公開日時が降順の newProductIdList に併せて tweetIdList も降順にする
  const tweetIdList = tweetResultList.toReversed().map((result) => {
    if (result.type === "success") {
      return result.id;
    }
    return undefined;
  });
  console.debug("tweetIds:", tweetIdList);

  // DB に保存
  const newProductIdList = newProductList.map(({ id }) => id);
  await saveScrapedLog(startScrapedAt, newProductIdList, tweetIdList);
  console.debug("saved ScrapedAt:", startScrapedAt);

  return context.logStreamName;
};
