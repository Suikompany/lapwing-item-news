import * as v from "valibot";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// S3 に保存するファイル形式
/*
  /scraped_data.json
  {
    "updated_at": "2024-01-01T00:00:00.000Z",
    "product_ids": [12345, 67890, ...],
  }

  /logs/2024-01-01T0000.json
  {
    "created_at": "2024-01-01T00:00:00.000Z",
    "new_products": [{
      "product_id": 12345,
      "tweet_id": "1357924680"
    }, ...],
  }
*/

const scrapedDataKey = "scraped_data.json" as const;
const scrapingLogKey = (
  date: Date,
): `logs/${string}-${string}-${string}T${string}.json` => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `logs/${y}-${m}-${d}T${h}${min}.json` as const;
};

const scrapedDataSchema = v.pipe(
  v.string(),
  v.parseJson(),
  v.object({
    updated_at: v.pipe(v.string(), v.isoTimestamp()),
    product_ids: v.array(v.number()),
  }),
);
type ScrapedDataJson = v.InferOutput<typeof scrapedDataSchema>;

const scrapingLogSchema = v.object({
  created_at: v.pipe(v.string(), v.isoTimestamp()),
  new_products: v.array(
    v.object({
      product_id: v.number(),
      tweet_id: v.nullable(v.string()),
    }),
  ),
});
type LogJson = v.InferOutput<typeof scrapingLogSchema>;

const s3Client = new S3Client({});

export const getScrapedData = async (bucket: string) => {
  const { Body: body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: scrapedDataKey,
    }),
  );

  if (!body) {
    throw new Error(`No data in ${scrapedDataKey}`);
  }

  const rawJson = await body.transformToString();

  return await v.parseAsync(scrapedDataSchema, rawJson);
};

export const putScrapedData = async (
  bucket: string,
  date: Date,
  productIds: ScrapedDataJson["product_ids"],
) => {
  const value: ScrapedDataJson = {
    updated_at: date.toISOString(),
    product_ids: productIds,
  };

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: scrapedDataKey,
      Body: JSON.stringify(value),
      ContentType: "application/json",
    }),
  );
};

export const putLog = async (
  bucket: string,
  date: Date,
  newProducts: LogJson["new_products"],
) => {
  const value = {
    created_at: date.toISOString(),
    new_products: newProducts,
  };

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: scrapingLogKey(date),
      Body: JSON.stringify(value),
      ContentType: "application/json",
    }),
  );
};
