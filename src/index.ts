import { scrapeProductList } from "./booth/products";
import { createMultipleTweets } from "./twitter/twitter";
import { truncateUnderMin } from "./util/truncateUnderMin";
import { getData, putData, putLog } from "./db/r2";
import { ALLOW_TWEET } from "./param/envParam";

const main = async () => {
  const startScrapedAt = truncateUnderMin(new Date());

  // 前回の商品ID一覧を取得
  const { product_ids: prevProductIdList } = await getData();

  // 今回の商品一覧（最新が1番目）を取得
  const productList = await scrapeProductList();

  console.log("productList:", JSON.stringify(productList, null, 2));

  // 今回新たに見つかった商品一覧を求める
  const newProductList = productList.filter(
    ({ id }) => !prevProductIdList.includes(id),
  );

  console.log("newProductList:", JSON.stringify(newProductList, null, 2));

  // 新しい商品が一つもない場合は早期終了
  if (newProductList.length < 1) {
    return;
  }

  // 今回の商品一覧で更新
  await putData(
    startScrapedAt,
    productList.map(({ id }) => id),
  );

  // 時系列通りにツイートするため、公開日時の昇順にしたパラメータを作成
  const tweetParamList = newProductList.toReversed().map((product) => ({
    productName: product.name,
    productId: product.id,
    hashtags: [],
    // hashtags: ["#Lapwing"], 試験運用中はタグなし
  }));

  // ツイート (ALLOW_TWEET が true の場合のみ)
  const tweetResultList = ALLOW_TWEET
    ? await createMultipleTweets(tweetParamList)
    : [];

  console.log("tweetResults:", JSON.stringify(tweetResultList, null, 2));

  // 公開日時が降順の newProductIdList に併せて tweetIdList も降順にする
  const tweetIdList = tweetResultList.toReversed().map((result) => {
    if (result.type === "success") {
      return result.id;
    }
    return null;
  });
  console.log("tweetIds:", JSON.stringify(tweetIdList, null, 2));

  // ログを保存
  await putLog(
    startScrapedAt,
    newProductList.map((product, index) => ({
      product_id: product.id,
      tweet_id: tweetIdList.at(index) ?? null,
    })),
  );
};

const scheduledHandler: ExportedHandlerScheduledHandler = async (
  controller,
  _,
  ctx,
) => {
  console.log("Scheduled event begin");
  await main();
  console.log("Scheduled event end");
};

export default {
  scheduled: scheduledHandler,
} satisfies ExportedHandler<Env>;
