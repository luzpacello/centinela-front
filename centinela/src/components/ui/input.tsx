import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[40px] w-full min-w-0 rounded-[8px] border border-[#cbd5e1] bg-white px-2.5 py-1 font-[family-name:'JetBrains_Mono',monospace] text-[13px] leading-[1.2] font-medium tracking-normal text-[#0f172a] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-inherit placeholder:text-[#94a3b8] hover:border-[#94a3b8] focus:border-[#2563eb] data-[state=success]:border-[#10b981] data-[state=success]:hover:border-[#10b981] data-[state=success]:focus:border-[#10b981] aria-invalid:border-[#ef4444] aria-invalid:hover:border-[#ef4444] aria-invalid:focus:border-[#ef4444] read-only:border-[#e2e8f0] read-only:bg-[#f8fafc] read-only:text-[#475569] read-only:hover:border-[#e2e8f0] read-only:focus:border-[#e2e8f0] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[#e2e8f0] disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:opacity-100",
        className
      )}
      {...props}
    />
  )
}

export { Input }
