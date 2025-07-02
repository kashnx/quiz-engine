import type React from "react"
import type { ButtonHTMLAttributes } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Define our own ButtonProps since it's not exported from shadcn
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

// Define the valid violet button variants
type VioletVariant = "gradient" | "neon" | "outlined" | "glass" | "threed" | "pulse" | "ultimate"

export interface VioletButtonProps extends Omit<ButtonProps, "variant"> {
    variant?: VioletVariant
    children: React.ReactNode
}

const QuizifyButton = forwardRef<HTMLButtonElement, VioletButtonProps>(
    ({ className, variant = "gradient", children, ...props }, ref) => {
        const variants: Record<VioletVariant, string> = {
            gradient:
                "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0",

            neon: "bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-500/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-violet-400 hover:border-violet-300",

            outlined:
                "border-2 border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-transparent",

            glass:
                "bg-violet-500/20 backdrop-blur-sm border border-violet-300/30 text-violet-700 hover:bg-violet-500/30 hover:text-violet-800 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300",

            threed:
                "bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:translate-y-[-2px] transition-all duration-200 border-b-4 border-violet-800 hover:border-violet-900 active:translate-y-0 active:border-b-2",

            pulse:
                "bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse hover:animate-none border-0 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",

            ultimate:
                "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-2xl hover:shadow-violet-500/30 transform hover:scale-110 transition-all duration-300 border-0 relative overflow-hidden group",
        }

        const content =
            variant === "ultimate" ? (
                <>
                    <span className="relative z-10">{children}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </>
            ) : (
                children
            )

        return (
            <Button className={cn(variants[variant], className)} ref={ref} {...props}>
                {content}
            </Button>
        )
    },
)

QuizifyButton.displayName = "QuizifyButton"

export { QuizifyButton }
