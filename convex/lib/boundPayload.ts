const MAX_TEXT = 600;
const MAX_DEPTH = 6;

export function boundPayload(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= MAX_DEPTH) return { truncated: true };
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((item) => boundPayload(item, depth + 1));
  if (typeof value === "object") {
    return out;
  }
}
