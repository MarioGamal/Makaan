const REDACTED = '[REDACTED]';
const UNSERIALIZABLE = '[UNSERIALIZABLE]';

const PROTECTED_KEY =
  /(?:authorization|cookie|password|passcode|otp|csrf|access[_-]?token|refresh[_-]?token|session[_-]?token|second[_-]?factor|totp|secret|phone(?:number)?|phone[_-]?ciphertext|exact[_-]?(?:location|latitude|longitude)|identity[_-]?(?:document|evidence)|document(?:[_-]?(?:content|body|image))?|evidence(?:[_-]?(?:content|body))?|private[_-]?object[_-]?reference)/i;
const PHONE_VALUE = /(?:\+?20|0)1[0125][0-9]{8}/g;
const LABELED_SECRET_VALUE =
  /\b(?:password|otp|csrf|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi;

export function isProtectedKey(key: string): boolean {
  return PROTECTED_KEY.test(key);
}

export function redactText(value: string): string {
  PHONE_VALUE.lastIndex = 0;
  LABELED_SECRET_VALUE.lastIndex = 0;
  return PHONE_VALUE.test(value) || LABELED_SECRET_VALUE.test(value)
    ? REDACTED
    : value;
}

/** Produces a detached, JSON-safe value suitable for structured logs and artifacts. */
export function redactForLog(value: unknown): unknown {
  return redactValue(value, new WeakSet<object>());
}

export const redactForLogs = redactForLog;

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined'
  ) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'symbol' || typeof value === 'function') {
    return `[${typeof value}]`;
  }
  if (Buffer.isBuffer(value)) {
    return REDACTED;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
    };
  }
  if (seen.has(value)) {
    return UNSERIALIZABLE;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }

  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (isProtectedKey(key)) {
      output[key] = REDACTED;
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor)) {
      output[key] = UNSERIALIZABLE;
      continue;
    }
    try {
      output[key] = redactValue(descriptor.value, seen);
    } catch {
      output[key] = UNSERIALIZABLE;
    }
  }
  return output;
}
