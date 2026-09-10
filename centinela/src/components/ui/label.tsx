"use client"

import * as React from "react"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className="text-label"
      {...props}
    />
  )
}

export { Label }
