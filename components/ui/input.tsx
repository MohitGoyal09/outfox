"use client"

import * as React from "react"
import { cn } from "cn"
import { controlClass, controlHeight, type ControlSize } from "./form/control"
import { useFieldControl } from "./form/context"

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: ControlSize | number }) {
  const field = useFieldControl(props)
  return (
    <input
      type={type}
      data-slot="input"
      {...props}
      {...field}
      size={typeof size === "number" ? size : undefined}
      className={cn(controlClass, controlHeight[typeof size === "number" ? "default" : size], "py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground", className)}
    />
  )
}

export { Input }
