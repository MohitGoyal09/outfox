import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "motion-safe:animate-pulse motion-safe:[animation-duration:1.4s] rounded-md bg-bg-inset",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
