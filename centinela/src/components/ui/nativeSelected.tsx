import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({
  className,
  size = "default",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="peer h-[40px] w-full min-w-0 appearance-none rounded-[8px] border border-[#cbd5e1] bg-white py-1 pr-10 pl-3 font-[family-name:'JetBrains_Mono',monospace] text-[14px] leading-[1.2] font-normal text-[#0f172a] transition-colors outline-none select-none hover:border-[#94a3b6] focus-visible:border-[#2563eb] focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[#e2e8f0] disabled:bg-white disabled:text-[#94a3b8] disabled:opacity-100 disabled:hover:border-[#e2e8f0] aria-invalid:border-[#ef4444] aria-invalid:text-[#ef4444] aria-invalid:ring-0 aria-invalid:hover:border-[#ef4444] data-[size=sm]:h-[40px] data-[size=sm]:rounded-[8px]"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-6 -translate-y-1/2 text-[#647488] select-none peer-focus-visible:text-[#2563eb] peer-disabled:text-[#94a3b8] peer-aria-invalid:text-[#ef4444]"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
