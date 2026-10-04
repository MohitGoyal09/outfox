const MAX_LEN = 80;

export function promptSafeName(name: string): string {
  if (cleaned === "") return "an unnamed brand";
  return cleaned.length > MAX_LEN ? `${cleaned.slice(0, MAX_LEN - 3).trimEnd()}...` : cleaned;
}
