import * as v from "valibot";
import { getParametersByName } from "@aws-lambda-powertools/parameters/ssm";
import type { SSMGetParametersByNameOptions } from "@aws-lambda-powertools/parameters/ssm/types";

const TWITTER_TOKEN_PATH = "/LapNewItemScrapedLog/Twitter";
const TWITTER_ACCESS_TOKEN_NAME = `${TWITTER_TOKEN_PATH}/AccessToken`;
const TWITTER_ACCESS_TOKEN_SECRET_NAME = `${TWITTER_TOKEN_PATH}/AccessTokenSecret`;
const TWITTER_API_KEY_NAME = `${TWITTER_TOKEN_PATH}/ApiKey`;
const TWITTER_API_SECRET_NAME = `${TWITTER_TOKEN_PATH}/ApiSecret`;

const twitterCredentialsSchema = v.object(
  v.entriesFromList(
    [
      TWITTER_ACCESS_TOKEN_NAME,
      TWITTER_ACCESS_TOKEN_SECRET_NAME,
      TWITTER_API_KEY_NAME,
      TWITTER_API_SECRET_NAME,
    ],
    v.string(),
  ),
);

export const fetchTwitterCredentials = async () => {
  const fetchedParams = await fetchParams({
    names: [
      TWITTER_ACCESS_TOKEN_NAME,
      TWITTER_ACCESS_TOKEN_SECRET_NAME,
      TWITTER_API_KEY_NAME,
      TWITTER_API_SECRET_NAME,
    ],
    withDecryption: true,
    maxAge: 660, // 11 minutes
  });

  const parsedParams = await v.parseAsync(
    twitterCredentialsSchema,
    fetchedParams,
  );

  return {
    accessToken: parsedParams[TWITTER_ACCESS_TOKEN_NAME],
    accessTokenSecret: parsedParams[TWITTER_ACCESS_TOKEN_SECRET_NAME],
    apiKey: parsedParams[TWITTER_API_KEY_NAME],
    apiSecret: parsedParams[TWITTER_API_SECRET_NAME],
  };
};

type FetchParamsProps = {
  names: string[];
  withDecryption?: boolean;
  maxAge?: number;
};

const fetchParams = async ({
  names,
  withDecryption,
  maxAge,
}: FetchParamsProps) => {
  const params = names.reduce<
    Record<(typeof names)[number], SSMGetParametersByNameOptions>
  >((acc, name) => {
    acc[name] = {};
    return acc;
  }, {});

  const fetchedParams = await getParametersByName(params, {
    throwOnError: true,
    decrypt: withDecryption,
    maxAge: maxAge,
  });

  return fetchedParams;
};
