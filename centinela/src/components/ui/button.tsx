import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding font-[family-name:Roboto,sans-serif] text-[14px] leading-[1.2] font-normal tracking-normal whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default: "bg-[#2563ebbd] text-white hover:border-[#1d4ed8] focus-visible:border-transparent focus-visible:bg-[#93c5fdbd] focus-visible:ring-0 active:border-transparent active:bg-[#1e40afbd] aria-pressed:border-transparent aria-pressed:bg-[#1e40afbd] disabled:bg-[#bfdbfebd] disabled:opacity-100",
        outline:
          "border-[#e2e8f0] bg-[#ffffffbd] text-[#0f172a] hover:border-[#cbd5e1] hover:bg-[#f8fafcbd] focus-visible:border-[#e2e8f0] focus-visible:bg-[#93c5fdbd] focus-visible:ring-0 active:border-[#e2e8f0] active:bg-[#f1f5f9bd] aria-pressed:border-[#e2e8f0] aria-pressed:bg-[#f1f5f9bd] aria-expanded:border-[#e2e8f0] aria-expanded:bg-[#f1f5f9bd]",
        secondary:
          "border-[#e2e8f0] bg-[#ffffffbd] text-[#0f172a] hover:border-[#cbd5e1] hover:bg-[#f8fafcbd] focus-visible:border-[#e2e8f0] focus-visible:bg-[#93c5fdbd] focus-visible:ring-0 active:border-[#e2e8f0] active:bg-[#f1f5f9bd] aria-pressed:border-[#e2e8f0] aria-pressed:bg-[#f1f5f9bd] aria-expanded:border-[#e2e8f0] aria-expanded:bg-[#f1f5f9bd]",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[40px] gap-2 px-5",
        xs: "h-[40px] gap-2 px-5",
        sm: "h-[40px] gap-2 px-5",
        lg: "h-[40px] gap-2 px-5",
        icon: "h-[40px] px-2",
        "icon-xs":
          "h-[40px] px-2",
        "icon-sm":
          "h-[40px] px-2",
        "icon-lg": "h-[40px] px-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }