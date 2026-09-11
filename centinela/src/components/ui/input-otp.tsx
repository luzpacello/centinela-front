import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Minus } from 'lucide-react';
import { cn } from 'cn';

const InputOTP = React.forwardRef<
    React.ElementRef<typeof OTPInput>,
    React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
    <OTPInput
        ref={ref}
        containerClassName={cn(
            'flex items-center gap-2 has-[:disabled]:opacity-50',
            containerClassName,
        )}
        className={cn('disabled:cursor-not-allowed', className)}
        {...props}
    />
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
        <div
            ref={ref}
            data-active={isActive}
            className={cn(
                'relative flex h-10 w-10 items-center justify-center border border-[#cbd5e1] bg-white text-sm font-medium text-[#0f172a] transition-all first:rounded-l-[8px] last:rounded-r-[8px] data-[active=true]:z-10 data-[active=true]:border-[#2563eb] data-[active=true]:ring-2 data-[active=true]:ring-[#bfdbfe]',
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-pulse bg-[#2563eb]" />
                </div>
            )}
        </div>
    );
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
        <Minus className="size-4 text-slate-400" />
    </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
