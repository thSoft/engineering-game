export function mapValues<T extends object, R>(
  object: T,
  fn: <K extends keyof T>(value: T[K], key: K) => R,
): {
  [K in keyof T]: R;
} {
  const result = {} as {
    [K in keyof T]: R;
  };

  for (const key of Object.keys(object) as Array<keyof T>) {
    result[key] = fn(object[key], key);
  }

  return result;
}

type PrefixKeys<T extends Record<string, unknown>, Prefix extends string, R> = {
  [K in keyof T & string as `${Prefix}${K}`]: R;
};

export function mapValuesWithKey<
  const T extends Record<string, unknown>,
  const Prefix extends string,
  R,
>(
  object: T,
  prefix: Prefix,
  fn: <K extends keyof T>(value: T[K], key: K) => R,
): PrefixKeys<T, Prefix, R> {
  const result: Record<string, R> = {};

  for (const key of Object.keys(object) as Array<keyof T & string>) {
    result[`${prefix}${key}`] = fn(object[key], key);
  }

  return result as PrefixKeys<T, Prefix, R>;
}
