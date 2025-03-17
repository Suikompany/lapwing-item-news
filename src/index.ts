import type { Handler } from "aws-lambda";

import { scrapeProductList } from "./booth/products";
import { createTweet } from "./twitter/twitter";
import { saveScrapedLog } from "./db/dynamodb";

import { truncateUnderMin } from "./util";
import { fetchLatestProductId, putLatestProductId } from "./param/ssmParam";

export const handler: Handler = async (event, context) => {
  const startScrapedAt = truncateUnderMin(new Date());

  // 商品一覧を取得
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

  // ツイートを作成
  const tweetResultList = await Promise.all(
    newProductList.map(async (product) => {
      const result = await createTweet({
        productName: product.name,
        productId: product.id,
        hashtags: [],
        // hashtags: ["#Lapwing"], 試験運用中はタグなし
      });
      return result;
    }),
  );
  const tweetIdList = tweetResultList.map((result) => result.id);
  console.debug("tweetIds:", tweetIdList);
  console.debug("rateLimit:", tweetResultList.at(-1)?.rateLimit);

  // DB に保存
  const newProductIdList = newProductList.map(({ id }) => id);
  await saveScrapedLog(startScrapedAt, newProductIdList, tweetIdList);
  console.debug("saved ScrapedAt:", startScrapedAt);

  return context.logStreamName;
};
