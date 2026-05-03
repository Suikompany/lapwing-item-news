type BuildURLSearchParams = (
  params: Record<string, string | readonly string[]>,
) => URLSearchParams;

export const buildURLSearchParams: BuildURLSearchParams = (params) => {
  const pairs: [string, string][] = Object.entries(params).flatMap(
    ([key, value]) => {
      if (typeof value === "string") {
        return [[key, value] satisfies [string, string]];
      }
      return value.map((vStr) => [key, vStr] satisfies [string, string]);
    },
  );

  return new URLSearchParams(pairs);
};
