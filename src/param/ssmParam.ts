import * as v from "valibot";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";

const TWITTER_CREDENTIAL_PATH = (stage: "dev" | "prod") =>
  `/lapwing-item-news/${stage}/Twitter/Credential` as const;

const twitterCredentialsSchema = v.pipe(
  v.string(),
  v.parseJson(),
  v.object({
    access_token: v.string(),
    access_token_secret: v.string(),
    api_key: v.string(),
    api_secret: v.string(),
  }),
);

export const fetchTwitterCredentials = async (stage: "dev" | "prod") => {
  const fetchedParam = await fetchParam({
    name: TWITTER_CREDENTIAL_PATH(stage),
    withDecryption: true,
    maxAge: 660, // 11 minutes
  });

  const parsedParams = await v.parseAsync(
    twitterCredentialsSchema,
    fetchedParam,
  );

  return {
    accessToken: parsedParams.access_token,
    accessTokenSecret: parsedParams.access_token_secret,
    apiKey: parsedParams.api_key,
    apiSecret: parsedParams.api_secret,
  };
};

type FetchParamProps = {
  name: string;
  withDecryption?: boolean;
  maxAge?: number;
};
const fetchParam = async ({
  name,
  withDecryption,
  maxAge,
}: FetchParamProps) => {
  const fetchedParam = await getParameter(name, {
    throwOnError: true,
    decrypt: withDecryption,
    maxAge: maxAge,
  });

  return fetchedParam;
};
