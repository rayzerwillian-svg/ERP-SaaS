import { Decimal } from '@prisma/client/runtime/library';

type AnyObject = Record<string, unknown>;

export function toPlain<T>(value: T): T {
  return transform(value) as T;
}

function transform(value: unknown): unknown {
  if (value instanceof Decimal) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map((item) => transform(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as AnyObject).reduce<Record<string, unknown>>((acc, [key, val]) => {
      acc[key] = transform(val);
      return acc;
    }, {});
  }

  return value;
}
