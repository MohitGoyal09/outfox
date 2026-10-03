"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      theme="light"
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ bottom: 96, left: 16, right: 16 }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-ok" />,
        error: <CircleAlertIcon className="size-4 text-danger" />,
      }}
      style={
        {
          "--normal-bg": "var(--bg-raised)",
          "--normal-text": "var(--fg)",
          "--normal-border": "var(--border)",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!font-sans !shadow-[var(--shadow-toast)] !text-[13px]",
          title: "!font-medium !text-fg",
          description: "!text-fg-secondary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
