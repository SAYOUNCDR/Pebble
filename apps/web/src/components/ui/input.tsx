import * as React from 'react'

import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300',
                    className,
                )}
                {...props}
            />
        )
    },
)

Input.displayName = 'Input'
