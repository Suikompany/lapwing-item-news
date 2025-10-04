import { fetchTwitterCredentials } from "./ssmParam";

const mocks = vi.hoisted(() => ({
  getParametersByName: vi.fn(),
}));

vi.mock("@aws-lambda-powertools/parameters/ssm", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@aws-lambda-powertools/parameters/ssm")
  >()),
  getParametersByName: mocks.getParametersByName,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchTwitterCredentials", () => {
  const PARAM_NAMES = [
    "/LapNewItemScrapedLog/Twitter/AccessToken",
    "/LapNewItemScrapedLog/Twitter/AccessTokenSecret",
    "/LapNewItemScrapedLog/Twitter/ApiKey",
    "/LapNewItemScrapedLog/Twitter/ApiSecret",
  ] as const;

  it("fetch valid Twitter API tokens", async () => {
    mocks.getParametersByName.mockResolvedValueOnce({
      [PARAM_NAMES[0]]: "access-token",
      [PARAM_NAMES[1]]: "access-token-secret",
      [PARAM_NAMES[2]]: "api-key",
      [PARAM_NAMES[3]]: "api-secret",
    });

    const result = await fetchTwitterCredentials();

    expect(result).toEqual({
      accessToken: "access-token",
      accessTokenSecret: "access-token-secret",
      apiKey: "api-key",
      apiSecret: "api-secret",
    });
  });

  it("fetch empty Twitter API tokens", async () => {
    mocks.getParametersByName.mockResolvedValueOnce({
      [PARAM_NAMES[0]]: "",
      [PARAM_NAMES[1]]: "",
      [PARAM_NAMES[2]]: "",
      [PARAM_NAMES[3]]: "",
    });

    const result = await fetchTwitterCredentials();

    expect(result).toEqual({
      accessToken: "",
      accessTokenSecret: "",
      apiKey: "",
      apiSecret: "",
    });
  });

  it("fetch missing Twitter API tokens", async () => {
    mocks.getParametersByName.mockResolvedValueOnce({
      [PARAM_NAMES[0]]: "access-token",
      [PARAM_NAMES[1]]: "access-token-secret",
      [PARAM_NAMES[2]]: "api-key",
      // Missing api-secret
    });

    await expect(fetchTwitterCredentials()).rejects.toThrowError(
      'Invalid key: Expected "/LapNewItemScrapedLog/Twitter/ApiSecret" but received undefined',
    );
  });
});
