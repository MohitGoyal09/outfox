"use client"

import * as React from "react"
import { cn } from "cn"
import { controlClass } from "./form/control"
import { useFieldControl } from "./form/context"

function Textarea({ className, rows = 3, ...props }: React.ComponentProps<"textarea">) {
  const field = useFieldControl(props)
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      {...props}
      {...field}
      className={cn(controlClass, "block field-sizing-content min-h-[5.5rem] resize-none py-2.5 leading-[22px]", className)}
    />
  )
}

export { Textarea }
