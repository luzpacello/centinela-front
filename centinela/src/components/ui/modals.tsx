import * as React from "react"
import { cn } from "cn"

type ModalVariant =
  | "default"
  | "informative"
  | "confirmation"
  | "success"
  | "destructive"
  | "form"
  | "scroll"

function Modal({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: ModalVariant
}) {
  return (
    <div
      data-slot="modal"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/modal relative flex min-h-[220px] w-[calc(100vw-2rem)] max-w-[520px] flex-col gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-(--modal-spacing) font-['JetBrains_Mono'] text-sm text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.12)] [--modal-spacing:24px] has-data-[slot=modal-footer]:pb-0 data-[size=sm]:min-h-0 data-[size=sm]:max-w-[420px] data-[size=sm]:[--modal-spacing:16px] data-[variant=form]:min-h-0 data-[variant=form]:max-h-[calc(100dvh-2rem)] data-[variant=scroll]:max-h-[min(640px,calc(100dvh-2rem))]",
        className
      )}
      {...props}
    />
  )
}

function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-header"
      className={cn(
        "group/modal-header @container/modal-header grid auto-rows-min items-start gap-x-4 gap-y-3 has-data-[slot=modal-action]:grid-cols-[1fr_auto] has-data-[slot=modal-description]:grid-rows-[auto_auto] has-data-[slot=modal-icon]:grid-cols-[48px_1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function ModalTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-title"
      className={cn(
        "font-['JetBrains_Mono'] text-base leading-[1.2] font-semibold text-slate-900 group-data-[size=sm]/modal:text-sm group-has-data-[slot=modal-icon]/modal-header:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function ModalDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-description"
      className={cn(
        "max-w-[440px] font-['JetBrains_Mono'] text-sm leading-5 font-normal text-slate-700 group-has-data-[slot=modal-icon]/modal-header:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function ModalAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex size-6 items-center justify-center self-start justify-self-end rounded-md text-slate-900 transition-colors hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-blue-600/30 focus-visible:outline-none group-has-data-[slot=modal-icon]/modal-header:col-start-3 [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ModalIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-icon"
      className={cn(
        "col-start-1 row-span-2 row-start-1 flex size-12 shrink-0 items-center justify-center rounded-full border-8 border-blue-50 bg-blue-100 text-blue-600 group-data-[variant=success]/modal:border-emerald-50 group-data-[variant=success]/modal:bg-emerald-100 group-data-[variant=success]/modal:text-emerald-600 group-data-[variant=destructive]/modal:border-red-50 group-data-[variant=destructive]/modal:bg-red-100 group-data-[variant=destructive]/modal:text-red-600 [&_svg]:size-6",
        className
      )}
      {...props}
    />
  )
}

function ModalContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-content"
      className={cn(
        "min-h-0 flex-1 font-['JetBrains_Mono'] text-sm leading-5 font-normal text-slate-700 group-data-[variant=scroll]/modal:overflow-y-auto group-data-[variant=scroll]/modal:pr-2",
        className
      )}
      {...props}
    />
  )
}

function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "-mx-(--modal-spacing) -mb-(--modal-spacing) mt-auto flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-(--modal-spacing) py-4 group-data-[variant=success]/modal:[&_[data-slot=button]:last-child]:border-slate-200 group-data-[variant=success]/modal:[&_[data-slot=button]:last-child]:bg-white group-data-[variant=success]/modal:[&_[data-slot=button]:last-child]:text-emerald-700 group-data-[variant=success]/modal:[&_[data-slot=button]:last-child]:hover:bg-emerald-50 group-data-[variant=destructive]/modal:[&_[data-slot=button]:last-child]:bg-red-600 group-data-[variant=destructive]/modal:[&_[data-slot=button]:last-child]:text-white group-data-[variant=destructive]/modal:[&_[data-slot=button]:last-child]:hover:bg-red-700",
        className
      )}
      {...props}
    />
  )
}

export {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalAction,
  ModalIcon,
  ModalDescription,
  ModalContent,
}
