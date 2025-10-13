import * as v from "valibot";

const envSchema = v.looseObject({
  STAGE: v.union([v.literal("dev"), v.literal("prod")]),
  ALLOW_TWEET: v.pipe(
    v.optional(v.string(), "false"),
    v.transform((s) => s === "true"),
  ),
  BUCKET_NAME: v.string(),
});

export const getEnv = (
  env: v.InferInput<typeof envSchema> | Record<string, unknown>,
): v.InferOutput<typeof envSchema> => v.parse(envSchema, env);
