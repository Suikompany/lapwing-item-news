import { describe, it, expect } from "vitest";
import { getEnv } from "./envParam";

describe("envParam", async () => {
  it("should parse BLOCKED_SUBDOMAINS as array when set", () => {
    const env: Parameters<typeof getEnv>[0] = {
      STAGE: "dev",
      ALLOW_TWEET: "true",
      BUCKET_NAME: "test-bucket",
      BLOCKED_SUBDOMAINS: "foo,bar",
    };

    const result = getEnv(env);
    expect(result.BLOCKED_SUBDOMAINS).toEqual(["foo", "bar"]);
  });

  it("should default BLOCKED_SUBDOMAINS to empty array when not set", () => {
    const env: Parameters<typeof getEnv>[0] = {
      STAGE: "dev",
      ALLOW_TWEET: "true",
      BUCKET_NAME: "test-bucket",
      BLOCKED_SUBDOMAINS: undefined,
    };

    const result = getEnv(env);
    expect(result.BLOCKED_SUBDOMAINS).toEqual([]);
  });

  it("should convert ALLOW_TWEET to true when set to 'true'", () => {
    const env: Parameters<typeof getEnv>[0] = {
      STAGE: "dev",
      ALLOW_TWEET: "true",
      BUCKET_NAME: "test-bucket",
    };

    const result = getEnv(env);

    expect(result.ALLOW_TWEET).toBe(true);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should convert ALLOW_TWEET to false when not set or not 'true'", () => {
    const env: Parameters<typeof getEnv>[0] = {
      STAGE: "dev",
      BUCKET_NAME: "test-bucket",
    };

    const result = getEnv(env);

    expect(result.ALLOW_TWEET).toBe(false);
    expect(result.BUCKET_NAME).toBe("test-bucket");
  });

  it("should throw an error if STAGE is missing", () => {
    const env: Parameters<typeof getEnv>[0] = {
      ALLOW_TWEET: "true",
      BUCKET_NAME: "test-bucket",
    };

    expect(() => getEnv(env)).toThrowError(
      'Invalid key: Expected "STAGE" but received undefined',
    );
  });

  it("should throw an error if BUCKET_NAME is missing", () => {
    const env: Parameters<typeof getEnv>[0] = {
      STAGE: "dev",
      ALLOW_TWEET: "true",
    };

    expect(() => getEnv(env)).toThrowError(
      'Invalid key: Expected "BUCKET_NAME" but received undefined',
    );
  });
});
