"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { useIsInIframe } from "@/hooks/use-is-in-iframe";

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      return message;
    }
  }

  return fallback;
}

// --- AuthCard ---
interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-full max-w-[400px] p-4 text-foreground sm:p-6",
        "**:data-[slot=button]:h-10 **:data-[slot=button]:rounded-xl **:data-[slot=button]:font-semibold",
        "**:data-[slot=input]:h-10 **:data-[slot=input]:rounded-xl **:data-[slot=input]:border-black/8 **:data-[slot=input]:bg-white/70 dark:**:data-[slot=input]:border-white/10 dark:**:data-[slot=input]:bg-zinc-900/45",
        "**:data-[slot=tabs-list]:mb-4 **:data-[slot=tabs-list]:h-10 **:data-[slot=tabs-list]:w-full **:data-[slot=tabs-list]:rounded-lg **:data-[slot=tabs-list]:border **:data-[slot=tabs-list]:border-black/8 **:data-[slot=tabs-list]:bg-zinc-100/70 **:data-[slot=tabs-list]:p-1 dark:**:data-[slot=tabs-list]:border-white/10 dark:**:data-[slot=tabs-list]:bg-zinc-900/45",
        "**:data-[slot=tabs-trigger]:h-8 **:data-[slot=tabs-trigger]:rounded-md **:data-[slot=tabs-trigger]:py-0 **:data-[slot=tabs-trigger]:text-sm **:data-[slot=tabs-trigger]:font-medium",
        className
      )}
    >
      <div className="mb-6 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="mb-1 text-xl font-semibold tracking-tight text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            {description}
          </motion.p>
        )}
      </div>

      <div className="space-y-4">{children}</div>

      {footer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mt-6 border-t border-black/6 pt-5 text-center text-sm text-muted-foreground dark:border-white/10"
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
}

// --- PasswordField ---
interface PasswordFieldProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={props.id}>{label}</Label>
        </div>
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

export function AuthSeparator({ text = "Or continue with" }: { text?: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-black/6 dark:bg-white/8" />
      <span className="text-xs font-medium text-muted-foreground">{text}</span>
      <div className="h-px flex-1 bg-black/6 dark:bg-white/8" />
    </div>
  );
}

// --- OTPField ---
interface OTPFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  label?: string;
}

export function OTPField({ value, onChange, disabled, length = 6, label = "Verification Code" }: OTPFieldProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {label && <Label className="text-center text-sm font-medium">{label}</Label>}
      <InputOTP
        maxLength={length}
        value={value}
        onChange={onChange}
        disabled={disabled}
        containerClassName="flex justify-center"
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length }).map((_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="size-12 rounded-lg border border-input bg-background/50 text-center text-lg font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

// --- OAuthButtons ---
interface OAuthButtonsProps {
  providers: Array<{ id: string; displayName?: string }>;
  onSelect: (provider: string) => void;
  disabled?: boolean;
}

export function OAuthButtons({ providers, onSelect, disabled }: OAuthButtonsProps) {
  const isInIframe = useIsInIframe();
  const oauthDisabled = disabled || isInIframe;

  if (!providers || providers.length === 0) return null;

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return "logos:google-icon";
      case "github":
        return "mdi:github";
      case "apple":
        return "mdi:apple";
      case "microsoft":
        return "logos:microsoft-icon";
      case "discord":
        return "logos:discord-icon";
      default:
        return "lucide:key";
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {providers.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            disabled={oauthDisabled}
            onClick={() => {
              if (oauthDisabled) return;
              onSelect(p.id);
            }}
            className="flex items-center justify-center gap-2 border-black/8 bg-white text-foreground shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Icon icon={getProviderIcon(p.id)} className="size-4" />
            <span className="text-sm font-medium">
              {p.displayName ?? p.id.charAt(0).toUpperCase() + p.id.slice(1)}
            </span>
          </Button>
        ))}
      </div>
      {isInIframe ? (
        <p className="text-center text-xs text-muted-foreground">
          OAuth sign-in is unavailable in embedded preview.
        </p>
      ) : null}
    </div>
  );
}

// --- MessageState ---
interface MessageStateProps {
  type: "success" | "error" | "info";
  message: string;
  className?: string;
}

export function MessageState({ type, message, className }: MessageStateProps) {
  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          icon: <CheckCircle2 className="size-4 shrink-0" />,
        };
      case "error":
        return {
          bg: "bg-destructive/10 border-destructive/20 text-destructive",
          icon: <AlertCircle className="size-4 shrink-0" />,
        };
      case "info":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
          icon: <Info className="size-4 shrink-0" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-sm font-medium leading-relaxed shadow-sm",
        styles.bg,
        className
      )}
    >
      {styles.icon}
      <span className="flex-1">{message}</span>
    </motion.div>
  );
}

// --- LoadingScreen ---
export function LoadingScreen({ message = "Please wait..." }: { message?: string }) {
  return (
    <div className="flex min-h-24 w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-muted-foreground"
      >
        <Loader2 className="size-6" />
      </motion.div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
