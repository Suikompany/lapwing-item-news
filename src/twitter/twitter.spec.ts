import { ApiRequestError, ApiResponseError, TwitterApi } from "twitter-api-v2";

import { createMultipleTweets, createTweet, buildTweetText } from "./twitter";

vi.mock("twitter-api-v2");

afterEach(() => {
  vi.clearAllMocks();
});

describe("buildTweetText", () => {
  it("タグありで正しく生成される", () => {
    const result = buildTweetText({
      productName: "商品名",
      productId: 123,
      shopName: "ショップ名",
      hashtags: ["#tag1", "#tag2"],
    });
    expect(result).toBe(
      "商品名\nショップ名\n#tag1 #tag2\nhttps://booth.pm/ja/items/123",
    );
  });

  it("タグなしで正しく生成される", () => {
    const result = buildTweetText({
      productName: "商品名",
      productId: 123,
      shopName: "ショップ名",
      hashtags: [],
    });
    expect(result).toBe("商品名\nショップ名\n\nhttps://booth.pm/ja/items/123");
  });

  it("タグが1つでも正しく生成される", () => {
    const result = buildTweetText({
      productName: "商品名",
      productId: 123,
      shopName: "ショップ名",
      hashtags: ["#tag1"],
    });
    expect(result).toBe(
      "商品名\nショップ名\n#tag1\nhttps://booth.pm/ja/items/123",
    );
  });

  it("productIdが0でも正しく生成される", () => {
    const result = buildTweetText({
      productName: "商品名",
      productId: 0,
      shopName: "ショップ名",
      hashtags: ["#tag1"],
    });
    expect(result).toBe(
      "商品名\nショップ名\n#tag1\nhttps://booth.pm/ja/items/0",
    );
  });

  it("productNameが空でも正しく生成される", () => {
    const result = buildTweetText({
      productName: "",
      productId: 123,
      shopName: "ショップ名",
      hashtags: ["#tag1"],
    });
    expect(result).toBe("\nショップ名\n#tag1\nhttps://booth.pm/ja/items/123");
  });
});

describe("createMultipleTweets", () => {
  const client = new TwitterApi().readWrite.v2;
  const twitterPostMock = vi.mocked(client.post);

  it("create 1 tweet from createMultipleTweets", async () => {
    const postMockImpl = vi.fn().mockResolvedValueOnce({
      data: {
        data: {
          id: "123",
          text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
        },
        errors: undefined,
      },
      rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
    });

    twitterPostMock.mockImplementation(postMockImpl);

    const result = await createMultipleTweets(client, [
      "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
    ]);

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
    expect(result).toEqual([
      {
        type: "success",
        id: "123",
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      },
    ]);
  });

  it("create 2 tweets from createMultipleTweets", async () => {
    const postMockImpl = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "100001",
            text: "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
          },
          errors: undefined,
        },
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "100002",
            text: "Product2\n#tag3 #tag4\nhttps://booth.pm/ja/items/2",
          },
          errors: undefined,
        },
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      });

    twitterPostMock.mockImplementation(postMockImpl);

    const result = await createMultipleTweets(client, [
      "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
      "Product2\n#tag3 #tag4\nhttps://booth.pm/ja/items/2",
    ]);

    expect(twitterPostMock).toHaveBeenNthCalledWith(
      1,
      "tweets",
      { text: "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
    expect(twitterPostMock).toHaveBeenNthCalledWith(
      2,
      "tweets",
      { text: "Product2\n#tag3 #tag4\nhttps://booth.pm/ja/items/2" },
      { fullResponse: true },
    );
    expect(result).toEqual([
      {
        type: "success",
        id: "100001",
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      },
      {
        type: "success",
        id: "100002",
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      },
    ]);
  });

  it("create 3 tweets, 2nd is errored from createMultipleTweets", async () => {
    const postMockImpl = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "100001",
            text: "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
          },
        },
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      })
      .mockRejectedValueOnce(
        new ApiResponseError("Error message", {
          errors: [{ message: "Error message" }],
          rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
          code: 400,
        } as unknown as ConstructorParameters<typeof ApiResponseError>[1]),
      )
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "100003",
            text: "Product3\n#tag3 #tag4\nhttps://booth.pm/ja/items/3",
          },
        },
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      });

    twitterPostMock.mockImplementation(postMockImpl);

    const result = await createMultipleTweets(client, [
      "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1",
      "Product2\n#tag3 #tag4\nhttps://booth.pm/ja/items/2",
      "Product3\n#tag3 #tag4\nhttps://booth.pm/ja/items/3",
    ]);

    expect(twitterPostMock).toHaveBeenNthCalledWith(
      1,
      "tweets",
      { text: "Product1\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
    expect(twitterPostMock).toHaveBeenNthCalledWith(
      2,
      "tweets",
      { text: "Product2\n#tag3 #tag4\nhttps://booth.pm/ja/items/2" },
      { fullResponse: true },
    );
    expect(twitterPostMock).toHaveBeenNthCalledWith(
      3,
      "tweets",
      { text: "Product3\n#tag3 #tag4\nhttps://booth.pm/ja/items/3" },
      { fullResponse: true },
    );
    expect(result).toEqual([
      {
        type: "success",
        id: "100001",
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      },
      {
        type: "error",
        error: new Error("Twitter API Response Error: Error message"),
      },
      {
        type: "success",
        id: "100003",
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      },
    ]);
  });
});

describe("createTweet", () => {
  const client = new TwitterApi().readWrite.v2;
  const twitterPostMock = vi.mocked(client.post);

  it("should create a tweet successfully", async () => {
    const postMockImpl = vi.fn().mockResolvedValueOnce({
      data: {
        data: { id: "123", text: "Product\n#tag1 #tag2\nhttp://example.com" },
        errors: undefined,
      },
      rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
    });

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = await createTweet(client, tweetText);

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
    expect(result).toEqual({
      id: "123",
      rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
    });
  });

  it("allow empty hashtags", async () => {
    const postMockImpl = vi.fn().mockResolvedValueOnce({
      data: {
        data: { id: "123", text: "Product\n\nhttp://example.com" },
        errors: undefined,
      },
      rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
    });

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: [],
    });
    const result = await createTweet(client, tweetText);

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
    expect(result).toEqual({
      id: "123",
      rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
    });
  });

  // ここからエラーハンドリング系の単体テストを追加
  it("should handle unknown errors", async () => {
    const postMockImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unknown error occurred"));

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = createTweet(client, tweetText);

    await expect(result).rejects.toThrow(
      "An unknown error occurred while sending the tweet.",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });

  it("should handle a request error", async () => {
    const postMockImpl = vi.fn().mockRejectedValueOnce(
      new ApiRequestError("Request Error", {
        error: new Error(),
        request: {},
      } as unknown as ConstructorParameters<typeof ApiRequestError>[1]),
    );

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = createTweet(client, tweetText);

    await expect(result).rejects.toThrow(
      "Twitter API Request Error: Request Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });

  it("should handle an authentication error", async () => {
    const postMockImpl = vi.fn().mockRejectedValueOnce(
      new ApiResponseError("Auth Error", {
        errors: [{ message: "Error message" }],
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
        code: 401,
      } as unknown as ConstructorParameters<typeof ApiResponseError>[1]),
    );

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = createTweet(client, tweetText);

    await expect(result).rejects.toThrow("Twitter API Auth Error: Auth Error");

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });

  it("should handle a rate limit error", async () => {
    const postMockImpl = vi.fn().mockRejectedValueOnce(
      new ApiResponseError("Rate Limit Error", {
        errors: [{ message: "Error message" }],
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
        code: 429,
      } as unknown as ConstructorParameters<typeof ApiResponseError>[1]),
    );

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = createTweet(client, tweetText);

    await expect(result).rejects.toThrow(
      "Twitter API Rate Limit Error: Rate Limit Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });

  it("should handle an unknown response error", async () => {
    const postMockImpl = vi.fn().mockRejectedValueOnce(
      new ApiResponseError("Response Error", {
        errors: [{ message: "Error message" }],
        rateLimit: { limit: 300, remaining: 299, reset: 1633024800 },
      } as unknown as ConstructorParameters<typeof ApiResponseError>[1]),
    );

    twitterPostMock.mockImplementation(postMockImpl);

    const tweetText = buildTweetText({
      productName: "Product",
      productId: 1,
      shopName: "Shop",
      hashtags: ["#tag1", "#tag2"],
    });
    const result = createTweet(client, tweetText);

    await expect(result).rejects.toThrow(
      "Twitter API Response Error: Response Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\nShop\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });
});
