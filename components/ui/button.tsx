import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(168,85,247,0.9))] text-white shadow-[0_12px_30px_rgba(99,102,241,0.2)] hover:brightness-110 hover:shadow-[0_16px_36px_rgba(99,102,241,0.26)]",
  secondary:
    "border border-white/10 bg-white/[0.04] text-white hover:border-white/15 hover:bg-white/[0.075] hover:text-white",
  ghost: "border border-transparent bg-transparent text-zinc-200 hover:bg-white/[0.05] hover:text-white",
};

export function buttonClassName(variant: ButtonVariant = "primary") {
  return [
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium tracking-tight transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50",
    buttonStyles[variant],
  ].join(" ");
}

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={`${buttonClassName(variant)} ${className}`.trim()} type={type} {...props} />;
}