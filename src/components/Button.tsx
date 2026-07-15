import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

export function Button({ variant = 'primary', icon, className, children, ...props }: ButtonProps) {
  return (
    <button className={clsx('button', `button--${variant}`, className)} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
