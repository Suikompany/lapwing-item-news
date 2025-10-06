import { fetchTwitterCredentials } from "./ssmParam";

const mocks = vi.hoisted(() => ({
  getParameter: vi.fn(),
  getParametersByName: vi.fn(),
}));

vi.mock("@aws-lambda-powertools/parameters/ssm", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@aws-lambda-powertools/parameters/ssm")
  >()),
  getParameter: mocks.getParameter,
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
    mocks.getParameter.mockResolvedValueOnce(
      JSON.stringify({
        access_token: "access_token",
        access_token_secret: "access_token_secret",
        api_key: "api_key",
        api_secret: "api_secret",
      }),
    );

    const result = await fetchTwitterCredentials("dev");

    expect(result).toEqual({
      accessToken: "access_token",
      accessTokenSecret: "access_token_secret",
      apiKey: "api_key",
      apiSecret: "api_secret",
    });
  });

  it("fetch empty Twitter API tokens", async () => {
    mocks.getParameter.mockResolvedValueOnce(
      JSON.stringify({
        access_token: "",
        access_token_secret: "",
        api_key: "",
        api_secret: "",
      }),
    );

    const result = await fetchTwitterCredentials("dev");

    expect(result).toEqual({
      accessToken: "",
      accessTokenSecret: "",
      apiKey: "",
      apiSecret: "",
    });
  });

  it("fetch missing Twitter API tokens", async () => {
    mocks.getParameter.mockResolvedValueOnce(
      JSON.stringify({
        access_token: "",
        access_token_secret: "",
        api_key: "",
        // Missing api_secret
      }),
    );

    await expect(fetchTwitterCredentials("dev")).rejects.toThrowError(
      'Invalid key: Expected "api_secret" but received undefined',
    );
  });
});
