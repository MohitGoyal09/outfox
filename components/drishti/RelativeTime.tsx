"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatExact, formatRelative } from "@/lib/relativeTime"

const TICK_MS = 60_000
const FRESH_MS = 60 * 60_000

export function RelativeTime({ iso, className }: { iso: string | null | undefined; className?: string }) {
  const [now, setNow] = useState(() => new Date())
  const born = iso ? new Date(iso).getTime() : Number.NaN

  useEffect(() => {
    if (Number.isNaN(born) || Date.now() - born >= FRESH_MS) return
    const id = setInterval(() => {
      setNow(new Date())
      if (Date.now() - born >= FRESH_MS) clearInterval(id)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [born])

  const text = formatRelative(iso, now)
  const exact = formatExact(iso)
  if (!text || !exact || !iso) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={iso}
          tabIndex={0}
          suppressHydrationWarning
          className={`rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ""}`}
        >
          {text}
        </time>
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start gap-0.5 font-mono tabular-nums">
        <span>{exact.local}</span>
        <span className="opacity-70">{exact.utc}</span>
      </TooltipContent>
    </Tooltip>
  )
}
