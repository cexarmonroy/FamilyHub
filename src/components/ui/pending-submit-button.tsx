"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = {
  idleText: string;
  pendingText?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function PendingSubmitButton({
  idleText,
  pendingText = "Guardando...",
  className,
  ...buttonProps
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...buttonProps}
      type="submit"
      disabled={pending || buttonProps.disabled}
      className={cn(className, pending ? "opacity-70" : "")}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
