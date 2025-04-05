import { handler } from "./index";

import { scrapeProductList } from "./booth/products";
import { saveScrapedLog } from "./db/dynamodb";
import { fetchLatestProductId, putLatestProductId } from "./param/ssmParam";
import { createMultipleTweets } from "./twitter/twitter";

vi.mock("./param/ssmParam", () => ({
  fetchTwitterApiTokens: vi.fn().mockResolvedValue({
    apiKey: "testApiKey",
    apiSecret: "testApiSecret",
    accessToken: "testAccessToken",
    accessTokenSecret: "testAccessTokenSecret",
  }),
  fetchLatestProductId: vi.fn().mockResolvedValue(Number.MAX_SAFE_INTEGER),
  putLatestProductId: vi.fn(),
}));

vi.mock("./twitter/twitter", () => ({
  client: vi.fn(),
  createMultipleTweets: vi.fn(),
}));

vi.mock("./booth/products", () => ({
  buildProductUrl: vi.fn().mockReturnValue("http://example.com"),
  scrapeProductList: vi.fn().mockResolvedValue([{ id: 1, name: "JustDummy" }]),
}));

vi.mock("./db/dynamodb", () => ({
  saveScrapedLog: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const DUMMY_CONTEXT = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "",
  functionVersion: "",
  invokedFunctionArn: "",
  memoryLimitInMB: "",
  awsRequestId: "",
  logGroupName: "",
  logStreamName: "logStreamName",
  getRemainingTimeInMillis: (): number => {
    throw new Error("Function not implemented.");
  },
  done: (error?: Error, result?: unknown): void => {
    throw new Error("Function not implemented.");
  },
  fail: (error: Error | string): void => {
    throw new Error("Function not implemented.");
  },
  succeed: (messageOrObject: unknown): void => {
    throw new Error("Function not implemented.");
  },
};
const callbackMock = vi.fn();

/** 公開日時の降順（IDが降順とは限らない） */
const DUMMY_PRODUCT_LIST = [
  {
    id: 6670110,
    name: "【13アバター対応】Fantasy Youth Mouton【VRChat向け衣装モデル】",
  },
  {
    id: 6670109,
    name: "【複数アバター対応 3D衣装】マジカルノリヤ / MAGICALNORIYA",
  },
  {
    id: 6670108,
    name: "シュガーヘア 【 2種セット / 髪型 / アップヘア 】 ヘアアクセサリー付き Sugar Hair",
  },
  {
    id: 6670107,
    name: "【3D】Mystic Bloke (森羅/しなの/愛莉/マヌカ/ラシューシャ/萌/桔梗/Lapwing/セレスティア/Sio/水瀬/狛乃対応) #LAYON服 ＃LAYONコーデ",
  },
  {
    id: 6670106,
    name: "キューティショート 【 髪型 / ヘア 】 Cutie Short Hair",
  },
  {
    id: 6670105,
    name: "【15アバター対応】MagicMaid【VRChat】",
  },
  {
    id: 6670104,
    name: "Twist Bun Hair",
  },
  {
    id: 6670103,
    name: "2024年第2弾『エレガントメイド』Elegant Maid 💜",
  },
  {
    id: 6670102,
    name: "Curly Short Cut",
  },
  {
    id: 6680101, // ID降順とは限らない
    name: "【Nail&Ring】STARDROPS-もっと、近くへ-【27アバター対応】 #STARDROPLAND",
  },
  {
    id: 6670100,
    name: "320アバター対応【光る】NebulaTexture【導入ガイド付き】",
  },
  {
    id: 6670099,
    name: "四つ葉のピン【VRChat対応】",
  },
  {
    id: 6670098,
    name: "[Lapwing] Phoenix_Ears",
  },
  {
    id: 6670097,
    name: "【Lapwing対応】ミラージュアイテクスチャ",
  },
  {
    id: 6670096,
    name: "【セール中】Lunar Glasses【VRChat用サングラス】",
  },
  {
    id: 6670095,
    name: "洋風の羽織【期間限定】",
  },
  {
    id: 6670094,
    name: "Starlight Eye Texture【glow eyes】",
  },
  {
    id: 6670093,
    name: "【VRChat対応】CosmicNightヘアスタイル【MA対応】",
  },
];

describe("handler", () => {
  const createMultipleTweetsMock = vi.mocked(createMultipleTweets);
  const scrapeProductListMock = vi.mocked(scrapeProductList);
  const fetchLatestProductIdMock = vi.mocked(fetchLatestProductId);
  const putLatestProductIdMock = vi.mocked(putLatestProductId);
  const saveScrapedLogMock = vi.mocked(saveScrapedLog);

  // TODO: putLatestProductIdMock が呼び出されることを確認するようにテストケースを修正する

  it("found 0 products and exit early", async () => {
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[0].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createMultipleTweetsMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
    expect(result).toEqual(undefined);
  });

  it("found 1 new product and tweets it", async () => {
    createMultipleTweetsMock.mockResolvedValueOnce([
      {
        type: "success",
        id: "100001",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 93,
          day: { reset: 123, limit: 17, remaining: 10 },
        },
      },
    ]);
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[1].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createMultipleTweetsMock).toHaveBeenCalledTimes(1);
    expect(createMultipleTweetsMock).toHaveBeenCalledWith([
      {
        productName: DUMMY_PRODUCT_LIST[0].name,
        productId: DUMMY_PRODUCT_LIST[0].id,
        hashtags: [],
      },
    ]);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(saveScrapedLogMock).toHaveBeenCalledWith(
      expect.any(Date),
      [DUMMY_PRODUCT_LIST[0].id],
      ["100001"],
    );
    expect(result).toEqual("logStreamName");
  });

  it("found 2 new products and tweets them", async () => {
    createMultipleTweetsMock.mockResolvedValueOnce([
      {
        type: "success",
        id: "100001",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 93,
          day: { reset: 123, limit: 17, remaining: 10 },
        },
      },
      {
        type: "success",
        id: "100002",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 92,
          day: { reset: 123, limit: 17, remaining: 9 },
        },
      },
    ]);
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[2].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createMultipleTweetsMock).toHaveBeenCalledOnce();
    expect(createMultipleTweetsMock).toHaveBeenCalledWith([
      {
        productName: DUMMY_PRODUCT_LIST[1].name,
        productId: DUMMY_PRODUCT_LIST[1].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[0].name,
        productId: DUMMY_PRODUCT_LIST[0].id,
        hashtags: [],
      },
    ]);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(saveScrapedLogMock).toHaveBeenCalledWith(
      expect.any(Date),
      [DUMMY_PRODUCT_LIST[0].id, DUMMY_PRODUCT_LIST[1].id],
      ["100002", "100001"],
    );
    expect(result).toEqual("logStreamName");
  });

  it("found 10 new products and tweets them", async () => {
    createMultipleTweetsMock.mockResolvedValueOnce([
      {
        type: "success",
        id: "100001",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 93,
          day: { reset: 123, limit: 17, remaining: 10 },
        },
      },
      {
        type: "success",
        id: "100002",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 92,
          day: { reset: 123, limit: 17, remaining: 9 },
        },
      },
      {
        type: "success",
        id: "100003",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 91,
          day: { reset: 123, limit: 17, remaining: 8 },
        },
      },
      {
        type: "success",
        id: "100004",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 90,
          day: { reset: 123, limit: 17, remaining: 7 },
        },
      },
      {
        type: "success",
        id: "100005",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 89,
          day: { reset: 123, limit: 17, remaining: 6 },
        },
      },
      {
        type: "success",
        id: "100006",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 88,
          day: { reset: 123, limit: 17, remaining: 5 },
        },
      },
      {
        type: "success",
        id: "100007",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 87,
          day: { reset: 123, limit: 17, remaining: 4 },
        },
      },
      {
        type: "success",
        id: "100008",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 86,
          day: { reset: 123, limit: 17, remaining: 3 },
        },
      },
      {
        type: "success",
        id: "100009",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 85,
          day: { reset: 123, limit: 17, remaining: 2 },
        },
      },
      {
        type: "success",
        id: "100010",
        rateLimit: {
          reset: 1234,
          limit: 100,
          remaining: 84,
          day: { reset: 123, limit: 17, remaining: 1 },
        },
      },
    ]);
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[10].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createMultipleTweetsMock).toHaveBeenCalledOnce();
    expect(createMultipleTweetsMock).toHaveBeenCalledWith([
      {
        productName: DUMMY_PRODUCT_LIST[9].name,
        productId: DUMMY_PRODUCT_LIST[9].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[8].name,
        productId: DUMMY_PRODUCT_LIST[8].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[7].name,
        productId: DUMMY_PRODUCT_LIST[7].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[6].name,
        productId: DUMMY_PRODUCT_LIST[6].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[5].name,
        productId: DUMMY_PRODUCT_LIST[5].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[4].name,
        productId: DUMMY_PRODUCT_LIST[4].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[3].name,
        productId: DUMMY_PRODUCT_LIST[3].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[2].name,
        productId: DUMMY_PRODUCT_LIST[2].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[1].name,
        productId: DUMMY_PRODUCT_LIST[1].id,
        hashtags: [],
      },
      {
        productName: DUMMY_PRODUCT_LIST[0].name,
        productId: DUMMY_PRODUCT_LIST[0].id,
        hashtags: [],
      },
    ]);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(saveScrapedLogMock).toHaveBeenCalledWith(
      expect.any(Date),
      DUMMY_PRODUCT_LIST.slice(0, 10).map((product) => product.id),
      [
        "100010",
        "100009",
        "100008",
        "100007",
        "100006",
        "100005",
        "100004",
        "100003",
        "100002",
        "100001",
      ],
    );
    expect(result).toEqual("logStreamName");
  });

  it("should exit before update the  'latest product ID' param if the fetched latest product ID is the same as the previous one", async () => {
    const prevLatestProductId = 100001;
    fetchLatestProductIdMock.mockResolvedValueOnce(prevLatestProductId);

    // 現在の商品リスト
    const productList = [
      { id: 100001, name: "Product 1" }, // 最新の商品（前回と同じ）
      { id: 100002, name: "Product 2" },
    ];
    scrapeProductListMock.mockResolvedValueOnce(productList);

    // ハンドラーを実行
    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    // 最新商品IDの更新が呼び出されないことを確認
    expect(putLatestProductIdMock).not.toHaveBeenCalled();

    // ツイート作成関数が呼び出されないことを確認
    expect(createMultipleTweetsMock).not.toHaveBeenCalled();

    // DB保存関数が呼び出されないことを確認
    expect(saveScrapedLogMock).not.toHaveBeenCalled();

    // 処理が早期終了し、戻り値が undefined であることを確認
    expect(result).toBeUndefined();
  });

  it("should exit early where the previous latest product ID is not found in the current product list", async () => {
    fetchLatestProductIdMock.mockResolvedValueOnce(999999); // 存在しないIDを返す

    // 現在取得した商品一覧
    scrapeProductListMock.mockResolvedValueOnce([
      { id: 100001, name: "Product 1" },
      { id: 100002, name: "Product 2" },
    ]);

    // ハンドラーを実行
    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    // 最新の商品IDを保存する関数が呼び出されていることを確認
    expect(putLatestProductIdMock).toHaveBeenCalledExactlyOnceWith(100001);

    // 他は呼び出されていないことを確認
    expect(createMultipleTweetsMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
  });

  it("should handle occuring errors when scraping", async () => {
    const error = new Error("Something went wrong");
    scrapeProductListMock.mockRejectedValueOnce(error);

    await expect(handler({}, DUMMY_CONTEXT, callbackMock)).rejects.toThrow(
      "Something went wrong",
    );

    expect(createMultipleTweetsMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
  });

  it("should handle occuring errors when fetching latest product id", async () => {
    const error = new Error("Something went wrong");
    fetchLatestProductIdMock.mockRejectedValueOnce(error);

    await expect(handler({}, DUMMY_CONTEXT, callbackMock)).rejects.toThrow(
      "Something went wrong",
    );

    expect(createMultipleTweetsMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
  });

  it("should handle occuring errors when creating tweet", async () => {
    createMultipleTweetsMock.mockRejectedValueOnce(
      new Error("Something went wrong"),
    );
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[1].id);

    await expect(handler({}, DUMMY_CONTEXT, callbackMock)).rejects.toThrow(
      "Something went wrong",
    );

    expect(scrapeProductListMock).toHaveBeenCalledOnce();
    expect(fetchLatestProductIdMock).toHaveBeenCalledOnce();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
  });
});
