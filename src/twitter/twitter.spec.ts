import { type ErrorV2, TwitterApi } from "twitter-api-v2";

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

  it("should throw an error if tweet creation fails", async () => {
    const mockPost = vi.fn().mockResolvedValueOnce({
      data: {
        data: undefined,
        // いずれ正しく作りたい https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/errors.md
        errors: [
          {
            title: "title",
            detail: "detail",
            errors: [{ message: "errors[0].message" }],
            type: "",
          },
        ] as ErrorV2[],
      },
      rateLimit: undefined,
    });

    twitterPostMock.mockImplementation(mockPost);

    await expect(
      createTweet({
        productName: "Product",
        productId: 1,
        hashtags: ["#tag1", "#tag2"],
      }),
    ).rejects.toThrow("Failed to create a tweet");
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
});
