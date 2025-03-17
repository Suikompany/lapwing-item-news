export * from "twitter-api-v2";

export const TwitterApi = vi.fn().mockReturnValue({
  readWrite: {
    v2: {
      post: vi.fn(),
    },
  },
});
