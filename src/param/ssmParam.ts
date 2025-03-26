import * as v from "valibot";
import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  PutParameterCommand,
} from "@aws-sdk/client-ssm";

const LATEST_PRODUCT_ID_NAME = "/LapNewItemScrapedLog/LatestProductId";
const TWITTER_TOKEN_PATH = "/LapNewItemScrapedLog/Twitter";
const TWITTER_ACCESS_TOKEN_NAME = `${TWITTER_TOKEN_PATH}/AccessToken`;
const TWITTER_ACCESS_TOKEN_SECRET_NAME = `${TWITTER_TOKEN_PATH}/AccessTokenSecret`;
const TWITTER_API_KEY_NAME = `${TWITTER_TOKEN_PATH}/ApiKey`;
const TWITTER_API_SECRET_NAME = `${TWITTER_TOKEN_PATH}/ApiSecret`;

const latestProductIdSchema = v.object({
  Name: v.literal(LATEST_PRODUCT_ID_NAME),
  Value: v.pipe(v.string(), v.nonEmpty(), v.transform(Number), v.number()),
});

const twitterSecretsSchema = v.tuple([
  v.object({
    Name: v.literal(TWITTER_ACCESS_TOKEN_NAME),
    Value: v.pipe(v.string(), v.nonEmpty()),
  }),
  v.object({
    Name: v.literal(TWITTER_ACCESS_TOKEN_SECRET_NAME),
    Value: v.pipe(v.string(), v.nonEmpty()),
  }),
  v.object({
    Name: v.literal(TWITTER_API_KEY_NAME),
    Value: v.pipe(v.string(), v.nonEmpty()),
  }),
  v.object({
    Name: v.literal(TWITTER_API_SECRET_NAME),
    Value: v.pipe(v.string(), v.nonEmpty()),
  }),
]);

const ssmClient = new SSMClient({ region: "ap-northeast-1" });

export const fetchLatestProductId = () =>
  fetchParam({
    name: LATEST_PRODUCT_ID_NAME,
    withDecryption: false,
    schema: latestProductIdSchema,
  });

export const putLatestProductId = (productId: number) =>
  putParam({
    name: LATEST_PRODUCT_ID_NAME,
    value: productId.toString(),
  });

export const fetchTwitterApiTokens = async () => {
  const fetchedParams = await fetchParams({
    names: [
      TWITTER_ACCESS_TOKEN_NAME,
      TWITTER_ACCESS_TOKEN_SECRET_NAME,
      TWITTER_API_KEY_NAME,
      TWITTER_API_SECRET_NAME,
    ],
    withDecryption: true,
    schema: twitterSecretsSchema,
  });

  return {
    accessToken: fetchedParams[TWITTER_ACCESS_TOKEN_NAME],
    accessTokenSecret: fetchedParams[TWITTER_ACCESS_TOKEN_SECRET_NAME],
    apiKey: fetchedParams[TWITTER_API_KEY_NAME],
    apiSecret: fetchedParams[TWITTER_API_SECRET_NAME],
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
}) => Promise<void>;
const putParam: PutParam = async ({ name, value }) => {
  const putParamCommand = new PutParameterCommand({
    Name: name,
    Value: value,
    Type: "String",
    Overwrite: true,
  });

  await ssmClient.send(putParamCommand);
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
