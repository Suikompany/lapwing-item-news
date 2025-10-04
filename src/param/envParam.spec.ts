import { describe, it, expect, beforeEach } from "vitest";
import { getEnv } from "./envParam";

describe("envParam", async () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv }; // 環境変数をリセット
  });

  afterEach(() => {
    process.env = originalEnv; // 元の環境変数に戻す
  });

  it("should convert ALLOW_TWEET to true when set to 'true'", () => {
    process.env.ALLOW_TWEET = "true";
    process.env.BUCKET_NAME = "test-bucket";

    const result = getEnv(process.env);

    expect(result.ALLOW_TWEET).toBe(true);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should convert ALLOW_TWEET to false when not set or not 'true'", () => {
    process.env.BUCKET_NAME = "test-bucket";

    const result = getEnv(process.env);

    expect(result.ALLOW_TWEET).toBe(false);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should throw an error if BUCKET_NAME is missing", () => {
    process.env.ALLOW_TWEET = "true";

    expect(() => getEnv(process.env)).toThrowError(/BUCKET_NAME/);
  });
});
