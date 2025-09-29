import * as v from "valibot";
import { env } from "cloudflare:workers";

// R2 に保存するファイル形式
/*
  /data.json
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

const bucket = env.LAPWING_ITEM_NEWS_BUCKET;

const dataKey = "data.json" as const;
const logKey = (
  date: Date,
): `logs/${string}-${string}-${string}T${string}.json` => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `logs/${y}-${m}-${d}T${h}${min}.json` as const;
};

const dataSchema = v.object({
  updated_at: v.pipe(v.string(), v.isoTimestamp()),
  product_ids: v.array(v.number()),
});
type DataJson = v.InferOutput<typeof dataSchema>;

const logSchema = v.object({
  created_at: v.pipe(v.string(), v.isoTimestamp()),
  new_products: v.array(
    v.object({
      product_id: v.number(),
      tweet_id: v.nullable(v.string()),
    }),
  ),
});
type LogJson = v.InferOutput<typeof logSchema>;

export const getData = async () => {
  const r2Obj = await bucket.get(dataKey);
  if (r2Obj === null) {
    throw new Error(`No data in ${dataKey}`);
  }

  const json = await r2Obj.json();

  return await v.parseAsync(dataSchema, json);
};

export const putData = async (
  date: Date,
  productIds: DataJson["product_ids"],
) => {
  const value: DataJson = {
    updated_at: date.toISOString(),
    product_ids: productIds,
  };

  await bucket.put(dataKey, JSON.stringify(value), {
    httpMetadata: {
      contentType: "application/json",
    },
  });
};

export const putLog = async (
  date: Date,
  newProducts: LogJson["new_products"],
) => {
  const value = {
    created_at: date.toISOString(),
    new_products: newProducts,
  };

  await bucket.put(logKey(date), JSON.stringify(value), {
    httpMetadata: {
      contentType: "application/json",
    },
  });
};
