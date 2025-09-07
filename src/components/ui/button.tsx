"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:shadow-md",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md focus-visible:ring-red-500/50",
        outline:
          "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md",
        secondary:
          "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-md",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
        link: "text-blue-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  success?: boolean
  loadingText?: string
  successText?: string
  successDuration?: number
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  success = false,
  loadingText,
  successText,
  successDuration = 2000,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const [showSuccess, setShowSuccess] = React.useState(false)
  const Comp = asChild ? Slot : "button"

  React.useEffect(() => {
    if (success) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, successDuration)
      return () => clearTimeout(timer)
    }
  }, [success, successDuration])

  const isDisabled = disabled || loading || showSuccess

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      )
    }
    
    if (showSuccess) {
      return (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {successText || children}
        </>
      )
    }
    
    return children
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {getButtonContent()}
    </Comp>
  )
}

export { Button, buttonVariants }
