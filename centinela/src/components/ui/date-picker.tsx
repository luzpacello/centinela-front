"use client"

import * as React from "react"
import { format, startOfDay, subMonths } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePickerBasic() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            data-empty={!date}
            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
          />
        }
      >
        <CalendarIcon />
        {date ? format(date, "PPP") : <span>Pick a date</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  )
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  maxDate?: Date
  showLabel?: boolean
  "aria-label"?: string
}

function DatePickerWithRange(props: DatePickerWithRangeProps) {
  const { value, onValueChange, maxDate, showLabel = false, "aria-label": accessibleLabel = "Desde / Hasta" } = props
  const triggerId = React.useId()
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(() => {
    const today = startOfDay(new Date())
    return { from: subMonths(today, 1), to: today }
  })
  const isControlled = "value" in props
  const date = isControlled ? value : internalRange

  function handleRangeChange(range: DateRange | undefined) {
    if (!isControlled) setInternalRange(range)
    onValueChange?.(range)
  }

  return (
    <Field className="mx-auto w-60">
      {showLabel && <FieldLabel htmlFor={triggerId}>Rango de fechas</FieldLabel>}
      <span id={`${triggerId}-description`} className="sr-only">
        Desde: {date?.from ? format(date.from, "dd/MM/yyyy") : "sin seleccionar"}.
        Hasta: {date?.to ? format(date.to, "dd/MM/yyyy") : "sin seleccionar"}.
      </span>
      <Popover>
        <PopoverTrigger
          id={triggerId}
          render={
            <Button
              variant="secondary"
              aria-label={accessibleLabel}
              aria-describedby={`${triggerId}-description`}
              className="justify-start font-normal"
            >
              <CalendarIcon data-icon="inline-start" className="px-1"/>
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleRangeChange}
            numberOfMonths={2}
            disabled={maxDate ? { after: maxDate } : undefined}
            excludeDisabled
            resetOnSelect
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

export { DatePickerBasic, DatePickerWithRange }
