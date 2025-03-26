import { fetchLatestProductId, fetchTwitterApiTokens } from "./ssmParam";

import {
  GetParameterCommand,
  GetParametersCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";

vi.mock("@aws-sdk/client-ssm");

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchLatestProductId", () => {
  const PARAM_NAME = "/LapNewItemScrapedLog/LatestProductId" as const;
  const ssmClient = new SSMClient();
  const ssmSendMock = vi.mocked(ssmClient.send);

  it("fetch numeric string", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameter: {
        Name: PARAM_NAME,
        Value: "6697866",
      },
    });

    ssmSendMock.mockImplementation(sendMockFn);

    const result = await fetchLatestProductId();

    expect(result).toBe(6697866);
    expect(ssmSendMock).toHaveBeenCalledWith(expect.any(GetParameterCommand));
  });

  it("fetch non-numeric string", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameter: {
        Name: PARAM_NAME,
        Value: "abc",
      },
    });

    ssmSendMock.mockImplementation(sendMockFn);

    await expect(fetchLatestProductId()).rejects.toThrowError(
      "Invalid type: Expected number but received NaN",
    );
  });

  it("fetch empty string", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameter: {
        Name: PARAM_NAME,
        Value: "",
      },
    });

    ssmSendMock.mockImplementation(sendMockFn);

    await expect(fetchLatestProductId()).rejects.toThrowError(
      "Invalid length: Expected !0 but received 0",
    );
  });

  it("fetch non-existence parameter", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameter: undefined,
    });

    ssmSendMock.mockImplementation(sendMockFn);

    await expect(fetchLatestProductId()).rejects.toThrowError(
      "Invalid type: Expected Object but received undefined",
    );
  });
});

describe("fetchTwitterApiTokens", () => {
  const PARAM_NAMES = [
    "/LapNewItemScrapedLog/Twitter/AccessToken",
    "/LapNewItemScrapedLog/Twitter/AccessTokenSecret",
    "/LapNewItemScrapedLog/Twitter/ApiKey",
    "/LapNewItemScrapedLog/Twitter/ApiSecret",
  ] as const;
  const ssmClient = new SSMClient();
  const ssmSendMock = vi.mocked(ssmClient.send);

  it("fetch valid Twitter API tokens", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameters: [
        { Name: PARAM_NAMES[0], Value: "access-token" },
        { Name: PARAM_NAMES[1], Value: "access-token-secret" },
        { Name: PARAM_NAMES[2], Value: "api-key" },
        { Name: PARAM_NAMES[3], Value: "api-secret" },
      ],
    });

    ssmSendMock.mockImplementation(sendMockFn);

    const result = await fetchTwitterApiTokens();

    expect(result).toEqual({
      accessToken: "access-token",
      accessTokenSecret: "access-token-secret",
      apiKey: "api-key",
      apiSecret: "api-secret",
    });
    expect(ssmSendMock).toHaveBeenCalledWith(expect.any(GetParametersCommand));
  });

  it("fetch empty Twitter API tokens", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameters: [
        { Name: PARAM_NAMES[0], Value: "" },
        { Name: PARAM_NAMES[1], Value: "" },
        { Name: PARAM_NAMES[2], Value: "" },
        { Name: PARAM_NAMES[3], Value: "" },
      ],
    });

    ssmSendMock.mockImplementation(sendMockFn);

    await expect(fetchTwitterApiTokens()).rejects.toThrowError(
      "Invalid length: Expected !0 but received 0",
    );
  });

  it("fetch missing Twitter API tokens", async () => {
    const sendMockFn = vi.fn().mockResolvedValueOnce({
      Parameters: [
        { Name: PARAM_NAMES[0], Value: "access-token" },
        { Name: PARAM_NAMES[1], Value: "access-token-secret" },
        { Name: PARAM_NAMES[2], Value: "api-key" },
        // Missing api-secret
      ],
    });

    ssmSendMock.mockImplementation(sendMockFn);

    await expect(fetchTwitterApiTokens()).rejects.toThrowError(
      "Invalid type: Expected Object but received undefined",
    );
  });
});
