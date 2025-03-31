import type { Handler } from "aws-lambda";

import { scrapeProductList } from "./booth/products";
import { createMultipleTweets } from "./twitter/twitter";
import { saveScrapedLog } from "./db/dynamodb";
import { fetchLatestProductId, putLatestProductId } from "./param/ssmParam";
import { truncateUnderMin } from "./util/truncateUnderMin";

export const handler: Handler = async (event, context) => {
  const startScrapedAt = truncateUnderMin(new Date());

  // 今回の商品一覧（最新が1番目）を取得
  const productList = await scrapeProductList();

  // 前回の最新商品 ID を取得
  const prevLatestProductId = await fetchLatestProductId();
  console.debug("prevLatestProductId:", prevLatestProductId);

  // 今回の一覧にある前回の最新商品のインデックスを求める
  const indexOfPrevLatestProductId = productList.findIndex(
    (product) => product.id === prevLatestProductId,
  );
  console.debug("indexOfPrevLatestProductId:", indexOfPrevLatestProductId);

  // 今回の最新商品 ID が前回の最新商品 ID と同じ場合はパラメータ更新前に早期終了
  if (indexOfPrevLatestProductId === 0) {
    return;
  }

  // 今回の最新商品 ID でパラメータを更新
  await putLatestProductId(productList[0].id);

  // 前回の最新商品が見つからなかった場合は早期終了
  if (indexOfPrevLatestProductId === -1) {
    return;
  }

  // 今回新たに見つかった商品一覧を求める
  const newProductList = productList.slice(0, indexOfPrevLatestProductId);
  console.debug("newProducts:", newProductList);

  // 新しい商品が一つもない場合は早期終了
  if (newProductList.length < 1) {
    return;
  }

  // 時系列通りにツイートするため、公開日時の昇順にしたパラメータを作成
  const tweetParams = newProductList.toReversed().map((product) => ({
    productName: product.name,
    productId: product.id,
    hashtags: [],
    // hashtags: ["#Lapwing"], 試験運用中はタグなし
  }));
  const tweetResultList = await createMultipleTweets(tweetParams);
  console.debug("tweetResults:", tweetResultList);

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
