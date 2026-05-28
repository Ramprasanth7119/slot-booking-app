import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] shadow-[0_8px_24px_var(--btn-primary-shadow)] hover:bg-[var(--btn-primary-hover)] hover:shadow-[0_12px_32px_rgba(30,122,136,0.25)] active:bg-[var(--btn-primary-active)] active:shadow-[0_4px_12px_rgba(30,122,136,0.15)]",
  secondary:
    "bg-[var(--btn-secondary-bg)] text-[var(--foreground)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-hover)] active:bg-[var(--btn-secondary-active)] hover:border-[var(--btn-secondary-border)]",
  ghost: "border border-transparent bg-transparent text-[var(--foreground)] hover:bg-white/[0.05] hover:text-[var(--foreground)] active:bg-white/[0.03]",
};

export function buttonClassName(variant: ButtonVariant = "primary") {
  return [
    "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium tracking-tight transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[rgba(71,141,150,0.4)] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",
    buttonStyles[variant],
  ].join(" ");
}

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={`${buttonClassName(variant)} ${className}`.trim()} type={type} {...props} />;
}