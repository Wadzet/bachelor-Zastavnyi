type ButtonVariant = "primary" | "secondary" | "ghost"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-zinc-900",
  secondary:
    "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-300",
  ghost:
    "text-zinc-600 hover:text-zinc-900 focus-visible:outline-zinc-400",
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium",
        "transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  )
}
