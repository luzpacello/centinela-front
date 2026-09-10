"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-[#cbd5e1] bg-white text-transparent transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-[#94a3b8] focus-visible:ring-3 focus-visible:ring-[#2563eb]/30 data-checked:border-[#2563eb] data-checked:bg-[#eff6ff] data-checked:text-[#2563eb] disabled:cursor-not-allowed disabled:border-[#e2e8f0] disabled:bg-white disabled:opacity-100 disabled:hover:border-[#e2e8f0] disabled:data-checked:border-[#e2e8f0] disabled:data-checked:bg-[#94a3b8] disabled:data-checked:text-white disabled:data-checked:hover:border-[#e2e8f0]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
