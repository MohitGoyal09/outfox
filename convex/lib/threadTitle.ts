export const MAX_THREAD_TITLE_LENGTH = 80;

export type ThreadTitleResult = { ok: true; title: string } | { ok: false; reason: string };
