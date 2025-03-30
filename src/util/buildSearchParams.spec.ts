import { buildURLSearchParams } from "./buildSearchParams";

describe("buildURLSearchParams", () => {
  it("should convert a single key-value pair into URLSearchParams", () => {
    const params = { key: "value" };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key=value");
  });

  it("should handle multiple key-value pairs", () => {
    const params = { key1: "value1", key2: "value2" };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key1=value1&key2=value2");
  });

  it("should handle array values for a single key", () => {
    const params = { key: ["value1-1", "value1-2"] };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key=value1-1&key=value1-2");
  });

  it("should handle mixed single and array values for different keys", () => {
    const params = { key1: "value1", key2: ["value2-1", "value2-2"] };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key1=value1&key2=value2-1&key2=value2-2");
  });

  it("should handle an empty string value as a valid query parameter", () => {
    const params = { key: "" };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key=");
  });

  it("should ignore empty array values but include other valid keys", () => {
    const params = { key1: "value1", key2: [] };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("key1=value1");
  });

  it("should ignore an empty object", () => {
    const params = {};
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("");
  });

  it("should ignore an empty array value", () => {
    const params = { key: [] };
    const result = buildURLSearchParams(params);
    expect(result.toString()).toBe("");
  });
});
