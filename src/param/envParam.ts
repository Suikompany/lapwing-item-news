import * as v from "valibot";

const envSchema = v.looseObject({
  STAGE: v.union([v.literal("dev"), v.literal("prod")]),
  ALLOW_TWEET: v.fallback(
    v.pipe(
      v.string(),
      v.transform((s) => s === "true"),
    ),
    false,
  ),
  BUCKET_NAME: v.string(),
  BLOCKED_SUBDOMAINS: v.fallback(
    v.pipe(
      v.string(),
      v.transform((s) => (s ? s.split(",") : [])),
    ),
    [],
  ),
});

export const getEnv = (
  env: v.InferInput<typeof envSchema> | Record<string, unknown>,
): v.InferOutput<typeof envSchema> => v.parse(envSchema, env);
