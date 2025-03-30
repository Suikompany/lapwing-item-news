type BuildURLSearchParams = (
  params: Record<string, string | string[]>,
) => URLSearchParams;

export const buildURLSearchParams: BuildURLSearchParams = (params) => {
  const pairs: [string, string][] = Object.entries(params).flatMap(
    ([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => [key, v] satisfies [string, string]);
      }
      return [[key, value] satisfies [string, string]];
    },
  );

  return new URLSearchParams(pairs);
};
