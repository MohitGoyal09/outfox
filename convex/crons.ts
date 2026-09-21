import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

crons.interval(
  "close stale runs",
  { minutes: 10 },
  internal.runs.closeStaleRuns,
  { olderThanMs: 30 * 60 * 1000, limit: 100 },
);

export default crons;
