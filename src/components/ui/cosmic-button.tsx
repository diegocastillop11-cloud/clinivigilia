'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

export type CosmicButtonProps<E extends 'a' | 'button' = 'a'> = {
  /** The HTML element to render as. @default "a" */
  as?: E
} & ComponentPropsWithoutRef<E>

/**
 * Animated button/link with a rotating gradient border (indigo/violet/cyan,
 * matching ClinivigilIA's brand palette). Renders as an anchor by default;
 * use `as="button"` for button behavior. Always pass `href` explicitly when
 * used as a link.
 */
export function CosmicButton<E extends 'a' | 'button' = 'a'>({
  as,
  className,
  children,
  ...props
}: CosmicButtonProps<E>) {
  const Element = as ?? 'a'
  const isAnchor = Element === 'a'

  const baseClassName = cn(
    'group/cosmic relative inline-flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-[15px] p-[3px] transition-transform',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]',
    className
  )

  const content = (
    <>
      <span className="absolute inset-0 overflow-hidden rounded-[15px] transition-all duration-300 ease-out group-hover/cosmic:inset-[-3px] group-hover/cosmic:rounded-[15px]">
        <span className="absolute inset-[-200%] animate-cosmic-spin bg-[conic-gradient(from_0deg,#6366f1,#8b5cf6,#38bdf8,#6366f1)] opacity-95" />
      </span>

      <span className="absolute inset-0 overflow-hidden rounded-[15px] opacity-45 mix-blend-soft-light transition-all duration-300 ease-out group-hover/cosmic:inset-[-3px] group-hover/cosmic:rounded-[15px] dark:opacity-60 dark:mix-blend-overlay">
        <span className="absolute inset-[-200%] animate-cosmic-spin-slow bg-[conic-gradient(from_180deg,#c7d2fe_0%,transparent_30%,#6366f1_50%,transparent_70%,#0ea5e9_100%)]" />
      </span>

      <span className="relative z-10 flex items-center gap-3 rounded-[12px] bg-[#0b0f1a] px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.45),0_10px_28px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover/cosmic:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_6px_rgba(0,0,0,0.5),0_14px_34px_rgba(0,0,0,0.42)] active:scale-[0.98]">
        <span className="text-base font-medium tracking-wide text-white">
          {children ?? 'Placeholder text'}
        </span>
      </span>
    </>
  )

  if (isAnchor) {
    const { href, rel, target, ...rest } = props as ComponentPropsWithoutRef<'a'>
    return (
      <a className={baseClassName} href={href} rel={rel} target={target} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button className={baseClassName} {...(props as ComponentPropsWithoutRef<'button'>)}>
      {content}
    </button>
  )
}
