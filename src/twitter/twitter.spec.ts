import { ApiRequestError, ApiResponseError, TwitterApi } from "twitter-api-v2";

import { createTweet } from "./twitter";

vi.mock("twitter-api-v2");

vi.mock("../param/ssmParam", () => ({
  fetchTwitterApiTokens: vi.fn().mockResolvedValue({
    apiKey: "testApiKey",
    apiSecret: "testApiSecret",
    accessToken: "testAccessToken",
    accessTokenSecret: "testAccessTokenSecret",
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
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

    const result = await createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
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

    const result = await createTweet({
      productName: "Product",
      productId: 1,
      hashtags: [],
    });

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n\nhttps://booth.pm/ja/items/1" },
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

    const result = createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    await expect(result).rejects.toThrow(
      "An unknown error occurred while sending the tweet.",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
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

    const result = createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    await expect(result).rejects.toThrow(
      "Twitter API Request Error: Request Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
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

    const result = createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    await expect(result).rejects.toThrow("Twitter API Auth Error: Auth Error");

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
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

    const result = createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    await expect(result).rejects.toThrow(
      "Twitter API Rate Limit Error: Rate Limit Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
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

    const result = createTweet({
      productName: "Product",
      productId: 1,
      hashtags: ["#tag1", "#tag2"],
    });

    await expect(result).rejects.toThrow(
      "Twitter API Response Error: Response Error",
    );

    expect(twitterPostMock).toHaveBeenCalledWith(
      "tweets",
      { text: "Product\n#tag1 #tag2\nhttps://booth.pm/ja/items/1" },
      { fullResponse: true },
    );
  });
});
