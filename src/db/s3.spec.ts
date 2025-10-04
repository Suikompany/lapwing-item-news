import { mockClient } from "aws-sdk-client-mock";
import { sdkStreamMixin } from "@smithy/util-stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { getScrapedData, putScrapedData, putLog } from "./s3";

const s3Mock = mockClient(S3Client);

const createSdkStream = (str: string) => {
  const stream = new Readable();
  stream.push(str);
  stream.push(null);
  return sdkStreamMixin(stream);
};

const bucket = "lapwing-item-news-bucket";

beforeEach(() => {
  s3Mock.reset();
});

describe("getScrapedData", () => {
  it("returns parsed data when S3 returns Body", async () => {
    const sdkStream = createSdkStream(
      JSON.stringify({
        updated_at: "2024-01-01T00:00:00.000Z",
        product_ids: [1, 2, 3],
      }),
    );

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

    const result = await getScrapedData(bucket);
    expect(result).toEqual({
      updated_at: "2024-01-01T00:00:00.000Z",
      product_ids: [1, 2, 3],
    });
  });

  it("returns undefined if Body is undefined", async () => {
    s3Mock.on(GetObjectCommand).resolves({ Body: undefined });

    const result = await getScrapedData(bucket);
    expect(result).toBeUndefined();
  });

  it("returns undefined if NoSuchKey error is thrown", async () => {
    s3Mock
      .on(GetObjectCommand)
      .rejects(new NoSuchKey({ message: "", $metadata: {} }));

    const result = await getScrapedData(bucket);
    expect(result).toBeUndefined();
  });
});

describe("putData", () => {
  it("calls S3Client.send with correct params", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const date = new Date("2024-01-01T00:00:00.000Z");
    const productIds = [1, 2, 3];
    await putScrapedData(bucket, date, productIds);

    expect(
      s3Mock.commandCalls(PutObjectCommand, {
        Bucket: "lapwing-item-news-bucket",
        Key: "scraped_data.json",
        Body: JSON.stringify({
          updated_at: date.toISOString(),
          product_ids: productIds,
        }),
        ContentType: "application/json",
      }).length,
    ).toBe(1);
  });
});

describe("putLog", () => {
  it("calls S3Client.send with correct params and log key", async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const date = new Date("2024-01-01T12:34:00.000Z");
    const newProducts = [
      { product_id: 123, tweet_id: "abc" },
      { product_id: 456, tweet_id: null },
    ];
    await putLog(bucket, date, newProducts);

    expect(
      s3Mock.commandCalls(PutObjectCommand, {
        Bucket: "lapwing-item-news-bucket",
        Key: "logs/2024-01-01T1234.json",
        Body: JSON.stringify({
          created_at: date.toISOString(),
          new_products: newProducts,
        }),
        ContentType: "application/json",
      }).length,
    ).toBe(1);
  });
});
