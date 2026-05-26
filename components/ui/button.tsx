import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  ghost: "hover:bg-gray-100 text-gray-900",
  link: "text-blue-600 underline-offset-4 hover:underline",
}

const sizeVariants = {
  default: "h-10 px-4 py-2 rounded-lg",
  sm: "h-8 px-3 py-1 rounded-md text-sm",
  lg: "h-12 px-6 rounded-lg text-base",
  "icon-sm": "h-8 w-8 rounded-md",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof sizeVariants
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        sizeVariants[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }