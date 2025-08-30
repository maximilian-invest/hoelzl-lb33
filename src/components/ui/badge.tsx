import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-500 text-white [a&]:hover:bg-blue-600",
        secondary:
          "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 [a&]:hover:bg-gray-200 dark:hover:bg-gray-700",
        destructive:
          "border-transparent bg-red-500 text-white [a&]:hover:bg-red-600 focus-visible:ring-red-500/50",
        outline:
          "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 [a&]:hover:bg-gray-50 dark:hover:bg-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
