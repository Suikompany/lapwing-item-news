import * as v from "valibot";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocument,
  type GetCommandInput,
  type PutCommandInput,
} from "@aws-sdk/lib-dynamodb";

const DDB_TABLE_NAME = "LapNewItemScrapedLog";

const scrapingLogTableSchema = v.object({
  /** パーティションキー ISO8601形式のstring */
  ScrapedAt: v.pipe(v.string(), v.isoTimestamp()),

  NewProductIdList: v.array(v.number()),
  TweetIdList: v.array(v.nullable(v.string())),
});

type ScrapeLogTable = v.InferOutput<typeof scrapingLogTableSchema>;

const dbClient = DynamoDBDocument.from(
  new DynamoDBClient({
    region: "ap-northeast-1",
  }),
);

export const saveScrapedLog = async (
  scrapedAt: Date,
  productIdList: number[],
  tweetIdList: (string | null)[],
) => {
  const record = buildScrapingLogRecord({
    scrapedAt: scrapedAt,
    productIdList: productIdList,
    tweetIdList: tweetIdList,
  });

  await putScrapingLogRecord(record);
};

const fetchScrapingLogRecord = async (scrapedAt: Date) => {
  const getCommand: GetCommandInput = {
    TableName: DDB_TABLE_NAME,
    Key: {
      ScrapedAt: scrapedAt.toISOString(),
    },
  };
  const { Item } = await dbClient.get(getCommand);

  const record = v.parse(scrapingLogTableSchema, Item);
  return record;
};

const buildScrapingLogRecord = ({
  scrapedAt,
  productIdList,
  tweetIdList,
}: {
  scrapedAt: Date;
  productIdList: number[];
  tweetIdList: (string | null)[];
}): ScrapeLogTable => {
  const transformedInput: v.InferInput<typeof scrapingLogTableSchema> = {
    ScrapedAt: scrapedAt.toISOString(),
    NewProductIdList: productIdList,
    TweetIdList: tweetIdList,
  };

  const { ScrapedAt, NewProductIdList, TweetIdList } = v.parse(
    scrapingLogTableSchema,
    transformedInput,
  );

  return {
    ScrapedAt: ScrapedAt,
    NewProductIdList: NewProductIdList,
    TweetIdList: TweetIdList,
  };
};

const putScrapingLogRecord = async (record: ScrapeLogTable) => {
  const putCommand: PutCommandInput = {
    TableName: DDB_TABLE_NAME,
    Item: record,
  };
  return await dbClient.put(putCommand);
};
