import { describe, it, expect, beforeEach } from "vitest";
import { getEnv } from "./envParam";

describe("envParam", async () => {
  it("should parse BLOCKED_SUBDOMAINS as array when set", () => {
    process.env.STAGE = "dev";
    process.env.ALLOW_TWEET = "true";
    process.env.BUCKET_NAME = "test-bucket";
    process.env.BLOCKED_SUBDOMAINS = "foo,bar";

    const result = getEnv(process.env);
    expect(result.BLOCKED_SUBDOMAINS).toEqual(["foo", "bar"]);
  });

  it("should default BLOCKED_SUBDOMAINS to empty array when not set", () => {
    process.env.STAGE = "dev";
    process.env.ALLOW_TWEET = "true";
    process.env.BUCKET_NAME = "test-bucket";
    process.env.BLOCKED_SUBDOMAINS = undefined;

    const result = getEnv(process.env);
    expect(result.BLOCKED_SUBDOMAINS).toEqual([]);
  });
  const originalEnv = {
    ...process.env,
  };

  beforeEach(() => {
    process.env = { ...originalEnv }; // 環境変数をリセット
  });

  afterEach(() => {
    process.env = originalEnv; // 元の環境変数に戻す
  });

  it("should convert ALLOW_TWEET to true when set to 'true'", () => {
    process.env.STAGE = "dev";
    process.env.ALLOW_TWEET = "true";
    process.env.BUCKET_NAME = "test-bucket";

    const result = getEnv(process.env);

    expect(result.ALLOW_TWEET).toBe(true);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should convert ALLOW_TWEET to false when not set or not 'true'", () => {
    process.env.STAGE = "dev";
    process.env.BUCKET_NAME = "test-bucket";

    const result = getEnv(process.env);

    expect(result.ALLOW_TWEET).toBe(false);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should throw an error if STAGE is missing", () => {
    process.env.ALLOW_TWEET = "true";
    process.env.BUCKET_NAME = "test-bucket";

    expect(() => getEnv(process.env)).toThrowError(
      'Invalid key: Expected "STAGE" but received undefined',
    );
  });

  it("should throw an error if BUCKET_NAME is missing", () => {
    process.env.STAGE = "dev";
    process.env.ALLOW_TWEET = "true";

    expect(() => getEnv(process.env)).toThrowError(
      'Invalid key: Expected "BUCKET_NAME" but received undefined',
    );
  });
});
