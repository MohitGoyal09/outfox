export type ThreadSummary = { threadKey: string; title: string; lastMessageAt: string };
export type ThreadGroup = { label: string; threads: ThreadSummary[] };

const LABELS = ["Today", "Yesterday", "Previous 7 days", "Older"] as const;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function groupThreadsByActivity(threads: ThreadSummary[], now: Date): ThreadGroup[] {
  const today = startOfLocalDay(now);
  const buckets: ThreadSummary[][] = [[], [], [], []];
  for (const thread of threads) {
    const dayStart = startOfLocalDay(new Date(thread.lastMessageAt));
    const daysAgo = Math.round((today - dayStart) / 86_400_000);
    buckets[daysAgo <= 0 ? 0 : daysAgo === 1 ? 1 : daysAgo <= 6 ? 2 : 3].push(thread);
  }
  return LABELS.map((label, i) => ({ label, threads: buckets[i] })).filter((g) => g.threads.length > 0);
}
