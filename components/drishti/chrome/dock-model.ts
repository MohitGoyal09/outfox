
const BRAND_ID_RE = /^[a-z0-9_]+$/i;

export function isChatRoute(pathname: string): boolean {
  const path = pathOnly(pathname);
  return path === "/ask" || path.startsWith("/ask/") || path === "/chats" || path.startsWith("/chats/");
}

export function pageBrandIdFromPath(pathname: string): string | null {
  const match = /^\/brands\/([^/]+)\/?$/.exec(pathOnly(pathname));
  return match !== null && BRAND_ID_RE.test(match[1]) ? match[1] : null;
}

export function turnCount(messages: readonly { role: string }[]): number {
  return messages.filter((message) => message.role === "user").length;
}
