import Link from "next/link";
import type { ReactNode } from "react";

import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/drishti";
import { cn } from "@/lib/utils";

export function ActionLink({
  href,
  children,
  variant = "ghost",
  size = "sm",
  icon,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(buttonClasses({ variant, size }), className)}
    >
      {children}
      {icon}
    </Link>
  );
}
