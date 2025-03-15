import * as v from "valibot";
import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  PutParameterCommand,
} from "@aws-sdk/client-ssm";

const LATEST_SCRAPED_AT_NAME = "/LapNewItemScrapedLog/LatestScrapedAt";
const LATEST_PRODUCT_ID_NAME = "/LapNewItemScrapedLog/LatestProductId";
const TWITTER_TOKEN_PATH = "/LapNewItemScrapedLog/Twitter";
const TWITTER_ACCESS_TOKEN_NAME = `${TWITTER_TOKEN_PATH}/AccessToken`;
const TWITTER_ACCESS_TOKEN_SECRET_NAME = `${TWITTER_TOKEN_PATH}/AccessTokenSecret`;
const TWITTER_API_KEY_NAME = `${TWITTER_TOKEN_PATH}/ApiKey`;
const TWITTER_API_SECRET_NAME = `${TWITTER_TOKEN_PATH}/ApiSecret`;

const latestScrapedAtSchema = v.object({
  Name: v.literal(LATEST_SCRAPED_AT_NAME),
  Value: v.pipe(
    v.string(),
    v.isoTimestamp(),
    v.transform((input) => new Date(input)),
    v.date(),
  ),
});

const latestProductIdSchema = v.object({
  Name: v.literal(LATEST_PRODUCT_ID_NAME),
  Value: v.pipe(v.string(), v.transform(Number), v.number()),
});

const twitterSecretsSchema = v.tuple([
  v.object({
    Name: v.literal(TWITTER_ACCESS_TOKEN_NAME),
    Value: v.string(),
  }),
  v.object({
    Name: v.literal(TWITTER_ACCESS_TOKEN_SECRET_NAME),
    Value: v.string(),
  }),
  v.object({
    Name: v.literal(TWITTER_API_KEY_NAME),
    Value: v.string(),
  }),
  v.object({
    Name: v.literal(TWITTER_API_SECRET_NAME),
    Value: v.string(),
  }),
]);

const ssmClient = new SSMClient({ region: "ap-northeast-1" });

export const fetchLatestProductId = async () => {
  const getParamCommand = new GetParameterCommand({
    Name: LATEST_PRODUCT_ID_NAME,
    WithDecryption: false,
  });

  const { Parameter: fetchedParam } = await ssmClient.send(getParamCommand);

  const parsedParam = v.parse(latestProductIdSchema, fetchedParam);
  return parsedParam.Value;
};

export const putLatestProductId = async (productId: number) => {
  const putParamCommand = new PutParameterCommand({
    Name: LATEST_PRODUCT_ID_NAME,
    Value: productId.toString(),
    Type: "String",
    Overwrite: true,
  });

  return await ssmClient.send(putParamCommand);
};

export const fetchLatestScrapedAt = async () => {
  const getParamCommand = new GetParameterCommand({
    Name: LATEST_SCRAPED_AT_NAME,
    WithDecryption: false,
  });

  const { Parameter: fetchedParam } = await ssmClient.send(getParamCommand);

  const parsedParam = v.parse(latestScrapedAtSchema, fetchedParam);
  return parsedParam.Value;
};

export const putLatestScrapedAt = async (scrapedAt: Date) => {
  const putParamCommand = new PutParameterCommand({
    Name: LATEST_SCRAPED_AT_NAME,
    Value: scrapedAt.toISOString(),
    Type: "String",
    Overwrite: true,
  });

  return await ssmClient.send(putParamCommand);
};

export const fetchTwitterApiTokens = async () => {
  const getParamCommand = new GetParametersCommand({
    Names: [
      TWITTER_ACCESS_TOKEN_NAME,
      TWITTER_ACCESS_TOKEN_SECRET_NAME,
      TWITTER_API_KEY_NAME,
      TWITTER_API_SECRET_NAME,
    ],
    WithDecryption: true,
  });

  const { Parameters: fetchedParams } = await ssmClient.send(getParamCommand);
  const parsedParams = v.parse(twitterSecretsSchema, fetchedParams);

  return {
    accessToken: parsedParams[0].Value,
    accessTokenSecret: parsedParams[1].Value,
    apiKey: parsedParams[2].Value,
    apiKeySecret: parsedParams[3].Value,
  };
};

type FetchParam = <
  TSchema extends v.GenericSchema<unknown, { Value: unknown }>,
>(params: {
  name: string;
  withDecryption: boolean;
  schema: TSchema;
}) => Promise<v.InferOutput<TSchema>["Value"]>;
const fetchParam: FetchParam = async ({ name, withDecryption, schema }) => {
  const getParamCommand = new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption,
  });

  const { Parameter: fetchedParam } = await ssmClient.send(getParamCommand);

  const parsedParam = v.parse(schema, fetchedParam);
  return parsedParam.Value;
};

type PutParam = (params: {
  name: string;
  value: string;
}) => void;
const putParam: PutParam = async ({ name, value }) => {
  const putParamCommand = new PutParameterCommand({
    Name: name,
    Value: value,
    Type: "String",
    Overwrite: true,
  });

  return await ssmClient.send(putParamCommand);
};

type FetchParams = <
  TSchema extends v.GenericSchema<unknown, { Name: string; Value: unknown }[]>,
>(params: {
  names: string[];
  withDecryption: boolean;
  schema: TSchema;
}) => Promise<{
  [P in v.InferOutput<TSchema>[number] as P["Name"]]: P["Value"];
}>;

const fetchParams: FetchParams = async ({ names, withDecryption, schema }) => {
  const getParamsCommand = new GetParametersCommand({
    Names: names,
    WithDecryption: withDecryption,
  });

  const { Parameters: fetchedParams } = await ssmClient.send(getParamsCommand);
  const parsedParams = v.parse(schema, fetchedParams);

  return parsedParams.reduce(
    (
      acc,
      {
        Name,
        Value,
      }: {
        Name: (typeof parsedParams)[number]["Name"];
        Value: (typeof parsedParams)[number]["Value"];
      },
    ) => {
      acc[Name] = Value as {
        [P in (typeof parsedParams)[number] as P["Name"]]: P["Value"];
      }[typeof Name];
      return acc;
    },
    {} as { [P in (typeof parsedParams)[number] as P["Name"]]: P["Value"] },
  );
};
