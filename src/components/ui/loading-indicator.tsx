import { LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type LoadingIndicatorProps = React.ComponentProps<"div"> & {
  label?: string
  size?: "sm" | "md"
}

function LoadingIndicator({
  className,
  label = "Loading...",
  size = "md",
  ...props
}: LoadingIndicatorProps) {
  const isSmall = size === "sm"

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-muted-foreground",
        className
      )}
      {...props}
    >
      <LoaderCircleIcon
        aria-hidden="true"
        className={cn(
          "shrink-0 animate-spin text-muted-foreground",
          isSmall ? "size-4" : "size-5"
        )}
      />

      {label ? (
        <span className="text-sm leading-none">{label}</span>
      ) : null}
    </div>
  )
}

export { LoadingIndicator }
